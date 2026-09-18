> Historical proposal: this scope predates the revised Phase 3 authorization. Fixed Team Consensus takes precedence; scoring/optimization language below is not authorized. The assistant now belongs to Phase 3. Review and revise before starting this phase.

# Phase 6 — Server-side AI explanation assistant

**Status: planned — not started. Requires Phase 5 approval. AI connects last.**

## Proposed scope

Add a server-side assistant that explains loaded data and deterministic outputs. Financial values, scores, constraints, comparisons and counterfactual totals are calculated by application code before any model call. Keep an API-free explanation path so the dashboard remains usable without credentials.

## Review decisions before implementation

Approve provider/model configuration, outbound data scope, usage constraints, factual grounding and handling of unsupported questions. No API key belongs in browser code. Vendor text and imported notes are data, not instructions.

## Planned acceptance checks

- [ ] API credentials remain server-only.
- [ ] Responses include recommendation, supporting/opposing evidence, assumptions, risk, confidence and human judgment considerations.
- [ ] Model output cannot invent or replace financial calculations.
- [ ] Supported comparison, replacement and channel-change questions use precomputed evidence.
- [ ] Missing key, timeout, invalid requests and unsupported questions produce useful explicit states.
- [ ] Tests cover grounding and deterministic counterfactual behavior.
- [ ] Live-provider testing status is disclosed honestly.
- [ ] Typecheck, lint, tests and build pass.

## Expected artifacts and gate

Explanation endpoint, assistant UI, grounding/security documentation, `.env.example` updates and tests. Add actual files/results after implementation. Wait for approval before final Phase 7 handoff.
