# RCRAReady Tools

Open-source TypeScript utilities for two common EPA RCRA hazardous waste workflows:

1. Determining monthly generator category: VSQG, SQG, or LQG
2. Calculating hazardous waste accumulation deadlines for central and satellite accumulation areas

RCRAReady builds hazardous waste compliance software for EHS managers, operations leaders, and consultants. This repository contains dependency-light helpers behind two public tools on [rcraready.com](https://rcraready.com/).

## Hosted Tools

- [RCRA generator status classifier](https://rcraready.com/tools/epa-generator-status-classifier)
- [RCRA storage deadline calculator](https://rcraready.com/tools/rcra-storage-deadline-calculator)

## What This Covers

### Generator Status

`classifyGeneratorStatus` evaluates federal monthly generation thresholds under 40 CFR 262.13:

- VSQG: 100 kg or less non-acute hazardous waste, 1 kg or less acute hazardous waste, and 100 kg or less acute spill cleanup residue
- SQG: more than 100 kg and less than 1,000 kg non-acute hazardous waste, without exceeding acute thresholds
- LQG: 1,000 kg or more non-acute hazardous waste, more than 1 kg acute hazardous waste, or more than 100 kg acute spill cleanup residue

### Storage Deadlines

`calculateAccumulationDeadline` and `calculateSatelliteAccumulationDeadline` cover:

- LQG 90-day central accumulation deadlines
- SQG 180-day central accumulation deadlines
- SQG 270-day deadlines when waste must be transported more than 200 miles
- VSQG no-fixed-federal-clock result while quantity-limit conditions are met
- Satellite accumulation three-day move window and downstream CAA clock start

## Install From GitHub

This package is not published to a registry yet. Until it is published, install from GitHub or copy the TypeScript helpers directly from `src/`.

```bash
npm install github:rcraready-dev/rcraready-tools
```

## Example: Generator Status

```ts
import { classifyGeneratorStatus, poundsToKilograms } from '@rcraready/tools';

const status = classifyGeneratorStatus({
  nonAcuteHazardousWasteKg: 425,
  acuteHazardousWasteKg: 0,
  acuteSpillResidueKg: 0,
});

console.log(status.category); // "SQG"
console.log(status.profile.onSiteAccumulationLimitKg); // 6000

const cleanout = classifyGeneratorStatus({
  nonAcuteHazardousWasteKg: poundsToKilograms(2500),
});

console.log(cleanout.category); // "LQG"
```

## Example: Central Accumulation Deadline

```ts
import { calculateAccumulationDeadline } from '@rcraready/tools';

const deadline = calculateAccumulationDeadline({
  generatorCategory: 'SQG',
  accumulationStartDate: '2026-05-17',
  asOfDate: '2026-06-16',
});

console.log(deadline.deadlineDate); // "2026-11-13"
console.log(deadline.daysRemaining); // 150
```

## Example: Satellite Accumulation Area

```ts
import { calculateSatelliteAccumulationDeadline } from '@rcraready/tools';

const deadline = calculateSatelliteAccumulationDeadline({
  generatorCategory: 'LQG',
  limitExceededDate: '2026-05-17',
  movedToCentralAccumulationDate: '2026-05-18',
});

console.log(deadline.moveByDate); // "2026-05-20"
console.log(deadline.accumulationStartDate); // "2026-05-18"
console.log(deadline.deadlineDate); // "2026-08-16"
```

## Development

```bash
npm install
npm run check
npm test
```

## Regulatory Scope

These helpers cover selected federal RCRA rules under 40 CFR Parts 261 and 262. They are not a substitute for facility-specific legal, environmental, or regulatory advice. State authorized programs may be more stringent than the federal baseline.

See [docs/regulatory-sources.md](docs/regulatory-sources.md) for citations.

## License

MIT. See [LICENSE](LICENSE).
