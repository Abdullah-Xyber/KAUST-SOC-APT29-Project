# Burhan

Burhan is a **Continuous SOC & Incident Response Validation** prototype. It is a
Next.js 15 (App Router) + TypeScript + Tailwind application that runs entirely
client-side against a generated/imported evidence set — there is no backend
server, database, or live external API call in this build.

## Purpose

Adversary-emulation evidence, SIEM/detection evidence, and incident-response
evidence are normally produced by separate tools and never automatically
compared against each other. Burhan's purpose is to bring the three together
into one normalized model and answer, per attack technique:

- Was it detected, and how fast?
- Did the SOC/IR team respond, and how fast?
- Was it contained?
- Where are the coverage gaps?

## Core Workflow

```
Adversary Emulation Evidence
        +
SIEM Detection Evidence
        +
Incident Response Evidence
        ↓
Data Import (manual / CSV / JSON, or generated demo data)
        ↓
Evidence Correlation  (src/lib/engine/correlation.ts)
        ↓
Metrics & Analytics    (src/lib/engine/metrics.ts, analytics.ts)
        ↓
Validation / Scoring   (src/lib/engine/scoring.ts, recommendations.ts)
        ↓
Dashboard · MITRE Coverage · SOC & IR Metrics · Evidence Drawer · Recommendations
```

The correlation engine (`correlate()` in `src/lib/engine/correlation.ts`) matches
each attack event to a telemetry event, a detection event, an incident and any
response actions by technique ID, hostname and a configurable time window
(`CorrelationConfig`, adjustable on the Settings page). Every latency shown in
the UI (detection, acknowledge, triage, containment) is computed from the
timestamps of the correlated records — nothing is hand-entered as a metric.

## Features

Implemented, and present in the source tree under `src/app/(app)/`:

- **Dashboard** — validation score, detection rate, response status, MTTD,
  alerts generated, techniques tested/detected/missed, trend charts, and a
  critical-findings panel, scoped to the historical KAUST baseline run.
- **Validation Runs** — a list of every run (historical and demo) with score,
  detection rate and response rate, filterable by status and free-text search.
- **Validation Run detail** (`/runs/[id]`) — a per-run execution timeline,
  side-by-side attack/defense evidence, a per-technique results table with an
  Evidence Drawer, the score breakdown, and a Markdown "Export Summary"
  download.
- **SOC & IR Metrics** — detection metrics (detection rate, missed-detection
  rate, MTTD, MTTA, average triage time) and incident-response metrics
  (response success rate, MTTR, MTTC, escalation time, containment success
  rate), scoped to "All Runs" or a single selected run, each labeled Measured
  / Estimated / Simulated.
- **MITRE Coverage** — a tactic-by-technique matrix (Tested & Detected /
  Partially Detected / Tested & Missed / Not Tested) for a curated technique
  set, scoped per run via a run selector, with a technique detail drawer.
- **Data Import** — manual form entry, JSON paste, or CSV paste for attack
  events, SIEM detections, and IR actions; validated client-side and merged
  into a synthetic "Manually Imported Evidence" run that flows through the
  same correlation and scoring engine as generated data.
- **Integrations** — cards for MITRE CALDERA, Elastic Security, Splunk,
  Microsoft Sentinel and a generic custom connector, each explicitly labeled
  **Prototype Connector** with a disclosure dialog; no live API calls are made.
- **Evidence Drawer** — a global, click-through drawer (opened from results
  tables, timelines and critical findings) showing the raw attack, telemetry,
  detection, incident and response records behind any validation verdict.
- **Recommendations** — deterministic, rule-based findings (`src/lib/engine/recommendations.ts`,
  rules R1–R10) surfaced as a compact "Findings" list under a run's technique
  results; not AI-generated.
- **Run Demo** — a modal, triggered from the Dashboard, that replays a fixed
  simulated scenario (`APT29 Validation — Live Demo`) with a timed event
  stream, live counters, and one intentionally undetected technique to
  demonstrate a coverage gap.
- **Settings** — adjustable Burhan Score weights, correlation window/rules,
  and a "Reset demo to initial state" action.
- **Mock authentication** (`src/lib/state/AuthProvider.tsx`) — a client-side-only
  login gate with a single hardcoded demo account, no server, no session
  beyond `localStorage`/`sessionStorage`.

Not present: a reports page, a standalone Detection Coverage page, and a
standalone SOC Metrics / Incident Response split — these were consolidated
into the Dashboard, Run detail, and SOC & IR Metrics pages during development.

## Metrics

All metrics are computed in `src/lib/engine/metrics.ts` and
`src/lib/engine/scoring.ts` from correlated evidence. Burhan distinguishes
three evidence-quality tiers (`src/lib/domain/evidenceQuality.ts`), shown as a
badge next to each figure:

| Tier | Meaning |
|---|---|
| **Measured** | Directly derived from timestamped attack/detection evidence (e.g. MTTD, detection rate, ATT&CK technique coverage on the historical baseline). |
| **Estimated** | A procedure-based estimate the original project reported, not something Burhan (or the project) instrumented automatically (MTTC, MTTR, false-positive rate on the historical baseline). |
| **Simulated** | The run is synthetic demo data; every metric on it is simulated. |

**Burhan Validation Score** is a Burhan-specific derived construct, not a
standard SOC/IR metric:

```
Burhan Score = 50% Detection Effectiveness
             + 30% Response Effectiveness
             + 20% Detection Speed
```

Weights are configurable on the Settings page (`ScoreWeights`, normalized to
sum to 1). MITRE technique coverage is reported separately on the MITRE
Coverage page — it measures breadth of testing, not detection quality, and is
not part of the score. The full arithmetic (each component's score, weight,
and the inputs that produced it) is shown on the Dashboard and Run detail
pages, never presented as a black-box number.

## Historical APT29 Baseline

The application ships one run whose evidence basis is marked `"historical"` —
**APT29 LOTL Validation — KAUST Lab** (`KAUST_RUN_ID` in
`src/lib/demo/scenarios.ts`) — used as a demonstration/historical baseline for
the platform. The values below are carried in the source as reported project
facts and are **displayed**, not independently re-measured by Burhan:

- 39 Elastic Security alerts generated
- 11 / 11 selected techniques detected
- 100% selected-scope ATT&CK coverage
- 18.4-second mean time to detect (MTTD)

Of these, MTTD and technique coverage are computed by Burhan's correlation
engine from the timestamped attack/detection records in the source (i.e.
genuinely "measured" from the data present). Alerts generated, mean time to
contain (~2.1 min), mean time to respond/remediate (~5.6 min) and false
positive rate (~8.5%) are carried as fixed, explicitly-labeled
`ProjectBaselineFacts` reported by the original project — Burhan does not
claim to have independently measured these and always renders them with an
**Estimated** badge and tooltip.

All other runs in the dataset (`Credential Access Validation`, `PowerShell
Abuse Validation`, `Lateral Movement Validation`, `APT29 Validation — Live
Demo`) are synthetic and marked `"demo"` / **Simulated Demo Data** throughout
the UI.

## Installation

```
cd tools/burhan
npm install
npm run dev
```

Then open `http://localhost:3000`. The login page shows the demo credentials
directly (`admin@burhan.local` / `burhan123`) — this is a client-side-only mock
login with no backend; it does not gate access to any real system.

Other scripts defined in `package.json`:

```
npm run build        # production build
npm run start         # serve the production build
npm run typecheck     # tsc --noEmit
npm run verify        # runs the correlation/scoring engines against the demo
                       # dataset and prints the resulting numbers (scripts/verify-engines.ts)
```

There is no `lint` script and no ESLint configuration in this project.

## Project Structure

```
tools/burhan/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── login/, forgot-password/
│   │   └── (app)/                # authenticated shell: dashboard, runs,
│   │                              # soc-ir-metrics, mitre-coverage,
│   │                              # data-import, integrations, settings
│   ├── components/               # UI components (charts, tables, drawers,
│   │                              # layout, evidence, integrations, etc.)
│   └── lib/
│       ├── domain/                # types.ts (the normalized data model),
│       │                          # mitre.ts (technique catalog),
│       │                          # evidenceQuality.ts
│       ├── demo/                  # environment.ts, scenarios.ts, generator.ts
│       │                          # — the source of the generated dataset
│       ├── engine/                # correlation.ts, metrics.ts, scoring.ts,
│       │                          # recommendations.ts, analytics.ts, timeline.ts, matrix.ts
│       ├── import/                # schema.ts, parse.ts — manual/CSV/JSON import
│       ├── reports/                # generate.ts — Markdown run-summary export
│       └── state/                  # AuthProvider, DataProvider, ThemeProvider
├── scripts/
│   └── verify-engines.ts         # standalone engine verification harness
├── package.json / package-lock.json
├── next.config.mjs / tsconfig.json / postcss.config.mjs / next-env.d.ts
```

There is no `public/` directory in this project (no static assets are served).

## Data / Import Model

Burhan's normalized domain model lives in `src/lib/domain/types.ts`
(`AttackEvent`, `TelemetryEvent`, `DetectionEvent`, `Incident`,
`ResponseAction`, `ValidationRun`, `Evidence`, `Recommendation`, `Integration`,
etc.). Two sources populate it, both feeding the same in-memory dataset held
by `DataProvider` (`src/lib/state/DataProvider.tsx`) — there is no database:

1. **Generated demo/historical data** — `src/lib/demo/generator.ts` builds the
   full dataset (including the KAUST baseline and all demo runs) from the
   fixed scripts in `src/lib/demo/scenarios.ts` and `environment.ts`.
2. **Manual import** — the Data Import page accepts attack events, SIEM
   detections, and IR actions via a manual form, pasted JSON, or pasted CSV.
   Field sets (`src/lib/import/schema.ts`) are:
   - Attack: Tool, Operation, Technique ID, Technique Name, Host, Execution Time, Status
   - Detection: SIEM, Alert ID, Rule, Technique ID, Host, Alert Time, Status
   - IR action: Incident, Action, Host, Phase, Timestamp, Status (one row per
     action; rows sharing an Incident label accumulate onto the same incident)

   Imported records are validated (`src/lib/import/parse.ts`), normalized into
   the same domain model, grouped into a synthetic `BRH-MANUAL-IMPORT` run, and
   run through the identical correlation/scoring pipeline as generated data.

All data is **local and in-memory for the current browser session** — nothing
is persisted to a server or database, and a page reload regenerates the demo
dataset from source. There is currently no live connection to CALDERA,
Elastic, Splunk, Sentinel, or any other external system.

## Limitations

This is a prototype, and the following are explicit, current limitations:

- **No live API integrations.** The Integrations page cards (CALDERA, Elastic
  Security, Splunk, Microsoft Sentinel, custom) are labeled "Prototype
  Connector" and make no network calls; "Configure" and "Test Connection" open
  local, informational dialogs only. **Live integration with these systems is
  future work**, not implemented functionality.
- **No backend or persistence layer.** All state lives in React context in the
  browser; there is no server, API route, or database in this build.
- **Mock authentication only.** A single hardcoded demo account with no real
  session/security model — not suitable for any deployment beyond a local demo.
- **A curated MITRE ATT&CK subset**, not the full ATT&CK Enterprise matrix.
- **The historical KAUST figures are displayed project facts**, not values
  Burhan independently measured against a live environment — see
  "Historical APT29 Baseline" above for exactly which numbers are measured by
  Burhan's own correlation engine versus carried as the project's own
  estimates.
- **No automated tests.** `npm run verify` is a manual console-output check of
  the engines, not a test suite; there is no `test` script.

## Scope

Burhan is a prototype / proof of concept for unified SOC and incident-response
validation — a demonstration of how adversary-emulation, detection, and
response evidence can be correlated into one measurable view, not a
production security platform.
