# Regulatory Sources

These utilities cover selected federal RCRA hazardous waste generator and accumulation rules. They are reference helpers, not legal advice.

## Generator Category

- [40 CFR 262.13](https://www.ecfr.gov/current/title-40/section-262.13): Generator category determination.
- [40 CFR 262.14](https://www.ecfr.gov/current/title-40/section-262.14): Very Small Quantity Generator conditions for exemption.
- [40 CFR 262.16](https://www.ecfr.gov/current/title-40/section-262.16): Small Quantity Generator conditions for exemption.
- [40 CFR 262.17](https://www.ecfr.gov/current/title-40/section-262.17): Large Quantity Generator conditions for exemption.

Federal monthly generation thresholds represented in `classifyGeneratorStatus`:

| Category | Federal threshold summary | Storage summary |
| --- | --- | --- |
| VSQG | 100 kg or less non-acute hazardous waste, 1 kg or less acute hazardous waste, and 100 kg or less acute spill cleanup residue in a calendar month. | No fixed federal 90/180/270-day clock while VSQG conditions are met; less than 1,000 kg non-acute hazardous waste, no more than 1 kg acute hazardous waste, and no more than 100 kg acute spill cleanup residue on site. |
| SQG | More than 100 kg and less than 1,000 kg non-acute hazardous waste in a calendar month, without exceeding acute thresholds. | 180 days generally, 270 days if waste must be transported 200 miles or more; 6,000 kg on-site hazardous waste limit. |
| LQG | 1,000 kg or more non-acute hazardous waste, more than 1 kg acute hazardous waste, or more than 100 kg acute spill cleanup residue in a calendar month. | 90 days generally; no federal on-site quantity cap represented by this helper. |

### Boundary Behavior

The helper intentionally treats several thresholds exactly as written in the federal generator-category framework:

- Exactly 100 kg non-acute hazardous waste remains VSQG if acute thresholds are not exceeded.
- More than 100 kg non-acute hazardous waste becomes SQG unless an LQG threshold is met.
- Exactly 1,000 kg non-acute hazardous waste is LQG.
- Exactly 1 kg acute hazardous waste does not trigger LQG by itself; more than 1 kg does.
- Exactly 100 kg acute spill cleanup residue does not trigger LQG by itself; more than 100 kg does.

## Accumulation Deadlines

- [40 CFR 262.17(a)](https://www.ecfr.gov/current/title-40/section-262.17#p-262.17(a)): LQG 90-day accumulation conditions.
- [40 CFR 262.16(b)](https://www.ecfr.gov/current/title-40/section-262.16#p-262.16(b)): SQG 180-day accumulation conditions.
- [40 CFR 262.16(c)](https://www.ecfr.gov/current/title-40/section-262.16#p-262.16(c)): SQG 270-day accumulation option when waste must be transported 200 miles or more for off-site treatment, storage, or disposal.
- [40 CFR 262.15(a)(6)](https://www.ecfr.gov/current/title-40/section-262.15#p-262.15(a)(6)): Satellite accumulation area excess waste dating and three-day removal requirement.

### Central Accumulation Areas

`calculateAccumulationDeadline` assumes the accumulation start date is the date waste first enters the container in a central accumulation area. It returns:

- `deadlineDate`
- `dayLimit`
- `daysElapsed`
- `daysRemaining`
- `isOverdue`
- federal citation and notes

### Satellite Accumulation Areas

`calculateSatelliteAccumulationDeadline` treats the satellite accumulation area threshold date separately from the central accumulation clock.

If a container is moved to the central accumulation area within the three-day window, the main accumulation clock starts on the actual transfer date. If the transfer date is omitted or late, the helper calculates the main deadline from the three-day limit. It also reports `moveDaysRemaining` and `isMoveOverdue` for the three-day move window, and marks completed late transfers with `transferWasLate`.

## Important Limits

- State authorized programs may be more stringent or broader in scope than the federal RCRA baseline.
- These utilities do not determine whether a material is a solid waste or hazardous waste.
- These utilities do not evaluate listed waste, characteristic waste, mixture rule, derived-from rule, used oil, universal waste, pharmaceutical waste, or state-specific waste codes.
- These utilities do not handle episodic generation, emergency permits, or enforcement discretion.
- Facilities remain responsible for final compliance determinations and should review current federal and state requirements.
