import { Calendar, Search, RotateCcw, Filter } from 'lucide-react';
import { getFilterOptions, getItemsPerPageOptions } from '../../utils/dateFilters';

export default function DataFilter({
  // Date filter props
  dateFilter,
  onDateFilterChange,
  enableDateFilter = true,
  
  // Items per page props
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions,
  
  // Search props
  searchQuery,
  onSearchChange,
  enableSearch = false,
  searchPlaceholder = "Search...",
  
  // Reset
  onResetFilters,
  hasActiveFilters,
  
  // Stats
  totalItems,
  filteredItems
}) {
  const filterOptions = getFilterOptions();
  const pageOptions = itemsPerPageOptions || getItemsPerPageOptions();

  return (
    <div className="bg-white px-4 py-3 border-b border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side - Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter Dropdown */}
          {enableDateFilter && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => onDateFilterChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Input */}
          {enableSearch && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset Filters
            </button>
          )}

          {/* Filter Status Indicator */}
          {hasActiveFilters && totalItems !== filteredItems && (
            <div className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-200">
              <Filter className="w-3 h-3 mr-1.5" />
              Showing {filteredItems} of {totalItems} items
            </div>
          )}
        </div>

        {/* Right side - Items per page */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {pageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>
    </div>
  );
}