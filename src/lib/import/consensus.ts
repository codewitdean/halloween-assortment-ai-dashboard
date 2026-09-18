import * as XLSX from 'xlsx';
import { z } from 'zod';
import type { Product } from '../../types/product';
import { PLACEMENTS, type Consensus, type Decision } from '../../types/consensus';
import { WorkbookImportError } from './workbook';
const placementSchema = z.enum(PLACEMENTS);
export function parseConsensus(bytes: Buffer | ArrayBuffer, products: Product[]): Consensus {
  const book = XLSX.read(bytes, { type: 'array', cellFormula: true });
  const sheet = book.Sheets['Product decisions'];
  if (!sheet)
    throw new WorkbookImportError(
      'Required Product decisions sheet is missing. Final consensus cannot be inferred.',
    );
  const literal = (cell: string): unknown => {
    const value = sheet[cell];
    if (value && (value.f !== undefined || value.F !== undefined || value.t === 'e'))
      throw new WorkbookImportError(
        `Product decisions!${cell}: literal decision required, formulas/errors are not accepted.`,
      );
    return value?.v;
  };
  for (const [cell, header] of Object.entries({
    A6: 'Product',
    C6: 'Balanced',
    H6: 'Maximum profit',
    I6: 'Lower investment',
    J6: 'Team choice',
  }))
    if (literal(cell) !== header)
      throw new WorkbookImportError(`Product decisions!${cell}: expected ${header}.`);
  const decisions: Decision[] = [];
  const seen = new Set<string>();
  for (let row = 7; row <= 32; row++) {
    const name = literal(`A${row}`);
    const product = products.find((p) => p.productName === name);
    if (!product || seen.has(product.id))
      throw new WorkbookImportError(
        `Product decisions!A${row}: unknown, missing or duplicate product name.`,
      );
    seen.add(product.id);
    const read = (col: string) => {
      const result = placementSchema.safeParse(literal(`${col}${row}`));
      if (!result.success)
        throw new WorkbookImportError(
          `Product decisions!${col}${row}: final placement must be In-Store, Online-Only or Removed.`,
        );
      return result.data;
    };
    decisions.push({
      productId: product.id,
      placement: read('J'),
      sourceCell: `Product decisions!J${row}`,
      comparisons: {
        Balanced: read('C'),
        'Maximum Profit': read('H'),
        'Lower Investment': read('I'),
      },
      comparisonCells: {
        Balanced: `Product decisions!C${row}`,
        'Maximum Profit': `Product decisions!H${row}`,
        'Lower Investment': `Product decisions!I${row}`,
      },
    });
  }
  if (seen.size !== products.length)
    throw new WorkbookImportError('Consensus must contain every source product exactly once.');
  return { source: 'Product decisions!J7:J32', decisions };
}
