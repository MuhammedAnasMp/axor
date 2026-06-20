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
  if (totalCount === 0 || totalCount <= pageSize || loading) return null;
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
    <div className="flex flex-row items-center justify-between gap-1.5 sm:gap-4 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-surface-low text-[10px] sm:text-xs text-text-secondary bg-white p-2 sm:p-3 rounded-b-lg border-x border-b w-full overflow-x-auto no-scrollbar">
      {/* Page Size Selector */}
      <div className="flex items-center space-x-1 whitespace-nowrap">
        <span className="hidden xs:inline">Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
            setPage(1);
          }}
          className="rounded border border-surface-dim bg-white px-1.5 py-0.5 text-[10px] sm:text-xs text-text-primary outline-none focus:border-brand-blue cursor-pointer"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="hidden xs:inline">entries</span>
      </div>

      {/* Info message */}
      <div className="whitespace-nowrap font-medium px-1">
        <span className="hidden sm:inline">Showing {startEntry} to {endEntry} of {totalCount} entries</span>
        <span className="sm:hidden">{startEntry}-{endEntry} of {totalCount}</span>
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center space-x-0.5 sm:space-x-1 whitespace-nowrap">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded border border-surface-dim bg-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 hover:bg-surface-low disabled:opacity-50 disabled:hover:bg-white transition"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">&lt;</span>
        </button>

        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => setPage(num)}
            className={`rounded border px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition ${
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
          className="rounded border border-surface-dim bg-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 hover:bg-surface-low disabled:opacity-50 disabled:hover:bg-white transition"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">&gt;</span>
        </button>
      </div>
    </div>
  );
}
