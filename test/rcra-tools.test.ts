import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  calculateAccumulationDeadline,
  calculateSatelliteAccumulationDeadline,
  calculateSatelliteMoveDeadline,
  classifyGeneratorStatus,
  getGeneratorCategoryProfile,
  poundsToKilograms,
} from '../src/index';

describe('classifyGeneratorStatus', () => {
  test('classifies VSQG at the federal non-acute threshold', () => {
    assert.equal(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 100 }).category, 'VSQG');
  });

  test('classifies SQG above 100 kg and below 1,000 kg', () => {
    const result = classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 425 });

    assert.equal(result.category, 'SQG');
    assert.equal(result.profile.onSiteAccumulationLimitKg, 6000);
  });

  test('classifies LQG at 1,000 kg non-acute hazardous waste', () => {
    assert.equal(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 1000 }).category, 'LQG');
  });

  test('does not classify exactly 1 kg acute hazardous waste as LQG by itself', () => {
    assert.equal(classifyGeneratorStatus({ acuteHazardousWasteKg: 1 }).category, 'VSQG');
  });

  test('classifies LQG when acute waste exceeds 1 kg', () => {
    assert.equal(classifyGeneratorStatus({ acuteHazardousWasteKg: 1.1 }).category, 'LQG');
  });

  test('classifies LQG when acute spill residue exceeds 100 kg', () => {
    assert.equal(classifyGeneratorStatus({ acuteSpillResidueKg: 100.1 }).category, 'LQG');
  });

  test('converts pounds to kilograms for pound-based inputs', () => {
    assert.equal(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: poundsToKilograms(2500) }).category, 'LQG');
  });

  test('returns category profile details', () => {
    assert.deepEqual(
      {
        centralAccumulationDayLimit: getGeneratorCategoryProfile('LQG').centralAccumulationDayLimit,
        onSiteAccumulationLimitKg: getGeneratorCategoryProfile('LQG').onSiteAccumulationLimitKg,
      },
      {
        centralAccumulationDayLimit: 90,
        onSiteAccumulationLimitKg: null,
      },
    );
  });
});

describe('calculateAccumulationDeadline', () => {
  test('calculates the LQG 90-day deadline and countdown fields', () => {
    const result = calculateAccumulationDeadline({
      generatorCategory: 'LQG',
      accumulationStartDate: '2026-05-17',
      asOfDate: '2026-06-16',
    });

    assert.deepEqual(
      {
        areaType: result.areaType,
        dayLimit: result.dayLimit,
        deadlineDate: result.deadlineDate,
        daysElapsed: result.daysElapsed,
        daysRemaining: result.daysRemaining,
        isOverdue: result.isOverdue,
      },
      {
        areaType: 'CAA',
        dayLimit: 90,
        deadlineDate: '2026-08-15',
        daysElapsed: 30,
        daysRemaining: 60,
        isOverdue: false,
      },
    );
  });

  test('calculates the SQG 180-day deadline', () => {
    const result = calculateAccumulationDeadline({
      generatorCategory: 'SQG',
      accumulationStartDate: '2026-05-17',
    });

    assert.equal(result.dayLimit, 180);
    assert.equal(result.deadlineDate, '2026-11-13');
  });

  test('calculates the SQG 270-day deadline when TSDF is more than 200 miles away', () => {
    const result = calculateAccumulationDeadline({
      generatorCategory: 'SQG',
      accumulationStartDate: '2026-05-17',
      transportDistanceMiles: 201,
    });

    assert.equal(result.dayLimit, 270);
    assert.equal(result.deadlineDate, '2027-02-11');
  });

  test('returns no fixed federal accumulation clock for VSQG', () => {
    const result = calculateAccumulationDeadline({
      generatorCategory: 'VSQG',
      accumulationStartDate: '2026-05-17',
    });

    assert.equal(result.dayLimit, null);
    assert.equal(result.deadlineDate, null);
    assert.equal(result.isOverdue, false);
  });

  test('marks a deadline overdue', () => {
    const result = calculateAccumulationDeadline({
      generatorCategory: 'LQG',
      accumulationStartDate: '2026-05-17',
      asOfDate: '2026-08-16',
    });

    assert.equal(result.daysRemaining, -1);
    assert.equal(result.isOverdue, true);
  });
});

describe('satellite accumulation helpers', () => {
  test('calculates the three-day satellite accumulation move deadline', () => {
    const result = calculateSatelliteMoveDeadline({ limitExceededDate: '2026-05-17' });

    assert.equal(result.dayLimit, 3);
    assert.equal(result.moveByDate, '2026-05-20');
  });

  test('uses actual transfer date when waste is moved before the three-day limit', () => {
    const result = calculateSatelliteAccumulationDeadline({
      generatorCategory: 'LQG',
      limitExceededDate: '2026-05-17',
      movedToCentralAccumulationDate: '2026-05-18',
    });

    assert.equal(result.areaType, 'SAA');
    assert.equal(result.accumulationStartDate, '2026-05-18');
    assert.equal(result.clockStartBasis, 'actual-transfer-date');
    assert.equal(result.deadlineDate, '2026-08-16');
    assert.equal(result.transferWasLate, false);
  });

  test('uses the three-day limit when transfer date is omitted', () => {
    const result = calculateSatelliteAccumulationDeadline({
      generatorCategory: 'SQG',
      limitExceededDate: '2026-05-17',
    });

    assert.equal(result.accumulationStartDate, '2026-05-20');
    assert.equal(result.clockStartBasis, 'three-day-limit');
    assert.equal(result.deadlineDate, '2026-11-16');
    assert.equal(result.transferWasLate, false);
  });

  test('does not extend the compliance clock for a late satellite transfer', () => {
    const result = calculateSatelliteAccumulationDeadline({
      generatorCategory: 'LQG',
      limitExceededDate: '2026-05-17',
      movedToCentralAccumulationDate: '2026-05-25',
    });

    assert.equal(result.accumulationStartDate, '2026-05-20');
    assert.equal(result.clockStartBasis, 'three-day-limit');
    assert.equal(result.deadlineDate, '2026-08-18');
    assert.equal(result.transferWasLate, true);
  });
});
