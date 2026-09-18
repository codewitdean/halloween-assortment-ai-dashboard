'use client';
import { useState } from 'react';
import type { ImportedDataset, Product } from '@/types/product';
import { PLACEMENTS, SCENARIOS } from '@/types/consensus';
import { summarizeConsensus } from '@/lib/consensus/summary';
import { money } from '@/lib/format';
export function ConsensusOverview({
  dataset,
  onSelect,
}: {
  dataset: ImportedDataset;
  onSelect: (p: Product) => void;
}) {
  const ds = dataset.consensus.decisions;
  const total = summarizeConsensus(dataset.products, ds);
  const [onlyDifferences, setOnlyDifferences] = useState(true);
  const lookup = (id: string) => dataset.products.find((p) => p.id === id)!;
  return (
    <>
      <section className="consensus-hero" id="final-assortment">
        <div>
          <span className="eyebrow">TEAM DECISION · FINAL BUSINESS RECOMMENDATION</span>
          <h2>Final Team Assortment</h2>
          <p>
            Independent member analyses. Discussion-led consensus. Approved placements are fixed.
          </p>
        </div>
        <span className="locked-badge">Approved Team Consensus · Read-only</span>
      </section>
      <div className="consensus-validation">
        <article>
          <small>Calculated Metric</small>
          <h3>16-Facing Validation</h3>
          <strong className={total.facings === 16 ? 'mint' : 'orange'}>{total.facings}/16</strong>
          <p>{total.store} in-store products · Numeric source facings</p>
        </article>
        <article>
          <small>Calculated Metric</small>
          <h3>Online-Only Validation</h3>
          <strong className={total.online <= 4 ? 'mint' : 'orange'}>{total.online}/4</strong>
          <p>Maximum four · Each product has one placement</p>
        </article>
        <article>
          <small>Calculated Metric</small>
          <h3>Category Coverage</h3>
          <strong className="mint">{Object.values(total.coverage).filter(Boolean).length}/3</strong>
          <p>
            {Object.entries(total.coverage)
              .map(([c, n]) => `${c}: ${n}`)
              .join(' · ')}
          </p>
        </article>
      </div>
      {!total.valid && (
        <div className="missing-warning" role="alert">
          {total.issues.join(' ')} Validation does not alter the approved decisions.
        </div>
      )}
      <section className="panel assortment-list">
        <div className="section-head">
          <div>
            <h2>Approved placements</h2>
            <p>
              Team Decision · {dataset.consensus.source}. Product facts remain sourced separately.
            </p>
          </div>
          <span className="source-tag">{ds.length} final decisions</span>
        </div>
        <div className="placement-groups">
          {PLACEMENTS.map((placement) => (
            <section key={placement}>
              <h3>
                {placement}
                <span>{ds.filter((d) => d.placement === placement).length}</span>
              </h3>
              <ul>
                {ds
                  .filter((d) => d.placement === placement)
                  .map((d) => {
                    const p = lookup(d.productId);
                    return (
                      <li key={d.productId}>
                        <button onClick={() => onSelect(p)}>
                          {p.productName}
                          <small>
                            {p.productStatus === 'new' ? 'New' : 'Current'}
                            {placement === 'In-Store'
                              ? ` · ${p.requiredFacings} facing${p.requiredFacings === 1 ? '' : 's'}`
                              : ''}
                          </small>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      </section>
      <section className="panel scenario-panel" id="scenario-comparison">
        <div className="section-head">
          <div>
            <span className="eyebrow">COMPARISON ONLY · NO REOPTIMIZATION</span>
            <h2>Scenario Comparison</h2>
            <p>
              Imported scenario placements; all counts and cost evidence independently calculated.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>In-store / facings</th>
                <th>Online-only</th>
                <th>Category coverage</th>
                <th>Agrees with team</th>
                <th>Retained current historical cost¹</th>
                <th>New minimum commitment²</th>
              </tr>
            </thead>
            <tbody>
              {[null, ...SCENARIOS].map((s) => {
                const v = summarizeConsensus(dataset.products, ds, s ?? undefined);
                return (
                  <tr key={s ?? 'team'}>
                    <td>
                      <strong>{s ?? 'Approved Team Consensus'}</strong>
                    </td>
                    <td>
                      {v.store} / {v.facings}
                    </td>
                    <td>{v.online}</td>
                    <td>{Object.values(v.coverage).filter(Boolean).length}/3</td>
                    <td>{s ? `${v.agreements}/${ds.length}` : 'Final recommendation'}</td>
                    <td>{money(v.historicalCost)}</td>
                    <td>{money(v.newCommitment)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="consensus-note">
          Calculated Metric · ¹ Last season’s product cost for retained current items, not a new
          purchasing forecast. ² Supplier minimum investment for selected new candidates. These
          amounts describe different evidence and are not combined into a forecast. “Maximum Profit”
          and “Lower Investment” are imported scenario names, not newly verified optimality claims.
        </p>
      </section>
      <section className="panel disagreement-panel" id="disagreements">
        <div className="section-head">
          <div>
            <h2>Team/Model Disagreements</h2>
            <p>
              Differences show team overrides of comparison placements, not evidence of individual
              votes.
            </p>
          </div>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={onlyDifferences}
              onChange={(e) => setOnlyDifferences(e.target.checked)}
            />
            Disagreements only
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Approved Team Consensus</th>
                {SCENARIOS.map((s) => (
                  <th key={s}>{s} · comparison only</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ds
                .filter(
                  (d) =>
                    !onlyDifferences || SCENARIOS.some((s) => d.placement !== d.comparisons[s]),
                )
                .map((d) => (
                  <tr key={d.productId}>
                    <td>
                      <button
                        className="product-link"
                        onClick={() => onSelect(lookup(d.productId))}
                      >
                        {lookup(d.productId).productName}
                      </button>
                    </td>
                    <td className="mint">{d.placement}</td>
                    {SCENARIOS.map((s) => (
                      <td key={s}>
                        <span
                          className={d.placement === d.comparisons[s] ? 'agreement' : 'override'}
                        >
                          {d.comparisons[s]} ·{' '}
                          {d.placement === d.comparisons[s] ? 'Agree' : 'Team override'}
                        </span>
                        <small className="quantity-caption">{d.comparisonCells[s]}</small>
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
