import { FEDERAL_CITATIONS, formatCitation } from './citations.js';

export type GeneratorCategory = 'VSQG' | 'SQG' | 'LQG';

export type QuantityLimitKg = {
  amountKg: number;
  inclusive: boolean;
};

export type OnSiteAccumulationLimits = {
  nonAcuteHazardousWaste: QuantityLimitKg | null;
  acuteHazardousWaste: QuantityLimitKg | null;
  acuteSpillCleanupResidue: QuantityLimitKg | null;
};

export type GeneratorCategoryProfile = {
  category: GeneratorCategory;
  label: string;
  monthlyGenerationSummary: string;
  centralAccumulationDayLimit: 90 | 180 | null;
  extendedSqgDayLimit: 270 | null;
  onSiteAccumulationLimits: OnSiteAccumulationLimits;
  onSiteAccumulationSummary: string;
  federalCitations: string[];
};

export const GENERATOR_THRESHOLDS = {
  vsqgNonAcuteMaxKg: 100,
  sqgNonAcuteMinExclusiveKg: 100,
  lqgNonAcuteMinKg: 1000,
  lqgAcuteMinExclusiveKg: 1,
  lqgAcuteSpillResidueMinExclusiveKg: 100,
  vsqgOnSiteAccumulationLimitKg: 1000,
  sqgOnSiteAccumulationLimitKg: 6000,
} as const;

export const GENERATOR_STATUS_CITATIONS = [
  formatCitation(FEDERAL_CITATIONS.generatorCategory),
  formatCitation(FEDERAL_CITATIONS.vsqgConditions),
  formatCitation(FEDERAL_CITATIONS.sqgConditions),
  formatCitation(FEDERAL_CITATIONS.lqgConditions),
];

export const GENERATOR_CATEGORY_PROFILES: Record<GeneratorCategory, GeneratorCategoryProfile> = {
  VSQG: {
    category: 'VSQG',
    label: 'Very Small Quantity Generator',
    monthlyGenerationSummary:
      '100 kg or less of non-acute hazardous waste, 1 kg or less of acute hazardous waste, and 100 kg or less of acute spill cleanup residue in a calendar month.',
    centralAccumulationDayLimit: null,
    extendedSqgDayLimit: null,
    onSiteAccumulationLimits: {
      nonAcuteHazardousWaste: {
        amountKg: GENERATOR_THRESHOLDS.vsqgOnSiteAccumulationLimitKg,
        inclusive: false,
      },
      acuteHazardousWaste: {
        amountKg: GENERATOR_THRESHOLDS.lqgAcuteMinExclusiveKg,
        inclusive: true,
      },
      acuteSpillCleanupResidue: {
        amountKg: GENERATOR_THRESHOLDS.lqgAcuteSpillResidueMinExclusiveKg,
        inclusive: true,
      },
    },
    onSiteAccumulationSummary:
      'Federal VSQG rules do not set a fixed accumulation clock, but the site must remain within applicable VSQG quantity limits, including less than 1,000 kg of non-acute hazardous waste, no more than 1 kg of acute hazardous waste, and no more than 100 kg of acute spill cleanup residue on site.',
    federalCitations: [FEDERAL_CITATIONS.generatorCategory.id, FEDERAL_CITATIONS.vsqgConditions.id],
  },
  SQG: {
    category: 'SQG',
    label: 'Small Quantity Generator',
    monthlyGenerationSummary:
      'More than 100 kg and less than 1,000 kg of non-acute hazardous waste in a calendar month without exceeding acute hazardous waste thresholds.',
    centralAccumulationDayLimit: 180,
    extendedSqgDayLimit: 270,
    onSiteAccumulationLimits: {
      nonAcuteHazardousWaste: {
        amountKg: GENERATOR_THRESHOLDS.sqgOnSiteAccumulationLimitKg,
        inclusive: true,
      },
      acuteHazardousWaste: {
        amountKg: GENERATOR_THRESHOLDS.lqgAcuteMinExclusiveKg,
        inclusive: true,
      },
      acuteSpillCleanupResidue: null,
    },
    onSiteAccumulationSummary:
      'SQGs generally may accumulate hazardous waste for 180 days, or 270 days when waste must be transported 200 miles or more, while never exceeding 6,000 kg of non-acute hazardous waste or 1 kg of acute hazardous waste on site.',
    federalCitations: [FEDERAL_CITATIONS.generatorCategory.id, FEDERAL_CITATIONS.sqgConditions.id],
  },
  LQG: {
    category: 'LQG',
    label: 'Large Quantity Generator',
    monthlyGenerationSummary:
      '1,000 kg or more of non-acute hazardous waste, more than 1 kg of acute hazardous waste, or more than 100 kg of acute spill cleanup residue in a calendar month.',
    centralAccumulationDayLimit: 90,
    extendedSqgDayLimit: null,
    onSiteAccumulationLimits: {
      nonAcuteHazardousWaste: null,
      acuteHazardousWaste: null,
      acuteSpillCleanupResidue: null,
    },
    onSiteAccumulationSummary:
      'LQGs generally may accumulate hazardous waste on site without a storage permit for 90 days or less when the applicable conditions are met.',
    federalCitations: [FEDERAL_CITATIONS.generatorCategory.id, FEDERAL_CITATIONS.lqgConditions.id],
  },
};

export const getGeneratorCategoryProfile = (category: GeneratorCategory): GeneratorCategoryProfile => {
  const profile = GENERATOR_CATEGORY_PROFILES[category];

  if (!profile) {
    throw new RangeError(`Unsupported generator category: ${String(category)}`);
  }

  return profile;
};
