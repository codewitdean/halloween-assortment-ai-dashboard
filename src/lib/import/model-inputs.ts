import * as XLSX from 'xlsx';
import { z } from 'zod';
import type { Product } from '../../types/product';

export interface ModelInputs {
  base: { demandMultiplier: number; clearanceFraction: number; clearancePriceFraction: number };
  newDemand: number;
  newOnlineFactor: number;
  recapture: number;
  quantities: Record<string, number>;
  quantitySources: Record<string, string>;
}

/** Read literal model assumptions only. Never read cached model or summary outputs. */
export function parseModelInputs(bytes: Buffer, products: Product[]): ModelInputs {
  const sheet = XLSX.read(bytes, { type: 'buffer', cellFormula: true }).Sheets.Assumptions;
  if (!sheet) throw new Error('Required Assumptions sheet is missing.');
  const literal = (address: string): unknown => {
    const cell = sheet[address];
    if (!cell || cell.f || cell.t === 'e')
      throw new Error(`Assumptions!${address}: literal input required.`);
    return cell.v;
  };
  const scalar = (address: string, schema = z.number().finite().min(0).max(1)) =>
    schema.parse(literal(address));
  if (
    literal('A7') !== 'Base' ||
    literal('A20') !== 'Product' ||
    literal('B20') !== 'Order quantity'
  )
    throw new Error('Assumptions layout does not match the expected base model.');
  const quantities: Record<string, number> = {},
    quantitySources: Record<string, string> = {};
  for (let row = 21; row < 21 + products.length; row++) {
    const name = literal(`A${row}`);
    const p = products.find((p) => p.productName === name);
    if (!p || quantities[p.id] !== undefined)
      throw new Error(`Assumptions!A${row}: unknown or duplicate product.`);
    const quantity = scalar(`B${row}`, z.number().finite().int().positive());
    if (
      p.productStatus === 'new' &&
      (p.mandatoryMinimumQuantity === null || quantity < p.mandatoryMinimumQuantity)
    )
      throw new Error(`Assumptions!B${row}: quantity below mandatory minimum.`);
    quantities[p.id] = quantity;
    quantitySources[p.id] = `Assumptions!B${row}`;
  }
  return {
    base: {
      demandMultiplier: scalar('B7', z.number().finite().nonnegative()),
      clearanceFraction: scalar('C7'),
      clearancePriceFraction: scalar('D7'),
    },
    newDemand: scalar('B13'),
    newOnlineFactor: scalar('B14'),
    recapture: scalar('B15'),
    quantities,
    quantitySources,
  };
}
