import type { Product } from '../../types/product';
import type { Decision, Placement, Scenario } from '../../types/consensus';
import type { ModelInputs } from '../import/model-inputs';
import { roundCurrency } from './historical';

export function modelProduct(p: Product, placement: Placement, inputs: ModelInputs) {
  const quantity = placement === 'Removed' ? 0 : inputs.quantities[p.id];
  if (quantity === undefined)
    throw new Error(`Missing modeled order quantity for ${p.productName}.`);
  let demand = 0;
  if (placement !== 'Removed') {
    if (p.productStatus === 'new') {
      if (p.mandatoryMinimumQuantity === null) throw new Error('Missing mandatory minimum.');
      demand =
        p.mandatoryMinimumQuantity *
        inputs.newDemand *
        (placement === 'Online-Only' ? inputs.newOnlineFactor : 1);
    } else {
      if (
        p.storeUnits === null ||
        p.onlineUnits === null ||
        p.fullPriceUnits === null ||
        !p.historicalBuyQuantity
      )
        throw new Error(`Historical inputs unavailable for ${p.productName}.`);
      demand =
        (((placement === 'In-Store' ? p.storeUnits : p.onlineUnits) +
          inputs.recapture * (placement === 'In-Store' ? p.onlineUnits : p.storeUnits)) *
          p.fullPriceUnits) /
        p.historicalBuyQuantity;
    }
  }
  const fullPriceUnits = Math.min(quantity, demand * inputs.base.demandMultiplier);
  const clearanceUnits = (quantity - fullPriceUnits) * inputs.base.clearanceFraction;
  const sales =
    p.retailPrice * (fullPriceUnits + clearanceUnits * inputs.base.clearancePriceFraction);
  const cost = quantity * p.unitCost;
  return {
    productId: p.id,
    placement,
    quantity,
    fullPriceUnits,
    clearanceUnits,
    unsoldUnits: quantity - fullPriceUnits - clearanceUnits,
    sales,
    cost,
    profit: sales - cost,
  };
}
export function modelAssortment(
  products: Product[],
  decisions: readonly Decision[],
  inputs: ModelInputs,
  scenario?: Scenario,
) {
  const rows = products.map((p) => {
    const d = decisions.find((d) => d.productId === p.id);
    if (!d) throw new Error(`Missing decision for ${p.productName}.`);
    return modelProduct(p, scenario ? d.comparisons[scenario] : d.placement, inputs);
  });
  const sales = roundCurrency(rows.reduce((sum, row) => sum + row.sales, 0));
  const cost = roundCurrency(rows.reduce((sum, row) => sum + row.cost, 0));
  const profit = roundCurrency(sales - cost);
  return { rows, sales, cost, profit, returnOnCost: cost === 0 ? null : profit / cost };
}
