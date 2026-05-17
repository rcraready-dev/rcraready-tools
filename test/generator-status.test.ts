import { describe, expect, it } from 'vitest';

import {
  GENERATOR_THRESHOLDS,
  classifyGeneratorStatus,
  getGeneratorCategoryProfile,
  kilogramsToPounds,
  poundsToKilograms,
} from '../src/index.js';

describe('generator status rules', () => {
  it('keeps exactly 100 kg non-acute hazardous waste in VSQG when acute thresholds are not exceeded', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: GENERATOR_THRESHOLDS.vsqgNonAcuteMaxKg }).category).toBe(
      'VSQG',
    );
  });

  it('classifies SQG above 100 kg and below 1,000 kg', () => {
    const result = classifyGeneratorStatus({ nonAcuteHazardousWasteKg: 425 });

    expect(result.category).toBe('SQG');
    expect(result.profile.onSiteAccumulationLimits.nonAcuteHazardousWaste).toEqual({
      amountKg: 6000,
      inclusive: true,
    });
    expect(result.profile.onSiteAccumulationLimits.acuteHazardousWaste).toEqual({
      amountKg: 1,
      inclusive: true,
    });
    expect(result.profile.onSiteAccumulationLimits.acuteSpillCleanupResidue).toBeNull();
  });

  it('classifies LQG at exactly 1,000 kg non-acute hazardous waste', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: GENERATOR_THRESHOLDS.lqgNonAcuteMinKg }).category).toBe(
      'LQG',
    );
  });

  it('does not classify exactly 1 kg acute hazardous waste as LQG by itself', () => {
    expect(classifyGeneratorStatus({ acuteHazardousWasteKg: GENERATOR_THRESHOLDS.lqgAcuteMinExclusiveKg }).category).toBe(
      'VSQG',
    );
  });

  it('classifies LQG when acute hazardous waste exceeds 1 kg', () => {
    expect(classifyGeneratorStatus({ acuteHazardousWasteKg: 1.1 }).category).toBe('LQG');
  });

  it('does not classify exactly 100 kg acute spill residue as LQG by itself', () => {
    const result = classifyGeneratorStatus({
      acuteSpillResidueKg: GENERATOR_THRESHOLDS.lqgAcuteSpillResidueMinExclusiveKg,
    });

    expect(result.category).toBe('VSQG');
    expect(result.profile.onSiteAccumulationLimits.acuteSpillCleanupResidue).toEqual({
      amountKg: 100,
      inclusive: true,
    });
  });

  it('classifies LQG when acute spill residue exceeds 100 kg', () => {
    expect(classifyGeneratorStatus({ acuteSpillResidueKg: 100.1 }).category).toBe('LQG');
  });

  it('collects all applicable LQG reasons', () => {
    const result = classifyGeneratorStatus({
      nonAcuteHazardousWasteKg: 1200,
      acuteHazardousWasteKg: 2,
      acuteSpillResidueKg: 150,
    });

    expect(result.category).toBe('LQG');
    expect(result.reasons).toHaveLength(3);
  });

  it('converts pounds and kilograms for field inputs and display', () => {
    expect(classifyGeneratorStatus({ nonAcuteHazardousWasteKg: poundsToKilograms(2500) }).category).toBe('LQG');
    expect(kilogramsToPounds(1)).toBeCloseTo(2.20462, 5);
  });

  it('returns generator category profiles from the rules layer', () => {
    expect(getGeneratorCategoryProfile('LQG')).toMatchObject({
      centralAccumulationDayLimit: 90,
      onSiteAccumulationLimits: {
        nonAcuteHazardousWaste: null,
        acuteHazardousWaste: null,
        acuteSpillCleanupResidue: null,
      },
    });
  });

  it('rejects unsupported generator category profile lookups', () => {
    expect(() => getGeneratorCategoryProfile('CESQG' as never)).toThrow(RangeError);
  });

  it('rejects negative and non-finite inputs', () => {
    expect(() => classifyGeneratorStatus({ nonAcuteHazardousWasteKg: -1 })).toThrow(RangeError);
    expect(() => classifyGeneratorStatus({ acuteHazardousWasteKg: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => poundsToKilograms(-1)).toThrow(RangeError);
    expect(() => kilogramsToPounds(Number.NaN)).toThrow(RangeError);
  });
});
