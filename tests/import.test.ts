import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { describe, it, expect } from 'vitest';
import { suppliedDataset } from '../src/data/dataset';
import {
  parseWorkbook,
  parseLicensed,
  parseStatus,
  optionalText,
} from '../src/lib/import/workbook';
import { historicalFields } from '../src/lib/validation/product';
const bytes = fs.readFileSync(path.join(process.cwd(), 'data', suppliedDataset.filename));
const parsed = parseWorkbook(bytes, { expectedProductCount: 26 });
function mutated(edit: (workbook: XLSX.WorkBook) => void) {
  const book = XLSX.read(bytes, { type: 'buffer', cellFormula: true });
  edit(book);
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
function cell(address: string, value: unknown) {
  return mutated((book) => {
    book.Sheets['Source data'][address] = {
      v: value,
      t: typeof value === 'number' ? 'n' : typeof value === 'boolean' ? 'b' : 's',
    } as XLSX.CellObject;
  });
}
describe('source-only spreadsheet parsing', () => {
  it('imports 26 products with typed fields and row provenance', () => {
    expect(parsed.products).toHaveLength(26);
    expect(parsed.products[0].retailPrice).toBe(299);
    expect(parsed.sourceCells[parsed.products[0].id]).toBe('Source data!A7:T7');
    expect(parsed.products[0].sourceRange).toBe('Student Data!A6:S6');
  });
  it('ignores every other worksheet, including misleading cached formulas', () => {
    const modified = mutated((book) => {
      for (const name of book.SheetNames.filter((n) => n !== 'Source data'))
        book.Sheets[name] = { A1: { f: '1+1', v: 99999999, t: 'n' } };
    });
    expect(parseWorkbook(modified).products).toEqual(parsed.products);
  });
  it('also works with only the authoritative sheet present', () => {
    expect(
      parseWorkbook(
        mutated((book) => {
          book.SheetNames = ['Source data'];
          book.Sheets = { 'Source data': book.Sheets['Source data'] };
        }),
      ).products,
    ).toEqual(parsed.products);
  });
  it('rejects missing source sheet', () => {
    expect(() =>
      parseWorkbook(
        mutated((book) => {
          delete book.Sheets['Source data'];
          book.SheetNames = book.SheetNames.filter((n) => n !== 'Source data');
        }),
      ),
    ).toThrow('Required sheet');
  });
  it('rejects missing or incorrect headers', () => {
    expect(() => parseWorkbook(cell('F6', 'Cost'))).toThrow('expected header');
    expect(() => parseWorkbook(cell('A6', ''))).toThrow('header row');
  });
  it('rejects source formula cells even with cached values', () => {
    expect(() =>
      parseWorkbook(
        mutated((book) => {
          book.Sheets['Source data'].E7 = { t: 'n', v: 299, f: '300-1' };
        }),
      ),
    ).toThrow('Formula cell Source data!E7');
  });
  it('rejects array formula source cells', () => {
    expect(() =>
      parseWorkbook(
        mutated((book) => {
          book.Sheets['Source data'].E7 = { t: 'n', v: 299, f: '299', F: 'E7:E7' };
        }),
      ),
    ).toThrow('Formula cell');
  });
  it('rejects error cells', () => {
    expect(() =>
      parseWorkbook(
        mutated((book) => {
          book.Sheets['Source data'].E7 = { t: 'e', v: 7 };
        }),
      ),
    ).toThrow('Excel error');
  });
  it('rejects duplicate names, including case variants', () => {
    expect(() => parseWorkbook(cell('A8', '12 FT GIANT SKELETON'))).toThrow('unique');
  });
  it('rejects populated records with missing names', () => {
    expect(() => parseWorkbook(cell('A7', ''))).toThrow('Product name is required');
  });
  it('does not silently skip invalid-status rows', () => {
    expect(() => parseWorkbook(cell('B7', 'unknown'))).toThrow('Invalid product status');
  });
  it('rejects unknown categories', () => {
    expect(() => parseWorkbook(cell('C7', 'Other'))).toThrow();
  });
  it.each([0, -1, 1.5])('rejects invalid facings %s', (v) => {
    expect(() => parseWorkbook(cell('D7', v))).toThrow();
  });
  it('accepts zero retail and cost but rejects negatives and numeric strings', () => {
    expect(parseWorkbook(cell('E7', 0)).products[0].retailPrice).toBe(0);
    expect(parseWorkbook(cell('F7', 0)).products[0].unitCost).toBe(0);
    expect(() => parseWorkbook(cell('F7', -1))).toThrow();
    expect(() => parseWorkbook(cell('E7', '299'))).toThrow('numeric cell');
  });
  it('requires all current historical fields', () => {
    for (const address of ['G7', 'H7', 'I7', 'J7', 'K7', 'L7', 'M7', 'N7', 'O7'])
      expect(() => parseWorkbook(cell(address, ''))).toThrow();
  });
  it('requires positive new minimum quantity', () => {
    for (const value of ['', 0, -1, 1.5]) expect(() => parseWorkbook(cell('G23', value))).toThrow();
  });
  it('rejects inconsistent historical unit totals', () => {
    expect(() => parseWorkbook(cell('J7', 18001))).toThrow('reconcile');
    expect(() => parseWorkbook(cell('G7', 100))).toThrow('exceed');
  });
  it('can import other dataset sizes when not using the supplied expectation', () => {
    const one = mutated((book) => {
      const s = book.Sheets['Source data'];
      for (const address of Object.keys(s))
        if (!address.startsWith('!') && XLSX.utils.decode_cell(address).r > 6) delete s[address];
      s['!ref'] = 'A1:T7';
    });
    expect(parseWorkbook(one).products).toHaveLength(1);
    expect(() => parseWorkbook(one, { expectedProductCount: 26 })).toThrow('expects 26');
  });
});
describe('nulls and quantity semantics', () => {
  it('preserves all new history as null', () => {
    for (const p of parsed.products.filter((p) => p.productStatus === 'new')) {
      expect(p.historicalBuyQuantity).toBeNull();
      for (const field of historicalFields) expect(p[field]).toBeNull();
      expect(p.mandatoryMinimumQuantity).toBeGreaterThan(0);
    }
  });
  it('never gives current products a mandatory minimum', () => {
    for (const p of parsed.products.filter((p) => p.productStatus === 'current')) {
      expect(p.mandatoryMinimumQuantity).toBeNull();
      expect(p.historicalBuyQuantity).toBeGreaterThan(0);
    }
  });
  it('rejects synthetic history on new products, including a numeric zero', () => {
    expect(() => parseWorkbook(cell('N23', 0))).toThrow('must remain null');
  });
  it('preserves real zero channel units for original online-only items', () => {
    expect(
      parsed.products.find((p) => p.productName === 'Life-Size Animated Butler')?.storeUnits,
    ).toBe(0);
  });
  it('normalizes blank optional text to null', () => {
    expect(optionalText('  ')).toBeNull();
    expect(optionalText(undefined)).toBeNull();
    expect(optionalText(' x ')).toBe('x');
    expect(parseWorkbook(cell('Q23', '   ')).products[16].vendorClaim).toBeNull();
    expect(parsed.products[0].vendorClaim).toBeNull();
  });
  it('preserves blank numeric cells and rejects missing required numerics', () => {
    expect(parseWorkbook(cell('L23', ' ')).products[16].averageStars).toBeNull();
    expect(() => parseWorkbook(cell('F7', ''))).toThrow();
  });
});
describe('safe conversions', () => {
  it.each([
    ['Current', 'current'],
    ['New', 'new'],
    [' current ', 'current'],
    ['NEW', 'new'],
  ])('converts status %s', (value, expected) => expect(parseStatus(value)).toBe(expected));
  it.each([
    ['Yes', true],
    ['No', false],
    [' yes ', true],
    ['NO', false],
    [true, true],
    [false, false],
  ])('converts licensed %s', (value, expected) => expect(parseLicensed(value)).toBe(expected));
  it.each([null, undefined, '', 0, 1, 'maybe', 'false'])('rejects ambiguous licensed %s', (value) =>
    expect(() => parseLicensed(value)).toThrow('Licensed must'),
  );
});
