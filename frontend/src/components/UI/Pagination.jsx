import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onFirstPage,
  onLastPage,
  onNextPage,
  onPrevPage,
  getPageNumbers
}) {
  // Don't render if no data
  if (totalItems === 0) return null;

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      {/* Left side - Showing X to Y of Z entries */}
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> entries
        </span>
      </div>

      {/* Right side - Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* First Page Button */}
        <button
          onClick={onFirstPage}
          disabled={!hasPrevPage}
          className={`p-2 rounded-lg transition-colors ${
            hasPrevPage
              ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="First page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        {/* Previous Button */}
        <button
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            hasPrevPage
              ? 'text-gray-700 bg-white hover:bg-gray-100 border border-gray-300'
              : 'text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'text-gray-700 bg-white hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={onNextPage}
          disabled={!hasNextPage}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            hasNextPage
              ? 'text-gray-700 bg-white hover:bg-gray-100 border border-gray-300'
              : 'text-gray-300 bg-gray-50 border border-gray-200 cursor-not-allowed'
          }`}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={onLastPage}
          disabled={!hasNextPage}
          className={`p-2 rounded-lg transition-colors ${
            hasNextPage
              ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Last page"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}