import { loadDataset } from '../src/lib/import/load-dataset';
import { summarizeProducts } from '../src/lib/calculations/historical';
const dataset = loadDataset();
console.log(
  JSON.stringify(
    {
      filename: dataset.filename,
      sourceSheet: dataset.sourceSheet,
      fingerprint: dataset.fingerprint,
      summary: summarizeProducts(dataset.products),
      validation: dataset.validation,
    },
    null,
    2,
  ),
);
