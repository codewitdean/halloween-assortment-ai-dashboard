import { afterEach, describe, it, expect, vi } from 'vitest';
import { loadDataset } from '../src/lib/import/load-dataset';
import { buildAnswer, querySchema, resolveLocally } from '../src/lib/assistant/answer';
import { interpretQuestion } from '../src/lib/assistant/provider';
const d = loadDataset();
const query = {
  question: 'Explain the evidence for this approved placement.',
  fingerprint: d.fingerprint,
  productIds: [d.products[0].id],
};
afterEach(() => vi.unstubAllEnvs());
describe('grounded assistant', () => {
  it('provides exact validation counts without changing consensus', () => {
    const snapshot = JSON.stringify(d);
    const a = buildAnswer(d, { intent: 'validation', productIds: [] });
    expect(a.supporting[0].text).toContain('16/16');
    expect(a.supporting[0].text).toContain('13 in-store');
    expect(JSON.stringify(d)).toBe(snapshot);
  });
  it('answers with calculated product evidence, sources, limits and no invented history', () => {
    const a = buildAnswer(d, { intent: 'product', productIds: [d.products[16].id] });
    expect(a.supporting.some((e) => e.text.includes('$10,800,000.00'))).toBe(true);
    expect(
      a.supporting.some((e) => e.text.includes('Historical evidence availability: Unavailable')),
    ).toBe(true);
    expect(a.supporting.every((e) => e.source)).toBe(true);
    expect(a.assumptions.join()).toContain('50%');
    expect(a.humanJudgment).toContain('does not know');
  });
  it('distinguishes largest candidate and retained commitments', () => {
    const a = buildAnswer(d, { intent: 'risk', productIds: [] });
    expect(a.supporting[0].text).toContain('Dragon');
    expect(a.supporting[0].text).toContain('Removed');
    expect(a.supporting[1].text).toContain('Black Cat');
    expect(a.risk).toContain('not a forecast');
  });
  it('cannot infer individual votes or change a placement', () => {
    expect(buildAnswer(d, resolveLocally('Who voted for Dragon?', [], d)).recommendation).toContain(
      'not supplied',
    );
    expect(
      buildAnswer(d, resolveLocally('What happens if Skeleton moves online?', [], d))
        .recommendation,
    ).toContain('cannot change');
    expect(querySchema.safeParse({ ...query, placement: 'Removed' }).success).toBe(false);
  });
  it('handles unknown questions and incomplete comparisons', () => {
    expect(buildAnswer(d, resolveLocally('What is the weather?', [], d)).recommendation).toContain(
      'outside',
    );
    expect(
      buildAnswer(d, { intent: 'compare', productIds: query.productIds }).recommendation,
    ).toContain('two different');
  });
  it('quotes only explicitly approved rationale records', () => {
    const record = {
      productId: d.products[0].id,
      text: 'Team-reviewed text',
      status: 'draft' as const,
      revision: 1,
      updatedAt: new Date().toISOString(),
      approvedAt: null,
    };
    expect(
      buildAnswer(
        d,
        { intent: 'product', productIds: query.productIds },
        { [record.productId]: record },
      ).approvedRationale,
    ).toHaveLength(0);
    expect(
      buildAnswer(
        d,
        { intent: 'product', productIds: query.productIds },
        { [record.productId]: { ...record, status: 'approved', approvedAt: record.updatedAt } },
      ).approvedRationale[0].text,
    ).toBe('Team-reviewed text');
  });
  it('works without an API key and makes no provider call', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const provider = vi.fn();
    const r = await interpretQuestion(query, d, provider);
    expect(r.mode).toBe('Deterministic evidence mode');
    expect(provider).not.toHaveBeenCalled();
  });
  it('accepts only structured intents and known IDs from a mocked provider', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-not-a-real-key');
    vi.stubEnv('OPENAI_MODEL', 'test-model');
    const payload = { intent: 'product', productIds: query.productIds };
    const provider = vi.fn<typeof fetch>(async () =>
      Response.json({
        status: 'completed',
        output: [{ content: [{ type: 'output_text', text: JSON.stringify(payload) }] }],
      }),
    );
    const r = await interpretQuestion(query, d, provider);
    expect(r.mode).toBe('AI-assisted question interpretation');
    expect(r.intent).toEqual(payload);
    const sent = JSON.parse(provider.mock.calls[0]?.[1]?.body as string);
    expect(sent.store).toBe(false);
    expect(sent.text.format.strict).toBe(true);
  });
  it.each(['unknown-id', 'invented-prose', 'refusal', 'timeout'])(
    'falls back safely for %s',
    async (kind) => {
      vi.stubEnv('OPENAI_API_KEY', 'test-not-a-real-key');
      vi.stubEnv('OPENAI_MODEL', 'test-model');
      const provider = vi.fn(async () => {
        if (kind === 'timeout') throw new Error('timeout');
        return Response.json({
          status: 'completed',
          output: [
            {
              content: [
                {
                  type: kind === 'refusal' ? 'refusal' : 'output_text',
                  text: JSON.stringify(
                    kind === 'unknown-id'
                      ? { intent: 'product', productIds: ['nonexistent'] }
                      : { intent: 'product', productIds: query.productIds, sales: 999999 },
                  ),
                },
              ],
            },
          ],
        });
      });
      const r = await interpretQuestion(query, d, provider);
      expect(r.mode).toBe('Deterministic evidence fallback');
      expect(r.intent).toEqual(resolveLocally(query.question, query.productIds, d));
    },
  );
});
