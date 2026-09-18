import type { Product } from '@/types/product';
import { productEvidence, evidenceWarnings } from '@/lib/calculations/evidence';
import { formatMetric } from '@/lib/consensus/rationales';
export function EvidenceMetrics({ product }: { product: Product }) {
  return (
    <section className="objective-evidence">
      <h3>Objective supporting metrics</h3>
      <p>Calculated independently from Source data. No weighted score or ranking.</p>
      <div className="evidence-metric-grid">
        {productEvidence(product).map((m) => (
          <article key={m.key}>
            <small>{m.label}</small>
            <span>{m.name}</span>
            <strong>{formatMetric(m)}</strong>
            <p>{m.formula}</p>
          </article>
        ))}
      </div>
      <h3>Evidence and investment-risk warnings</h3>
      <ul className="evidence-warnings">
        {evidenceWarnings(product).map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </section>
  );
}
