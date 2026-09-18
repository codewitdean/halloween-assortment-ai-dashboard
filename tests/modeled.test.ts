import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { loadDashboard } from '../src/lib/import/load-dashboard';
import { parseModelInputs } from '../src/lib/import/model-inputs';
import { modelAssortment, modelProduct } from '../src/lib/calculations/modeled';
const { dataset, modelInputs } = loadDashboard();
const bytes = fs.readFileSync(`data/${dataset.filename}`);
const mutated = (sheet: string, cell: string, value: XLSX.CellObject) => {
  const w = XLSX.read(bytes);
  w.Sheets[sheet][cell] = value;
  return XLSX.write(w, { type: 'buffer', bookType: 'xlsx' });
};
describe('independent base model', () => {
  it('reconciles Team Choice KPIs from source and literal assumptions', () => {
    const m = modelAssortment(dataset.products, dataset.consensus.decisions, modelInputs);
    expect(m.sales).toBeCloseTo(27703646.95, 2);
    expect(m.profit).toBeCloseTo(13899146.95, 2);
    expect(m.cost).toBeCloseTo(13804500, 2);
    expect(m.returnOnCost! * 100).toBeCloseTo(100.6856239, 5);
  });
  it('reconciles Balanced and correctly identifies lower sales and profit', () => {
    const b = modelAssortment(
        dataset.products,
        dataset.consensus.decisions,
        modelInputs,
        'Balanced',
      ),
      t = modelAssortment(dataset.products, dataset.consensus.decisions, modelInputs);
    expect(b.sales).toBeCloseTo(29497931.95, 2);
    expect(b.profit).toBeCloseTo(14367431.95, 2);
    expect(b.cost - t.cost).toBe(1326000);
    expect(t.sales).toBeLessThan(b.sales);
    expect(t.profit).toBeLessThan(b.profit);
  });
  it('reconciles financial totals to underlying product contributions', () => {
    const t = modelAssortment(dataset.products, dataset.consensus.decisions, modelInputs);
    expect(t.rows.reduce((s, r) => s + r.sales, 0)).toBeCloseTo(t.sales, 2);
    expect(t.rows.reduce((s, r) => s + r.cost, 0)).toBeCloseTo(t.cost, 2);
    expect(t.rows.reduce((s, r) => s + r.profit, 0)).toBeCloseTo(t.profit, 2);
  });
  it('never mutates historical evidence or approved placements', () => {
    const before = JSON.stringify(dataset);
    modelAssortment(dataset.products, dataset.consensus.decisions, modelInputs);
    expect(JSON.stringify(dataset)).toBe(before);
    for (const p of dataset.products.filter((p) => p.productStatus === 'new'))
      expect(p.historicalSales).toBeNull();
  });
  it('caps demand to the order, and charges the full order with unsold stock', () => {
    const p = dataset.products.find((p) => p.productStatus === 'new')!;
    const model = {
      ...modelInputs,
      base: { demandMultiplier: 100, clearanceFraction: 0, clearancePriceFraction: 0.5 },
    };
    const row = modelProduct(p, 'In-Store', model);
    expect(row.fullPriceUnits).toBe(row.quantity);
    const zero = modelProduct(p, 'In-Store', {
      ...model,
      base: { ...model.base, demandMultiplier: 0 },
    });
    expect(zero.sales).toBe(0);
    expect(zero.profit).toBe(-zero.cost);
    expect(zero.unsoldUnits).toBe(zero.quantity);
  });
  it('does not replace missing current history with zero', () => {
    const p = { ...dataset.products[0], fullPriceUnits: null };
    expect(() => modelProduct(p, 'In-Store', modelInputs)).toThrow('unavailable');
  });
  it('rejects formulas in assumption inputs', () => {
    expect(() =>
      parseModelInputs(mutated('Assumptions', 'B7', { t: 'n', v: 1, f: '1+0' }), dataset.products),
    ).toThrow('literal');
  });
  it('rejects missing, invalid and below-minimum assumptions', () => {
    expect(() =>
      parseModelInputs(mutated('Assumptions', 'B13', { t: 's', v: '' }), dataset.products),
    ).toThrow();
    expect(() =>
      parseModelInputs(mutated('Assumptions', 'C7', { t: 'n', v: 1.2 }), dataset.products),
    ).toThrow();
    expect(() =>
      parseModelInputs(mutated('Assumptions', 'B37', { t: 'n', v: 1 }), dataset.products),
    ).toThrow('minimum');
  });
  it('rejects duplicate product quantity rows', () => {
    expect(() =>
      parseModelInputs(
        mutated('Assumptions', 'A22', { t: 's', v: dataset.products[0].productName }),
        dataset.products,
      ),
    ).toThrow('duplicate');
  });
  it('ignores corrupt cached financial results', () => {
    const changed = mutated('Team summary', 'E16', { t: 'n', v: 999, f: 'SUM(1)' });
    const model = parseModelInputs(changed, dataset.products);
    expect(modelAssortment(dataset.products, dataset.consensus.decisions, model).sales).toBeCloseTo(
      27703646.95,
      2,
    );
  });
  it('preserves the four approved online-only products', () => {
    const names = dataset.consensus.decisions
      .filter((d) => d.placement === 'Online-Only')
      .map((d) => dataset.products.find((p) => p.id === d.productId)!.productName);
    expect(names).toEqual([
      '9 ft Animated Pirate Ship',
      '16 ft Inflatable Haunted Archway',
      'Life-Size Animated Butler',
      'Animated Witch Cauldron',
    ]);
  });
});
