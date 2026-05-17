export {
  classifyGeneratorStatus,
  type GeneratorStatusInput,
  type GeneratorStatusResult,
} from './calculations/generator-status.js';

export { KG_PER_LB, kilogramsToPounds, poundsToKilograms } from './calculations/units.js';

export {
  calculateAccumulationDeadline,
  calculateSatelliteAccumulationDeadline,
  calculateSatelliteMoveDeadline,
  type AccumulationDeadlineInput,
  type AccumulationDeadlineResult,
  type SatelliteAccumulationDeadlineInput,
  type SatelliteAccumulationDeadlineResult,
  type SatelliteMoveDeadlineInput,
  type SatelliteMoveDeadlineResult,
} from './calculations/deadlines.js';

export { type DateLike } from './calculations/dates.js';

export { FEDERAL_CITATIONS, formatCitation, type FederalCitation } from './rules/citations.js';

export {
  GENERATOR_CATEGORY_PROFILES,
  GENERATOR_STATUS_CITATIONS,
  GENERATOR_THRESHOLDS,
  getGeneratorCategoryProfile,
  type GeneratorCategory,
  type GeneratorCategoryProfile,
  type OnSiteAccumulationLimits,
  type QuantityLimitKg,
} from './rules/generator-status.js';

export {
  ACCUMULATION_RULES,
  SATELLITE_MOVE_RULE,
  getCentralAccumulationRule,
  type AccumulationDayLimit,
  type AccumulationRuleOptions,
  type CentralAccumulationRule,
} from './rules/accumulation.js';
