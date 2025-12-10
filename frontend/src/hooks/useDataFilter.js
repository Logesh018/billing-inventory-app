import { useState, useMemo, useCallback } from 'react';
import { filterByDate, filterBySearch } from '../utils/dateFilters';

/**
 * Custom hook for managing data filtering
 * @param {Array} data - Data to filter
 * @param {Object} options - Configuration options
 * @returns {Object} Filter state and methods
 */
export const useDataFilter = (data = [], options = {}) => {
  const {
    dateField = 'createdAt',           // Default date field to filter by
    defaultDateFilter = 'thisMonth',   // Default date filter
    searchFields = [],                 // Fields to search (empty = search all)
    enableDateFilter = true,           // Enable/disable date filtering
    enableSearch = false               // Enable/disable search
  } = options;

  // State
  const [dateFilter, setDateFilter] = useState(defaultDateFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [customDateRange, setCustomDateRange] = useState(null);

  // Apply date filter
  const dateFilteredData = useMemo(() => {
    if (!enableDateFilter) return data;
    
    // If custom date range is set, use it
    if (customDateRange) {
      return data.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= customDateRange.start && itemDate <= customDateRange.end;
      });
    }

    // Otherwise use predefined filter
    return filterByDate(data, dateField, dateFilter);
  }, [data, dateField, dateFilter, customDateRange, enableDateFilter]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) {
      return dateFilteredData;
    }

    return filterBySearch(dateFilteredData, searchQuery, searchFields);
  }, [dateFilteredData, searchQuery, searchFields, enableSearch]);

  // Change date filter
  const changeDateFilter = useCallback((newFilter) => {
    setDateFilter(newFilter);
    setCustomDateRange(null); // Clear custom range when using predefined filter
  }, []);

  // Set custom date range
  const setCustomRange = useCallback((startDate, endDate) => {
    setCustomDateRange({ start: startDate, end: endDate });
    setDateFilter('custom'); // Set filter type to custom
  }, []);

  // Change search query
  const changeSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setDateFilter(defaultDateFilter);
    setSearchQuery('');
    setCustomDateRange(null);
  }, [defaultDateFilter]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      (enableDateFilter && dateFilter !== 'all') ||
      (enableSearch && searchQuery.trim() !== '') ||
      customDateRange !== null
    );
  }, [dateFilter, searchQuery, customDateRange, enableDateFilter, enableSearch]);

  // Get filter summary (for display)
  const filterSummary = useMemo(() => {
    const summary = [];

    if (enableDateFilter && dateFilter !== 'all') {
      summary.push(`Date: ${dateFilter}`);
    }

    if (enableSearch && searchQuery.trim()) {
      summary.push(`Search: "${searchQuery}"`);
    }

    if (customDateRange) {
      summary.push(`Custom range`);
    }

    return summary;
  }, [dateFilter, searchQuery, customDateRange, enableDateFilter, enableSearch]);

  return {
    // Filtered data
    filteredData,
    
    // Date filter state
    dateFilter,
    customDateRange,
    changeDateFilter,
    setCustomRange,
    
    // Search state
    searchQuery,
    changeSearchQuery,
    clearSearch,
    
    // Utility
    resetFilters,
    hasActiveFilters,
    filterSummary,
    
    // Stats
    totalBeforeFilter: data.length,
    totalAfterFilter: filteredData.length,
    itemsFiltered: data.length - filteredData.length,
  };
};