import type { GeneratorCategory } from './generator-status';

export type DateLike = Date | string;

export type AccumulationDeadlineInput = {
  generatorCategory: GeneratorCategory;
  accumulationStartDate: DateLike;
  transportDistanceMiles?: number;
  moreThan200MilesToTsdf?: boolean;
  asOfDate?: DateLike;
};

export type AccumulationDeadlineResult = {
  areaType: 'CAA';
  generatorCategory: GeneratorCategory;
  accumulationStartDate: string;
  deadlineDate: string | null;
  dayLimit: 90 | 180 | 270 | null;
  asOfDate: string;
  daysElapsed: number | null;
  daysRemaining: number | null;
  isOverdue: boolean;
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

export type SatelliteAccumulationDeadlineInput = {
  generatorCategory: GeneratorCategory;
  limitExceededDate: DateLike;
  movedToCentralAccumulationDate?: DateLike;
  transportDistanceMiles?: number;
  moreThan200MilesToTsdf?: boolean;
  asOfDate?: DateLike;
};

export type SatelliteAccumulationDeadlineResult = Omit<AccumulationDeadlineResult, 'areaType'> & {
  areaType: 'SAA';
  limitExceededDate: string;
  moveByDate: string;
  movedToCentralAccumulationDate: string | null;
  transferWasLate: boolean;
  clockStartBasis: 'actual-transfer-date' | 'three-day-limit';
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const addCalendarDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const differenceInCalendarDays = (later: Date, earlier: Date): number =>
  Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);

const isAfter = (left: Date, right: Date): boolean => left.getTime() > right.getTime();

const getAsOfDate = (value: DateLike | undefined): Date => (value == null ? todayUtc() : parseDate(value, 'asOfDate'));

const getSqgDayLimit = (input: Pick<AccumulationDeadlineInput, 'moreThan200MilesToTsdf' | 'transportDistanceMiles'>): 180 | 270 => {
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

const getDayLimit = (
  generatorCategory: GeneratorCategory,
  input: Pick<AccumulationDeadlineInput, 'moreThan200MilesToTsdf' | 'transportDistanceMiles'>,
): 90 | 180 | 270 | null => {
  if (generatorCategory === 'LQG') {
    return 90;
  }

  if (generatorCategory === 'SQG') {
    return getSqgDayLimit(input);
  }

  if (generatorCategory === 'VSQG') {
    return null;
  }

  throw new RangeError(`Unsupported generatorCategory: ${String(generatorCategory)}`);
};

const getFederalCitation = (generatorCategory: GeneratorCategory, dayLimit: 90 | 180 | 270 | null): string => {
  if (generatorCategory === 'LQG') {
    return '40 CFR 262.17(a) - LQG accumulation time limit';
  }

  if (generatorCategory === 'SQG' && dayLimit === 270) {
    return '40 CFR 262.16(d) - SQG 270-day accumulation option';
  }

  if (generatorCategory === 'SQG') {
    return '40 CFR 262.16(b) - SQG accumulation time limit';
  }

  return '40 CFR 262.14 - VSQG conditions for exemption';
};

const getNotes = (generatorCategory: GeneratorCategory, dayLimit: 90 | 180 | 270 | null): string[] => {
  if (generatorCategory === 'LQG') {
    return ['Large Quantity Generators generally may accumulate hazardous waste on site without a permit for 90 days or less.'];
  }

  if (generatorCategory === 'SQG' && dayLimit === 270) {
    return [
      'Small Quantity Generators may use a 270-day limit when waste must be transported more than 200 miles for off-site treatment, storage, or disposal.',
    ];
  }

  if (generatorCategory === 'SQG') {
    return ['Small Quantity Generators generally may accumulate hazardous waste on site without a permit for 180 days or less.'];
  }

  return [
    'Federal VSQG rules do not set a fixed 90-day, 180-day, or 270-day accumulation clock while the site remains within VSQG quantity limits and meets applicable conditions.',
  ];
};

const buildDeadlineFields = (
  generatorCategory: GeneratorCategory,
  clockStartDate: Date,
  input: Pick<AccumulationDeadlineInput, 'moreThan200MilesToTsdf' | 'transportDistanceMiles' | 'asOfDate'>,
) => {
  const dayLimit = getDayLimit(generatorCategory, input);
  const asOf = getAsOfDate(input.asOfDate);
  const deadline = dayLimit == null ? null : addCalendarDays(clockStartDate, dayLimit);

  return {
    deadlineDate: deadline == null ? null : formatDate(deadline),
    dayLimit,
    asOfDate: formatDate(asOf),
    daysElapsed: dayLimit == null ? null : differenceInCalendarDays(asOf, clockStartDate),
    daysRemaining: deadline == null ? null : differenceInCalendarDays(deadline, asOf),
    isOverdue: deadline == null ? false : isAfter(asOf, deadline),
    federalCitation: getFederalCitation(generatorCategory, dayLimit),
    notes: getNotes(generatorCategory, dayLimit),
  };
};

export const calculateAccumulationDeadline = (input: AccumulationDeadlineInput): AccumulationDeadlineResult => {
  const startDate = parseDate(input.accumulationStartDate, 'accumulationStartDate');

  return {
    areaType: 'CAA',
    generatorCategory: input.generatorCategory,
    accumulationStartDate: formatDate(startDate),
    ...buildDeadlineFields(input.generatorCategory, startDate, input),
  };
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

export const calculateSatelliteAccumulationDeadline = (
  input: SatelliteAccumulationDeadlineInput,
): SatelliteAccumulationDeadlineResult => {
  const limitExceededDate = parseDate(input.limitExceededDate, 'limitExceededDate');
  const moveByDate = addCalendarDays(limitExceededDate, 3);
  const movedToCentralAccumulationDate =
    input.movedToCentralAccumulationDate == null
      ? null
      : parseDate(input.movedToCentralAccumulationDate, 'movedToCentralAccumulationDate');

  if (movedToCentralAccumulationDate != null && isAfter(limitExceededDate, movedToCentralAccumulationDate)) {
    throw new RangeError('movedToCentralAccumulationDate cannot be before limitExceededDate.');
  }

  const transferWasLate = movedToCentralAccumulationDate == null ? false : isAfter(movedToCentralAccumulationDate, moveByDate);
  const clockStartDate =
    movedToCentralAccumulationDate != null && !transferWasLate ? movedToCentralAccumulationDate : moveByDate;
  const clockStartBasis = movedToCentralAccumulationDate != null && !transferWasLate ? 'actual-transfer-date' : 'three-day-limit';
  const notes = [
    ...getNotes(input.generatorCategory, getDayLimit(input.generatorCategory, input)),
    transferWasLate
      ? 'The transfer date is after the three-day satellite accumulation removal window; the compliance clock is calculated from the three-day limit instead of extending the deadline.'
      : 'For satellite accumulation areas, the main accumulation clock starts when waste is moved to the central accumulation area or when the three-day removal window ends.',
  ];

  return {
    areaType: 'SAA',
    generatorCategory: input.generatorCategory,
    limitExceededDate: formatDate(limitExceededDate),
    moveByDate: formatDate(moveByDate),
    movedToCentralAccumulationDate: movedToCentralAccumulationDate == null ? null : formatDate(movedToCentralAccumulationDate),
    transferWasLate,
    clockStartBasis,
    accumulationStartDate: formatDate(clockStartDate),
    ...buildDeadlineFields(input.generatorCategory, clockStartDate, input),
    notes,
  };
};
