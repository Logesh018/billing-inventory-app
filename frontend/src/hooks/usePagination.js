import { useState, useMemo, useCallback } from 'react';
import { getPaginationInfo } from '../utils/dateFilters';

/**
 * Custom hook for managing pagination
 * @param {Array} data - Data to paginate
 * @param {Object} options - Configuration options
 * @returns {Object} Pagination state and methods
 */
export const usePagination = (data = [], options = {}) => {
  const {
    defaultItemsPerPage = 20,
    itemsPerPageOptions = [10, 20, 50, 100]
  } = options;

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    return getPaginationInfo(data.length, currentPage, itemsPerPage);
  }, [data.length, currentPage, itemsPerPage]);

  // Get current page data
  const paginatedData = useMemo(() => {
    const { startIndex, endIndex } = paginationInfo;
    return data.slice(startIndex, endIndex);
  }, [data, paginationInfo]);

  // Navigation methods
  const goToPage = useCallback((page) => {
    const { totalPages } = getPaginationInfo(data.length, page, itemsPerPage);
    
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [data.length, itemsPerPage]);

  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const prevPage = useCallback(() => {
    if (paginationInfo.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationInfo.hasPrevPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    const { totalPages } = paginationInfo;
    setCurrentPage(totalPages);
  }, [paginationInfo]);

  // Change items per page
  const changeItemsPerPage = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setItemsPerPage(defaultItemsPerPage);
  }, [defaultItemsPerPage]);

  // Get page numbers for pagination UI (with ellipsis logic)
  const getPageNumbers = useCallback(() => {
    const { totalPages } = paginationInfo;
    const pages = [];
    const maxVisiblePages = 7; // Show max 7 page numbers

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex logic for ellipsis
      if (currentPage <= 4) {
        // Near start: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... 6 7 8 9 10
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, paginationInfo]);

  return {
    // Data
    paginatedData,
    
    // Pagination info
    currentPage,
    totalPages: paginationInfo.totalPages,
    totalItems: paginationInfo.totalItems,
    itemsPerPage,
    startItem: paginationInfo.startItem,
    endItem: paginationInfo.endItem,
    hasNextPage: paginationInfo.hasNextPage,
    hasPrevPage: paginationInfo.hasPrevPage,
    
    // Navigation methods
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    
    // Settings
    changeItemsPerPage,
    itemsPerPageOptions,
    
    // Utility
    resetPagination,
    getPageNumbers,
  };
};