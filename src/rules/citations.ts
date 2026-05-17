export type FederalCitation = {
  id: string;
  title: string;
  url: string;
};

export const FEDERAL_CITATIONS = {
  generatorCategory: {
    id: '40 CFR 262.13',
    title: 'Generator category determination',
    url: 'https://www.ecfr.gov/current/title-40/section-262.13',
  },
  vsqgConditions: {
    id: '40 CFR 262.14',
    title: 'Very Small Quantity Generator conditions for exemption',
    url: 'https://www.ecfr.gov/current/title-40/section-262.14',
  },
  sqgConditions: {
    id: '40 CFR 262.16',
    title: 'Small Quantity Generator conditions for exemption',
    url: 'https://www.ecfr.gov/current/title-40/section-262.16',
  },
  sqgAccumulation: {
    id: '40 CFR 262.16(b)',
    title: 'SQG accumulation time limit',
    url: 'https://www.ecfr.gov/current/title-40/section-262.16#p-262.16(b)',
  },
  sqgLongDistanceAccumulation: {
    id: '40 CFR 262.16(c)',
    title: 'SQG 270-day accumulation option',
    url: 'https://www.ecfr.gov/current/title-40/section-262.16#p-262.16(c)',
  },
  lqgConditions: {
    id: '40 CFR 262.17',
    title: 'Large Quantity Generator conditions for exemption',
    url: 'https://www.ecfr.gov/current/title-40/section-262.17',
  },
  lqgAccumulation: {
    id: '40 CFR 262.17(a)',
    title: 'LQG accumulation time limit',
    url: 'https://www.ecfr.gov/current/title-40/section-262.17#p-262.17(a)',
  },
  satelliteAccumulationExcess: {
    id: '40 CFR 262.15(a)(6)',
    title: 'Satellite accumulation area excess waste removal',
    url: 'https://www.ecfr.gov/current/title-40/section-262.15#p-262.15(a)(6)',
  },
} as const satisfies Record<string, FederalCitation>;

export const formatCitation = (citation: FederalCitation): string => `${citation.id} - ${citation.title}`;
