import { describe, expect, test } from 'bun:test';

import {
  calculateAccumulationDeadline,
  calculateSatelliteMoveDeadline,
  classifyGeneratorStatus,
} from '../src/index';

describe('classifyGeneratorStatus', () => {
  test('classifies VSQG at the federal non-acute threshold', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 100 }).category).toBe('VSQG');
  });

  test('classifies SQG above 100 kg and below 1,000 kg', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 425 }).category).toBe('SQG');
  });

  test('classifies LQG at 1,000 kg non-acute hazardous waste', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 1000 }).category).toBe('LQG');
  });

  test('classifies LQG when acute waste exceeds 1 kg', () => {
    expect(classifyGeneratorStatus({ acuteHazardousWasteKg: 1.1 }).category).toBe('LQG');
  });
});

describe('calculateAccumulationDeadline', () => {
  test('calculates the LQG 90-day deadline', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'LQG',
        accumulationStartDate: '2026-05-17',
      }),
    ).toMatchObject({
      dayLimit: 90,
      deadlineDate: '2026-08-15',
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
    });
  });
});

describe('calculateSatelliteMoveDeadline', () => {
  test('calculates the three-day satellite accumulation move deadline', () => {
    expect(calculateSatelliteMoveDeadline({ limitExceededDate: '2026-05-17' })).toMatchObject({
      dayLimit: 3,
      moveByDate: '2026-05-20',
    });
  });
});
