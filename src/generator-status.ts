export type GeneratorCategory = 'VSQG' | 'SQG' | 'LQG';

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
  federalCitations: string[];
};

const FEDERAL_GENERATOR_CITATIONS = [
  '40 CFR 262.13 - Generator category determination',
  '40 CFR 262.14 - Very small quantity generators',
  '40 CFR 262.16 - Small quantity generators',
  '40 CFR 262.17 - Large quantity generators',
];

const CATEGORY_LABELS: Record<GeneratorCategory, string> = {
  VSQG: 'Very Small Quantity Generator',
  SQG: 'Small Quantity Generator',
  LQG: 'Large Quantity Generator',
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
    return {
      category: 'LQG',
      label: CATEGORY_LABELS.LQG,
      reasons: lqgReasons,
      inputs: values,
      federalCitations: FEDERAL_GENERATOR_CITATIONS,
    };
  }

  if (values.nonAcuteHazardousWasteKg > 100) {
    return {
      category: 'SQG',
      label: CATEGORY_LABELS.SQG,
      reasons: ['Generates more than 100 kg and less than 1,000 kg of non-acute hazardous waste in a calendar month.'],
      inputs: values,
      federalCitations: FEDERAL_GENERATOR_CITATIONS,
    };
  }

  return {
    category: 'VSQG',
    label: CATEGORY_LABELS.VSQG,
    reasons: [
      'Generates 100 kg or less of non-acute hazardous waste, 1 kg or less of acute hazardous waste, and 100 kg or less of acute spill cleanup residue in a calendar month.',
    ],
    inputs: values,
    federalCitations: FEDERAL_GENERATOR_CITATIONS,
  };
};
