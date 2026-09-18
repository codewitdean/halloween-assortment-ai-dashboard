# Phase 1: source inspection

Inspected every project file at start: empty `README` and `data/Halloween Assortment — Team Calculator & Scenario Comparison.xlsx`. `docs/` was empty. The requested `docs/challenge-instructions.pdf`, `docs/metrics.md`, and original source workbook are absent. Challenge rules are taken from the user request; event presentation requirements quoted in the workbook remain unverified against the original PDF.

## Workbook

11 sheets: Presentation brief, Product decisions, Product evidence, Assumptions, Team summary (hidden), Assortment guide (hidden), Channel evidence (hidden), Customer reviews (hidden), New product risk (hidden), Profit model (hidden), Source data (hidden).

Source data row 6 holds 20 headers. Rows 7–22 contain 16 current products; rows 23–32 contain 10 new candidates. Source values are numeric for money, quantities, facings, ratings and reviews; strings for names, status, categories, licensed Yes/No, notes, source ranges and channels. Empty historical fields on new items are missing, not zero. No source cells contain formulas. Derived sheets contain lookups, SUMIFS, COUNTIFS, IF, MIN and arithmetic, including shared formulas and cached results. No cached error cells were present. Cached outputs are not treated as freshly evaluated results.

Source columns: Product, Current / new, Category, Required facings, Retail price, Unit cost, Historical buy / new minimum, Full-price units, Clearance units, Store units, Online units, Average stars, Review count, Historical sales, Historical gross profit, Licensed, Vendor claim, Merchant note, Source range, Original channel.

Historical sales total $29,481,671.50; gross profit $14,775,171.50; purchase cost $14,706,500. Current products include 12 original in-store items and four online-only items. New prices range from $29.98 to $449, with mandatory purchases from 7,000 to 45,000 units. Dragon alone requires $10.8 million. Financial scale is the supplied business dataset, not one store.

All 26 team placements are Undecided, and all team rationales are blank. Workbook Balanced is an existing judgment-based proposal; Maximum profit is an older profit optimum; Lower investment uses a 90% Balanced-profit floor. These are reference alternatives, not approved team decisions and not the new app's configurable value strategies.

## Ambiguities and gaps

- Channel shares are units, not revenue; channel-level revenue/cost are unavailable.
- Original in-store products historically sold across channels. Proposed placements are exclusive, per task.
- Prior online-only sales do not measure in-store demand.
- Sitcom merchant note implies the Reaper footprint; numeric facings are 2 and 1 respectively. Use numeric values.
- New products have no sales, reviews, channel history or validated forecast.
- Current purchase quantity is last year's buy, not a supplier minimum.
- No approved metric weights, strategic scores, traffic effects, cannibalization, shipping, returns, operating costs or probability-calibrated confidence.
- No actual AI rejection by the team; do not invent one for presentation.

## Provenance

Historical Fact: supplied current performance, reviews and source attributes. Calculated Metric: financial ratios, investment, normalizations, scores, constraints and optimizer outputs. Model Assumption: scenario inputs, transfer rates, penalties and evidence-confidence heuristics. Vendor Claim: new supplier terms/marketing. AI Interpretation: explanatory narrative. Team Decision: edited priorities, strategic assessments, placements and rationale.

## Implementation plan

Import/validate → visible product table → metric configuration → scoring → constraints → deterministic optimizer → charts/presentation → server AI explanation. Run tests or the application at each milestone. All essential decisions work without an API key. Preserve source file and source labels. Reject invalid settings instead of quietly using incorrect totals.
