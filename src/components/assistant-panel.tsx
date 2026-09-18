'use client';
import { useState } from 'react';
import type { ImportedDataset } from '@/types/product';
import {
  buildAnswer,
  resolveLocally,
  type Answer,
  type EvidenceLine,
} from '@/lib/assistant/answer';
export function AssistantPanel({ dataset }: { dataset: ImportedDataset }) {
  const [question, setQuestion] = useState('Explain the evidence for this approved placement.'),
    [first, setFirst] = useState(dataset.products[0].id),
    [second, setSecond] = useState(''),
    [answer, setAnswer] = useState<Answer | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function ask() {
    setBusy(true);
    setError('');
    setAnswer(null);
    try {
      if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
        setAnswer(
          buildAnswer(dataset, resolveLocally(question, [first, second].filter(Boolean), dataset)),
        );
        return;
      }
      const r = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          fingerprint: dataset.fingerprint,
          productIds: [first, second].filter(Boolean),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setAnswer(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to answer.');
    } finally {
      setBusy(false);
    }
  }
  const lines = (title: string, values: EvidenceLine[]) =>
    values.length ? (
      <section>
        <h3>{title}</h3>
        <ul>
          {values.map((line, i) => (
            <li key={i}>
              <span className="source-tag">{line.label}</span>
              {line.text}
              {line.source && <small>Source: {line.source}</small>}
            </li>
          ))}
        </ul>
      </section>
    ) : null;
  return (
    <section className="panel assistant-panel" id="assistant">
      <div className="section-head">
        <div>
          <span className="eyebrow">EXPLAIN THE EVIDENCE · KEEP THE CONSENSUS</span>
          <h2>AI Question-and-Answer Assistant</h2>
          <p>Read-only answers. Provider mode is disclosed with every response.</p>
        </div>
      </div>
      <div className="assistant-form">
        <div className="assistant-examples">
          {[
            'Validate the 16-facing assortment.',
            'Where did the team override comparison scenarios?',
            'Which new product has the largest investment risk?',
            'Compare the evidence for these products.',
            'Explain the Lower Investment comparison.',
          ].map((q) => (
            <button key={q} onClick={() => setQuestion(q)}>
              {q}
            </button>
          ))}
        </div>
        <div className="assistant-controls">
          <div>
            <label htmlFor="assistant-product">Product</label>
            <select id="assistant-product" value={first} onChange={(e) => setFirst(e.target.value)}>
              {dataset.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assistant-compare">Second product (optional)</label>
            <select
              id="assistant-compare"
              value={second}
              onChange={(e) => setSecond(e.target.value)}
            >
              <option value="">No second product</option>
              {dataset.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="assistant-question">Question</label>
        <textarea
          id="assistant-question"
          value={question}
          maxLength={1500}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="import-button" disabled={busy || !question.trim()} onClick={ask}>
          {busy ? 'Checking evidence…' : 'Ask about evidence'}
        </button>
        {error && (
          <p role="alert" className="missing-warning">
            {error}
          </p>
        )}
        {answer && (
          <article className="assistant-answer" aria-label="Evidence answer">
            <p className="mode-status">
              {answer.mode} · {answer.notice}
            </p>
            <span className="draft-pill">Draft — requires team approval</span>
            <h3>Recommendation</h3>
            <p>{answer.recommendation}</p>
            {lines('Supporting evidence', answer.supporting)}
            {lines('Opposing evidence and limitations', answer.opposing)}
            {lines('Previously approved team wording', answer.approvedRationale)}
            <h3>Assumptions</h3>
            <p>
              {answer.assumptions.length
                ? answer.assumptions.join(' ')
                : 'No new financial or demand assumptions used in this answer.'}
            </p>
            <h3>Risk</h3>
            <p>{answer.risk}</p>
            <h3>Confidence</h3>
            <p>{answer.confidence}</p>
            <h3>Human judgment considerations</h3>
            <p>{answer.humanJudgment}</p>
          </article>
        )}
      </div>
    </section>
  );
}
