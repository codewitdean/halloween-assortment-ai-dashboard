import type { Product } from '../../types/product';
import { historicalPurchaseCost, minimumInvestment, roundCurrency } from './historical';
export type EvidenceLabel =
  | 'Historical Fact'
  | 'Calculated Metric'
  | 'Model Assumption'
  | 'Vendor Claim'
  | 'Team Decision'
  | 'AI Interpretation';
export interface EvidenceMetric {
  key: string;
  name: string;
  value: number | null;
  format: 'currency' | 'percent' | 'number' | 'boolean';
  formula: string;
  label: EvidenceLabel;
}
export const ratio = (a: number | null, b: number | null): number | null =>
  a === null || b === null || b === 0 ? null : a / b;
export function productEvidence(p: Product): EvidenceMetric[] {
  const metric = (
    key: string,
    name: string,
    value: number | null,
    format: EvidenceMetric['format'],
    formula: string,
    label: EvidenceLabel = 'Calculated Metric',
  ): EvidenceMetric => ({ key, name, value, format, formula, label });
  if (p.productStatus === 'current') {
    const cost = historicalPurchaseCost(p),
      units = p.storeUnits === null || p.onlineUnits === null ? null : p.storeUnits + p.onlineUnits;
    return [
      metric(
        'margin',
        'Historical gross-margin rate',
        ratio(p.historicalGrossProfit, p.historicalSales),
        'percent',
        'Historical gross profit ÷ historical sales',
      ),
      metric(
        'sellThrough',
        'Full-price sell-through',
        ratio(p.fullPriceUnits, p.historicalBuyQuantity),
        'percent',
        'Full-price units ÷ historical buy quantity',
      ),
      metric(
        'clearanceExposure',
        'Clearance exposure',
        ratio(p.clearanceUnits, p.historicalBuyQuantity),
        'percent',
        'Clearance units ÷ historical buy quantity; not clearance loss dollars',
      ),
      metric(
        'profitFacing',
        'Gross profit per facing',
        ratio(p.historicalGrossProfit, p.requiredFacings),
        'currency',
        'All-channel historical gross profit ÷ required facings; not store-attributed profit',
      ),
      metric(
        'salesFacing',
        'Sales per facing',
        ratio(p.historicalSales, p.requiredFacings),
        'currency',
        'All-channel historical sales ÷ required facings; not store-attributed revenue',
      ),
      metric(
        'storeShare',
        'Store unit share',
        ratio(p.storeUnits, units),
        'percent',
        'Store units ÷ (store units + online units)',
      ),
      metric(
        'onlineShare',
        'Online unit share',
        ratio(p.onlineUnits, units),
        'percent',
        'Online units ÷ (store units + online units)',
      ),
      metric(
        'historicalCost',
        'Historical product cost',
        cost,
        'currency',
        'Historical buy quantity × unit cost',
      ),
      metric(
        'returnOnCost',
        'Return on historical product cost',
        ratio(p.historicalGrossProfit, cost),
        'percent',
        'Historical gross profit ÷ historical product cost; excludes operating costs',
      ),
      metric(
        'rating',
        'Average rating',
        p.averageStars,
        'number',
        'Supplied average stars; not a demand forecast',
        'Historical Fact',
      ),
      metric(
        'reviews',
        'Review count',
        p.reviewCount,
        'number',
        'Supplied number of reviews',
        'Historical Fact',
      ),
    ];
  }
  const half = roundCurrency(p.retailPrice * 0.5);
  return [
    metric(
      'unitMargin',
      'Full-price unit margin',
      roundCurrency(p.retailPrice - p.unitCost),
      'currency',
      'Retail price − unit cost; before operating costs',
    ),
    metric(
      'fullPriceMargin',
      'Full-price margin rate',
      ratio(p.retailPrice - p.unitCost, p.retailPrice),
      'percent',
      '(Retail price − unit cost) ÷ retail price',
    ),
    metric(
      'minimumInvestment',
      'Minimum purchase investment',
      minimumInvestment(p),
      'currency',
      'Mandatory minimum quantity × unit cost',
    ),
    metric(
      'halfPrice',
      'Estimated half-price clearance value',
      half,
      'currency',
      'Per-unit retail price × 50%; illustrative price, not realized recovery',
      'Model Assumption',
    ),
    metric(
      'clearanceGain',
      'Clearance gain / loss per unit',
      roundCurrency(half - p.unitCost),
      'currency',
      'Illustrative half-price value − unit cost',
      'Model Assumption',
    ),
    metric(
      'mandatoryQuantity',
      'Mandatory purchase quantity',
      p.mandatoryMinimumQuantity,
      'number',
      'Supplied mandatory minimum; not expected demand',
      'Vendor Claim',
    ),
    metric(
      'facings',
      'Required facings',
      p.requiredFacings,
      'number',
      'Supplied numeric display requirement',
      'Vendor Claim',
    ),
    metric(
      'history',
      'Historical evidence availability',
      null,
      'number',
      'Unavailable: no historical sales, units or reviews supplied',
      'Historical Fact',
    ),
    metric(
      'licensed',
      'Licensed status',
      Number(p.licensed),
      'boolean',
      'Supplied licensed status',
      'Vendor Claim',
    ),
  ];
}
export function evidenceWarnings(p: Product): string[] {
  const warnings = ['Freight, returns, labor and other operating expenses are not supplied.'];
  if (p.productStatus === 'new') {
    warnings.push(
      'No historical sales, units, ratings or reviews; mandatory purchase is a commitment, not proven demand.',
    );
    if (p.retailPrice * 0.5 < p.unitCost)
      warnings.push(
        'At the illustrative half-price clearance price, every cleared unit loses product margin.',
      );
    warnings.push(
      'Unsold quantity and total clearance recovery are unknown; no demand or sell-through forecast is assumed.',
    );
  } else {
    warnings.push(
      'Interpret the average rating alongside its review count; review distribution and representativeness are unavailable.',
    );
    if (p.originalChannel === 'Online-Only')
      warnings.push(
        'Prior online-only availability does not establish store demand or channel preference.',
      );
    warnings.push(
      'Historical sales and profit span the supplied channels; per-facing ratios are not store-only returns.',
    );
  }
  if (p.productName.includes('Sitcom'))
    warnings.push(
      'Merchant footprint note conflicts with numeric source: Sitcom 2 facings, Animated Reaper 1.',
    );
  return warnings;
}
