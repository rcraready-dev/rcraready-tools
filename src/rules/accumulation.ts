import { FEDERAL_CITATIONS, formatCitation } from './citations.js';
import type { GeneratorCategory } from './generator-status.js';

export type AccumulationDayLimit = 90 | 180 | 270;

export type CentralAccumulationRule = {
  dayLimit: AccumulationDayLimit | null;
  federalCitation: string;
  notes: string[];
};

export type AccumulationRuleOptions = {
  transportDistanceMiles?: number;
  atLeast200MilesToTsdf?: boolean;
};

export const ACCUMULATION_RULES = {
  lqgDayLimit: 90,
  sqgDefaultDayLimit: 180,
  sqgLongDistanceDayLimit: 270,
  sqgLongDistanceThresholdMiles: 200,
  satelliteMoveDayLimit: 3,
} as const;

export const SATELLITE_MOVE_RULE = {
  dayLimit: ACCUMULATION_RULES.satelliteMoveDayLimit,
  federalCitation: formatCitation(FEDERAL_CITATIONS.satelliteAccumulationExcess),
  notes: [
    'When the satellite accumulation area quantity limit is exceeded, excess waste must be dated and removed within three consecutive calendar days.',
  ],
} as const;

const getSqgDayLimit = (options: AccumulationRuleOptions): 180 | 270 => {
  if (options.transportDistanceMiles != null) {
    if (!Number.isFinite(options.transportDistanceMiles) || options.transportDistanceMiles < 0) {
      throw new RangeError('transportDistanceMiles must be a non-negative finite number.');
    }

    const distanceQualifiesFor270Days = options.transportDistanceMiles >= ACCUMULATION_RULES.sqgLongDistanceThresholdMiles;

    if (
      options.atLeast200MilesToTsdf != null &&
      options.atLeast200MilesToTsdf !== distanceQualifiesFor270Days
    ) {
      throw new RangeError('atLeast200MilesToTsdf conflicts with transportDistanceMiles.');
    }

    return distanceQualifiesFor270Days
      ? ACCUMULATION_RULES.sqgLongDistanceDayLimit
      : ACCUMULATION_RULES.sqgDefaultDayLimit;
  }

  if (options.atLeast200MilesToTsdf === true) {
    return ACCUMULATION_RULES.sqgLongDistanceDayLimit;
  }

  return ACCUMULATION_RULES.sqgDefaultDayLimit;
};

export const getCentralAccumulationRule = (
  generatorCategory: GeneratorCategory,
  options: AccumulationRuleOptions = {},
): CentralAccumulationRule => {
  if (generatorCategory === 'LQG') {
    return {
      dayLimit: ACCUMULATION_RULES.lqgDayLimit,
      federalCitation: formatCitation(FEDERAL_CITATIONS.lqgAccumulation),
      notes: [
        'Large Quantity Generators generally may accumulate hazardous waste on site without a permit for 90 days or less.',
      ],
    };
  }

  if (generatorCategory === 'SQG') {
    const dayLimit = getSqgDayLimit(options);

    return {
      dayLimit,
      federalCitation: formatCitation(
        dayLimit === ACCUMULATION_RULES.sqgLongDistanceDayLimit
          ? FEDERAL_CITATIONS.sqgLongDistanceAccumulation
          : FEDERAL_CITATIONS.sqgAccumulation,
      ),
      notes: [
        dayLimit === ACCUMULATION_RULES.sqgLongDistanceDayLimit
          ? 'Small Quantity Generators may use a 270-day limit when waste must be transported 200 miles or more for off-site treatment, storage, or disposal.'
          : 'Small Quantity Generators generally may accumulate hazardous waste on site without a permit for 180 days or less.',
      ],
    };
  }

  if (generatorCategory === 'VSQG') {
    return {
      dayLimit: null,
      federalCitation: formatCitation(FEDERAL_CITATIONS.vsqgConditions),
      notes: [
        'Federal VSQG rules do not set a fixed 90-day, 180-day, or 270-day accumulation clock while the site remains within VSQG quantity limits and meets applicable conditions.',
      ],
    };
  }

  throw new RangeError(`Unsupported generatorCategory: ${String(generatorCategory)}`);
};
