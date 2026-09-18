export const PLACEMENTS = ['In-Store', 'Online-Only', 'Removed'] as const;
export type Placement = (typeof PLACEMENTS)[number];
export const SCENARIOS = ['Balanced', 'Maximum Profit', 'Lower Investment'] as const;
export type Scenario = (typeof SCENARIOS)[number];
export interface Decision {
  readonly productId: string;
  readonly placement: Placement;
  readonly sourceCell: string;
  readonly comparisons: Readonly<Record<Scenario, Placement>>;
  readonly comparisonCells: Readonly<Record<Scenario, string>>;
}
export interface Consensus {
  readonly decisions: readonly Decision[];
  readonly source: 'Product decisions!J7:J32';
}
