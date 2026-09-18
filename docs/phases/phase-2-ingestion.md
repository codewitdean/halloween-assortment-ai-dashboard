# Phase 2 — Source ingestion and visible dashboard

**Status: complete and verified — awaiting user review. Not yet approved.**

This report is the review artifact for Phase 2. Do not implement Phase 3 until the user explicitly approves this phase.

## 1. Authorized scope

Build a Next.js/TypeScript application that independently reads and validates the supplied workbook and displays all 26 products. Use only Source data as the authoritative input. No scoring, optimization, scenario modeling, team placement editing or OpenAI integration is included.

## 2. Files created or changed

| Area                   | Files                                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App shell              | [page.tsx](../../src/app/page.tsx), [layout.tsx](../../src/app/layout.tsx), [globals.css](../../src/app/globals.css)                                                                                                 |
| Visible dashboard      | [workbench.tsx](../../src/components/workbench.tsx), [product-table.tsx](../../src/components/product-table.tsx), [product-detail.tsx](../../src/components/product-detail.tsx)                                      |
| Typed model            | [product.ts](../../src/types/product.ts)                                                                                                                                                                             |
| Source parsing         | [workbook.ts](../../src/lib/import/workbook.ts), [load-dataset.ts](../../src/lib/import/load-dataset.ts)                                                                                                             |
| Validation             | [product.ts](../../src/lib/validation/product.ts)                                                                                                                                                                    |
| Independent arithmetic | [historical.ts](../../src/lib/calculations/historical.ts), [format.ts](../../src/lib/format.ts)                                                                                                                      |
| Dataset manifest       | [dataset.ts](../../src/data/dataset.ts)                                                                                                                                                                              |
| Inspection command     | [inspect.ts](../../scripts/inspect.ts)                                                                                                                                                                               |
| Unit tests             | [import.test.ts](../../tests/import.test.ts), [reconciliation.test.ts](../../tests/reconciliation.test.ts)                                                                                                           |
| Browser tests          | [dashboard.spec.ts](../../tests/browser/dashboard.spec.ts), [playwright.config.ts](../../playwright.config.ts)                                                                                                       |
| Tooling                | package.json, package-lock.json, tsconfig.json, next.config.ts, next-env.d.ts, postcss.config.mjs, eslint.config.mjs, vitest.config.ts, .prettierrc.json, .prettierignore, .gitignore                                |
| Documentation          | [README](../../README.md), [data dictionary](../data-dictionary.md), [provenance](../provenance.md), [known limitations](../known-limitations.md), [.env.example](../../.env.example), phase tracker and phase plans |

Next.js also generated AGENTS.md and CLAUDE.md with local framework instructions. The original empty README and source workbook are preserved. Later-phase exploratory scoring/optimization files and tests were removed after the scope was narrowed.

## 3. Data model

The Product interface contains all 23 requested fields with explicit nullability: ID/name/status/category, facings, prices, two distinct quantity fields, historical units/reviews/sales/profit, licensing, vendor/merchant text, source range and original channel.

- Current: historicalBuyQuantity supplied; mandatoryMinimumQuantity = null.
- New: mandatoryMinimumQuantity supplied; historicalBuyQuantity and all eight historical evidence fields = null.
- Blank optional text becomes null. Real numeric zeros remain zeros.
- Product IDs are generated from names; no source SKU is invented.
- Metadata separately retains authoritative source cells, file fingerprint, import time and validation results.

## 4. Validation rules

Require Source data and exact A:T headers. Reject formulas/cached formula cells, Excel errors, duplicate case-insensitive names, unknown statuses/categories/channels, invalid or missing numeric fields, fractional/zero facings, negative retail/cost, unknown licensed values and partially populated nameless rows. Current history must be complete and unit totals must reconcile. New mandatory minimum must be positive and historical fields must be null.

The supplied manifest expects 26 records; the reusable parser has no universal 26-product restriction. Non-source sheets have no influence, proven by tests that mutate/remove them.

## 5. Reconciliation results

All requested reconciliation checks passed in the 56-test unit suite:

| Check                                     | Verified result |
| ----------------------------------------- | --------------: |
| Total/current/new                         |    26 / 16 / 10 |
| Recognized categories                     |               3 |
| Current originally in-store / online-only |          12 / 4 |
| Historical sales                          |  $29,481,671.50 |
| Historical gross profit                   |  $14,775,171.50 |
| Historical product purchase cost          |  $14,706,500.00 |
| Dragon mandatory investment               |  $10,800,000.00 |
| Sitcom Character facings                  |               2 |
| Animated Reaper facings                   |               1 |

Historical purchase cost sums current historical quantity × unit cost. New minimum investment uses mandatory minimum × unit cost. Assertions tolerate sub-cent floating-point noise. Historical gross profit is never called net profit; operating expenses are not fabricated.

## 6. Commands and verification

- `npm install`: dependencies installed. SheetJS updated to official 0.20.3; dependency audit reported zero vulnerabilities afterward.
- `npm run inspect`: **passed**; all 26 products validated and historical totals reconciled.
- `npm run format`: Prettier applied.
- `npm test`: **56 tests passed**.
- `npm run typecheck`: **passed**.
- `npm run lint`: **passed** after fixing JSX error handling and the PostCSS export warning.
- `npm run build`: **passed** using the supported Webpack bundler; dynamic `/` route compiled successfully.
- `npm run test:e2e`: **2 browser tests passed**, covering desktop (1920×1080), mobile (390×844), summaries, all filters, sorting, pagination, empty results, workbook reload, dialog opening/closing, Escape/focus return and horizontal scrolling. No page errors in the desktop flow.

Verification history: an invalid array-formula test fixture was corrected; a React Strict Mode dialog cleanup bug was found by browser tests and fixed. Sandbox restrictions blocked local sockets/browser startup. Turbopack retained a CSS compilation failure from its sandbox attempt, so the production script now uses Next.js's supported `--webpack` option. No failure is counted as a passed check.

## 7. Screens implemented

- Responsive executive evidence overview with loaded/import/validation status.
- Four source-count cards and three explicitly historical financial summary cards.
- Eighteen-column product table with search, category/status/channel/licensed filters, all-column sorting, eight-row pagination, nulls as em dashes and horizontal scrolling.
- Read-only product detail drawer with all source fields, quantity semantics, historical evidence, vendor claim, merchant note, missing-data notice, minimum investment and cell provenance.
- Validation report, file identity and six-label provenance legend. Future-phase labels are identified as reserved.
- Explicit import-failure screen displaying no stale records or totals.

Screenshots were generated and visually reviewed: [desktop](../screenshots/phase-2-desktop.png), [mobile](../screenshots/phase-2-mobile.png), and [new-product details](../screenshots/phase-2-product-detail.png). No page-width overflow on mobile; the wide source table scrolls inside its container. Desktop is a scrolling evidence dashboard, not the later presentation mode.

## 8. Remaining limitations

Original challenge PDF and original source workbook are absent. Source date/period is not independently supplied. Channel data measures units, not channel revenue. New demand and reviews are unknown. Merchant commentary and supplier claims are not forecasts. No upload/editing/database persistence or later-phase decision features exist. See [known limitations](../known-limitations.md).

## 9. Team review items

Confirm acceptance of the separate quantity semantics and of preserving numeric facings despite the Sitcom/Reaper merchant-note conflict. USD display follows the source/task. No scoring weights or model assumptions are needed or approved in Phase 2.

## Approval gate

Review this document, the dashboard and supporting docs. Phase 3 remains planned and unimplemented until explicit approval.
