import type { Product } from '../../types/product';
export const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function historicalPurchaseCost(product: Product): number | null {
  return product.productStatus === 'current' && product.historicalBuyQuantity !== null
    ? roundCurrency(product.historicalBuyQuantity * product.unitCost)
    : null;
}
export function minimumInvestment(product: Product): number | null {
  return product.productStatus === 'new' && product.mandatoryMinimumQuantity !== null
    ? roundCurrency(product.mandatoryMinimumQuantity * product.unitCost)
    : null;
}
export function summarizeProducts(products: Product[]) {
  const current = products.filter((p) => p.productStatus === 'current');
  // Validation guarantees complete current history. Still reject missing inputs here, never coalesce to zero.
  const sum = (getValue: (p: Product) => number | null) =>
    roundCurrency(
      current.reduce((sum, p) => {
        const value = getValue(p);
        if (value === null) throw new Error(`Missing historical evidence for ${p.productName}.`);
        return sum + value;
      }, 0),
    );
  return {
    totalProducts: products.length,
    currentProducts: current.length,
    newProducts: products.length - current.length,
    categories: new Set(products.map((p) => p.category)).size,
    historicalSales: sum((p) => p.historicalSales),
    historicalGrossProfit: sum((p) => p.historicalGrossProfit),
    historicalProductCost: sum(historicalPurchaseCost),
  };
}
