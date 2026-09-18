# Halloween Assortment AI Decision Dashboard

Four-page executive dashboard redesign of Phase 3 of the Hometown AI Innovation Challenge dashboard: Product Metrics, Evidence and Consensus Explanation. The approved Team Consensus is the final business recommendation. Objective metrics, read-only scenario comparisons, rationale review and grounded Q&A explain the evidence without scoring or reoptimizing products.

## Run locally

Requires Node.js 22.13+ and npm. Tested with Node 26.5.0.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Core evidence, consensus and rationale review need no API key. Optional server-side AI question interpretation is configured in `.env.local` using `.env.example`; without it, Q&A uses explicitly labeled deterministic evidence mode.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Additional commands:

```bash
npm run inspect       # Parse the source and print validation/reconciliation results
npm run format:check  # Check Prettier formatting
npm run format        # Apply formatting
npx playwright install chromium
npm run test:e2e      # Starts isolated local server on port 3100 and test-only rationale store
```

`npm run build` uses the supported Webpack bundler and creates the production application; `npm start` serves it. For a clean production check, stop the dev server before starting production on the same port. The lockfile pins exact dependencies. SheetJS is installed as `xlsx` from its official 0.20.3 distribution, following the [SheetJS installation guide](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/); the older npm registry release has known advisories.

## Workbook and source of truth

The original workbook is preserved at:

`data/Halloween Assortment — Team Calculator & Scenario Comparison (1).xlsx`

Only **Source data** supplies product facts and financial inputs. A separate importer reads **Product decisions!J7:J32** as the approved Team Consensus and C/H/I as comparison-only placements, joined by exact names in A7:A32. Cached calculations, narrative rationale cells and financial scenario outputs never drive the calculations. It rejects formula cells anywhere in Source data, including cells with cached values. Product IDs are derived deterministically from normalized product names; IDs change when a product is renamed because the workbook has no SKU column.

The server reads and validates the workbook on every page request. **Reload workbook** triggers a fresh server import without modifying the workbook. Import time, validation status and SHA-256 file fingerprint are available in the dashboard. A failed import shows an explicit error and no product table or financial totals. No previous values silently substitute for invalid data.

The file name and 26-record expectation live in `src/data/dataset.ts`. This expectation belongs to the supplied challenge dataset; the reusable parser accepts other row counts when no expectation is supplied. To use a different dataset, deliberately update its manifest and reconciliation tests. No arbitrary directory-first-file fallback is used.

### Spreadsheet import instructions

1. Preserve the source file or work on a backup.
2. Keep a sheet named `Source data`. The header row begins in column A and is discovered by its `Product` header (row 6 in the supplied workbook).
3. Preserve these exact headers in A:T: Product; Current / new; Category; Required facings; Retail price; Unit cost; Historical buy / new minimum; Full-price units; Clearance units; Store units; Online units; Average stars; Review count; Historical sales; Historical gross profit; Licensed; Vendor claim; Merchant note; Source range; Original channel.
4. Use literal typed numbers for numeric fields, not numeric text or formulas. Keep blank evidence blank. Entirely blank trailing rows are ignored; partially populated invalid rows are rejected.
5. `Current` rows require their historical buy and historical evidence. `New` rows require a positive mandatory minimum and blank historical evidence. Do not use zero to stand for missing history.
6. Use the three exact category names and `In-Store`, `Online-Only` or `Candidate` as appropriate. Licensed values accept case-insensitive `Yes`/`No` and true Excel boolean cells. Unknown or missing licensed values fail validation.
7. Run `npm run inspect` and `npm test`, then reload the app. Editing data can intentionally change reconciliation results; review and update expectations only when an authorized new dataset replaces this one.

The decision importer also requires the exact row-6 headers Product, Balanced, Maximum profit, Lower investment and Team choice in A/C/H/I/J. Literal In-Store, Online-Only or Removed decisions are required for every product; no formulas or undecided values are accepted. Placements are not editable in the app.

Optional vendor claim, merchant note and original source-range text become `null` when blank. Missing numeric evidence stays `null`, rendered as an em dash. The original referenced workbook is unavailable; its provenance references are retained verbatim.

## Structure

- `src/app`: App Router shell, dynamic server import and styles.
- `src/components`: dashboard, evidence table and accessible native-dialog details panel.
- `src/lib/import`: SheetJS parsing, server file loader and provenance.
- `src/lib/validation`: Zod product and collection validation.
- `src/lib/calculations`: independent current/new evidence metrics and historical arithmetic.
- `src/lib/consensus`: fixed-decision validation, draft explanations and separate rationale revision storage.
- `src/lib/assistant`: bounded question interpretation and code-generated evidence answers.
- `src/app/api`: rationale persistence and grounded Q&A endpoints; no placement mutation endpoint.
- `src/types`: strongly typed Product and import metadata.
- `src/data`: supplied dataset manifest, not a copied product database.
- `tests`: unit, reconciliation and browser tests.
- `docs`: data dictionary, provenance, limitations and original inspection notes.

Tailwind CSS provides the styling framework; local styles handle the dense executive dashboard layout. Native controls and `<dialog>` cover evidence and consensus interactions without an additional component library.

## Historical reconciliation

| Check                                     |       Expected |
| ----------------------------------------- | -------------: |
| Total products                            |             26 |
| Current / new                             |        16 / 10 |
| Recognized categories                     |              3 |
| Current originally in-store / online-only |         12 / 4 |
| Historical sales                          | $29,481,671.50 |
| Historical gross profit                   | $14,775,171.50 |
| Historical product purchase cost          | $14,706,500.00 |
| Dragon mandatory investment               | $10,800,000.00 |
| Sitcom / Animated Reaper facings          |          2 / 1 |

Historical purchase cost = sum of current historical buy quantity × unit cost. Minimum new-product investment = mandatory minimum quantity × unit cost. Gross profit is not net profit. No operating expenses are invented or subtracted. Currency assertions allow floating-point noise below one cent.

## Consensus and rationale review

The imported final assortment has **16 facings, 13 in-store products, four online-only products, and all three categories covered**. The three older scenarios are comparisons only. There is no shared weighted Product Value Score and no optimizer.

Generated rationale text is **Draft — requires team approval**. Select a product, review/edit the evidence summary, then Save draft or explicitly Approve rationale. Editing approved wording requires a new approval. Saves and approvals persist in `.local/rationales` (or `RATIONALE_DATA_DIR`), outside the workbook, with timestamps, revision history and stale-save checks. Save before switching products or reloading. Browser tests use a separate test-only store.

The AI Question-and-Answer Assistant always uses server-calculated evidence. Without credentials it reports deterministic mode. Optional AI selects only the question intent and known products, never financial numbers or placements. Read [consensus workflow](docs/consensus-workflow.md) for setup, storage limits and provider behavior.

## Executive dashboard

Four persistent tabs provide Executive Overview, Product Performance, Final Assortment, and AI and Team Judgment. The overview targets 1920×1080 without scrolling and supports full-screen presentation. Charts and the searchable decision table share filters; products open in an evidence dialog.

Modeled base financial results are independently calculated from Source data, fixed placements, and literal Assumptions inputs. Team Choice has modeled sales of $27,703,646.95, modeled profit of $13,899,146.95, and 100.7% return on product cost. Both modeled sales and profit are lower than Balanced.

See the [redesign review report](docs/phases/executive-redesign.md).

## Documentation and phase review

- [Phase tracker](docs/phases/README.md)
- [Phase 3 report](docs/phases/phase-3-consensus.md)
- [Metric definitions](docs/metrics.md)
- [Consensus/rationale workflow](docs/consensus-workflow.md)
- [Data dictionary](docs/data-dictionary.md)
- [Provenance](docs/provenance.md)
- [Known limitations](docs/known-limitations.md)

Phase 4 is not authorized or implemented. The old optimization proposal is suspended because approved Team Consensus must remain final. Stop for review after Phase 3.

## GitHub Pages edition

`npm run build:pages` creates a static export in `out/` for
`https://codewitdean.github.io/halloween-assortment-ai-dashboard/`.
The build uses an isolated temporary copy of the source, omits server routes,
and validates the workbook before generating the published snapshot. Local
`.env` files and saved rationale records are never copied into this build.

The public edition retains four pages, interactive charts, filters, product
details, and deterministic evidence Q&A. Rationale drafts are read-only;
approvals and live AI calls remain available only in the local server edition.
Updating the published workbook requires a successful rebuild and deployment.
The repository and deployed dashboard are public.

Run `npx playwright test --config playwright.pages.config.ts` after the static
build to verify the repository base path and server-free interactions locally.
Set `PAGES_URL` to the exact deployed URL to run the same check against the live site.

GitHub Pages uses GitHub Actions as its deployment source. Pushes to `main`
run validation, build and browser checks before deployment. The workflow can
also be started manually from the Actions tab.
