import { parseConsensus } from './consensus';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseWorkbook } from './workbook';
import { suppliedDataset } from '../../data/dataset';
import type { ImportedDataset } from '../../types/product';
export function loadDataset(): ImportedDataset {
  const bytes = fs.readFileSync(path.join(process.cwd(), 'data', suppliedDataset.filename));
  const parsed = parseWorkbook(bytes, {
    expectedProductCount: suppliedDataset.expectedProductCount,
  });
  return {
    ...parsed,
    consensus: parseConsensus(bytes, parsed.products),
    filename: suppliedDataset.filename,
    importedAt: new Date().toISOString(),
    fingerprint: createHash('sha256').update(bytes).digest('hex'),
    sourceSheet: 'Source data',
    validation: {
      status: 'passed',
      checks: [
        'Source sheet and 20 headers verified',
        'Source cells contain no formulas',
        'Unique names and valid typed fields',
        'Current / new quantities separated',
        'Missing historical evidence preserved',
        `${suppliedDataset.expectedProductCount} expected products imported`,
      ],
      warnings: [
        'Original challenge PDF and original source workbook were not supplied.',
        'Channel counts measure units, not channel revenue.',
        'Sitcom merchant note conflicts with numeric facings. Source values remain 2 for Sitcom and 1 for Animated Reaper.',
      ],
    },
  };
}
