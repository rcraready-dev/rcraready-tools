export type DateLike = Date | string;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const parseIsoDate = (value: DateLike, fieldName: string): Date => {
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

export const todayLocal = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

export const formatIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const addCalendarDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const differenceInCalendarDays = (later: Date, earlier: Date): number =>
  Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);

export const isAfter = (left: Date, right: Date): boolean => left.getTime() > right.getTime();
