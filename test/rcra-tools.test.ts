import { describe, expect, test } from 'bun:test';

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
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 100 }).category).toBe('VSQG');
  });

  test('classifies SQG above 100 kg and below 1,000 kg', () => {
    const result = classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 425 });

    expect(result.category).toBe('SQG');
    expect(result.profile.onSiteAccumulationLimitKg).toBe(6000);
  });

  test('classifies LQG at 1,000 kg non-acute hazardous waste', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 1000 }).category).toBe('LQG');
  });

  test('does not classify exactly 1 kg acute hazardous waste as LQG by itself', () => {
    expect(classifyGeneratorStatus({ acuteHazardousWasteKg: 1 }).category).toBe('VSQG');
  });

  test('classifies LQG when acute waste exceeds 1 kg', () => {
    expect(classifyGeneratorStatus({ acuteHazardousWasteKg: 1.1 }).category).toBe('LQG');
  });

  test('classifies LQG when acute spill residue exceeds 100 kg', () => {
    expect(classifyGeneratorStatus({ acuteSpillResidueKg: 100.1 }).category).toBe('LQG');
  });

  test('converts pounds to kilograms for pound-based inputs', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: poundsToKilograms(2500) }).category).toBe('LQG');
  });

  test('returns category profile details', () => {
    expect(getGeneratorCategoryProfile('LQG')).toMatchObject({
      centralAccumulationDayLimit: 90,
      onSiteAccumulationLimitKg: null,
    });
  });
});

describe('calculateAccumulationDeadline', () => {
  test('calculates the LQG 90-day deadline and countdown fields', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'LQG',
        accumulationStartDate: '2026-05-17',
        asOfDate: '2026-06-16',
      }),
    ).toMatchObject({
      areaType: 'CAA',
      dayLimit: 90,
      deadlineDate: '2026-08-15',
      daysElapsed: 30,
      daysRemaining: 60,
      isOverdue: false,
    });
  });

  test('calculates the SQG 180-day deadline', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'SQG',
        accumulationStartDate: '2026-05-17',
      }),
    ).toMatchObject({
      dayLimit: 180,
      deadlineDate: '2026-11-13',
    });
  });

  test('calculates the SQG 270-day deadline when TSDF is more than 200 miles away', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'SQG',
        accumulationStartDate: '2026-05-17',
        transportDistanceMiles: 201,
      }),
    ).toMatchObject({
      dayLimit: 270,
      deadlineDate: '2027-02-11',
    });
  });

  test('returns no fixed federal accumulation clock for VSQG', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'VSQG',
        accumulationStartDate: '2026-05-17',
      }),
    ).toMatchObject({
      dayLimit: null,
      deadlineDate: null,
      isOverdue: false,
    });
  });

  test('marks a deadline overdue', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'LQG',
        accumulationStartDate: '2026-05-17',
        asOfDate: '2026-08-16',
      }),
    ).toMatchObject({
      daysRemaining: -1,
      isOverdue: true,
    });
  });
});

describe('satellite accumulation helpers', () => {
  test('calculates the three-day satellite accumulation move deadline', () => {
    expect(calculateSatelliteMoveDeadline({ limitExceededDate: '2026-05-17' })).toMatchObject({
      dayLimit: 3,
      moveByDate: '2026-05-20',
    });
  });

  test('uses actual transfer date when waste is moved before the three-day limit', () => {
    expect(
      calculateSatelliteAccumulationDeadline({
        generatorCategory: 'LQG',
        limitExceededDate: '2026-05-17',
        movedToCentralAccumulationDate: '2026-05-18',
      }),
    ).toMatchObject({
      areaType: 'SAA',
      accumulationStartDate: '2026-05-18',
      clockStartBasis: 'actual-transfer-date',
      deadlineDate: '2026-08-16',
      transferWasLate: false,
    });
  });

  test('uses the three-day limit when transfer date is omitted', () => {
    expect(
      calculateSatelliteAccumulationDeadline({
        generatorCategory: 'SQG',
        limitExceededDate: '2026-05-17',
      }),
    ).toMatchObject({
      accumulationStartDate: '2026-05-20',
      clockStartBasis: 'three-day-limit',
      deadlineDate: '2026-11-16',
      transferWasLate: false,
    });
  });

  test('does not extend the compliance clock for a late satellite transfer', () => {
    expect(
      calculateSatelliteAccumulationDeadline({
        generatorCategory: 'LQG',
        limitExceededDate: '2026-05-17',
        movedToCentralAccumulationDate: '2026-05-25',
      }),
    ).toMatchObject({
      accumulationStartDate: '2026-05-20',
      clockStartBasis: 'three-day-limit',
      deadlineDate: '2026-08-18',
      transferWasLate: true,
    });
  });
});
