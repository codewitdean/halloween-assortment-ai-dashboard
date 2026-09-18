'use client';
import { EvidenceMetrics } from './evidence-metrics';
import { useEffect, useRef } from 'react';
import { FileSpreadsheet, Info, X } from 'lucide-react';
import type { Product } from '@/types/product';
import type { Decision } from '@/types/consensus';
import { historicalFields } from '@/lib/validation/product';
import { minimumInvestment, historicalPurchaseCost } from '@/lib/calculations/historical';
import { money, number } from '@/lib/format';
export function ProductDetail({
  product: p,
  sourceCell,
  decision,
  onClose,
}: {
  product: Product;
  sourceCell: string;
  decision: Decision;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    // Native dialog removal handles unmount. Closing in effect cleanup dispatches
    // onClose during React Strict Mode's setup/cleanup rehearsal and dismisses it.
    if (element && !element.open) element.showModal();
  }, []);
  const isNew = p.productStatus === 'new';
  const field = (label: string, value: string | number | null) => (
    <div className="detail-field" key={label}>
      <dt>{label}</dt>
      <dd>{value ?? <span className="missing">—</span>}</dd>
    </div>
  );
  const history: [string, string][] = [
    ['Historical sales', money(p.historicalSales)],
    ['Historical gross profit', money(p.historicalGrossProfit)],
    ['Full-price units', number(p.fullPriceUnits)],
    ['Clearance units', number(p.clearanceUnits)],
    ['Store units', number(p.storeUnits)],
    ['Online units', number(p.onlineUnits)],
    ['Average rating', p.averageStars === null ? '—' : `${p.averageStars.toFixed(1)} / 5`],
    ['Review count', number(p.reviewCount)],
  ];
  const missing = historicalFields.filter((k) => p[k] === null);
  return (
    <dialog
      ref={dialog}
      className="detail-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="detail-title"
    >
      <div className="detail-content">
        <header className="detail-header">
          <div>
            <span className="eyebrow">PRODUCT SOURCE RECORD</span>
            <h2 id="detail-title">{p.productName}</h2>
            <p>{p.category}</p>
          </div>
          <button aria-label="Close product details" onClick={onClose} autoFocus>
            <X size={20} />
          </button>
        </header>
        <div className="detail-body">
          <div className="investment-box">
            <div>
              <span className="eyebrow">TEAM DECISION · APPROVED TEAM CONSENSUS</span>
              <h3>{decision.placement}</h3>
              <p>{decision.sourceCell} · Fixed final placement</p>
            </div>
          </div>
          <EvidenceMetrics product={p} />
          <div className="detail-status">
            <span className={`pill ${p.productStatus}`}>
              {isNew ? 'New candidate' : 'Current product'}
            </span>
            <span className="source-tag">{isNew ? 'Vendor Claim' : 'Historical Fact'}</span>
          </div>
          <section>
            <h3>Supplied product fields</h3>
            <p>
              {isNew
                ? 'Supplier terms supplied in the workbook; not a demand forecast.'
                : 'Product attributes and performance as supplied in the workbook.'}
            </p>
            <dl className="detail-grid">
              {field('Category', p.category)}
              {field('Original channel', p.originalChannel)}
              {field('Required facings', p.requiredFacings)}
              {field('Licensed', p.licensed ? 'Yes' : 'No')}
              {field('Retail price', money(p.retailPrice))}
              {field('Unit cost', money(p.unitCost))}
              {field('Historical buy quantity', number(p.historicalBuyQuantity))}
              {field('Mandatory minimum quantity', number(p.mandatoryMinimumQuantity))}
            </dl>
          </section>
          <div className="investment-box">
            <div>
              <span className="eyebrow">CALCULATED METRIC</span>
              <h3>{isNew ? 'Minimum required investment' : 'Historical product purchase cost'}</h3>
              <p>
                {number(isNew ? p.mandatoryMinimumQuantity : p.historicalBuyQuantity)} units ×{' '}
                {money(p.unitCost)} unit cost
              </p>
            </div>
            <strong>{money(isNew ? minimumInvestment(p) : historicalPurchaseCost(p))}</strong>
          </div>
          <div className="info-note">
            <Info size={17} />
            <p>
              {isNew
                ? 'Quantity is the supplier’s mandatory minimum purchase. It is not a sales forecast.'
                : 'Quantity is last season’s historical buy. A supplier minimum was not supplied.'}
            </p>
          </div>
          <section>
            <div className="subsection-title">
              <h3>Historical evidence</h3>
              <span className="source-tag">{isNew ? 'Not supplied' : 'Historical Fact'}</span>
            </div>
            <dl className="detail-grid">{history.map(([label, value]) => field(label, value))}</dl>
            {missing.length > 0 && (
              <p className="missing-warning">
                No historical sales, gross profit, units, ratings or reviews were supplied for this
                new candidate. These fields remain null; missing evidence is not poor performance.
              </p>
            )}
          </section>
          <section className="claim-box">
            <span className="eyebrow">VENDOR CLAIM</span>
            <h3>Supplier statement</h3>
            <p>{p.vendorClaim ?? '—'}</p>
            {!p.vendorClaim && <small>No vendor claim supplied.</small>}
          </section>
          <section>
            <h3>Merchant note</h3>
            <p className="note-context">
              Source annotation, reproduced verbatim. This is qualitative commentary, not verified
              performance or an app-generated interpretation.
            </p>
            <blockquote>{p.merchantNote ?? '—'}</blockquote>
            {p.productName.includes('Sitcom') && (
              <div className="missing-warning">
                Source conflict: the note claims the same footprint as Animated Reaper. The numeric
                fields specify Sitcom = 2 facings and Reaper = 1. The app preserves the numeric
                source fields.
              </div>
            )}
          </section>
          <section className="source-record">
            <FileSpreadsheet size={18} />
            <div>
              <h3>Source provenance</h3>
              <dl>
                {field('Authoritative workbook cells', sourceCell)}
                {field('Original source range (supplied reference)', p.sourceRange)}
                {field('Product ID (generated from name)', p.id)}
                {field('Product name', p.productName)}
                {field('Product status', p.productStatus)}
              </dl>
              <p>
                The original source workbook was not supplied; its referenced range cannot be
                independently inspected.
              </p>
            </div>
          </section>
        </div>
        <footer className="detail-footer">
          <span>Read-only source evidence</span>
          <button onClick={onClose}>Close record</button>
        </footer>
      </div>
    </dialog>
  );
}
