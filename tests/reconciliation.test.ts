import { describe, it, expect } from 'vitest';
import { loadDataset } from '../src/lib/import/load-dataset';
import {
  summarizeProducts,
  minimumInvestment,
  historicalPurchaseCost,
  roundCurrency,
} from '../src/lib/calculations/historical';
import { CATEGORIES } from '../src/types/product';
import { money, number, percent } from '../src/lib/format';
const { products } = loadDataset();
const summary = summarizeProducts(products);
describe('supplied dataset reconciliation', () => {
  it('matches 26 total, 16 current, 10 new and three recognized categories', () => {
    expect(summary).toMatchObject({
      totalProducts: 26,
      currentProducts: 16,
      newProducts: 10,
      categories: 3,
    });
    expect(new Set(products.map((p) => p.category))).toEqual(new Set(CATEGORIES));
  });
  it('has 12 original in-store and four online-only current products', () => {
    expect(
      products.filter((p) => p.productStatus === 'current' && p.originalChannel === 'In-Store'),
    ).toHaveLength(12);
    expect(
      products.filter((p) => p.productStatus === 'current' && p.originalChannel === 'Online-Only'),
    ).toHaveLength(4);
  });
  it('reconciles historical sales to $29,481,671.50', () =>
    expect(summary.historicalSales).toBeCloseTo(29481671.5, 2));
  it('reconciles historical gross profit to $14,775,171.50', () =>
    expect(summary.historicalGrossProfit).toBeCloseTo(14775171.5, 2));
  it('reconciles historical product cost to $14,706,500', () =>
    expect(summary.historicalProductCost).toBeCloseTo(14706500, 2));
  it('sales less purchase cost reconciles to historical gross profit', () =>
    expect(summary.historicalSales - summary.historicalProductCost).toBeCloseTo(
      summary.historicalGrossProfit,
      2,
    ));
  it('Dragon mandatory investment equals $10,800,000', () => {
    const p = products.find((p) => p.productName === '14 ft Giant Animated Dragon')!;
    expect(minimumInvestment(p)).toBeCloseTo(10800000, 2);
    expect(historicalPurchaseCost(p)).toBeNull();
  });
  it('preserves Sitcom = 2 and Animated Reaper = 1 facing', () => {
    expect(
      products.find((p) => p.productName === '7 ft Licensed Sitcom Character')?.requiredFacings,
    ).toBe(2);
    expect(products.find((p) => p.productName === '7 ft Animated Reaper')?.requiredFacings).toBe(1);
  });
  it('current quantity never becomes minimum investment', () => {
    expect(minimumInvestment(products[0])).toBeNull();
    expect(historicalPurchaseCost(products[0])).toBe(5040000);
  });
  it('does not include new products in historical totals', () =>
    expect(
      summarizeProducts(products.filter((p) => p.productStatus === 'current')).historicalSales,
    ).toBe(summary.historicalSales));
  it('rejects missing current history instead of treating it as zero', () =>
    expect(() => summarizeProducts([{ ...products[0], historicalSales: null }])).toThrow(
      'Missing historical evidence',
    ));
});
describe('currency and missing-value formatting', () => {
  it('rounds float noise only at currency boundaries', () => {
    expect(roundCurrency(366416.9999999999)).toBe(366417);
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
  });
  it('renders null as an em dash and retains real zeros', () => {
    expect(money(null)).toBe('—');
    expect(number(null)).toBe('—');
    expect(percent(null)).toBe('—');
    expect(money(0)).toBe('$0.00');
    expect(number(0)).toBe('0');
    expect(percent(0.45)).toBe('45%');
  });
});
