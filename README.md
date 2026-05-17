# RCRAReady Tools

Open-source TypeScript utilities for common EPA RCRA hazardous waste compliance workflows.

RCRAReady builds hazardous waste compliance software for EHS managers, operations leaders, and consultants. This repository contains small, dependency-light helpers that mirror public reference tools available at [rcraready.com](https://rcraready.com/).

## What's Included

- Federal generator category classification for VSQG, SQG, and LQG thresholds
- Central accumulation area deadline calculations for LQG and SQG facilities
- Satellite accumulation area three-day move deadline helper
- Source notes for the federal regulations behind each helper

## Hosted Tools

Use the free hosted versions here:

- [RCRA generator status classifier](https://rcraready.com/tools/epa-generator-status-classifier)
- [RCRA storage deadline calculator](https://rcraready.com/tools/rcra-storage-deadline-calculator)
- [RCRA hazardous waste codes lookup](https://rcraready.com/tools/hazardous-waste-codes)
- [EPA ID lookup](https://rcraready.com/tools/epa-id-lookup)

## Use From Source

This package is not published to a registry yet. Until it is published, install from GitHub or copy the TypeScript helpers directly from `src/`.

```bash
bun add github:rcraready-dev/rcraready-tools
```

## Example

```ts
import {
  calculateAccumulationDeadline,
  classifyGeneratorStatus,
} from '@rcraready/tools';

const status = classifyGeneratorStatus({
  nonAcuteHazardousWasteKg: 425,
});

const deadline = calculateAccumulationDeadline({
  generatorCategory: status.category,
  accumulationStartDate: '2026-05-17',
});

console.log(status.category); // "SQG"
console.log(deadline.deadlineDate); // "2026-11-13"
```

## Regulatory Scope

These helpers cover selected federal RCRA rules under 40 CFR Parts 261 and 262. They are not a substitute for facility-specific legal, environmental, or regulatory advice. State authorized programs may be more stringent than the federal baseline.

See [docs/regulatory-sources.md](docs/regulatory-sources.md) for citations.

## License

MIT. See [LICENSE](LICENSE).
