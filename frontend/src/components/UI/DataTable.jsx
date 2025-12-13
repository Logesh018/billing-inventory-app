import React from "react";
import PropTypes from "prop-types";
import { usePagination } from "../../hooks/usePagination";
import { useDataFilter } from "../../hooks/useDataFilter";
import Pagination from "./Pagination";
import DataFilter from "./DataFilter";

const DataTable = ({ 
  columns, 
  data, 
  actions = [], 
  dynamicActions = false, // NEW: Flag to indicate actions is a function
  className = "",
  
  // Pagination props
  enablePagination = false,
  defaultItemsPerPage = 20,
  itemsPerPageOptions = [10, 20, 50, 100],
  
  // Filter props
  enableDateFilter = false,
  dateFilterField = "createdAt",
  defaultDateFilter = "thisMonth",
  
  // Search props
  enableSearch = false,
  searchFields = [],
  searchPlaceholder = "Search...",
}) => {
  // Apply filters first (if enabled)
  const {
    filteredData,
    dateFilter,
    changeDateFilter,
    searchQuery,
    changeSearchQuery,
    resetFilters,
    hasActiveFilters,
    totalBeforeFilter,
    totalAfterFilter,
  } = useDataFilter(data, {
    dateField: dateFilterField,
    defaultDateFilter,
    searchFields,
    enableDateFilter,
    enableSearch,
  });

  // Apply pagination (if enabled)
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startItem,
    endItem,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    changeItemsPerPage,
    getPageNumbers,
  } = usePagination(filteredData, {
    defaultItemsPerPage,
    itemsPerPageOptions,
  });

  // Use paginated data if pagination enabled, otherwise use filtered data
  const displayData = enablePagination ? paginatedData : filteredData;

  // Helper function to get actions for a row
  const getRowActions = (row) => {
    if (dynamicActions && typeof actions === 'function') {
      return actions(row);
    }
    return actions;
  };

  // Check if we have any actions at all
  const hasActions = dynamicActions ? true : (Array.isArray(actions) && actions.length > 0);

  return (
    <div className="w-full space-y-0">
      {/* Filter Bar - Show if any filter is enabled */}
      {(enableDateFilter || enableSearch) && (
        <DataFilter
          // Date filter
          dateFilter={dateFilter}
          onDateFilterChange={changeDateFilter}
          enableDateFilter={enableDateFilter}
          
          // Items per page
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={changeItemsPerPage}
          itemsPerPageOptions={itemsPerPageOptions}
          
          // Search
          searchQuery={searchQuery}
          onSearchChange={changeSearchQuery}
          enableSearch={enableSearch}
          searchPlaceholder={searchPlaceholder}
          
          // Reset
          onResetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
          
          // Stats
          totalItems={totalBeforeFilter}
          filteredItems={totalAfterFilter}
        />
      )}

      {/* Table */}
      <div className={`rounded-lg border border-gray-200 shadow-sm w-full ${className}`}>
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  style={{ width: column.width || 'auto' }}
                  className="px-1 py-1.5 ml-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight first:rounded-tl-lg"
                >
                  {column.label}
                </th>
              ))}
              {hasActions && (
                <th 
                  style={{ width: '100px' }}
                  className="px-1 py-1.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-tight rounded-tr-lg"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-8 text-center"
                >
                  {hasActiveFilters ? (
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No results found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters</p>
                      <button
                        onClick={resetFilters}
                        className="mt-2 px-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-medium">No data available</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => {
                const rowActions = getRowActions(row);
                return (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        style={{ width: column.width || 'auto' }}
                        className="px-1 py-1.5 text-xs text-gray-900 text-center overflow-hidden"
                      >
                        {column.render ? column.render(row) : row[column.key] || "-"}
                      </td>
                    ))}
                    {hasActions && (
                      <td 
                        style={{ width: '50px' }}
                        className="px-1 py-1.5 text-center"
                      >
                        <div className="flex justify-center space-x-0.5">
                          {Array.isArray(rowActions) && rowActions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              disabled={action.disabled && action.disabled(row)}
                              className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                                action.disabled && action.disabled(row)
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              } ${action.className || "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                              title={action.label}
                            >
                              <action.icon className="w-3 h-3" aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Show if pagination enabled and there's data */}
      {enablePagination && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={goToPage}
          onFirstPage={goToFirstPage}
          onLastPage={goToLastPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          getPageNumbers={getPageNumbers}
        />
      )}
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      width: PropTypes.string,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.func
  ]),
  dynamicActions: PropTypes.bool,
  className: PropTypes.string,
  
  // Pagination
  enablePagination: PropTypes.bool,
  defaultItemsPerPage: PropTypes.number,
  itemsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  
  // Filters
  enableDateFilter: PropTypes.bool,
  dateFilterField: PropTypes.string,
  defaultDateFilter: PropTypes.string,
  
  // Search
  enableSearch: PropTypes.bool,
  searchFields: PropTypes.arrayOf(PropTypes.string),
  searchPlaceholder: PropTypes.string,
};

DataTable.defaultProps = {
  actions: [],
  dynamicActions: false,
  className: "",
  enablePagination: false,
  defaultItemsPerPage: 20,
  itemsPerPageOptions: [10, 20, 50, 100],
  enableDateFilter: false,
  dateFilterField: "createdAt",
  defaultDateFilter: "thisMonth",
  enableSearch: false,
  searchFields: [],
  searchPlaceholder: "Search...",
};

export default DataTable;