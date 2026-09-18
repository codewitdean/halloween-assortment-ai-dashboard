import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadDataset } from './load-dataset';
import { parseModelInputs } from './model-inputs';
export function loadDashboard() {
  const dataset = loadDataset();
  const bytes = fs.readFileSync(path.join(process.cwd(), 'data', dataset.filename));
  if (createHash('sha256').update(bytes).digest('hex') !== dataset.fingerprint)
    throw new Error('Workbook changed during import; reload to obtain a consistent dataset.');
  return { dataset, modelInputs: parseModelInputs(bytes, dataset.products) };
}
