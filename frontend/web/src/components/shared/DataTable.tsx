import { useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable } from './LoadingSkeleton';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  searchable?: boolean;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  rowKey: (row: T) => string;
  actions?: ReactNode;
  emptyMessage?: string;
}

export default function DataTable<T>({ columns, data, loading, total = 0, page = 1, pageSize = 20, onPageChange, searchable, onSearch, searchPlaceholder = 'Search...', rowKey, actions, emptyMessage }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const handleSearch = (q: string) => {
    setSearch(q);
    onSearch?.(q);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {(searchable || actions) && (
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              />
            </div>
          )}
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {loading ? (
        <div className="p-4"><SkeletonTable rows={5} cols={columns.length} /></div>
      ) : data.length === 0 ? (
        <EmptyState message={emptyMessage ?? 'No records found'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.width ?? ''} ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map(row => (
                <tr key={rowKey(row)} className="hover:bg-gray-50/50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="py-3 px-4 text-gray-700">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => onPageChange(p)}
                  className={`w-7 h-7 text-xs rounded border ${p === page ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
