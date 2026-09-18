# Known limitations — Phase 3

- Final Team Consensus is fixed. There is no universal score, shared weight configuration, normalization, reoptimization, placement editor or new strategy selection.
- The original challenge PDF and original source workbook remain absent. The updated calculator workbook is the supplied input. Product facts come from Source data; approved/comparison placements come from the explicitly authorized decision columns.
- All new-product history remains null. Minimum buys and supplier margin do not establish demand. Separately labeled modeled results use literal workbook assumptions; they are not observed performance or validated demand forecasts.
- Current quantity is historical buy; its supplier minimum is unknown. New quantity is mandatory minimum, not a sales target. Historical current-product cost and new commitments are displayed separately.
- Historical channel mix is unit mix, not revenue mix. Historical per-facing sales/profit spans all supplied channels; it is not a store-only attribution. Prior online-only availability does not prove customer channel preference.
- No freight, returns, labor or other operating costs were supplied. Gross profit is not net profit.
- Per-unit half-price clearance is a 50% illustration. Modeled assortment clearance additionally uses workbook demand and clearance-fraction assumptions; none establishes realized liquidation outcomes.
- The Sitcom merchant note conflicts with numeric footprint fields. Numeric evidence remains Sitcom 2 / Animated Reaper 1. No placement is changed to resolve the commentary.
- No individual votes, member-specific metrics or statements were supplied. Generated rationale text must be reviewed and edited to reflect the actual discussion.
- Rationale persistence supports a trusted local single Node server and writable disk. No authenticated approver identity, shared cloud database, automatic backups or multi-process locking is implemented. Deploying publicly requires a separate access-control/storage design.
- Unsaved edits are lost on product switch/reload. Stale revisions are rejected; workbook changes isolate old approvals by fingerprint. Corrupt storage is reported, not silently treated as approved or empty.
- The optional AI provider only interprets question intent/products. It does not author the factual answer. Unsupported or ambiguous questions can require selecting the intended products explicitly. Model-generated finance cannot enter the response.
- A live AI-provider call requires the user’s server-side credentials/model configuration. Test coverage uses mocked provider responses plus the functional API-free evidence path; live account behavior must be reported separately.
- Product IDs derive from names, not source SKUs. The supplied dataset requires 26 products by manifest; the product-only parser is reusable with other sizes.

Phase 4 remains unstarted. Its earlier optimization proposal is superseded by the fixed-consensus requirement; future scope requires explicit review and authorization.
