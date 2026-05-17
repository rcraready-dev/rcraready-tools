export type GeneratorCategory = 'VSQG' | 'SQG' | 'LQG';

export type GeneratorStatusInput = {
  nonAcuteHazardousWasteKg?: number;
  acuteHazardousWasteKg?: number;
  acuteSpillResidueKg?: number;
};

export type GeneratorCategoryProfile = {
  category: GeneratorCategory;
  label: string;
  monthlyGenerationSummary: string;
  centralAccumulationDayLimit: 90 | 180 | null;
  extendedSqgDayLimit: 270 | null;
  onSiteAccumulationLimitKg: number | null;
  onSiteAccumulationSummary: string;
  federalCitations: string[];
};

export type GeneratorStatusResult = {
  category: GeneratorCategory;
  label: string;
  reasons: string[];
  inputs: Required<GeneratorStatusInput>;
  profile: GeneratorCategoryProfile;
  federalCitations: string[];
};

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

const FEDERAL_GENERATOR_CITATIONS = [
  '40 CFR 262.13 - Generator category determination',
  '40 CFR 262.14 - Very small quantity generators',
  '40 CFR 262.16 - Small quantity generators',
  '40 CFR 262.17 - Large quantity generators',
];

export const GENERATOR_CATEGORY_PROFILES: Record<GeneratorCategory, GeneratorCategoryProfile> = {
  VSQG: {
    category: 'VSQG',
    label: 'Very Small Quantity Generator',
    monthlyGenerationSummary:
      '100 kg or less of non-acute hazardous waste, 1 kg or less of acute hazardous waste, and 100 kg or less of acute spill cleanup residue in a calendar month.',
    centralAccumulationDayLimit: null,
    extendedSqgDayLimit: null,
    onSiteAccumulationLimitKg: 1000,
    onSiteAccumulationSummary:
      'Federal VSQG rules do not set a fixed accumulation clock, but the site must remain within applicable VSQG quantity limits, including the 1,000 kg on-site hazardous waste limit.',
    federalCitations: ['40 CFR 262.13', '40 CFR 262.14'],
  },
  SQG: {
    category: 'SQG',
    label: 'Small Quantity Generator',
    monthlyGenerationSummary:
      'More than 100 kg and less than 1,000 kg of non-acute hazardous waste in a calendar month without exceeding acute hazardous waste thresholds.',
    centralAccumulationDayLimit: 180,
    extendedSqgDayLimit: 270,
    onSiteAccumulationLimitKg: 6000,
    onSiteAccumulationSummary:
      'SQGs generally may accumulate hazardous waste for 180 days, or 270 days when waste must be transported more than 200 miles, while staying within the 6,000 kg on-site limit.',
    federalCitations: ['40 CFR 262.13', '40 CFR 262.16'],
  },
  LQG: {
    category: 'LQG',
    label: 'Large Quantity Generator',
    monthlyGenerationSummary:
      '1,000 kg or more of non-acute hazardous waste, more than 1 kg of acute hazardous waste, or more than 100 kg of acute spill cleanup residue in a calendar month.',
    centralAccumulationDayLimit: 90,
    extendedSqgDayLimit: null,
    onSiteAccumulationLimitKg: null,
    onSiteAccumulationSummary:
      'LQGs generally may accumulate hazardous waste on site without a storage permit for 90 days or less when the applicable conditions are met.',
    federalCitations: ['40 CFR 262.13', '40 CFR 262.17'],
  },
};

const toNonNegativeKg = (value: number | undefined, fieldName: string): number => {
  if (value == null) {
    return 0;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} must be a non-negative finite number of kilograms.`);
  }

  return value;
};

export const getGeneratorCategoryProfile = (category: GeneratorCategory): GeneratorCategoryProfile => {
  const profile = GENERATOR_CATEGORY_PROFILES[category];

  if (!profile) {
    throw new RangeError(`Unsupported generator category: ${String(category)}`);
  }

  return profile;
};

export const classifyGeneratorStatus = (input: GeneratorStatusInput): GeneratorStatusResult => {
  const values = {
    nonAcuteHazardousWasteKg: toNonNegativeKg(
      input.nonAcuteHazardousWasteKg,
      'nonAcuteHazardousWasteKg',
    ),
    acuteHazardousWasteKg: toNonNegativeKg(input.acuteHazardousWasteKg, 'acuteHazardousWasteKg'),
    acuteSpillResidueKg: toNonNegativeKg(input.acuteSpillResidueKg, 'acuteSpillResidueKg'),
  };

  const lqgReasons: string[] = [];

  if (values.nonAcuteHazardousWasteKg >= 1000) {
    lqgReasons.push('Generates 1,000 kg or more of non-acute hazardous waste in a calendar month.');
  }

  if (values.acuteHazardousWasteKg > 1) {
    lqgReasons.push('Generates more than 1 kg of acute hazardous waste in a calendar month.');
  }

  if (values.acuteSpillResidueKg > 100) {
    lqgReasons.push('Generates more than 100 kg of acute spill cleanup residue in a calendar month.');
  }

  if (lqgReasons.length > 0) {
    const profile = getGeneratorCategoryProfile('LQG');

    return {
      category: 'LQG',
      label: profile.label,
      reasons: lqgReasons,
      inputs: values,
      profile,
      federalCitations: FEDERAL_GENERATOR_CITATIONS,
    };
  }

  if (values.nonAcuteHazardousWasteKg > 100) {
    const profile = getGeneratorCategoryProfile('SQG');

    return {
      category: 'SQG',
      label: profile.label,
      reasons: ['Generates more than 100 kg and less than 1,000 kg of non-acute hazardous waste in a calendar month.'],
      inputs: values,
      profile,
      federalCitations: FEDERAL_GENERATOR_CITATIONS,
    };
  }

  const profile = getGeneratorCategoryProfile('VSQG');

  return {
    category: 'VSQG',
    label: profile.label,
    reasons: [profile.monthlyGenerationSummary],
    inputs: values,
    profile,
    federalCitations: FEDERAL_GENERATOR_CITATIONS,
  };
};
