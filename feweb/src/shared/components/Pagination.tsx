import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  itemsOnCurrentPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  isLoading = false,
  itemsOnCurrentPage
}) => {
  // Don't show pagination if there's only one page or no data
  if (totalPages <= 1 || totalElements === 0) {
    return null;
  }

  const displayCount = itemsOnCurrentPage ?? Math.min(pageSize, totalElements - currentPage * pageSize);

  return (
    <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-sm text-slate-600">
        Hiển thị {displayCount} trong tổng số {totalElements} kết quả
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isLoading || currentPage === 0}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Trước
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i).map(pageNum => {
            // Show first page, last page, current page, and pages around current
            const showPage = 
              pageNum === 0 || 
              pageNum === totalPages - 1 || 
              Math.abs(pageNum - currentPage) <= 1;
            
            // Show ellipsis
            const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 2;
            const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 3;

            if (showEllipsisBefore || showEllipsisAfter) {
              return (
                <span key={pageNum} className="px-2 text-slate-400">
                  ...
                </span>
              );
            }

            if (!showPage) return null;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className={`h-9 w-9 rounded-full text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                  pageNum === currentPage
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLoading || currentPage >= totalPages - 1}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau →
        </button>
      </div>
    </div>
  );
};
