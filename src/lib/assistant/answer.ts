import { z } from 'zod';
import type { ImportedDataset } from '../../types/product';
import { SCENARIOS } from '../../types/consensus';
import { productEvidence, evidenceWarnings, type EvidenceLabel } from '../calculations/evidence';
import { formatMetric, type RationaleRecord } from '../consensus/rationales';
import { summarizeConsensus } from '../consensus/summary';
import { minimumInvestment } from '../calculations/historical';
import { money } from '../format';
export const INTENTS = [
  'product',
  'compare',
  'validation',
  'disagreements',
  'risk',
  'lower-investment',
  'members',
  'fixed-placements',
  'unsupported',
] as const;
export const querySchema = z
  .object({
    question: z.string().trim().min(1).max(1500),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    productIds: z.array(z.string().max(500)).max(2),
  })
  .strict();
export type Query = z.infer<typeof querySchema>;
export const intentSchema = z
  .object({ intent: z.enum(INTENTS), productIds: z.array(z.string()).max(2) })
  .strict();
export type Intent = z.infer<typeof intentSchema>;
export interface EvidenceLine {
  label: EvidenceLabel;
  text: string;
  source?: string;
}
export interface Answer {
  mode: string;
  notice: string;
  recommendation: string;
  supporting: EvidenceLine[];
  opposing: EvidenceLine[];
  assumptions: string[];
  risk: string;
  confidence: string;
  humanJudgment: string;
  approvedRationale: EvidenceLine[];
}
export function resolveLocally(
  question: string,
  selected: string[],
  dataset: ImportedDataset,
): Intent {
  const q = question.toLowerCase();
  const matches = dataset.products.filter((p) => q.includes(p.productName.toLowerCase()));
  const productIds = matches.length ? matches.slice(0, 2).map((p) => p.id) : selected;
  const intent = /votes?|individual|member|who said|who chose/.test(q)
    ? 'members'
    : /reoptimi|optimi[sz]e|replace|move .+ online|change .+ placement|what happens if/.test(q)
      ? 'fixed-placements'
      : /lower.?investment/.test(q)
        ? 'lower-investment'
        : /disagree|override|scenario/.test(q)
          ? 'disagreements'
          : /validat|16.?facing|category coverage|online.only count|constraint/.test(q)
            ? 'validation'
            : /greatest|largest|highest.*risk|inventory risk|investment risk/.test(q)
              ? 'risk'
              : /compare|difference between/.test(q)
                ? 'compare'
                : /why|explain|evidence|metric|margin|profit|rating|review|clearance|histor|investment|quantity|facing/.test(
                      q,
                    )
                  ? 'product'
                  : 'unsupported';
  return { intent, productIds };
}
export function buildAnswer(
  dataset: ImportedDataset,
  intent: Intent,
  records: Record<string, RationaleRecord> = {},
): Answer {
  const answer: Answer = {
    mode: 'Deterministic evidence mode',
    notice: 'No language model was used. Interpretive wording is a draft for review.',
    recommendation: 'Approved Team Consensus remains the final business recommendation.',
    supporting: [],
    opposing: [],
    assumptions: [],
    risk: 'No demand forecast or probability-based risk estimate is supplied.',
    confidence:
      'Confidence in the arithmetic depends on the validated source. No confidence score is assigned to consensus or future sales.',
    humanJudgment:
      'Members performed independent analyses and reached consensus through discussion. The app does not know their individual votes, private metrics or statements.',
    approvedRationale: [],
  };
  const summary = summarizeConsensus(dataset.products, dataset.consensus.decisions);
  if (intent.intent === 'members') {
    answer.recommendation =
      'Individual votes, member metrics and statements were not supplied. They cannot be reconstructed from the consensus placements.';
    return answer;
  }
  if (intent.intent === 'fixed-placements') {
    answer.recommendation =
      'Placements are fixed to the approved Team Consensus. This assistant cannot change, replace or reoptimize them.';
    return answer;
  }
  if (intent.intent === 'unsupported') {
    answer.recommendation =
      'This question is outside the available evidence. Ask about a selected product, two-product comparison, constraints, scenario disagreements or new-product investment exposure.';
    return answer;
  }
  if (intent.intent === 'validation') {
    answer.supporting.push(
      {
        label: 'Calculated Metric',
        text: `${summary.facings}/16 facings, ${summary.store} in-store products, ${summary.online}/4 online-only products and ${summary.removed} removed products.`,
        source: dataset.consensus.source,
      },
      {
        label: 'Calculated Metric',
        text: Object.entries(summary.coverage)
          .map(([c, n]) => `${c}: ${n} in-store`)
          .join('; '),
        source: 'Source data category and facing fields + approved decision cells',
      },
    );
    answer.opposing.push(
      ...summary.issues.map((text) => ({ label: 'Calculated Metric' as const, text })),
    );
    return answer;
  }
  if (intent.intent === 'disagreements' || intent.intent === 'lower-investment') {
    const scenarios =
      intent.intent === 'lower-investment' ? ['Lower Investment' as const] : SCENARIOS;
    for (const scenario of scenarios) {
      const s = summarizeConsensus(dataset.products, dataset.consensus.decisions, scenario);
      answer.supporting.push({
        label: 'Calculated Metric',
        text: `${scenario}: ${s.agreements}/${dataset.products.length} placements agree with the team; ${s.facings} facings and ${s.online} online-only products. Selected new minimum commitment: ${money(s.newCommitment)}.`,
        source: 'Product decisions C/H/I + Source data',
      });
      for (const d of dataset.consensus.decisions.filter(
        (d) => d.placement !== d.comparisons[scenario],
      )) {
        const p = dataset.products.find((p) => p.id === d.productId)!;
        answer.opposing.push({
          label: 'Team Decision',
          text: `${p.productName}: team ${d.placement}; ${scenario} ${d.comparisons[scenario]}.`,
          source: `${d.sourceCell}; ${d.comparisonCells[scenario]}`,
        });
      }
    }
    answer.assumptions.push(
      'Scenario names are imported labels only. Cached financial forecasts and claimed optimality are not reproduced.',
    );
    return answer;
  }
  if (intent.intent === 'risk') {
    const candidates = dataset.products
      .filter((p) => p.productStatus === 'new')
      .sort((a, b) => minimumInvestment(b)! - minimumInvestment(a)!);
    const selected = candidates.filter(
      (p) => dataset.consensus.decisions.find((d) => d.productId === p.id)?.placement !== 'Removed',
    );
    for (const [label, p] of [
      ['Largest new candidate commitment', candidates[0]],
      ['Largest retained new commitment', selected[0]],
    ] as const) {
      if (p) {
        const d = dataset.consensus.decisions.find((d) => d.productId === p.id)!;
        answer.supporting.push({
          label: 'Calculated Metric',
          text: `${label}: ${p.productName}, ${money(minimumInvestment(p))}; approved placement ${d.placement}.`,
          source: `${dataset.sourceCells[p.id]}; ${d.sourceCell}`,
        });
      }
    }
    answer.risk =
      'Largest purchase commitment is a capital-exposure comparison, not a forecast of which product will lose the most money. Unsold inventory cannot be estimated without demand assumptions.';
    answer.assumptions.push(
      'All new demand is unavailable. No synthetic history or composite risk score is used.',
    );
    return answer;
  }
  const products = intent.productIds
    .map((id) => dataset.products.find((p) => p.id === id))
    .filter((p) => p !== undefined);
  if (!products.length || (intent.intent === 'compare' && new Set(intent.productIds).size < 2)) {
    answer.recommendation =
      intent.intent === 'compare'
        ? 'Select two different products to compare validated evidence.'
        : 'Select a product or use its full name in the question.';
    return answer;
  }
  for (const p of products) {
    const d = dataset.consensus.decisions.find((d) => d.productId === p.id)!;
    answer.supporting.push({
      label: 'Team Decision',
      text: `${p.productName}: approved ${d.placement}.`,
      source: d.sourceCell,
    });
    answer.supporting.push(
      ...productEvidence(p).map((m) => ({
        label: m.label,
        text: `${p.productName} — ${m.name}: ${formatMetric(m)}. ${m.formula}.`,
        source: dataset.sourceCells[p.id],
      })),
    );
    answer.opposing.push(
      ...evidenceWarnings(p).map((text) => ({
        label: 'AI Interpretation' as const,
        text: `${p.productName}: ${text}`,
        source: dataset.sourceCells[p.id],
      })),
    );
    for (const scenario of SCENARIOS)
      if (d.comparisons[scenario] !== d.placement)
        answer.opposing.push({
          label: 'Team Decision',
          text: `${p.productName}: team differs from ${scenario} (${d.comparisons[scenario]}). A disagreement alone does not reveal the team's reason.`,
          source: `${d.sourceCell}; ${d.comparisonCells[scenario]}`,
        });
    if (p.productStatus === 'new')
      answer.assumptions.push(
        `${p.productName}: half-price clearance is retail × 50%, an illustration rather than predicted realization. Historical evidence is unavailable.`,
      );
    const approved = records[p.id];
    if (approved?.status === 'approved')
      answer.approvedRationale.push({
        label: 'Team Decision',
        text: approved.text,
        source: `User-approved rationale revision ${approved.revision}, ${approved.approvedAt}`,
      });
  }
  answer.recommendation =
    'The approved placements are retained. The evidence below supports review and explanation; it is not proof of the team’s unstated reasoning.';
  return answer;
}
