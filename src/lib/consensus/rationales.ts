import { z } from 'zod';
import type { Product } from '../../types/product';
import { SCENARIOS, type Decision } from '../../types/consensus';
import { productEvidence, evidenceWarnings, type EvidenceMetric } from '../calculations/evidence';
import { money, number, percent } from '../format';
export const DRAFT_LABEL = 'Draft — requires team approval';
export function formatMetric(m: EvidenceMetric) {
  return m.value === null
    ? 'Unavailable'
    : m.format === 'currency'
      ? money(m.value)
      : m.format === 'percent'
        ? percent(m.value)
        : m.format === 'boolean'
          ? m.value
            ? 'Yes'
            : 'No'
          : number(m.value);
}
export function generateRationale(p: Product, d: Decision) {
  const metrics = productEvidence(p);
  const facts = metrics
    .filter((m) => !['history', 'licensed'].includes(m.key))
    .map((m) => `${m.name}: ${formatMetric(m)} [${m.label}].`);
  const agreement = SCENARIOS.map(
    (s) =>
      `${s}: ${d.comparisons[s]} (${d.comparisons[s] === d.placement ? 'agrees with' : 'differs from'} the approved placement).`,
  ).join(' ');
  return [
    `Approved Team Consensus: ${d.placement} [Team Decision, ${d.sourceCell}].`,
    'Evidence summary for review; this does not reconstruct the team’s discussion.',
    ...facts,
    p.productStatus === 'current'
      ? `Historical gross profit was ${money(p.historicalGrossProfit)} on ${money(p.historicalSales)} sales [Historical Fact].`
      : 'Historical sales, gross profit, unit performance, ratings and reviews are unavailable. Supplier economics do not establish demand.',
    d.placement === 'Removed'
      ? 'Tradeoff: removal gives up this product’s potential assortment role; positive historic or unit margin alone does not establish a reason to retain it.'
      : `Placement context: ${d.placement === 'In-Store' ? `${p.requiredFacings} required facings are included in the final store total.` : 'This product occupies one of the available online-only slots.'} Historical channel shares do not prove future demand transfer.`,
    'Scenario comparison: ' + agreement,
    'Limitations: ' + evidenceWarnings(p).join(' '),
    'Team review: confirm which evidence reflects the consensus discussion and add the actual reasoning. No individual member votes, private metrics or statements are supplied.',
  ].join('\n\n');
}
export const rationaleRecordSchema = z
  .object({
    productId: z.string(),
    text: z.string().trim().min(1).max(12000),
    status: z.enum(['draft', 'approved']),
    revision: z.number().int().nonnegative(),
    updatedAt: z.string().datetime(),
    approvedAt: z.string().datetime().nullable(),
  })
  .strict();
export type RationaleRecord = z.infer<typeof rationaleRecordSchema>;
export const rationaleRequestSchema = z
  .object({
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    productId: z.string().min(1).max(500),
    text: z.string().trim().min(1).max(12000),
    action: z.enum(['save', 'approve']),
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict();
export type RationaleRequest = z.infer<typeof rationaleRequestSchema>;
