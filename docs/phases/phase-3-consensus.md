# Phase 3 — Product Metrics, Evidence and Consensus Explanation

**Status: implemented and verified; awaiting user review.** Completed September 17, 2026. Phase 4 has not started.

## Approved scope and source authority

The final business recommendation is imported from `Product decisions!J7:J32` in `data/Halloween Assortment — Team Calculator & Scenario Comparison (1).xlsx`. Placements are fixed throughout the application. No weighted Product Value Score, new optimization, individual member votes or inferred member statements were created.

`Source data` remains the exclusive product and financial evidence input. Literal placements in columns C/H/I are imported as existing Balanced, Maximum Profit and Lower Investment comparisons. Rows are matched by exact product name. Missing, duplicate, unknown, invalid and formula-driven decision records fail validation. Cached financial formulas and workbook narrative rationales do not drive calculations or explanations.

The source workbook was not edited. SHA-256: `226a2f3455dc86246a0f38d5064215198b38e9f05e984ac6d25e4302b67ed292`.

## Verified final assortment

| Validation                              | Result                       |
| --------------------------------------- | ---------------------------- |
| Assigned products                       | 26 of 26; one placement each |
| In-store facings                        | 16 of 16                     |
| In-store products                       | 13                           |
| Online-only products                    | 4 of maximum 4               |
| Removed products                        | 9                            |
| Giants & Animatronics in-store products | 3                            |
| Inflatables in-store products           | 4                            |
| Decor & Accessories in-store products   | 6                            |

Team agreement with Balanced is 23/26, Maximum Profit 15/26 and Lower Investment 20/26. Thirteen products differ from at least one comparison. Relative to Balanced, the team retains Witch Cauldron online, removes Sitcom Character, and places Haunted Tree in-store. These are differences in recorded decisions; the app does not claim to know the team's deliberations.

Retained current products have historical purchase cost of $12,095,500. Selected new candidates have minimum purchase investment of $1,709,000. These amounts remain separate: the former is historical evidence, not a new order or forecast.

The original source reconciliation remains passing: 26 products, 16 current, 10 new, three categories, 12 originally in-store and four originally online-only current products; historical sales $29,481,671.50, historical gross profit $14,775,171.50 and historical product cost $14,706,500. Dragon minimum investment is $10,800,000; Sitcom Character requires two facings and Animated Reaper one.

## Calculations and evidence

All required current-product and new-product metrics are implemented independently in application code. See [metric formulas](../metrics.md), [data dictionary](../data-dictionary.md) and [provenance](../provenance.md).

Current metrics include gross-margin rate, full-price sell-through, clearance exposure, gross profit and sales per facing, channel unit shares, historical cost, return on historical cost, rating and reviews. New metrics include unit margin, margin rate, minimum investment, illustrative half-price value and clearance gain/loss, minimum quantity, facings, history availability, licensing and investment warnings.

Missing new history remains null. Missing inputs and zero denominators produce unavailable metrics. Gross profit is not net profit. Half-price clearance uses retail × 50%, explicitly labeled Model Assumption. Clearance exposure means clearance units / historical buy quantity; it does not estimate unsold inventory. All-channel historical sales/profit per facing are identified as such.

## Screens and workflows

- Final Team Assortment: all approved placements, fixed-decision labels and selectable product evidence.
- 16-Facing Validation, Online-Only Validation and Category Coverage: independent checks with no automatic repair.
- Product Evidence: source table and details, objective metrics, formulas, warnings and original versus approved placement.
- Scenario Comparison and Team/Model Disagreements: read-only comparisons and a disagreements/all-products toggle.
- Draft Consensus Rationales: deterministic evidence drafts labeled **“Draft — requires team approval.”** Team members can edit, save and explicitly approve text. Editing approved text returns it to draft. Revision checks reject stale saves; records are bound to the dataset fingerprint.
- AI Question-and-Answer Assistant: server-side answers with evidence, assumptions, risks, confidence and human-judgment considerations. Unsupported requests, placement changes and requests for private member history receive explicit limitations.

Rationale approvals persist separately from the workbook with revision history. No production rationale was approved by this implementation; browser tests use isolated storage. See [rationale and assistant workflow](../consensus-workflow.md).

Review screenshots: [desktop](../screenshots/phase-3-desktop.png), [mobile](../screenshots/phase-3-mobile.png), [product evidence](../screenshots/phase-3-product-detail.png), [assistant](../screenshots/phase-3-assistant.png). Desktop and mobile screenshots were visually inspected.

## Files created or changed

| Area                       | Files                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consensus import and model | `src/types/consensus.ts`, `src/types/product.ts`, `src/lib/import/consensus.ts`, `src/lib/import/load-dataset.ts`, `src/data/dataset.ts`                                                                                                                |
| Objective calculations     | `src/lib/calculations/evidence.ts`, `src/lib/consensus/summary.ts`                                                                                                                                                                                      |
| Rationale workflow         | `src/lib/consensus/rationales.ts`, `src/lib/consensus/store.ts`, `src/app/api/rationales/route.ts`                                                                                                                                                      |
| Grounded assistant         | `src/lib/assistant/answer.ts`, `src/lib/assistant/provider.ts`, `src/app/api/assistant/route.ts`                                                                                                                                                        |
| Request validation         | `src/lib/validation/request.ts`                                                                                                                                                                                                                         |
| Dashboard                  | `src/components/consensus-overview.tsx`, `src/components/evidence-metrics.tsx`, `src/components/rationale-editor.tsx`, `src/components/assistant-panel.tsx`, `src/components/workbench.tsx`, `src/components/product-detail.tsx`, `src/app/globals.css` |
| Verification               | `tests/consensus.test.ts`, `tests/assistant.test.ts`, `tests/request.test.ts`, `tests/browser/consensus.spec.ts`, `tests/browser/dashboard.spec.ts`, existing import tests                                                                              |
| Configuration              | `next.config.ts`, `playwright.config.ts`, `tsconfig.json`, ESLint/Prettier/git ignores, `.env.example`                                                                                                                                                  |
| Documentation              | `README.md`, `docs/metrics.md`, `docs/consensus-workflow.md`, `docs/data-dictionary.md`, `docs/provenance.md`, `docs/known-limitations.md`, phase tracker/revised phase documents, Phase 3 screenshots                                                  |

## Commands and results

| Command             | Final result                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run format`    | Passed                                                                                                       |
| `npm run typecheck` | Passed                                                                                                       |
| `npm run lint`      | Passed                                                                                                       |
| `npm test`          | 85 tests passed across five files                                                                            |
| `npm run test:e2e`  | Three browser tests passed: consensus/rationale/Q&A lifecycle, desktop table/details, mobile viewport/scroll |
| `npm run build`     | Passed; production routes `/`, `/api/rationales`, `/api/assistant` built successfully                        |

Tests cover source reconciliation, authority separation, formula rejection, independent financial formulas, null/zero handling, immutable placements, scenario counts, rationale revisions/approval persistence, request validation and grounded assistant behavior. Provider success/error/refusal/timeout behavior is tested with mocks.

A browser test caught legitimate localhost saves being rejected because Next.js used a different internal bind address. Origin validation was corrected to compare the browser origin with the request host; regression tests also reject different-origin requests. The browser suite now passes. Browser/build output includes a non-failing Node color-environment warning.

## Limitations and review decisions

The dashboard works without AI credentials in disclosed deterministic evidence mode. The optional OpenAI Responses adapter interprets questions into validated intents and known product IDs only. Application code supplies every displayed financial value and answer; the model cannot approve rationales or alter placements. **No live OpenAI provider call was verified.**

Rationale storage targets a single local Node server. It has no authenticated approver identity, shared database or cross-process locking. Production multi-user deployment requires an approved persistence/authentication design. Switching products discards unsaved textarea edits. Ambiguous questions may require selecting products explicitly.

There is no forecast, universal score, new optimizer or reconstruction of private team deliberations. Investment warnings describe supplied commitments and missing evidence, not predicted demand or losses. The numeric facing fields remain authoritative where a merchant note conflicts; that source discrepancy is preserved.

Team review should confirm the documented clearance-exposure definition and illustrative 50% clearance assumption, review/approve generated rationale wording, and decide any future deployment requirements. These choices do not change approved placements. Full limitations are in [known limitations](../known-limitations.md).

## Review gate

Phase 3 is complete for review, not marked user-approved. Stop here. The former Phase 4 optimization proposal is suspended; any next phase requires explicit user approval of a scope that preserves final Team Consensus.
