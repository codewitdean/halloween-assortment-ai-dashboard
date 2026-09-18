import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { rationaleRecordSchema, type RationaleRequest, type RationaleRecord } from './rationales';
import type { ImportedDataset } from '../../types/product';
const fileSchema = z
  .object({ fingerprint: z.string(), history: z.array(rationaleRecordSchema) })
  .strict();
export class RationaleConflict extends Error {}
const directory = () =>
  process.env.RATIONALE_DATA_DIR || path.join(process.cwd(), '.local', 'rationales');
function readHistory(fingerprint: string, dir: string) {
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) throw new Error('Invalid dataset fingerprint.');
  const file = path.join(dir, `${fingerprint}.json`);
  if (!fs.existsSync(file)) return [];
  const saved = fileSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (saved.fingerprint !== fingerprint)
    throw new Error('Rationale dataset identity does not match.');
  return saved.history;
}
export function loadRationales(
  fingerprint: string,
  dir = directory(),
): Record<string, RationaleRecord> {
  return Object.fromEntries(readHistory(fingerprint, dir).map((r) => [r.productId, r]));
}
/** Synchronous read-check-write avoids interleaving within the supported single Node server. */
export function saveRationale(
  dataset: ImportedDataset,
  input: RationaleRequest,
  dir = directory(),
): RationaleRecord {
  if (input.fingerprint !== dataset.fingerprint)
    throw new RationaleConflict('Workbook changed. Reload before reviewing this rationale.');
  if (!dataset.products.some((p) => p.id === input.productId)) throw new Error('Unknown product.');
  const history = readHistory(dataset.fingerprint, dir);
  const prior = history.findLast((r) => r.productId === input.productId);
  if ((prior?.revision ?? 0) !== input.expectedRevision)
    throw new RationaleConflict('This rationale changed in another session. Reload before saving.');
  const now = new Date().toISOString();
  const record = rationaleRecordSchema.parse({
    productId: input.productId,
    text: input.text,
    status: input.action === 'approve' ? 'approved' : 'draft',
    revision: input.expectedRevision + 1,
    updatedAt: now,
    approvedAt: input.action === 'approve' ? now : null,
  });
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `${dataset.fingerprint}.${randomUUID()}.tmp`);
  fs.writeFileSync(
    tmp,
    JSON.stringify({ fingerprint: dataset.fingerprint, history: [...history, record] }, null, 2),
    'utf8',
  );
  fs.renameSync(tmp, path.join(dir, `${dataset.fingerprint}.json`));
  return record;
}
