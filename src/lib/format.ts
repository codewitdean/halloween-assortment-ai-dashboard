export const money = (value: number | null) =>
  value === null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
export const number = (value: number | null) =>
  value === null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
export const percent = (value: number | null) =>
  value === null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value);
