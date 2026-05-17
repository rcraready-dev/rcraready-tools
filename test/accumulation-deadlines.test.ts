import { describe, expect, it } from 'vitest';

import {
  ACCUMULATION_RULES,
  calculateAccumulationDeadline,
  calculateSatelliteAccumulationDeadline,
  calculateSatelliteMoveDeadline,
  getCentralAccumulationRule,
} from '../src/index.js';

describe('central accumulation deadline rules', () => {
  it('calculates the LQG 90-day deadline and countdown fields', () => {
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

  it('accepts Date objects and normalizes them to UTC calendar dates', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'LQG',
        accumulationStartDate: new Date(Date.UTC(2026, 4, 17, 18, 30)),
        asOfDate: new Date(Date.UTC(2026, 5, 16, 4, 15)),
      }),
    ).toMatchObject({
      accumulationStartDate: '2026-05-17',
      asOfDate: '2026-06-16',
      deadlineDate: '2026-08-15',
    });
  });

  it('calculates the SQG 180-day deadline by default', () => {
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

  it('keeps SQG at 180 days when transport distance is below 200 miles', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'SQG',
        accumulationStartDate: '2026-05-17',
        transportDistanceMiles: 199,
      }),
    ).toMatchObject({
      dayLimit: 180,
      deadlineDate: '2026-11-13',
    });
  });

  it('calculates the SQG 270-day deadline when transport distance is exactly 200 miles', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'SQG',
        accumulationStartDate: '2026-05-17',
        transportDistanceMiles: ACCUMULATION_RULES.sqgLongDistanceThresholdMiles,
      }),
    ).toMatchObject({
      dayLimit: 270,
      deadlineDate: '2027-02-11',
    });
  });

  it('returns the federal citation for the SQG 270-day long-distance rule', () => {
    expect(
      getCentralAccumulationRule('SQG', {
        transportDistanceMiles: ACCUMULATION_RULES.sqgLongDistanceThresholdMiles,
      }).federalCitation,
    ).toContain('40 CFR 262.16(c)');
  });

  it('calculates the SQG 270-day deadline when TSDF is more than 200 miles away', () => {
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

  it('supports explicit long-distance SQG option when mileage is not known', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'SQG',
        accumulationStartDate: '2026-05-17',
        atLeast200MilesToTsdf: true,
      }).dayLimit,
    ).toBe(270);
  });

  it('rejects conflicting SQG long-distance inputs', () => {
    expect(() =>
      calculateAccumulationDeadline({
        generatorCategory: 'SQG',
        accumulationStartDate: '2026-05-17',
        transportDistanceMiles: 199,
        atLeast200MilesToTsdf: true,
      }),
    ).toThrow(RangeError);
  });

  it('returns no fixed federal accumulation clock for VSQG', () => {
    expect(
      calculateAccumulationDeadline({
        generatorCategory: 'VSQG',
        accumulationStartDate: '2026-05-17',
      }),
    ).toMatchObject({
      dayLimit: null,
      deadlineDate: null,
      daysElapsed: null,
      daysRemaining: null,
      isOverdue: false,
    });
  });

  it('marks a deadline overdue', () => {
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

  it('rejects invalid dates and impossible transport distances', () => {
    expect(() =>
      calculateAccumulationDeadline({
        generatorCategory: 'LQG',
        accumulationStartDate: '2026-02-30',
      }),
    ).toThrow(RangeError);

    expect(() =>
      calculateAccumulationDeadline({
        generatorCategory: 'SQG',
        accumulationStartDate: '2026-05-17',
        transportDistanceMiles: -1,
      }),
    ).toThrow(RangeError);

    expect(() =>
      calculateAccumulationDeadline({
        generatorCategory: 'LQG',
        accumulationStartDate: '05/17/2026',
      }),
    ).toThrow(RangeError);

    expect(() =>
      calculateAccumulationDeadline({
        generatorCategory: 'LQG',
        accumulationStartDate: new Date(Number.NaN),
      }),
    ).toThrow(RangeError);
  });
});

describe('satellite accumulation deadline rules', () => {
  it('calculates the three-day satellite accumulation move deadline', () => {
    expect(calculateSatelliteMoveDeadline({ limitExceededDate: '2026-05-17', asOfDate: '2026-05-18' })).toMatchObject({
      dayLimit: 3,
      moveByDate: '2026-05-20',
      moveDaysRemaining: 2,
      isMoveOverdue: false,
    });
  });

  it('uses actual transfer date when waste is moved before the three-day limit', () => {
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
      isMoveOverdue: false,
      transferWasLate: false,
    });
  });

  it('uses the three-day limit when transfer date is omitted', () => {
    expect(
      calculateSatelliteAccumulationDeadline({
        generatorCategory: 'SQG',
        limitExceededDate: '2026-05-17',
      }),
    ).toMatchObject({
      accumulationStartDate: '2026-05-20',
      clockStartBasis: 'three-day-limit',
      deadlineDate: '2026-11-16',
      isMoveOverdue: false,
      transferWasLate: false,
    });
  });

  it('marks an omitted satellite transfer overdue after the three-day move window', () => {
    expect(
      calculateSatelliteAccumulationDeadline({
        generatorCategory: 'LQG',
        limitExceededDate: '2026-05-17',
        asOfDate: '2026-05-25',
      }),
    ).toMatchObject({
      moveByDate: '2026-05-20',
      moveDaysRemaining: -5,
      isMoveOverdue: true,
      transferWasLate: false,
    });
  });

  it('does not extend the compliance clock for a late satellite transfer', () => {
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
      isMoveOverdue: true,
      transferWasLate: true,
    });
  });

  it('rejects transfer dates before the satellite limit was exceeded', () => {
    expect(() =>
      calculateSatelliteAccumulationDeadline({
        generatorCategory: 'LQG',
        limitExceededDate: '2026-05-17',
        movedToCentralAccumulationDate: '2026-05-16',
      }),
    ).toThrow(RangeError);
  });
});

describe('accumulation rules layer', () => {
  it('exposes central accumulation rules without calculating dates', () => {
    expect(getCentralAccumulationRule('SQG', { transportDistanceMiles: 201 })).toMatchObject({
      dayLimit: 270,
    });
  });

  it('rejects unsupported generator categories at the rules layer', () => {
    expect(() => getCentralAccumulationRule('CESQG' as never)).toThrow(RangeError);
  });
});
