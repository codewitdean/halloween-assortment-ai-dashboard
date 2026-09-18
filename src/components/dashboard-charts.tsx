'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Product } from '@/types/product';
import type { Decision, Placement } from '@/types/consensus';
import { money, percent } from '@/lib/format';
import { minimumInvestment } from '@/lib/calculations/historical';

export const placementColors: Record<Placement, string> = {
  'In-Store': '#65c69b',
  'Online-Only': '#6aaff5',
  Removed: '#9996a3',
};
export const categoryColors = {
  'Giants & Animatronics': '#e7a663',
  Inflatables: '#b89ad9',
  'Decor & Accessories': '#dfca75',
};
const tooltipStyle = {
  background: '#22252c',
  border: '1px solid #565965',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
};
const compact = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}m` : `$${Math.round(n / 1000)}k`;
export const shortName = (name: string) =>
  name
    .replace(/^\d+(\.\d+)? (ft|in) /, '')
    .replace('Inflatable ', '')
    .replace(' Inflatable', '')
    .replace(' (6-piece)', '')
    .replace(' (4-pc)', '');
export function PlacementDonut({ decisions }: { decisions: readonly Decision[] }) {
  const rows = (Object.keys(placementColors) as Placement[]).map((name) => ({
    name,
    value: decisions.filter((d) => d.placement === name).length,
  }));
  return (
    <div className="donut-layout">
      <div
        className="donut-chart"
        role="img"
        aria-label={rows.map((r) => `${r.value} ${r.name}`).join(', ')}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 240, height: 220 }}
        >
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="91%"
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {rows.map((r) => (
                <Cell key={r.name} fill={placementColors[r.name]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{decisions.length}</strong>
          <span>products</span>
        </div>
      </div>
      <div className="placement-legend">
        {rows.map((r) => (
          <div key={r.name}>
            <i style={{ background: placementColors[r.name] }} />
            <span>{r.name}</span>
            <strong>{r.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function PerformanceCharts({
  products,
  decisions,
  onSelect,
}: {
  products: Product[];
  decisions: readonly Decision[];
  onSelect: (p: Product) => void;
}) {
  const current = products.filter(
    (p) =>
      p.productStatus === 'current' &&
      p.historicalSales !== null &&
      p.historicalGrossProfit !== null,
  );
  const fresh = products.filter((p) => p.productStatus === 'new');
  const profitRows = current
    .map((p) => ({
      product: p,
      name: shortName(p.productName),
      value: p.historicalGrossProfit! / p.requiredFacings,
    }))
    .sort((a, b) => b.value - a.value);
  const investmentRows = fresh
    .map((p) => ({ product: p, name: shortName(p.productName), value: minimumInvestment(p)! }))
    .sort((a, b) => b.value - a.value);
  const color = (p: Product) =>
    placementColors[decisions.find((d) => d.productId === p.id)!.placement];
  const bars = (rows: typeof profitRows) =>
    rows.length ? (
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 700, height: 360 }}
      >
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#33363d" horizontal={false} />
          <XAxis type="number" tickFormatter={compact} tick={{ fill: '#bcbecb', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={205}
            tick={{ fill: '#dedee6', fontSize: 11 }}
            interval={0}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => money(Number(v))} />
          <Bar
            dataKey="value"
            name="Calculated amount"
            radius={[0, 3, 3, 0]}
            isAnimationActive={false}
            onClick={(row) => {
              if (row?.payload?.product) onSelect(row.payload.product as Product);
            }}
          >
            {rows.map((r) => (
              <Cell key={r.product.id} fill={color(r.product)} cursor="pointer" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="chart-empty">No products with applicable evidence match these filters.</div>
    );
  return (
    <div className="performance-charts">
      <section className="exec-panel">
        <div className="chart-heading">
          <h2>Sales versus profitability</h2>
          <span className="provenance-small">Historical Fact</span>
        </div>
        <p className="chart-note">
          {current.length} current products · all-channel sales and gross profit. New history is
          unavailable.
        </p>
        <div className="chart-area">
          {current.length ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 700, height: 360 }}
            >
              <ScatterChart margin={{ top: 18, right: 30, bottom: 25, left: 20 }}>
                <CartesianGrid stroke="#33363d" />
                <XAxis
                  dataKey="sales"
                  name="Historical sales"
                  type="number"
                  tickFormatter={compact}
                  tick={{ fill: '#bcbecb', fontSize: 11 }}
                  label={{
                    value: 'Historical sales ($)',
                    position: 'bottom',
                    fill: '#bcbecb',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  dataKey="profit"
                  name="Historical gross profit"
                  type="number"
                  tickFormatter={compact}
                  tick={{ fill: '#bcbecb', fontSize: 11 }}
                  width={70}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload?.product as Product | undefined;
                    return active && p ? (
                      <div className="chart-tooltip">
                        <strong>{p.productName}</strong>
                        <p>Sales: {money(p.historicalSales)}</p>
                        <p>Gross profit: {money(p.historicalGrossProfit)}</p>
                        <p>Historical Fact · click to inspect</p>
                      </div>
                    ) : null;
                  }}
                />
                <Scatter
                  data={current.map((product) => ({
                    product,
                    sales: product.historicalSales,
                    profit: product.historicalGrossProfit,
                  }))}
                  isAnimationActive={false}
                  onClick={(row) => {
                    if (row?.payload?.product) onSelect(row.payload.product as Product);
                  }}
                >
                  {current.map((p) => (
                    <Cell key={p.id} fill={color(p)} cursor="pointer" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Historical evidence unavailable for this selection.</div>
          )}
        </div>
        <PlacementKey />
      </section>
      <section className="exec-panel">
        <div className="chart-heading">
          <h2>Gross profit per facing</h2>
          <MetricTip text="All-channel historical gross profit divided by required facings. This is not store-attributed profit." />
        </div>
        <p className="chart-note">
          Calculated Metric · {current.length} current products · click bars for evidence
        </p>
        <div className="chart-area">{bars(profitRows)}</div>
      </section>
      <section className="exec-panel">
        <div className="chart-heading">
          <h2>New-product minimum investment</h2>
          <MetricTip text="Mandatory minimum quantity × unit cost. This is a supplier purchase commitment, not expected demand." />
        </div>
        <p className="chart-note">
          Calculated Metric · {fresh.length} new candidates · supplier minimums
        </p>
        <div className="chart-area investment-chart">{bars(investmentRows)}</div>
      </section>
      <section className="exec-panel">
        <div className="chart-heading">
          <h2>Licensed-product comparison</h2>
          <span className="provenance-small">Calculated Metric</span>
        </div>
        <p className="chart-note">
          Filtered current products only · aggregate margin, not an average of rates
        </p>
        <div className="licensed-comparison">
          {[true, false].map((licensed) => {
            const ps = current.filter((p) => p.licensed === licensed),
              sales = ps.reduce((s, p) => s + p.historicalSales!, 0),
              gp = ps.reduce((s, p) => s + p.historicalGrossProfit!, 0);
            return (
              <div key={String(licensed)}>
                <div className="chart-heading">
                  <h3>{licensed ? 'Licensed' : 'Non-licensed'}</h3>
                  <span>{ps.length} products</span>
                </div>
                <strong>{percent(sales ? gp / sales : null)}</strong>
                <p>Historical gross-margin rate</p>
                <div className="margin-track">
                  <span
                    style={{
                      width: `${sales ? Math.max(0, Math.min(100, (gp / sales) * 100)) : 0}%`,
                      background: licensed ? '#b89ad9' : '#e7a663',
                    }}
                  />
                </div>
                <dl>
                  <div>
                    <dt>Historical sales</dt>
                    <dd>{money(ps.length ? sales : null)}</dd>
                  </div>
                  <div>
                    <dt>Historical gross profit</dt>
                    <dd>{money(ps.length ? gp : null)}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
        <p className="chart-note">
          New candidates are excluded from historical comparisons. Licensing does not establish
          financial performance.
        </p>
      </section>
    </div>
  );
}
export function MetricTip({ text }: { text: string }) {
  return (
    <span className="metric-tip" tabIndex={0} aria-label={text}>
      i<span role="tooltip">{text}</span>
    </span>
  );
}
export function PlacementKey() {
  return (
    <div className="inline-legend">
      {(Object.keys(placementColors) as Placement[]).map((p) => (
        <span key={p}>
          <i style={{ background: placementColors[p] }} />
          {p}
        </span>
      ))}
    </div>
  );
}
