# Phase tracker and approval gates

**Working agreement:** show the phase document, explain the changes and checks, then wait for explicit user approval before implementing the next phase. An implementation being complete does not mean it is approved. Silence is not approval. Do not start the next phase's source code while review is pending.

| Phase | Document                                                                    | Status                                    | Gate                                                           |
| ----- | --------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| 1     | [Inspection](phase-1-inspection.md)                                         | Approved                                  | Completed                                                      |
| 2     | [Source ingestion](phase-2-ingestion.md)                                    | Implemented and verified                  | User subsequently authorized revised Phase 3                   |
| 3     | [Product Metrics, Evidence and Consensus Explanation](phase-3-consensus.md) | Implemented and verified; awaiting review | Present report and wait for review                             |
| 4     | [Next-phase scope](phase-4-optimization.md)                                 | Suspended; not started                    | Old optimization proposal superseded; new scope needs approval |
| 5     | [Dashboard/presentation proposal](phase-5-dashboard.md)                     | Earlier proposal; not authorized          | Must preserve fixed consensus and be reviewed again            |
| 6     | [Assistant proposal](phase-6-assistant.md)                                  | Superseded in part                        | User moved grounded Q&A into revised Phase 3                   |
| 7     | [Final verification](phase-7-verification.md)                               | Planned; not started                      | Requires separate approval                                     |

## Executive interface correction

The user authorized a conventional four-page dashboard to replace the five-step presentation proposal. See the [executive redesign report](executive-redesign.md). This is a correction to the Phase 3 interface, not authorization for optimization or further phases. Review remains pending.

## Reporting standard for every phase

1. Authorized scope and explicit exclusions.
2. Files created or changed, linked for inspection.
3. Data/model behavior and provenance implications.
4. Commands executed and actual test/build results.
5. Screens or artifacts available for review.
6. Known limitations and decisions requiring approval.
7. Acceptance checklist and a clear approval gate.

Future-phase documents below are **proposals, not completed work or approved business definitions**. Update the relevant document before implementing a change in its scope. Keep it current as work proceeds and record failures or limitations rather than silently advancing.

## Scope correction recorded

The original broad instruction authorized sequential construction through all phases. Scoring and optimization work was started under that instruction. The user subsequently restricted authorization to Phase 2. That later-phase source and its tests were removed. The user later authorized revised Phase 3 on September 17, 2026: objective evidence and fixed-consensus explanation, without weighted scoring or optimization. All subsequent development remains gated by explicit review.
