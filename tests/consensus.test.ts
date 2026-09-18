import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import * as XLSX from 'xlsx';
import { describe, it, expect, afterEach } from 'vitest';
import { loadDataset } from '../src/lib/import/load-dataset';
import { parseConsensus } from '../src/lib/import/consensus';
import { productEvidence, ratio } from '../src/lib/calculations/evidence';
import { summarizeConsensus } from '../src/lib/consensus/summary';
import { generateRationale, rationaleRequestSchema } from '../src/lib/consensus/rationales';
import { saveRationale, loadRationales } from '../src/lib/consensus/store';
import { SCENARIOS } from '../src/types/consensus';
const d = loadDataset(),
  ps = d.products;
const file = fs.readFileSync(path.join('data', d.filename));
const mutate = (edit: (b: XLSX.WorkBook) => void) => {
  const b = XLSX.read(file);
  edit(b);
  return XLSX.write(b, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};
const metric = (name: string, key: string) =>
  productEvidence(ps.find((p) => p.productName === name)!).find((m) => m.key === key)!.value;
describe('approved consensus import', () => {
  it('imports fixed final placements with exact provenance', () => {
    expect(d.consensus.decisions).toHaveLength(26);
    expect(d.consensus.decisions[0]).toMatchObject({
      placement: 'In-Store',
      sourceCell: 'Product decisions!J7',
    });
    expect(d.consensus.decisions[19].placement).toBe('Removed');
    expect(d.consensus.decisions[14].placement).toBe('Online-Only');
    expect(d.consensus.decisions[21].placement).toBe('In-Store');
  });
  it('matches decisions by name rather than source position', () => {
    expect(parseConsensus(file, [...ps].reverse())).toEqual(d.consensus);
  });
  it('rejects missing, duplicate, unknown, undecided and formula placement records', () => {
    for (const change of [
      (b: XLSX.WorkBook) => {
        delete b.Sheets['Product decisions'];
        b.SheetNames = b.SheetNames.filter((s) => s !== 'Product decisions');
      },
      (b: XLSX.WorkBook) => {
        b.Sheets['Product decisions'].A8.v = '12 ft Giant Skeleton';
      },
      (b: XLSX.WorkBook) => {
        b.Sheets['Product decisions'].A8.v = 'Unknown';
      },
      (b: XLSX.WorkBook) => {
        b.Sheets['Product decisions'].J7.v = 'Undecided';
      },
      (b: XLSX.WorkBook) => {
        b.Sheets['Product decisions'].J7.f = '"In-Store"';
      },
      (b: XLSX.WorkBook) => {
        delete b.Sheets['Product decisions'].J7;
      },
    ])
      expect(() => parseConsensus(mutate(change), ps)).toThrow();
  });
  it('ignores narrative rationale and cached summary totals', () => {
    const out = parseConsensus(
      mutate((b) => {
        b.Sheets['Product decisions'].M7 = { t: 's', v: 'fabricated votes' };
        b.Sheets['Team summary'].C25 = { t: 'n', v: 999 };
      }),
      ps,
    );
    expect(out).toEqual(d.consensus);
  });
  it('preserves comparisons without replacing Team Choice', () => {
    const before = JSON.stringify(d.consensus);
    for (const s of SCENARIOS) summarizeConsensus(ps, d.consensus.decisions, s);
    expect(JSON.stringify(d.consensus)).toBe(before);
    expect(
      SCENARIOS.map((s) => summarizeConsensus(ps, d.consensus.decisions, s).agreements),
    ).toEqual([23, 15, 20]);
  });
  it('validates exact facings, online count, categories and one placement per product', () => {
    const s = summarizeConsensus(ps, d.consensus.decisions);
    expect(s).toMatchObject({ valid: true, facings: 16, online: 4, store: 13, removed: 9 });
    expect(Object.values(s.coverage).every((n) => n > 0)).toBe(true);
    expect(summarizeConsensus(ps, d.consensus.decisions.slice(1)).valid).toBe(false);
    expect(summarizeConsensus(ps, [...d.consensus.decisions, d.consensus.decisions[0]]).valid).toBe(
      false,
    );
  });
  it('reports invalid capacity without repairing approved decisions', () => {
    const changed = d.consensus.decisions.map((x, i) =>
      i === 0 ? { ...x, placement: 'Online-Only' as const } : x,
    );
    const before = JSON.stringify(changed);
    expect(summarizeConsensus(ps, changed)).toMatchObject({ valid: false, facings: 13, online: 5 });
    expect(JSON.stringify(changed)).toBe(before);
  });
});
describe('independent objective metrics', () => {
  it('reconciles every current metric for Giant Skeleton', () => {
    const name = '12 ft Giant Skeleton';
    const values: Record<string, number> = {
      margin: 6621000 / 11661000,
      sellThrough: 0.95,
      clearanceExposure: 0.05,
      profitFacing: 2207000,
      salesFacing: 3887000,
      storeShare: 0.45,
      onlineShare: 0.55,
      historicalCost: 5040000,
      returnOnCost: 6621000 / 5040000,
      rating: 4.5,
      reviews: 1200,
    };
    for (const [k, v] of Object.entries(values)) expect(metric(name, k)).toBeCloseTo(v, 8);
  });
  it('reconciles new Dragon supplier and illustrative clearance metrics', () => {
    const name = '14 ft Giant Animated Dragon';
    const values: Record<string, number> = {
      unitMargin: 209,
      fullPriceMargin: 209 / 449,
      minimumInvestment: 10800000,
      halfPrice: 224.5,
      clearanceGain: -15.5,
      mandatoryQuantity: 45000,
      facings: 4,
      licensed: 0,
    };
    for (const [k, v] of Object.entries(values)) expect(metric(name, k)).toBeCloseTo(v, 8);
    expect(metric(name, 'history')).toBeNull();
  });
  it('keeps absent history and zero denominators unavailable', () => {
    expect(ratio(1, 0)).toBeNull();
    expect(ratio(null, 2)).toBeNull();
    expect(ratio(0, 2)).toBe(0);
    expect(
      productEvidence({ ...ps[0], historicalSales: 0 }).find((m) => m.key === 'margin')?.value,
    ).toBeNull();
    expect(
      ps
        .filter((p) => p.productStatus === 'new')
        .every((p) => p.historicalSales === null && p.averageStars === null),
    ).toBe(true);
  });
  it('makes half-price assumptions explicit', () =>
    expect(
      productEvidence(ps[16])
        .filter((m) => ['halfPrice', 'clearanceGain'].includes(m.key))
        .every((m) => m.label === 'Model Assumption'),
    ).toBe(true));
});
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
describe('rationale approval lifecycle', () => {
  it('generates evidence drafts without invented members or score', () => {
    const text = generateRationale(ps[16], d.consensus.decisions[16]);
    expect(text).toContain('$10,800,000.00');
    expect(text).toContain('Historical sales, gross profit');
    expect(text).not.toMatch(/Member \d|Value Score|voted for/);
  });
  it('saves, approves, reloads and resets edited approvals to draft without changing placements', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consensus-test-'));
    dirs.push(dir);
    const before = JSON.stringify(d.consensus);
    const input = {
      fingerprint: d.fingerprint,
      productId: ps[0].id,
      text: 'Team-reviewed rationale',
      action: 'save' as const,
      expectedRevision: 0,
    };
    const first = saveRationale(d, input, dir);
    expect(first.status).toBe('draft');
    const second = saveRationale(d, { ...input, action: 'approve', expectedRevision: 1 }, dir);
    expect(second.approvedAt).not.toBeNull();
    expect(loadRationales(d.fingerprint, dir)[ps[0].id]).toEqual(second);
    expect(
      saveRationale(d, { ...input, text: 'Edited rationale', expectedRevision: 2 }, dir),
    ).toMatchObject({ status: 'draft', approvedAt: null, revision: 3 });
    expect(JSON.stringify(d.consensus)).toBe(before);
  });
  it('rejects stale revisions, changed datasets, blank text and placement payloads', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'consensus-test-'));
    dirs.push(dir);
    const input = {
      fingerprint: d.fingerprint,
      productId: ps[0].id,
      text: 'A reviewed rationale',
      action: 'save' as const,
      expectedRevision: 0,
    };
    saveRationale(d, input, dir);
    expect(() => saveRationale(d, input, dir)).toThrow('another session');
    expect(() => saveRationale(d, { ...input, fingerprint: 'a'.repeat(64) }, dir)).toThrow(
      'Workbook changed',
    );
    expect(rationaleRequestSchema.safeParse({ ...input, placement: 'Removed' }).success).toBe(
      false,
    );
    expect(rationaleRequestSchema.safeParse({ ...input, text: ' ' }).success).toBe(false);
  });
});
