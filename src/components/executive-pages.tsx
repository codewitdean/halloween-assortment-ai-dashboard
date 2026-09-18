'use client';
import { useState } from 'react';
import { ArrowDownRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { ImportedDataset, Product } from '@/types/product';
import { CATEGORIES } from '@/types/product';
import { SCENARIOS, type Placement } from '@/types/consensus';
import type { ModelInputs } from '@/lib/import/model-inputs';
import { modelAssortment } from '@/lib/calculations/modeled';
import { summarizeConsensus } from '@/lib/consensus/summary';
import { summarizeProducts, minimumInvestment } from '@/lib/calculations/historical';
import { money, percent } from '@/lib/format';
import {
  PlacementDonut,
  MetricTip,
  PerformanceCharts,
  categoryColors,
  shortName,
} from './dashboard-charts';
import { ProductTable } from './product-table';
import { RationaleEditor } from './rationale-editor';
import { AssistantPanel } from './assistant-panel';

type Props = { dataset: ImportedDataset; modelInputs: ModelInputs; onSelect: (p: Product) => void };
const selectedProducts = (dataset: ImportedDataset, placement?: Placement) =>
  dataset.products.filter((p) => {
    const d = dataset.consensus.decisions.find((d) => d.productId === p.id)!;
    return placement ? d.placement === placement : d.placement !== 'Removed';
  });
export function Allocation({
  dataset,
  onSelect,
  detailed = false,
}: Pick<Props, 'dataset' | 'onSelect'> & { detailed?: boolean }) {
  const store = selectedProducts(dataset, 'In-Store');
  return (
    <section
      className={`exec-panel allocation-panel ${detailed ? 'detailed' : ''}`}
      aria-label="16-facing allocation"
    >
      <div className="chart-heading">
        <div>
          <span className="eyebrow">TEAM DECISION · FIXED ALLOCATION</span>
          <h2>Every facing has a purpose</h2>
        </div>
        <strong className="allocation-total">
          {store.reduce((s, p) => s + p.requiredFacings, 0)}
          <small>/16 facings</small>
        </strong>
      </div>
      <div className="facing-bar">
        {store.map((p, index) => {
          const start =
            store.slice(0, index).reduce((sum, item) => sum + item.requiredFacings, 0) + 1;
          const offset = start + p.requiredFacings - 1;
          return (
            <button
              key={p.id}
              style={{
                gridColumn: `span ${p.requiredFacings}`,
                borderTopColor: categoryColors[p.category],
              }}
              onClick={() => onSelect(p)}
              title={`${p.productName}: facings ${start}${offset !== start ? `–${offset}` : ''}`}
              aria-label={`${p.productName}, ${p.requiredFacings} facings, inspect evidence`}
            >
              <small>{start === offset ? `${start}` : `${start}–${offset}`}</small>
              <strong>{shortName(p.productName)}</strong>
              <span>
                {p.requiredFacings} {p.requiredFacings === 1 ? 'facing' : 'facings'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="allocation-caption">
        <div className="inline-legend">
          {CATEGORIES.map((c) => (
            <span key={c}>
              <i style={{ background: categoryColors[c] }} />
              {c}
            </span>
          ))}
        </div>
        <span>Click a product to inspect its evidence</span>
      </div>
    </section>
  );
}
export function ExecutiveOverview({ dataset, modelInputs, onSelect }: Props) {
  const summary = summarizeConsensus(dataset.products, dataset.consensus.decisions),
    team = modelAssortment(dataset.products, dataset.consensus.decisions, modelInputs),
    balanced = modelAssortment(
      dataset.products,
      dataset.consensus.decisions,
      modelInputs,
      'Balanced',
    );
  const saved = balanced.cost - team.cost;
  return (
    <div className="overview-page">
      <div className="overview-headline">
        <div>
          <span className="eyebrow orange">FINAL TEAM RECOMMENDATION</span>
          <h1>Executive Overview</h1>
          <p>
            A balanced Halloween assortment with lower investment, stronger capital efficiency,
            complete category coverage, and disciplined use of store space.
          </p>
        </div>
        <span className="approved-stamp">
          <CheckCircle2 size={16} />
          Team Choice approved
        </span>
      </div>
      <div className="executive-kpis">
        {[
          {
            label: 'Facings used',
            value: `${summary.facings}/16`,
            foot: 'Calculated Metric',
            tip: 'Sum of required facings for approved in-store products. Exactly 16 required.',
            accent: 'green',
          },
          {
            label: 'In-store products',
            value: String(summary.store),
            foot: 'Team Decision',
            tip: 'Approved In-Store placements; each product appears in exactly one channel.',
            accent: 'green',
          },
          {
            label: 'Online-only products',
            value: String(summary.online),
            foot: 'Team Decision',
            tip: 'Approved Online-Only placements. Maximum four.',
            accent: 'blue',
          },
          {
            label: 'Removed products',
            value: String(summary.removed),
            foot: 'Team Decision',
            tip: 'Approved removals. No purchase is modeled for these products.',
            accent: 'gray',
          },
          {
            label: 'Modeled base sales',
            value: money(team.sales),
            foot: 'Calculated Metric · Base model',
            tip: 'Projected full-price plus clearance sales, using Source data and Assumptions. Not observed revenue.',
            accent: 'orange',
          },
          {
            label: 'Modeled base profit',
            value: money(team.profit),
            foot: 'Calculated Metric · Base model',
            tip: 'Modeled sales minus the cost of the entire order, including unsold units. Excludes operating expenses; not net profit.',
            accent: 'purple',
          },
          {
            label: 'Return on product cost',
            value: percent(team.returnOnCost),
            foot: 'Calculated Metric · Base model',
            tip: 'Modeled profit divided by modeled full purchase cost. Not gross-margin rate.',
            accent: 'purple',
          },
        ].map((k) => (
          <article className={`executive-kpi ${k.accent}`} key={k.label}>
            <div>
              <span>{k.label}</span>
              <MetricTip text={k.tip} />
            </div>
            <strong>{k.value}</strong>
            <small>{k.foot}</small>
          </article>
        ))}
      </div>
      <div className="overview-middle">
        <section className="exec-panel">
          <div className="chart-heading">
            <h2>Placement mix</h2>
            <span className="provenance-small">Team Decision</span>
          </div>
          <PlacementDonut decisions={dataset.consensus.decisions} />
        </section>
        <section className="exec-panel comparison-panel">
          <div className="chart-heading">
            <h2>Team Choice versus Balanced</h2>
            <span className="provenance-small">Modeled · Base</span>
          </div>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Team Choice</th>
                <th>Balanced</th>
                <th>Team − Balanced</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Product investment', team: team.cost, other: balanced.cost },
                { name: 'Modeled sales', team: team.sales, other: balanced.sales },
                { name: 'Modeled profit', team: team.profit, other: balanced.profit },
              ].map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{money(r.team)}</td>
                  <td>{money(r.other)}</td>
                  <td>
                    {r.team - r.other < 0 ? '−' : '+'}
                    {money(Math.abs(r.team - r.other))}
                  </td>
                </tr>
              ))}
              <tr>
                <td>Return on cost</td>
                <td>{percent(team.returnOnCost)}</td>
                <td>{percent(balanced.returnOnCost)}</td>
                <td>+{((team.returnOnCost! - balanced.returnOnCost!) * 100).toFixed(1)} pp</td>
              </tr>
            </tbody>
          </table>
          <div className="comparison-takeaway">
            <ArrowDownRight size={19} />
            <span>
              <strong>{money(saved)} less product investment</strong> ·{' '}
              {percent(saved / balanced.cost)} below Balanced. Sales and base profit are also lower.
            </span>
          </div>
        </section>
      </div>
      <Allocation dataset={dataset} onSelect={onSelect} />
      <div className="overview-bottom">
        <section className="exec-panel category-validation">
          <div className="chart-heading">
            <h2>Category coverage</h2>
            <span className="valid-badge">
              {Object.values(summary.coverage).filter(Boolean).length}/3 represented
            </span>
          </div>
          <div className="category-coverage">
            {CATEGORIES.map((c) => (
              <div key={c}>
                <span style={{ color: categoryColors[c] }}>
                  <CheckCircle2 size={16} />
                  {c}
                </span>
                <strong>{summary.coverage[c]} in-store products</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="exec-panel ai-insight">
          <div className="chart-heading">
            <h2>
              <Sparkles size={17} />
              AI insight summary
            </h2>
            <span className="provenance-small">AI Interpretation · Draft</span>
          </div>
          <p>
            Team Choice reduces investment by {money(saved)} versus Balanced while preserving all
            categories and 16 facings. The tradeoff is {money(balanced.profit - team.profit)} less
            modeled base profit. Merchant judgment determines whether that tradeoff is worthwhile.
          </p>
        </section>
      </div>
      <p className="overview-footnote">
        Model Assumption · current channel recapture {percent(modelInputs.recapture)}; new store
        demand {percent(modelInputs.newDemand)} of minimum order; new online factor{' '}
        {percent(modelInputs.newOnlineFactor)}; remaining stock cleared at{' '}
        {percent(modelInputs.base.clearancePriceFraction)} of retail. All projected results exclude
        operating costs.
      </p>
    </div>
  );
}
export function ProductPerformance({ dataset, onSelect }: Pick<Props, 'dataset' | 'onSelect'>) {
  const [filtered, setFiltered] = useState(dataset.products);
  const historical = summarizeProducts(dataset.products);
  return (
    <div className="dashboard-page">
      <PageTitle
        title="Product Performance"
        eyebrow="EVIDENCE BEFORE INTERPRETATION"
        description="Compare historical performance and new-product commitments. All charts follow the table filters."
      />
      <div className="historical-strip">
        <span>Historical Fact · {historical.currentProducts} current products</span>
        <strong>Sales {money(historical.historicalSales)}</strong>
        <strong>Gross profit {money(historical.historicalGrossProfit)}</strong>
        <strong>Product cost {money(historical.historicalProductCost)}</strong>
      </div>
      <ProductTable
        products={dataset.products}
        decisions={dataset.consensus.decisions}
        onSelect={onSelect}
        onFilteredChange={setFiltered}
      />
      <PerformanceCharts
        products={filtered}
        decisions={dataset.consensus.decisions}
        onSelect={onSelect}
      />
    </div>
  );
}
function PageTitle({
  title,
  eyebrow,
  description,
}: {
  title: string;
  eyebrow: string;
  description: string;
}) {
  return (
    <header className="dashboard-page-title">
      <span className="eyebrow orange">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
export function FinalAssortment({ dataset, onSelect }: Pick<Props, 'dataset' | 'onSelect'>) {
  const store = selectedProducts(dataset, 'In-Store'),
    online = selectedProducts(dataset, 'Online-Only'),
    removed = selectedProducts(dataset, 'Removed'),
    retained = selectedProducts(dataset);
  const groups = [
    {
      label: 'Limited historical financial return',
      items: removed.filter((p) => p.productStatus === 'current'),
      note: 'Historical sell-through, clearance and margin evidence warrant review.',
    },
    {
      label: 'Unproven purchase commitments',
      items: removed.filter((p) => p.productStatus === 'new'),
      note: 'Mandatory investment without supplied sales or review history.',
    },
  ];
  return (
    <div className="dashboard-page">
      <PageTitle
        title="Final Assortment"
        eyebrow="APPROVED TEAM CONSENSUS"
        description="One final placement for every product. Store space, online capacity and category coverage are independently validated."
      />
      <Allocation dataset={dataset} onSelect={onSelect} detailed />
      <div className="assortment-stats">
        <section className="exec-panel">
          <h2>Category balance</h2>
          <p className="chart-note">Calculated Metric · in-store facings</p>
          {CATEGORIES.map((c) => {
            const n = store
              .filter((p) => p.category === c)
              .reduce((s, p) => s + p.requiredFacings, 0);
            return (
              <div className="category-row" key={c}>
                <span>{c}</span>
                <strong>{n}/16</strong>
                <div>
                  <i style={{ width: `${(n / 16) * 100}%`, background: categoryColors[c] }} />
                </div>
              </div>
            );
          })}
        </section>
        <section className="exec-panel">
          <h2>Price-point coverage</h2>
          <p className="chart-note">Calculated Metric · {retained.length} retained products</p>
          {[
            { name: 'Under $50', test: (p: Product) => p.retailPrice < 50 },
            {
              name: '$50–$149.99',
              test: (p: Product) => p.retailPrice >= 50 && p.retailPrice < 150,
            },
            { name: '$150 and above', test: (p: Product) => p.retailPrice >= 150 },
          ].map((b) => (
            <div className="coverage-row" key={b.name}>
              <span>{b.name}</span>
              <strong>{retained.filter(b.test).length}</strong>
            </div>
          ))}
        </section>
        <section className="exec-panel">
          <h2>Current versus new</h2>
          <p className="chart-note">Calculated Metric · retained assortment</p>
          <div className="composition-numbers">
            <div>
              <strong>{retained.filter((p) => p.productStatus === 'current').length}</strong>
              <span>Current products</span>
            </div>
            <div>
              <strong>{retained.filter((p) => p.productStatus === 'new').length}</strong>
              <span>New candidates</span>
            </div>
          </div>
          <p className="chart-note">New history remains unavailable.</p>
        </section>
        <section className="exec-panel">
          <h2>Licensed coverage</h2>
          <p className="chart-note">Calculated Metric · retained assortment</p>
          <div className="composition-numbers">
            <div>
              <strong>{retained.filter((p) => p.licensed).length}</strong>
              <span>Licensed products</span>
            </div>
            <div>
              <strong>
                {store.filter((p) => p.licensed).reduce((s, p) => s + p.requiredFacings, 0)}
              </strong>
              <span>In-store facings</span>
            </div>
          </div>
          <p className="chart-note">Licensing is supplied status, not proven demand.</p>
        </section>
      </div>
      <div className="final-lists placement-groups">
        <section className="exec-panel">
          <h2 className="green-text">
            In-Store <span>{store.length} products</span>
          </h2>
          <p className="chart-note">Team Decision · 16 facings allocated</p>
          <div className="product-roster">
            {store.map((p) => (
              <ProductRoster key={p.id} product={p} onSelect={onSelect} />
            ))}
          </div>
        </section>
        <section className="exec-panel">
          <h2 className="blue-text">
            Online-Only <span>{online.length} / 4 products</span>
          </h2>
          <p className="chart-note">Team Decision · no store facings</p>
          <div className="product-roster online-roster">
            {online.map((p) => (
              <ProductRoster key={p.id} product={p} onSelect={onSelect} />
            ))}
          </div>
        </section>
      </div>
      <section className="exec-panel removed-section">
        <h2>
          Removed <span>{removed.length} products</span>
        </h2>
        <p className="chart-note">
          Team Decision: placements. Grouping below is an evidence-based explanation draft, not
          recorded team rationale.
        </p>
        <div className="removal-groups">
          {groups.map((g) => (
            <div key={g.label}>
              <h3>{g.label}</h3>
              <p>{g.note}</p>
              <span className="draft-label">Draft — requires team approval</span>
              {g.items.map((p) => (
                <button key={p.id} onClick={() => onSelect(p)}>
                  <span>{p.productName}</span>
                  <small>
                    {p.productStatus === 'new'
                      ? `${money(minimumInvestment(p))} minimum investment`
                      : `${money(p.historicalGrossProfit)} historical gross profit`}
                  </small>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function ProductRoster({
  product: p,
  onSelect,
}: {
  product: Product;
  onSelect: (p: Product) => void;
}) {
  return (
    <button className="roster-item" onClick={() => onSelect(p)}>
      <div>
        <strong>{p.productName}</strong>
        <span>{p.category}</span>
      </div>
      <div>
        <strong>{money(p.retailPrice)}</strong>
        <span>
          {p.productStatus === 'new' ? 'New' : 'Current'} · {p.requiredFacings}{' '}
          {p.requiredFacings === 1 ? 'facing' : 'facings'}
          {p.licensed ? ' · Licensed' : ''}
        </span>
      </div>
    </button>
  );
}
const judgmentProducts = [
  '12 ft Giant Skeleton',
  '7 ft Licensed Sitcom Character',
  '9.5 ft Licensed Sandworm Inflatable',
  '6 ft Scarecrow Inflatable',
  '12 ft Inflatable Haunted Tree',
  'Animated Witch Cauldron',
];
export function JudgmentPage({ dataset, modelInputs, onSelect }: Props) {
  const decisions = dataset.consensus.decisions;
  const agrees = decisions.filter((d) => d.placement === d.comparisons.Balanced).length;
  return (
    <div className="dashboard-page">
      <PageTitle
        title="AI and Team Judgment"
        eyebrow="ANALYTICAL SUPPORT · HUMAN ACCOUNTABILITY"
        description="AI supported the analysis but did not replace merchant judgment. Team Choice is final; existing model scenarios are comparisons only."
      />
      <div className="judgment-panels">
        <section className="exec-panel">
          <span className="eyebrow">CALCULATED METRIC</span>
          <h2>AI calculated</h2>
          <p>
            Channel unit shares, historical margins, profit per facing and supplier minimum
            investment. This app independently reproduces the arithmetic and modeled base results.
          </p>
          <small>No universal weighted score.</small>
        </section>
        <section className="exec-panel">
          <span className="eyebrow">AI INTERPRETATION · DRAFT</span>
          <h2>AI identified</h2>
          <p>
            Capital concentration, clearance exposure, limited review samples and missing
            new-product history. These are evidence prompts, not a substitute for merchant
            expertise.
          </p>
          <small>Vendor claims remain unverified claims.</small>
        </section>
        <section className="exec-panel">
          <span className="eyebrow">TEAM DECISION</span>
          <h2>Team accepted</h2>
          <p>
            {agrees} of 26 final placements agree with Balanced. Animated Reaper, Skeleton Pony and
            Metal Tombstone have the same placement across all three comparison scenarios.
          </p>
          <small>Placement agreement does not imply endorsement of every model assumption.</small>
        </section>
        <section className="exec-panel">
          <span className="eyebrow">TEAM DECISION</span>
          <h2>Team rejected or changed</h2>
          <p>
            Compared with Balanced: Sitcom Character is removed, Haunted Tree moves in-store and
            Witch Cauldron is retained online. Other differences are shown below.
          </p>
          <small>No individual votes or private statements are inferred.</small>
        </section>
      </div>
      <section className="judgment-disagreements">
        <div className="chart-heading">
          <h2>Where merchant judgment differs</h2>
          <span className="provenance-small">Recorded placements · Product decisions</span>
        </div>
        <div className="judgment-cards">
          {judgmentProducts.map((name) => {
            const p = dataset.products.find((p) => p.productName === name)!;
            const d = decisions.find((d) => d.productId === p.id)!;
            return (
              <article className="exec-panel" key={p.id}>
                <button className="judgment-product" onClick={() => onSelect(p)}>
                  {p.productName} ↗
                </button>
                <div className="judgment-choice">
                  <span>Final Team Choice</span>
                  <strong className={`placement-pill placement-${d.placement.toLowerCase()}`}>
                    {d.placement}
                  </strong>
                </div>
                <div className="scenario-mini">
                  {SCENARIOS.map((s) => (
                    <div key={s}>
                      <span>{s}</span>
                      <strong className={d.comparisons[s] !== d.placement ? 'disagrees' : ''}>
                        {d.comparisons[s]}
                      </strong>
                    </div>
                  ))}
                </div>
                <p className="judgment-evidence">
                  {p.productStatus === 'current'
                    ? `${money(p.historicalGrossProfit)} historical gross profit; ${p.requiredFacings} required facings; ${p.averageStars} stars from ${p.reviewCount} reviews.`
                    : `${money(minimumInvestment(p))} mandatory investment; ${p.requiredFacings} required facings; historical demand and reviews unavailable.`}
                </p>
                <small>
                  Calculated Metric / Historical Fact · {p.sourceRange}
                  <br />
                  Team Decision · {d.sourceCell}
                </small>
              </article>
            );
          })}
        </div>
        <p className="chart-note">
          Differences are documented by placement cells. Explanation of why the team made each
          tradeoff remains a draft until the team approves its rationale below.
        </p>
      </section>
      <details className="exec-panel scenario-details">
        <summary>All comparison scenarios and model assumptions</summary>
        <div className="table-wrap" id="scenario-comparison">
          <table>
            <thead>
              <tr>
                <th>Assortment</th>
                <th>Modeled base sales</th>
                <th>Modeled base profit</th>
                <th>Product cost</th>
                <th>Return on cost</th>
                <th>Team agreement</th>
              </tr>
            </thead>
            <tbody>
              {[undefined, ...SCENARIOS].map((s) => {
                const m = modelAssortment(dataset.products, decisions, modelInputs, s);
                return (
                  <tr key={s ?? 'Team Choice'}>
                    <td>{s ?? 'Team Choice · final'}</td>
                    <td>{money(m.sales)}</td>
                    <td>{money(m.profit)}</td>
                    <td>{money(m.cost)}</td>
                    <td>{percent(m.returnOnCost)}</td>
                    <td>
                      {s ? decisions.filter((d) => d.placement === d.comparisons[s]).length : 26}/26
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          Model Assumption · Assumptions!B7:D7 and B13:B15; order quantities A21:B46. Model profit
          subtracts the full order cost, including unsold units, and excludes operating expenses.
          Current order quantities are modeled repeat buys, not supplier minimums. New quantities
          must meet supplied minimums.
        </p>
        <p>
          Base demand multiplier {modelInputs.base.demandMultiplier}; remaining stock clearance
          fraction {percent(modelInputs.base.clearanceFraction)}; clearance price{' '}
          {percent(modelInputs.base.clearancePriceFraction)} of retail; new demand{' '}
          {percent(modelInputs.newDemand)} of minimum; online factor{' '}
          {percent(modelInputs.newOnlineFactor)}; recapture {percent(modelInputs.recapture)}.
        </p>
      </details>
      <RationaleEditor dataset={dataset} />
      <AssistantPanel dataset={dataset} />
    </div>
  );
}
