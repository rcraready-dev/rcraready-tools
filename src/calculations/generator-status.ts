import {
  GENERATOR_STATUS_CITATIONS,
  GENERATOR_THRESHOLDS,
  getGeneratorCategoryProfile,
  type GeneratorCategory,
  type GeneratorCategoryProfile,
} from '../rules/generator-status.js';

export type GeneratorStatusInput = {
  nonAcuteHazardousWasteKg?: number;
  acuteHazardousWasteKg?: number;
  acuteSpillResidueKg?: number;
};

export type GeneratorStatusResult = {
  category: GeneratorCategory;
  label: string;
  reasons: string[];
  inputs: Required<GeneratorStatusInput>;
  profile: GeneratorCategoryProfile;
  federalCitations: string[];
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

  if (values.nonAcuteHazardousWasteKg >= GENERATOR_THRESHOLDS.lqgNonAcuteMinKg) {
    lqgReasons.push('Generates 1,000 kg or more of non-acute hazardous waste in a calendar month.');
  }

  if (values.acuteHazardousWasteKg > GENERATOR_THRESHOLDS.lqgAcuteMinExclusiveKg) {
    lqgReasons.push('Generates more than 1 kg of acute hazardous waste in a calendar month.');
  }

  if (values.acuteSpillResidueKg > GENERATOR_THRESHOLDS.lqgAcuteSpillResidueMinExclusiveKg) {
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
      federalCitations: GENERATOR_STATUS_CITATIONS,
    };
  }

  if (values.nonAcuteHazardousWasteKg > GENERATOR_THRESHOLDS.sqgNonAcuteMinExclusiveKg) {
    const profile = getGeneratorCategoryProfile('SQG');

    return {
      category: 'SQG',
      label: profile.label,
      reasons: ['Generates more than 100 kg and less than 1,000 kg of non-acute hazardous waste in a calendar month.'],
      inputs: values,
      profile,
      federalCitations: GENERATOR_STATUS_CITATIONS,
    };
  }

  const profile = getGeneratorCategoryProfile('VSQG');

  return {
    category: 'VSQG',
    label: profile.label,
    reasons: [profile.monthlyGenerationSummary],
    inputs: values,
    profile,
    federalCitations: GENERATOR_STATUS_CITATIONS,
  };
};
