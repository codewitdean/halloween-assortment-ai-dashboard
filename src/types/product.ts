import type { Consensus } from './consensus';
/** Nullable fields represent unsupplied evidence, never an inferred zero. */
export const CATEGORIES = ['Giants & Animatronics', 'Inflatables', 'Decor & Accessories'] as const;
export type Category = (typeof CATEGORIES)[number];
export type ProductStatus = 'current' | 'new';
export type OriginalChannel = 'In-Store' | 'Online-Only' | 'Candidate';
export interface Product {
  id: string;
  productName: string;
  productStatus: ProductStatus;
  category: Category;
  requiredFacings: number;
  retailPrice: number;
  unitCost: number;
  historicalBuyQuantity: number | null;
  mandatoryMinimumQuantity: number | null;
  fullPriceUnits: number | null;
  clearanceUnits: number | null;
  storeUnits: number | null;
  onlineUnits: number | null;
  averageStars: number | null;
  reviewCount: number | null;
  historicalSales: number | null;
  historicalGrossProfit: number | null;
  licensed: boolean;
  vendorClaim: string | null;
  merchantNote: string | null;
  sourceRange: string | null;
  originalChannel: OriginalChannel;
}
export interface ImportedDataset {
  products: Product[];
  consensus: Consensus;
  filename: string;
  importedAt: string;
  fingerprint: string;
  sourceSheet: 'Source data';
  sourceCells: Record<string, string>;
  validation: { status: 'passed'; checks: string[]; warnings: string[] };
}
