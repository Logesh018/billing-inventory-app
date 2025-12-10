import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  isWithinInterval,
  parseISO,
  isValid
} from 'date-fns';

/**
 * Get date range based on filter type
 * @param {string} filterType - 'all', 'thisMonth', 'lastMonth', 'last3Months', 'thisYear', 'lastYear'
 * @returns {Object} { start: Date, end: Date } or null for 'all'
 */
export const getDateRange = (filterType) => {
  const now = new Date();

  switch (filterType) {
    case 'all':
      return null; // No filtering

    case 'thisMonth':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };

    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    }

    case 'last3Months':
      return {
        start: subMonths(now, 3),
        end: now
      };

    case 'last6Months':
      return {
        start: subMonths(now, 6),
        end: now
      };

    case 'thisYear':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };

    case 'lastYear': {
      const lastYear = subYears(now, 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear)
      };
    }

    default:
      return null;
  }
};

/**
 * Filter array of objects by date field
 * @param {Array} data - Array of objects to filter
 * @param {string} dateField - Name of the date field to filter by
 * @param {string} filterType - Type of filter ('all', 'thisMonth', etc.)
 * @returns {Array} Filtered data
 */
export const filterByDate = (data, dateField, filterType = 'thisMonth') => {
  if (!data || !Array.isArray(data)) return [];
  if (filterType === 'all') return data;

  const dateRange = getDateRange(filterType);
  if (!dateRange) return data;

  return data.filter(item => {
    const dateValue = item[dateField];
    if (!dateValue) return false;

    try {
      // Parse date (handles both ISO strings and Date objects)
      const itemDate = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
      
      if (!isValid(itemDate)) return false;

      // Check if date is within range
      return isWithinInterval(itemDate, dateRange);
    } catch (error) {
      console.error(`Error filtering date for item:`, item, error);
      return false;
    }
  });
};

/**
 * Filter array by search query (searches multiple fields)
 * @param {Array} data - Array of objects to filter
 * @param {string} query - Search query
 * @param {Array} searchFields - Fields to search in
 * @returns {Array} Filtered data
 */
export const filterBySearch = (data, query, searchFields = []) => {
  if (!data || !Array.isArray(data)) return [];
  if (!query || query.trim() === '') return data;

  const lowerQuery = query.toLowerCase().trim();

  return data.filter(item => {
    // If no search fields specified, search all string fields
    if (searchFields.length === 0) {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(lowerQuery)
      );
    }

    // Search only specified fields
    return searchFields.some(field => {
      const value = getNestedValue(item, field);
      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
};

/**
 * Get nested object value by path (e.g., 'buyer.name')
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path
 * @returns {any} Value at path or empty string
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key] ?? '', obj);
};

/**
 * Get filter options for dropdown
 * @returns {Array} Array of filter options
 */
export const getFilterOptions = () => [
  { value: 'all', label: 'All Time' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'last6Months', label: 'Last 6 Months' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
];

/**
 * Get items per page options
 * @returns {Array} Array of page size options
 */
export const getItemsPerPageOptions = () => [10, 20, 50, 100];

/**
 * Calculate pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} Pagination metadata
 */
export const getPaginationInfo = (totalItems, currentPage, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    totalPages,
    totalItems,
    currentPage,
    itemsPerPage,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startItem: startIndex + 1,
    endItem: endIndex
  };
};