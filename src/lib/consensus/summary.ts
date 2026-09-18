import { CATEGORIES, type Product } from '../../types/product';
import { PLACEMENTS, type Decision, type Scenario } from '../../types/consensus';
import {
  historicalPurchaseCost,
  minimumInvestment,
  roundCurrency,
} from '../calculations/historical';
export function summarizeConsensus(
  products: Product[],
  decisions: readonly Decision[],
  scenario?: Scenario,
) {
  const issues: string[] = [];
  let facings = 0,
    online = 0,
    store = 0,
    removed = 0,
    historicalCost = 0,
    newCommitment = 0;
  const coverage = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    (typeof CATEGORIES)[number],
    number
  >;
  if (
    decisions.length !== products.length ||
    new Set(decisions.map((d) => d.productId)).size !== products.length
  )
    issues.push('Every product must have exactly one decision.');
  for (const p of products) {
    const d = decisions.find((d) => d.productId === p.id);
    const placement = scenario ? d?.comparisons[scenario] : d?.placement;
    if (!placement || !PLACEMENTS.includes(placement)) {
      issues.push(`${p.productName}: missing or invalid placement.`);
      continue;
    }
    if (placement === 'In-Store') {
      facings += p.requiredFacings;
      store++;
      coverage[p.category]++;
    }
    if (placement === 'Online-Only') online++;
    if (placement === 'Removed') {
      removed++;
      continue;
    }
    historicalCost += historicalPurchaseCost(p) ?? 0;
    newCommitment += minimumInvestment(p) ?? 0;
  }
  if (decisions.some((d) => !products.some((p) => p.id === d.productId)))
    issues.push('Unknown product in consensus.');
  if (facings !== 16)
    issues.push(
      `Approved placements use ${facings} facings; required: exactly 16. Placements are unchanged.`,
    );
  if (online > 4)
    issues.push(
      `Approved placements use ${online} online-only products; maximum: 4. Placements are unchanged.`,
    );
  for (const c of CATEGORIES) if (!coverage[c]) issues.push(`No in-store product in ${c}.`);
  return {
    facings,
    online,
    store,
    removed,
    coverage,
    valid: issues.length === 0,
    issues,
    historicalCost: roundCurrency(historicalCost),
    newCommitment: roundCurrency(newCommitment),
    agreements: scenario
      ? decisions.filter((d) => d.placement === d.comparisons[scenario]).length
      : decisions.length,
  };
}
