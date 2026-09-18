'use client';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { ImportedDataset } from '@/types/product';
import {
  DRAFT_LABEL,
  generateRationale,
  rationaleRecordSchema,
  type RationaleRecord,
} from '@/lib/consensus/rationales';
const responseSchema = z.object({
  fingerprint: z.string(),
  records: z.record(z.string(), rationaleRecordSchema),
});
function RationaleForm({
  dataset,
  productId,
  record,
  onSaved,
}: {
  dataset: ImportedDataset;
  productId: string;
  record?: RationaleRecord;
  onSaved: (r: RationaleRecord) => void;
}) {
  const p = dataset.products.find((p) => p.id === productId)!;
  const d = dataset.consensus.decisions.find((d) => d.productId === productId)!;
  const [text, setText] = useState(record?.text ?? generateRationale(p, d)),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const dirty = text !== record?.text;
  const approved = record?.status === 'approved' && !dirty;
  async function submit(action: 'save' | 'approve') {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/rationales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: dataset.fingerprint,
          productId,
          text,
          action,
          expectedRevision: record?.revision ?? 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Save failed');
      const updated = rationaleRecordSchema.parse(data.record);
      onSaved(updated);
      setText(updated.text);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rationale-form">
      <div className="rationale-status">
        <h3>{p.productName}</h3>
        <span className={approved ? 'approval-pill' : 'draft-pill'}>
          {approved ? 'Team-approved rationale' : DRAFT_LABEL}
        </span>
      </div>
      <p>
        Approved placement: <strong>{d.placement}</strong> · Team Decision from {d.sourceCell}. This
        editor cannot change placement.
      </p>
      <label htmlFor="rationale-text">Consensus rationale</label>
      <textarea
        id="rationale-text"
        aria-label="Consensus rationale"
        value={text}
        maxLength={12000}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
      />
      <p className="consensus-note">
        Draft text summarizes evidence and tradeoffs; it is not a transcript of discussion. Review
        every claim before approving. Editing approved text requires a new approval.
      </p>
      <div className="rationale-actions">
        <button disabled={busy || !text.trim()} onClick={() => submit('save')}>
          Save draft
        </button>
        <button
          className="import-button"
          disabled={busy || !text.trim() || approved}
          onClick={() => submit('approve')}
        >
          Approve rationale
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setText(generateRationale(p, d));
            setSaved(false);
          }}
        >
          Restore evidence draft
        </button>
      </div>
      {error && (
        <p className="missing-warning" role="alert">
          {error}
        </p>
      )}
      <p role="status">
        {busy
          ? 'Saving…'
          : saved
            ? 'Rationale saved.'
            : approved
              ? `Approved ${record.approvedAt} · revision ${record.revision}`
              : dirty
                ? 'Draft changes are not yet saved.'
                : 'Saved draft.'}
      </p>
    </div>
  );
}
function LocalRationaleEditor({ dataset }: { dataset: ImportedDataset }) {
  const [records, setRecords] = useState<Record<string, RationaleRecord>>({}),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(dataset.products[0].id),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    fetch('/api/rationales', { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? 'Unable to load saved rationales.');
        const data = responseSchema.parse(body);
        if (data.fingerprint !== dataset.fingerprint)
          throw new Error('Workbook changed. Reload the dashboard.');
        if (active) {
          setRecords(data.records);
          setLoaded(true);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [dataset.fingerprint, attempt]);
  const approved = Object.values(records).filter((r) => r.status === 'approved').length;
  return (
    <section className="panel rationales-panel" id="rationales">
      <div className="section-head">
        <div>
          <span className="eyebrow">PLACEMENTS APPROVED · WORDING UNDER REVIEW</span>
          <h2>Draft Consensus Rationales</h2>
          <p>
            {loaded
              ? `${approved}/${dataset.products.length} rationales approved`
              : 'Loading saved approval status…'}{' '}
            · Stored separately from the workbook
          </p>
        </div>
      </div>
      {error ? (
        <div className="rationale-form">
          <p role="alert" className="missing-warning">
            {error} Approval status is unavailable.
          </p>
          <button onClick={() => setAttempt((n) => n + 1)}>Retry loading rationales</button>
        </div>
      ) : loaded ? (
        <>
          <label className="rationale-picker">
            Product to review
            <select
              aria-label="Rationale product"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {dataset.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} · {records[p.id]?.status === 'approved' ? 'Approved' : 'Draft'}
                </option>
              ))}
            </select>
          </label>
          <RationaleForm
            key={selected}
            dataset={dataset}
            productId={selected}
            record={records[selected]}
            onSaved={(r) => setRecords((prev) => ({ ...prev, [r.productId]: r }))}
          />
        </>
      ) : null}
    </section>
  );
}

function PublishedRationales({ dataset }: { dataset: ImportedDataset }) {
  const [selected, setSelected] = useState(dataset.products[0].id);
  const product = dataset.products.find((p) => p.id === selected)!;
  const decision = dataset.consensus.decisions.find((d) => d.productId === selected)!;
  return (
    <section className="panel rationales-panel" id="rationales">
      <div className="section-head">
        <div>
          <span className="eyebrow">PLACEMENTS APPROVED · WORDING UNDER REVIEW</span>
          <h2>Draft Consensus Rationales</h2>
          <p>Read-only evidence drafts. Team rationale approvals are not published on this site.</p>
        </div>
      </div>
      <label className="rationale-picker">
        Product to review
        <select
          aria-label="Rationale product"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {dataset.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.productName} · Draft
            </option>
          ))}
        </select>
      </label>
      <div className="rationale-form">
        <div className="rationale-status">
          <h3>{product.productName}</h3>
          <span className="draft-pill">{DRAFT_LABEL}</span>
        </div>
        <label htmlFor="published-rationale">Consensus rationale</label>
        <textarea
          id="published-rationale"
          aria-label="Consensus rationale"
          readOnly
          value={generateRationale(product, decision)}
        />
      </div>
    </section>
  );
}
export function RationaleEditor({ dataset }: { dataset: ImportedDataset }) {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? (
    <PublishedRationales dataset={dataset} />
  ) : (
    <LocalRationaleEditor dataset={dataset} />
  );
}
