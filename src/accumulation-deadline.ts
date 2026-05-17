import type { GeneratorCategory } from './generator-status';

export type DateLike = Date | string;

export type AccumulationDeadlineInput = {
  generatorCategory: GeneratorCategory;
  accumulationStartDate: DateLike;
  transportDistanceMiles?: number;
  moreThan200MilesToTsdf?: boolean;
};

export type AccumulationDeadlineResult = {
  generatorCategory: GeneratorCategory;
  accumulationStartDate: string;
  deadlineDate: string | null;
  dayLimit: number | null;
  federalCitation: string;
  notes: string[];
};

export type SatelliteMoveDeadlineInput = {
  limitExceededDate: DateLike;
};

export type SatelliteMoveDeadlineResult = {
  limitExceededDate: string;
  moveByDate: string;
  dayLimit: 3;
  federalCitation: string;
  notes: string[];
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseDate = (value: DateLike, fieldName: string): Date => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError(`${fieldName} must be a valid Date.`);
    }

    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`${fieldName} must be a real calendar date.`);
  }

  return date;
};

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const addCalendarDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const getSqgDayLimit = (input: AccumulationDeadlineInput): 180 | 270 => {
  if (input.moreThan200MilesToTsdf === true) {
    return 270;
  }

  if (input.transportDistanceMiles != null) {
    if (!Number.isFinite(input.transportDistanceMiles) || input.transportDistanceMiles < 0) {
      throw new RangeError('transportDistanceMiles must be a non-negative finite number.');
    }

    return input.transportDistanceMiles > 200 ? 270 : 180;
  }

  return 180;
};

export const calculateAccumulationDeadline = (input: AccumulationDeadlineInput): AccumulationDeadlineResult => {
  const startDate = parseDate(input.accumulationStartDate, 'accumulationStartDate');
  const accumulationStartDate = formatDate(startDate);

  if (input.generatorCategory === 'LQG') {
    const dayLimit = 90;

    return {
      generatorCategory: input.generatorCategory,
      accumulationStartDate,
      deadlineDate: formatDate(addCalendarDays(startDate, dayLimit)),
      dayLimit,
      federalCitation: '40 CFR 262.17(a) - LQG accumulation time limit',
      notes: ['Large Quantity Generators generally may accumulate hazardous waste on site without a permit for 90 days or less.'],
    };
  }

  if (input.generatorCategory === 'SQG') {
    const dayLimit = getSqgDayLimit(input);

    return {
      generatorCategory: input.generatorCategory,
      accumulationStartDate,
      deadlineDate: formatDate(addCalendarDays(startDate, dayLimit)),
      dayLimit,
      federalCitation: '40 CFR 262.16(b) and 40 CFR 262.16(d) - SQG accumulation time limits',
      notes: [
        dayLimit === 270
          ? 'Small Quantity Generators may use a 270-day limit when waste must be transported more than 200 miles for off-site treatment, storage, or disposal.'
          : 'Small Quantity Generators generally may accumulate hazardous waste on site without a permit for 180 days or less.',
      ],
    };
  }

  if (input.generatorCategory === 'VSQG') {
    return {
      generatorCategory: input.generatorCategory,
      accumulationStartDate,
      deadlineDate: null,
      dayLimit: null,
      federalCitation: '40 CFR 262.14 - VSQG conditions for exemption',
      notes: [
        'Federal VSQG rules do not set a fixed 90-day, 180-day, or 270-day accumulation clock while the site remains within VSQG quantity limits and meets applicable conditions.',
      ],
    };
  }

  throw new RangeError(`Unsupported generatorCategory: ${String(input.generatorCategory)}`);
};

export const calculateSatelliteMoveDeadline = (input: SatelliteMoveDeadlineInput): SatelliteMoveDeadlineResult => {
  const exceededDate = parseDate(input.limitExceededDate, 'limitExceededDate');
  const dayLimit = 3;

  return {
    limitExceededDate: formatDate(exceededDate),
    moveByDate: formatDate(addCalendarDays(exceededDate, dayLimit)),
    dayLimit,
    federalCitation: '40 CFR 262.15(a)(6) - Satellite accumulation area excess waste removal',
    notes: [
      'When the satellite accumulation area quantity limit is exceeded, excess waste must be dated and removed within three consecutive calendar days.',
    ],
  };
};
