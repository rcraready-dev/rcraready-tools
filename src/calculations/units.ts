export const KG_PER_LB = 0.45359237;

export const poundsToKilograms = (pounds: number): number => {
  if (!Number.isFinite(pounds) || pounds < 0) {
    throw new RangeError('pounds must be a non-negative finite number.');
  }

  return pounds * KG_PER_LB;
};

export const kilogramsToPounds = (kilograms: number): number => {
  if (!Number.isFinite(kilograms) || kilograms < 0) {
    throw new RangeError('kilograms must be a non-negative finite number.');
  }

  return kilograms / KG_PER_LB;
};
