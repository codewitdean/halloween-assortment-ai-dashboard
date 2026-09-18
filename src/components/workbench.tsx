'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, LayoutGrid, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import type { ImportedDataset, Product } from '@/types/product';
import type { ModelInputs } from '@/lib/import/model-inputs';
import {
  ExecutiveOverview,
  ProductPerformance,
  FinalAssortment,
  JudgmentPage,
} from './executive-pages';
import { ProductDetail } from './product-detail';
const tabs = [
  ['overview', 'Executive Overview'],
  ['performance', 'Product Performance'],
  ['assortment', 'Final Assortment'],
  ['judgment', 'AI and Team Judgment'],
] as const;
type Tab = (typeof tabs)[number][0];
export default function Workbench({
  dataset,
  modelInputs,
}: {
  dataset: ImportedDataset;
  modelInputs: ModelInputs;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [selected, setSelected] = useState<Product | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [presentationError, setPresentationError] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (tabs.some(([id]) => id === hash)) setTab(hash as Tab);
    };
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    const fs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', fs);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      document.removeEventListener('fullscreenchange', fs);
    };
  }, []);
  const navigate = (id: Tab) => {
    setTab(id);
    window.history.pushState(null, '', `#${id}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const present = async () => {
    setPresentationError('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setPresentationError(
        'Full screen is unavailable in this browser. Use your browser’s full-screen command.',
      );
    }
  };
  const props = { dataset, modelInputs, onSelect: setSelected };
  return (
    <div className={`executive-shell ${fullscreen ? 'presentation-mode' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to dashboard
      </a>
      <header className="executive-header">
        <div className="executive-brand">
          <span className="brand-mark">
            <LayoutGrid size={22} />
          </span>
          <div>
            <strong>HOMETOWN</strong>
            <span>Halloween Assortment AI Decision Dashboard</span>
          </div>
        </div>
        <div className="executive-status">
          <span>
            <CheckCircle2 size={14} />
            Dataset loaded · {dataset.products.length} products
          </span>
          <span title={`Last import successful: ${dataset.importedAt}`}>Validation passed</span>
          {process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? (
            <span title={`Workbook snapshot: ${dataset.importedAt}`}>
              Published workbook snapshot
            </span>
          ) : (
            <button
              className="reload-control"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  setSelected(null);
                  router.refresh();
                })
              }
              aria-label="Reload workbook"
            >
              <RefreshCw size={15} className={pending ? 'spin' : ''} />
              {pending ? 'Validating…' : 'Reload workbook'}
            </button>
          )}
          <button className="presentation-control" onClick={present}>
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}{' '}
            {fullscreen ? 'Exit full screen' : 'Present full screen'}
          </button>
        </div>
      </header>
      <nav className="dashboard-tabs" aria-label="Dashboard pages">
        {tabs.map(([id, label], index) => (
          <button
            key={id}
            id={`tab-${id}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => navigate(id)}
          >
            <span>0{index + 1}</span>
            {label}
          </button>
        ))}
        <span className="tabs-caption">TEAM CHOICE IS FINAL</span>
      </nav>
      {presentationError && (
        <p className="presentation-error" role="alert">
          {presentationError}
        </p>
      )}
      <main id="main" className="executive-main" aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' ? (
          <ExecutiveOverview {...props} />
        ) : tab === 'performance' ? (
          <ProductPerformance {...props} />
        ) : tab === 'assortment' ? (
          <FinalAssortment {...props} />
        ) : (
          <JudgmentPage {...props} />
        )}
      </main>
      <footer className="executive-footer">
        <span>Hometown AI Innovation Challenge · Approved Team Consensus</span>
        <span>
          Historical Fact · Calculated Metric · Model Assumption · Vendor Claim · AI Interpretation
          · Team Decision
        </span>
      </footer>
      {selected && (
        <ProductDetail
          product={selected}
          sourceCell={dataset.sourceCells[selected.id]}
          decision={dataset.consensus.decisions.find((d) => d.productId === selected.id)!}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
