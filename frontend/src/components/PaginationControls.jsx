import React from 'react';

export default function PaginationControls({ 
  page, 
  setPage, 
  pageSize, 
  setPageSize, 
  totalCount, 
  totalPages,
  loading
}) {
  if (totalCount === 0 || loading) return null;
  const startEntry = (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalCount);

  // Generate page numbers to show
  const pageNumbers = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-surface-low text-xs text-text-secondary bg-white p-3 rounded-b-lg border-x border-b">
      {/* Page Size Selector */}
      <div className="flex items-center space-x-2">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
            setPage(1);
          }}
          className="rounded border border-surface-dim bg-white px-2.5 py-1 text-xs text-text-primary outline-none focus:border-brand-blue cursor-pointer"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>entries</span>
      </div>

      {/* Info message */}
      <div>
        Showing {startEntry} to {endEntry} of {totalCount} entries
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded border border-surface-dim bg-white px-2.5 py-1.5 hover:bg-surface-low disabled:opacity-50 disabled:hover:bg-white transition"
        >
          Previous
        </button>

        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => setPage(num)}
            className={`rounded border px-2.5 py-1.5 transition ${
              page === num
                ? 'bg-brand-blue border-brand-blue text-white font-semibold'
                : 'border-surface-dim bg-white hover:bg-surface-low'
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded border border-surface-dim bg-white px-2.5 py-1.5 hover:bg-surface-low disabled:opacity-50 disabled:hover:bg-white transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
