1# Product data dictionary

Authoritative input: Source data!A6:T32 in the supplied workbook. `Product` is defined in `src/types/product.ts`; its runtime validation lives in `src/lib/validation/product.ts`. Unavailable optional values are `null`, never zero or an empty string.

| Product field            | Type            | Source column   | Meaning / validation                                                                           |
| ------------------------ | --------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| id                       | string          | generated       | `product:` plus URI-encoded lowercase trimmed name; deterministic and unique, not a source SKU |
| productName              | string          | A               | Nonblank, trimmed, unique ignoring case                                                        |
| productStatus            | current / new   | B               | Case-insensitive conversion from Current / New                                                 |
| category                 | category enum   | C               | Giants & Animatronics; Inflatables; Decor & Accessories                                        |
| requiredFacings          | integer         | D               | Positive, as supplied; no assortment constraints applied in Phase 2                            |
| retailPrice              | number          | E               | Nonnegative USD per unit                                                                       |
| unitCost                 | number          | F               | Nonnegative USD product cost per unit                                                          |
| historicalBuyQuantity    | integer or null | G, current rows | Nonnegative historical purchase quantity; new rows must be null                                |
| mandatoryMinimumQuantity | integer or null | G, new rows     | Positive supplier minimum; current rows must be null                                           |
| fullPriceUnits           | integer or null | H               | Nonnegative historical full-price units                                                        |
| clearanceUnits           | integer or null | I               | Nonnegative historical clearance units                                                         |
| storeUnits               | integer or null | J               | Nonnegative historical store units; online-only products can have a real zero                  |
| onlineUnits              | integer or null | K               | Nonnegative historical online units                                                            |
| averageStars             | number or null  | L               | Supplied average from 0 to 5                                                                   |
| reviewCount              | integer or null | M               | Nonnegative review sample size                                                                 |
| historicalSales          | number or null  | N               | Nonnegative historical USD revenue                                                             |
| historicalGrossProfit    | number or null  | O               | Historical USD product gross profit; negative values allowed; not net profit                   |
| licensed                 | boolean         | P               | Yes/No (case-insensitive, trimmed) or Excel boolean; all other values rejected                 |
| vendorClaim              | string or null  | Q               | Supplied vendor marketing claim; not validated performance                                     |
| merchantNote             | string or null  | R               | Verbatim qualitative source annotation, not app-generated interpretation                       |
| sourceRange              | string or null  | S               | Referenced original workbook cells; original workbook unavailable                              |
| originalChannel          | channel enum    | T               | Current: In-Store or Online-Only; new: Candidate                                               |

All eight historical fields H:O must be present for current products and null for new products. Actual zeros remain numbers. Full-price plus clearance units must not exceed the historical buy; store plus online units must equal the supplied sold-unit totals. Source formulas and Excel error cells are rejected, including cached formula values. Typed numeric strings are rejected rather than guessed.

## Independent arithmetic

- Historical purchase cost: historicalBuyQuantity × unitCost for current products, null for new products.
- Minimum new investment: mandatoryMinimumQuantity × unitCost for new products, null for current products.
- Historical financial cards: sums across validated current products only.
- Summary counts: count products by status and distinct category.
- Currency: retain original numeric values; round financial calculation outputs to cents. Display USD with two decimals.
- No universal scores, modeled sales, profit forecasts or inferred historical results are produced. Phase 3 objective metric definitions are in [metrics.md](metrics.md).

## Dataset metadata

The import response stores filename, UTC import time, SHA-256 fingerprint, source sheet, per-product authoritative A:T row location, successful validation checks and known source warnings. Metadata stays separate from Product. Original source-range references are preserved alongside authoritative workbook row provenance.

## Approved consensus metadata (separate from Product)

`Consensus` contains 26 immutable decision records joined to Product by productId. Each record stores the final `placement` from J, its `sourceCell`, comparison placements from C/H/I, and each comparison source cell. This data is a Team Decision / scenario reference, not a product fact. Runtime parsing rejects unsupported placements and incomplete/duplicate mappings.

Rationale records are separate persisted review artifacts: productId, text, draft/approved status, revision, updatedAt and approvedAt. They are bound to the imported workbook fingerprint and have no placement field. See [consensus workflow](consensus-workflow.md).
