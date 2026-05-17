import {
  SATELLITE_MOVE_RULE,
  getCentralAccumulationRule,
  type AccumulationDayLimit,
  type AccumulationRuleOptions,
} from '../rules/accumulation.js';
import type { GeneratorCategory } from '../rules/generator-status.js';
import {
  addCalendarDays,
  differenceInCalendarDays,
  formatIsoDate,
  isAfter,
  parseIsoDate,
  todayLocal,
  type DateLike,
} from './dates.js';

export type AccumulationDeadlineInput = AccumulationRuleOptions & {
  generatorCategory: GeneratorCategory;
  accumulationStartDate: DateLike;
  asOfDate?: DateLike;
};

export type AccumulationDeadlineResult = {
  areaType: 'CAA';
  generatorCategory: GeneratorCategory;
  accumulationStartDate: string;
  deadlineDate: string | null;
  dayLimit: AccumulationDayLimit | null;
  asOfDate: string;
  daysElapsed: number | null;
  daysRemaining: number | null;
  isOverdue: boolean;
  federalCitation: string;
  notes: string[];
};

export type SatelliteMoveDeadlineInput = {
  limitExceededDate: DateLike;
  asOfDate?: DateLike;
};

export type SatelliteMoveDeadlineResult = {
  limitExceededDate: string;
  moveByDate: string;
  dayLimit: 3;
  asOfDate: string;
  moveDaysRemaining: number;
  isMoveOverdue: boolean;
  federalCitation: string;
  notes: string[];
};

export type SatelliteAccumulationDeadlineInput = AccumulationRuleOptions & {
  generatorCategory: GeneratorCategory;
  limitExceededDate: DateLike;
  movedToCentralAccumulationDate?: DateLike;
  asOfDate?: DateLike;
};

export type SatelliteAccumulationDeadlineResult = Omit<AccumulationDeadlineResult, 'areaType'> & {
  areaType: 'SAA';
  limitExceededDate: string;
  moveByDate: string;
  movedToCentralAccumulationDate: string | null;
  moveDaysRemaining: number;
  isMoveOverdue: boolean;
  transferWasLate: boolean;
  clockStartBasis: 'actual-transfer-date' | 'three-day-limit';
};

const getAsOfDate = (value: DateLike | undefined): Date => (value == null ? todayLocal() : parseIsoDate(value, 'asOfDate'));

const buildDeadlineFields = (
  generatorCategory: GeneratorCategory,
  clockStartDate: Date,
  input: AccumulationRuleOptions & { asOfDate?: DateLike },
  resolvedAsOfDate?: Date,
) => {
  const rule = getCentralAccumulationRule(generatorCategory, input);
  const asOf = resolvedAsOfDate ?? getAsOfDate(input.asOfDate);
  const deadline = rule.dayLimit == null ? null : addCalendarDays(clockStartDate, rule.dayLimit);

  return {
    deadlineDate: deadline == null ? null : formatIsoDate(deadline),
    dayLimit: rule.dayLimit,
    asOfDate: formatIsoDate(asOf),
    daysElapsed: rule.dayLimit == null ? null : differenceInCalendarDays(asOf, clockStartDate),
    daysRemaining: deadline == null ? null : differenceInCalendarDays(deadline, asOf),
    isOverdue: deadline == null ? false : isAfter(asOf, deadline),
    federalCitation: rule.federalCitation,
    notes: rule.notes,
  };
};

export const calculateAccumulationDeadline = (input: AccumulationDeadlineInput): AccumulationDeadlineResult => {
  const startDate = parseIsoDate(input.accumulationStartDate, 'accumulationStartDate');

  return {
    areaType: 'CAA',
    generatorCategory: input.generatorCategory,
    accumulationStartDate: formatIsoDate(startDate),
    ...buildDeadlineFields(input.generatorCategory, startDate, input),
  };
};

export const calculateSatelliteMoveDeadline = (input: SatelliteMoveDeadlineInput): SatelliteMoveDeadlineResult => {
  const exceededDate = parseIsoDate(input.limitExceededDate, 'limitExceededDate');
  const asOfDate = getAsOfDate(input.asOfDate);
  const moveByDate = addCalendarDays(exceededDate, SATELLITE_MOVE_RULE.dayLimit);

  return {
    limitExceededDate: formatIsoDate(exceededDate),
    moveByDate: formatIsoDate(moveByDate),
    dayLimit: SATELLITE_MOVE_RULE.dayLimit,
    asOfDate: formatIsoDate(asOfDate),
    moveDaysRemaining: differenceInCalendarDays(moveByDate, asOfDate),
    isMoveOverdue: isAfter(asOfDate, moveByDate),
    federalCitation: SATELLITE_MOVE_RULE.federalCitation,
    notes: [...SATELLITE_MOVE_RULE.notes],
  };
};

export const calculateSatelliteAccumulationDeadline = (
  input: SatelliteAccumulationDeadlineInput,
): SatelliteAccumulationDeadlineResult => {
  const limitExceededDate = parseIsoDate(input.limitExceededDate, 'limitExceededDate');
  const moveByDate = addCalendarDays(limitExceededDate, SATELLITE_MOVE_RULE.dayLimit);
  const asOfDate = getAsOfDate(input.asOfDate);
  const movedToCentralAccumulationDate =
    input.movedToCentralAccumulationDate == null
      ? null
      : parseIsoDate(input.movedToCentralAccumulationDate, 'movedToCentralAccumulationDate');

  if (movedToCentralAccumulationDate != null && isAfter(limitExceededDate, movedToCentralAccumulationDate)) {
    throw new RangeError('movedToCentralAccumulationDate cannot be before limitExceededDate.');
  }

  const transferWasLate = movedToCentralAccumulationDate == null ? false : isAfter(movedToCentralAccumulationDate, moveByDate);
  const moveDaysRemaining = differenceInCalendarDays(moveByDate, asOfDate);
  const isMoveOverdue = movedToCentralAccumulationDate == null ? isAfter(asOfDate, moveByDate) : transferWasLate;
  const clockStartDate =
    movedToCentralAccumulationDate != null && !transferWasLate ? movedToCentralAccumulationDate : moveByDate;
  const clockStartBasis = movedToCentralAccumulationDate != null && !transferWasLate ? 'actual-transfer-date' : 'three-day-limit';
  const centralRule = getCentralAccumulationRule(input.generatorCategory, input);
  const notes = [
    ...centralRule.notes,
    transferWasLate
      ? 'The transfer date is after the three-day satellite accumulation removal window; the compliance clock is calculated from the three-day limit instead of extending the deadline.'
      : 'For satellite accumulation areas, the main accumulation clock starts when waste is moved to the central accumulation area or when the three-day removal window ends.',
  ];

  return {
    areaType: 'SAA',
    generatorCategory: input.generatorCategory,
    limitExceededDate: formatIsoDate(limitExceededDate),
    moveByDate: formatIsoDate(moveByDate),
    movedToCentralAccumulationDate: movedToCentralAccumulationDate == null ? null : formatIsoDate(movedToCentralAccumulationDate),
    moveDaysRemaining,
    isMoveOverdue,
    transferWasLate,
    clockStartBasis,
    accumulationStartDate: formatIsoDate(clockStartDate),
    ...buildDeadlineFields(input.generatorCategory, clockStartDate, input, asOfDate),
    notes,
  };
};
