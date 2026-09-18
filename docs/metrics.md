# Product metrics and evidence — Phase 3

There is no universal Product Value Score, shared weighting scheme, normalization, risk penalty or product optimizer. These metrics support explanation of approved Team Consensus; they cannot select or replace placements.

## Current products

| Metric                            | Independent formula                           | Meaning / limitation                                                  |
| --------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Historical gross-margin rate      | historicalGrossProfit / historicalSales       | Realized product margin, not net margin                               |
| Full-price sell-through           | fullPriceUnits / historicalBuyQuantity        | Share of original purchase sold full price                            |
| Clearance exposure                | clearanceUnits / historicalBuyQuantity        | Share of purchase cleared; not financial loss dollars                 |
| Gross profit per facing           | historicalGrossProfit / requiredFacings       | All-channel history divided by footprint; not store-attributed profit |
| Sales per facing                  | historicalSales / requiredFacings             | All-channel history divided by footprint; not store-only revenue      |
| Store unit share                  | storeUnits / (storeUnits + onlineUnits)       | Unit share, not revenue share                                         |
| Online unit share                 | onlineUnits / (storeUnits + onlineUnits)      | Availability affects observed channel share                           |
| Historical product cost           | historicalBuyQuantity × unitCost              | Historical buy, not mandatory minimum or forecast                     |
| Return on historical product cost | historicalGrossProfit / historicalProductCost | Historical gross profit return before operating expenses              |
| Rating / reviews                  | supplied averageStars and reviewCount         | No inferred distribution or synthetic ratings                         |

## New products

| Metric                               | Independent formula                      | Provenance                               |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------- |
| Full-price unit margin               | retailPrice − unitCost                   | Calculated Metric from supplier terms    |
| Full-price margin rate               | (retailPrice − unitCost) / retailPrice   | Calculated Metric; not realized margin   |
| Minimum purchase investment          | mandatoryMinimumQuantity × unitCost      | Calculated Metric; no demand implied     |
| Estimated half-price clearance value | retailPrice × 0.50                       | Model Assumption; per-unit illustration  |
| Clearance gain / loss per unit       | illustrative half-price value − unitCost | Model Assumption; before operating costs |
| Mandatory quantity                   | supplied minimum quantity                | Vendor Claim / supplied terms            |
| Required facings                     | supplied numeric footprint               | Vendor Claim / supplied terms            |
| Historical evidence availability     | unavailable                              | Historical data remains null             |
| Licensed status                      | supplied licensed flag                   | Vendor Claim / supplied terms            |

Investment warnings disclose unproven demand, binding purchase quantities, below-cost half-price clearance where applicable, and unprovided expenses. No arbitrary composite risk score is calculated. The Q&A capital-exposure comparison identifies the largest minimum purchase, not the greatest expected loss. Ratings are presented with their review counts; no arbitrary review threshold or confidence score is applied.

## Calculation and comparison rules

Missing numerators/denominators or a zero denominator return null, displayed as Unavailable. Real zero values remain zero. Currency outputs round to cents; ratios retain precision until display. No averages include missing values.

Scenario comparison uses literal C/H/I placements and recomputes facings, online counts, category coverage, agreement counts and selected-product cost evidence from Source data. Historical cost of retained current products and mandatory investment in new products are shown separately. They are different evidence and are not combined into a forecast. Cached sales/profit scenarios from other sheets are not consumed.

## Modeled base assortment results — executive redesign

These projected results are separate from the preserved historical calculations. Inputs come from literal Assumptions cells: base demand multiplier B7, clearance fraction C7, clearance price fraction D7, new demand B13, new online factor B14, channel recapture B15, and product order quantities A21:B46. Invalid or formula-driven assumptions fail import.

For retained current products, base demand is (chosen-channel historical units + recapture × other-channel historical units) × historical full-price units / historical buy quantity. For new products, base demand is mandatory minimum × new demand, multiplied by the online factor for Online-Only placements. Full-price modeled units are the lesser of the order quantity and base demand × demand multiplier. Clearance units are remaining order units × clearance fraction.

Modeled sales = retail price × (full-price units + clearance units × clearance price fraction). Product cost = full order quantity × unit cost, including unsold units. Modeled profit = modeled sales − product cost. Return on product cost = modeled profit / product cost. Removed products contribute zero modeled orders; their historical evidence is retained. Aggregate currency is rounded to cents. Operating expenses are excluded.

Team Choice: modeled sales $27,703,646.95; cost $13,804,500.00; profit $13,899,146.95; return 100.7%. Balanced: modeled sales $29,497,931.95; cost $15,130,500.00; profit $14,367,431.95. Team Choice saves $1,326,000.00 investment with $468,285.00 less modeled profit. These are scenario comparisons, not optimization or guarantees.
