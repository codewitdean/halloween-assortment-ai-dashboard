'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { CATEGORIES, type Product } from '@/types/product';
import type { Decision } from '@/types/consensus';
import { money, number } from '@/lib/format';
type Column = {
  key: keyof Product | 'quantity' | 'placement';
  label: string;
  numeric?: boolean;
  display?: (p: Product) => string;
};
const columns: Column[] = [
  { key: 'productName', label: 'Product' },
  { key: 'productStatus', label: 'Current / New' },
  { key: 'category', label: 'Category' },
  { key: 'originalChannel', label: 'Original channel' },
  { key: 'requiredFacings', label: 'Required facings', numeric: true },
  {
    key: 'retailPrice',
    label: 'Retail price',
    numeric: true,
    display: (p) => money(p.retailPrice),
  },
  { key: 'unitCost', label: 'Unit cost', numeric: true, display: (p) => money(p.unitCost) },
  { key: 'quantity', label: 'Historical / mandatory quantity', numeric: true },
  {
    key: 'historicalSales',
    label: 'Historical sales',
    numeric: true,
    display: (p) => money(p.historicalSales),
  },
  {
    key: 'historicalGrossProfit',
    label: 'Historical gross profit',
    numeric: true,
    display: (p) => money(p.historicalGrossProfit),
  },
  { key: 'fullPriceUnits', label: 'Full-price units', numeric: true },
  { key: 'clearanceUnits', label: 'Clearance units', numeric: true },
  { key: 'storeUnits', label: 'Store units', numeric: true },
  { key: 'onlineUnits', label: 'Online units', numeric: true },
  { key: 'averageStars', label: 'Average rating', numeric: true },
  { key: 'reviewCount', label: 'Review count', numeric: true },
  { key: 'licensed', label: 'Licensed', display: (p) => (p.licensed ? 'Yes' : 'No') },
  { key: 'sourceRange', label: 'Source range' },
  { key: 'placement', label: 'Team placement' },
];
const rawValue = (p: Product, key: Column['key'], decisions?: readonly Decision[]) =>
  key === 'placement'
    ? (decisions?.find((d) => d.productId === p.id)?.placement ?? null)
    : key === 'quantity'
      ? (p.historicalBuyQuantity ?? p.mandatoryMinimumQuantity)
      : p[key];
export function ProductTable({
  products,
  onSelect,
  decisions,
  onFilteredChange,
}: {
  products: Product[];
  onSelect: (p: Product) => void;
  decisions?: readonly Decision[];
  onFilteredChange?: (products: Product[]) => void;
}) {
  const [placement, setPlacement] = useState('all');
  const [disagreement, setDisagreement] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [licensed, setLicensed] = useState('all');
  const [sort, setSort] = useState<{ key: Column['key']; direction: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 8;
  const filtered = useMemo(() => {
    const rows = products.filter(
      (p) =>
        p.productName.toLowerCase().includes(search.toLowerCase()) &&
        (category === 'all' || p.category === category) &&
        (status === 'all' || p.productStatus === status) &&
        (channel === 'all' || p.originalChannel === channel) &&
        (licensed === 'all' || p.licensed === (licensed === 'yes')) &&
        (placement === 'all' ||
          decisions?.find((d) => d.productId === p.id)?.placement === placement) &&
        (!disagreement ||
          decisions?.some(
            (d) =>
              d.productId === p.id && Object.values(d.comparisons).some((v) => v !== d.placement),
          )),
    );
    if (sort)
      rows.sort((a, b) => {
        const av = rawValue(a, sort.key, decisions),
          bv = rawValue(b, sort.key, decisions);
        if (av === null) return bv === null ? 0 : 1;
        if (bv === null) return -1;
        const comparison =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'en');
        return comparison * sort.direction || a.productName.localeCompare(b.productName, 'en');
      });
    return rows;
  }, [
    products,
    search,
    category,
    status,
    channel,
    licensed,
    sort,
    decisions,
    placement,
    disagreement,
  ]);
  useEffect(() => {
    onFilteredChange?.(filtered);
  }, [filtered, onFilteredChange]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const rows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const filter = (
    label: string,
    value: string,
    setter: (v: string) => void,
    options: { value: string; label: string }[],
  ) => (
    <label className="filter-field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          setter(e.target.value);
          setPage(0);
        }}
      >
        <option value="all">All {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const clear = () => {
    setPlacement('all');
    setDisagreement(false);
    setSearch('');
    setCategory('all');
    setStatus('all');
    setChannel('all');
    setLicensed('all');
    setSort(null);
    setPage(0);
  };
  const active =
    placement !== 'all' ||
    disagreement ||
    search ||
    category !== 'all' ||
    status !== 'all' ||
    channel !== 'all' ||
    licensed !== 'all';
  return (
    <section className="panel evidence-panel" id="products" aria-labelledby="products-heading">
      <div className="section-head">
        <div>
          <div className="eyebrow">THE SOURCE OF EVERY DECISION</div>
          <h2 id="products-heading">
            Product decision table <span className="count-chip">{products.length}</span>
          </h2>
          <p>Explore the supplied assortment. Select a product for its complete source record.</p>
        </div>
        <span className="source-tag">
          <span className="dot" />
          Source data
        </span>
      </div>
      <div className="filters">
        <label className="search-field">
          <span>Search products</span>
          <div>
            <Search size={17} />
            <input
              aria-label="Search products"
              placeholder="Search name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </label>
        {filter(
          'Category',
          category,
          setCategory,
          CATEGORIES.map((c) => ({ value: c, label: c })),
        )}
        {filter('Status', status, setStatus, [
          { value: 'current', label: 'Current' },
          { value: 'new', label: 'New' },
        ])}
        {filter(
          'Original channel',
          channel,
          setChannel,
          ['In-Store', 'Online-Only', 'Candidate'].map((c) => ({ value: c, label: c })),
        )}
        {filter('Licensed', licensed, setLicensed, [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ])}
        {decisions &&
          filter(
            'Team placement',
            placement,
            setPlacement,
            ['In-Store', 'Online-Only', 'Removed'].map((c) => ({ value: c, label: c })),
          )}
        {decisions && (
          <label className="disagreement-filter">
            <input
              type="checkbox"
              checked={disagreement}
              onChange={(e) => {
                setDisagreement(e.target.checked);
                setPage(0);
              }}
            />
            Model/team disagreement
          </label>
        )}
        <button className="reset-button" onClick={clear} disabled={!active && !sort}>
          <SlidersHorizontal size={15} />
          Reset
        </button>
      </div>
      <div className="table-caption">
        <span aria-live="polite">
          {filtered.length} products{active ? ' matching filters' : ' in the dataset'}
        </span>
        <span>
          — = not supplied <span className="separator">·</span> Scroll horizontally for all 19
          fields →
        </span>
      </div>
      <div
        className="table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Product source data, horizontally scrollable"
      >
        <table>
          <caption className="sr-only">
            Source data product evidence. Column headers sort; missing values always sort last.
          </caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={c.numeric ? 'numeric' : ''}
                  aria-sort={
                    sort?.key === c.key
                      ? sort.direction === 1
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    onClick={() => {
                      setSort({
                        key: c.key,
                        direction: sort?.key === c.key && sort.direction === 1 ? -1 : 1,
                      });
                      setPage(0);
                    }}
                  >
                    {c.label}
                    {sort?.key === c.key ? (
                      sort.direction === 1 ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                {columns.map((c) => {
                  const raw = rawValue(p, c.key, decisions);
                  return (
                    <td key={c.key} className={c.numeric ? 'numeric' : ''}>
                      {c.key === 'productName' ? (
                        <button className="product-link" onClick={() => onSelect(p)}>
                          <span
                            className={`product-symbol ${p.category === 'Inflatables' ? 'violet' : p.category === 'Decor & Accessories' ? 'mint' : ''}`}
                          >
                            {p.category === 'Giants & Animatronics'
                              ? 'G'
                              : p.category === 'Inflatables'
                                ? 'I'
                                : 'D'}
                          </span>
                          <span>{p.productName}</span>
                          <ArrowUpRight size={14} />
                        </button>
                      ) : c.key === 'productStatus' ? (
                        <span className={`pill ${p.productStatus}`}>
                          {p.productStatus === 'new' ? 'New' : 'Current'}
                        </span>
                      ) : c.key === 'placement' ? (
                        <span className={`placement-pill placement-${String(raw).toLowerCase()}`}>
                          {String(raw)}
                        </span>
                      ) : c.key === 'originalChannel' ? (
                        <span
                          className={`channel ${p.originalChannel === 'Candidate' ? 'candidate' : ''}`}
                        >
                          {p.originalChannel}
                        </span>
                      ) : c.key === 'quantity' ? (
                        <>
                          <span>{number(raw as number | null)}</span>
                          <small className="quantity-caption">
                            {p.productStatus === 'new' ? 'Mandatory minimum' : 'Historical buy'}
                          </small>
                        </>
                      ) : c.display ? (
                        c.display(p)
                      ) : raw === null ? (
                        <span className="missing" aria-label="Not supplied">
                          —
                        </span>
                      ) : c.numeric ? (
                        number(raw as number)
                      ) : (
                        String(raw)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="empty">
            <Search size={26} />
            <h3>No matching products</h3>
            <p>Try another name or clear the filters.</p>
            <button onClick={clear}>Clear filters</button>
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          Showing {filtered.length ? currentPage * pageSize + 1 : 0}–
          {Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="pagination">
          <button
            aria-label="Previous page"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {currentPage + 1} of {pages}
          </span>
          <button
            aria-label="Next page"
            disabled={currentPage >= pages - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
