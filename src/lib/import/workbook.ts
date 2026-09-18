import * as XLSX from 'xlsx';
import { validateProducts } from '../validation/product';
import type { Product } from '../../types/product';
export const SOURCE_HEADERS = [
  'Product',
  'Current / new',
  'Category',
  'Required facings',
  'Retail price',
  'Unit cost',
  'Historical buy / new minimum',
  'Full-price units',
  'Clearance units',
  'Store units',
  'Online units',
  'Average stars',
  'Review count',
  'Historical sales',
  'Historical gross profit',
  'Licensed',
  'Vendor claim',
  'Merchant note',
  'Source range',
  'Original channel',
] as const;
export class WorkbookImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkbookImportError';
  }
}
export function optionalText(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string')
    throw new WorkbookImportError('Expected text, received a non-text cell.');
  return value.trim() || null;
}
export function parseStatus(value: unknown): 'current' | 'new' {
  const text = optionalText(value)?.toLowerCase();
  if (text !== 'current' && text !== 'new')
    throw new WorkbookImportError(`Invalid product status: ${String(value)}.`);
  return text;
}
export function parseLicensed(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase();
    if (text === 'yes') return true;
    if (text === 'no') return false;
  }
  throw new WorkbookImportError(
    'Licensed must be Yes, No, or a boolean; blanks and unknown values are rejected.',
  );
}
function numericCell(value: unknown): number | null {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === ''))
    return null;
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new WorkbookImportError('Expected a numeric cell; numeric strings are not accepted.');
  return value;
}
export function parseWorkbook(
  bytes: ArrayBuffer | Buffer,
  options: { expectedProductCount?: number } = {},
) {
  let book: XLSX.WorkBook;
  try {
    book = XLSX.read(bytes, { type: 'array', cellFormula: true });
  } catch {
    throw new WorkbookImportError('Cannot read workbook. Supply a valid .xlsx file.');
  }
  const sheet = book.Sheets['Source data'];
  if (!sheet) throw new WorkbookImportError('Required sheet "Source data" is missing.');
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
  // Reject source formulas, including cached values and array/shared formulas, before reading any values.
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith('!') || !cell || typeof cell !== 'object') continue;
    if ('f' in cell || 'F' in cell)
      throw new WorkbookImportError(
        `Formula cell Source data!${address} is not allowed. Supply literal source values.`,
      );
    if (cell.t === 'e') throw new WorkbookImportError(`Excel error in Source data!${address}.`);
  }
  let headerRow = -1;
  for (let row = range.s.r; row <= range.e.r; row++) {
    if (sheet[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v === 'Product') {
      headerRow = row;
      break;
    }
  }
  if (headerRow < 0) throw new WorkbookImportError('Source data header row was not found.');
  for (const [col, expected] of SOURCE_HEADERS.entries()) {
    const address = XLSX.utils.encode_cell({ r: headerRow, c: col });
    if (sheet[address]?.v !== expected)
      throw new WorkbookImportError(`Source data!${address}: expected header "${expected}".`);
  }
  const records: unknown[] = [];
  const sourceCells: Record<string, string> = {};
  for (let row = headerRow + 1; row <= range.e.r; row++) {
    const values = SOURCE_HEADERS.map(
      (_, col) => sheet[XLSX.utils.encode_cell({ r: row, c: col })]?.v ?? null,
    );
    if (values.every((v) => v === null || (typeof v === 'string' && v.trim() === ''))) continue;
    try {
      const productName = optionalText(values[0]);
      if (!productName)
        throw new WorkbookImportError('Product name is required for a populated row.');
      const productStatus = parseStatus(values[1]);
      const id = `product:${encodeURIComponent(productName.toLowerCase())}`;
      const record = {
        id,
        productName,
        productStatus,
        category: optionalText(values[2]),
        requiredFacings: numericCell(values[3]),
        retailPrice: numericCell(values[4]),
        unitCost: numericCell(values[5]),
        historicalBuyQuantity: productStatus === 'current' ? numericCell(values[6]) : null,
        mandatoryMinimumQuantity: productStatus === 'new' ? numericCell(values[6]) : null,
        fullPriceUnits: numericCell(values[7]),
        clearanceUnits: numericCell(values[8]),
        storeUnits: numericCell(values[9]),
        onlineUnits: numericCell(values[10]),
        averageStars: numericCell(values[11]),
        reviewCount: numericCell(values[12]),
        historicalSales: numericCell(values[13]),
        historicalGrossProfit: numericCell(values[14]),
        licensed: parseLicensed(values[15]),
        vendorClaim: optionalText(values[16]),
        merchantNote: optionalText(values[17]),
        sourceRange: optionalText(values[18]),
        originalChannel: optionalText(values[19]),
      };
      // Validate each row here to preserve the Excel row in error messages.
      records.push(validateProducts([record])[0]);
      sourceCells[id] = `Source data!A${row + 1}:T${row + 1}`;
    } catch (error) {
      throw new WorkbookImportError(
        `Source data row ${row + 1}: ${error instanceof Error ? error.message : 'Invalid row.'}`,
      );
    }
  }
  let products: Product[];
  try {
    products = validateProducts(records, options.expectedProductCount);
  } catch (error) {
    throw new WorkbookImportError(
      error instanceof Error ? error.message : 'Invalid product collection.',
    );
  }
  return { products, sourceCells };
}
