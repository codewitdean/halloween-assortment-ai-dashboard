# Fixed consensus and rationale review

## Authorities

- Product facts: only Source data, validated by the Phase 2 importer.
- Final placement: Product decisions!J7:J32, explicitly approved by the user.
- Comparison placements: C7:C32 (Balanced), H7:H32 (Maximum Profit), I7:I32 (Lower Investment).
- Product identity: exact name match in Product decisions!A7:A32 to Source data names, never implicit row alignment.

Literal placement cells must contain In-Store, Online-Only or Removed. Invalid/undecided/missing/duplicate/formula cells block import. Numeric constraints are validated independently; a constraint issue is shown without automatically repairing a placement. No endpoint or control accepts placement mutations.

## Rationale lifecycle

1. Choose a product under Draft Consensus Rationales.
2. Review the generated evidence summary. Every initial rationale is **Draft — requires team approval**.
3. Edit it to reflect the actual team consensus discussion. The app does not invent votes, member metrics or statements.
4. Save draft, or explicitly select Approve rationale for that exact wording.
5. Saved approvals carry a server timestamp and revision. Editing approved text displays a draft state and saving it clears approval. Reapproval is an explicit action.

Rationales are stored in `.local/rationales/<workbook-sha256>.json`, or `RATIONALE_DATA_DIR`. The original workbook is never written. The store retains a revision history and uses an atomic file rename. An expected-revision check prevents a stale browser session from overwriting a newer save. Dataset fingerprints prevent applying approvals to a changed workbook. Old files remain available for audit; a new workbook starts a separate rationale review.

Unsaved text is local to the form. Save before switching products, reloading or closing the page. A load/storage failure is shown explicitly; the UI does not claim approvals it could not read.

This is a trusted local, single-Node-server workflow. There is no login, authenticated approver identity or distributed database lock. An approval means someone explicitly approved wording through this interface, not proof that every member voted. Multi-user production deployment needs authentication, access control and transactional storage. Browser tests use a separate test-only directory and never create actual team approvals.

## Evidence question-and-answer assistant

`POST /api/assistant` reloads the validated dataset on the server. The browser supplies a question, selected product IDs and the displayed dataset fingerprint. Numeric results, source locations and approved placements come exclusively from application code.

Without credentials, the response explicitly says **Deterministic evidence mode**. Supported topics include selected-product evidence, two-product comparison, capacity/category validation, scenario disagreements, the imported Lower Investment scenario, new-product investment exposure, and source limitations. Unsupported questions receive a limitation rather than invented answers.

Optionally configure server-only `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env.local`. The model must support Responses API Structured Outputs. The request uses `store: false`. Only the question, selected IDs and product names/IDs are sent; vendor notes, saved rationale text, financial data and approvals are not sent. The model selects a supported intent and known product IDs. Application code validates that selection and supplies the entire evidence answer. The provider does not generate financial prose or perform arithmetic, nor can it approve wording or change placements. Timeout, refusal, malformed responses and unknown IDs fall back with an explicit notice.

The integration follows the [official Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs). Live account access depends on the configured model; no live provider success is claimed without a credentialed test. Mocked tests cover the optional provider contract and fallback behavior.

Q&A interpretive wording remains **Draft — requires team approval**. Previously approved team wording is quoted separately when available. Asking about private member votes or placement changes cannot bypass those boundaries.
