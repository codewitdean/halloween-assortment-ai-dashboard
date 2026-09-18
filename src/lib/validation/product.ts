import { z } from 'zod';
import { CATEGORIES, type Product } from '../../types/product';
const count = z.number().finite().int().nonnegative();
const amount = z.number().finite().nonnegative();
export const historicalFields = [
  'fullPriceUnits',
  'clearanceUnits',
  'storeUnits',
  'onlineUnits',
  'averageStars',
  'reviewCount',
  'historicalSales',
  'historicalGrossProfit',
] as const;
export const productSchema: z.ZodType<Product> = z
  .object({
    id: z.string().min(1),
    productName: z.string().trim().min(1),
    productStatus: z.enum(['current', 'new']),
    category: z.enum(CATEGORIES),
    requiredFacings: count.positive(),
    retailPrice: amount,
    unitCost: amount,
    historicalBuyQuantity: count.nullable(),
    mandatoryMinimumQuantity: count.positive().nullable(),
    fullPriceUnits: count.nullable(),
    clearanceUnits: count.nullable(),
    storeUnits: count.nullable(),
    onlineUnits: count.nullable(),
    averageStars: z.number().finite().min(0).max(5).nullable(),
    reviewCount: count.nullable(),
    historicalSales: amount.nullable(),
    historicalGrossProfit: z.number().finite().nullable(),
    licensed: z.boolean(),
    vendorClaim: z.string().min(1).nullable(),
    merchantNote: z.string().min(1).nullable(),
    sourceRange: z.string().min(1).nullable(),
    originalChannel: z.enum(['In-Store', 'Online-Only', 'Candidate']),
  })
  .superRefine((p, ctx) => {
    const issue = (field: keyof Product, message: string) =>
      ctx.addIssue({ code: 'custom', path: [field], message });
    if (p.productStatus === 'current') {
      if (p.historicalBuyQuantity === null)
        issue('historicalBuyQuantity', 'Current products require historical buy quantity.');
      if (p.mandatoryMinimumQuantity !== null)
        issue('mandatoryMinimumQuantity', 'A historical buy is not a mandatory minimum.');
      for (const key of historicalFields)
        if (p[key] === null) issue(key, `Current products require ${key}.`);
      if (p.originalChannel === 'Candidate')
        issue('originalChannel', 'Current products require an original selling channel.');
      if (
        p.fullPriceUnits !== null &&
        p.clearanceUnits !== null &&
        p.historicalBuyQuantity !== null &&
        p.fullPriceUnits + p.clearanceUnits > p.historicalBuyQuantity
      )
        issue('fullPriceUnits', 'Sold units exceed historical buy.');
      if (
        p.storeUnits !== null &&
        p.onlineUnits !== null &&
        p.fullPriceUnits !== null &&
        p.clearanceUnits !== null &&
        p.storeUnits + p.onlineUnits !== p.fullPriceUnits + p.clearanceUnits
      )
        issue('storeUnits', 'Channel units do not reconcile to sold units.');
    } else {
      if (p.historicalBuyQuantity !== null)
        issue('historicalBuyQuantity', 'New products must not have historical buy quantity.');
      if (p.mandatoryMinimumQuantity === null)
        issue('mandatoryMinimumQuantity', 'New products require a positive mandatory minimum.');
      for (const key of historicalFields)
        if (p[key] !== null) issue(key, 'New-product historical evidence must remain null.');
      if (p.originalChannel !== 'Candidate')
        issue('originalChannel', 'New products must be marked Candidate.');
    }
  });
export function validateProducts(input: unknown, expectedProductCount?: number): Product[] {
  const schema = z
    .array(productSchema)
    .min(1)
    .superRefine((ps, ctx) => {
      const names = ps.map((p) => p.productName.trim().toLocaleLowerCase('en-US'));
      if (new Set(names).size !== ps.length)
        ctx.addIssue({
          code: 'custom',
          message: 'Product names must be unique (case-insensitive).',
        });
      if (new Set(ps.map((p) => p.id)).size !== ps.length)
        ctx.addIssue({ code: 'custom', message: 'Product IDs must be unique.' });
      if (expectedProductCount !== undefined && ps.length !== expectedProductCount)
        ctx.addIssue({
          code: 'custom',
          message: `This dataset expects ${expectedProductCount} products; found ${ps.length}.`,
        });
    });
  return schema.parse(input);
}
