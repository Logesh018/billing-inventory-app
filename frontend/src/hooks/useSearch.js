import { useState } from 'react';
import { axiosInstance } from '../lib/axios';

export function useSearch(searchEndpoint, minSearchLength = 2) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (searchTerm) => {
    if (searchTerm.length < minSearchLength) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await axiosInstance.get(`${searchEndpoint}?q=${encodeURIComponent(searchTerm)}`);

      // Deduplicate results by _id or name
      const uniqueResults = data.filter(
        (item, index, self) =>
          index === self.findIndex(
            (i) => (i._id && i._id === item._id) || (i.name === item.name)
          )
      );

      setSuggestions(uniqueResults);
      setShowDropdown(true);
    } catch (err) {
      console.error(`Error searching ${searchEndpoint}:`, err);
      setError(err.message);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
  };

  const selectItem = (item, callback) => {
    if (callback) callback(item);
    clearSearch();
  };

  return {
    suggestions,
    showDropdown,
    isLoading,
    error,
    search,
    clearSearch,
    selectItem,
    setShowDropdown
  };
}

// Specific buyer search hook
export function useBuyerSearch() {
  const searchHook = useSearch("/orders/search/buyers");

  return {
    ...searchHook,
    searchBuyers: searchHook.search,
    buyerSuggestions: searchHook.suggestions,
    showBuyerDropdown: searchHook.showDropdown,
    setShowBuyerDropdown: searchHook.setShowDropdown,
    selectBuyer: searchHook.selectItem,
  };
}

// Specific supplier search hook
export function useSupplierSearch() {
  const searchHook = useSearch("/purchases/search/suppliers");

  return {
    ...searchHook,
    searchSuppliers: searchHook.search,
    supplierSuggestions: searchHook.suggestions,
    showSupplierDropdown: searchHook.showDropdown,
    setShowSupplierDropdown: searchHook.setShowDropdown,
    selectSupplier: searchHook.selectItem,
  };
}

// Specific product search hook
export function useProductSearch() {
  const searchHook = useSearch("/products/search");

  return {
    ...searchHook,
    searchProducts: searchHook.search,
    productSuggestions: searchHook.suggestions,
    showProductDropdown: searchHook.showDropdown,
    setShowProductDropdown: searchHook.setShowDropdown,
    selectProduct: searchHook.selectItem,
  };
}

// ✅ Specific supplier search hook for Purchase Orders
export function usePOSupplierSearch() {
  const searchHook = useSearch("/purchase-orders/search/suppliers");

  return {
    ...searchHook,
    searchPOSuppliers: searchHook.search,
    poSupplierSuggestions: searchHook.suggestions,
    showPOSupplierDropdown: searchHook.showDropdown,
    setShowPOSupplierDropdown: searchHook.setShowDropdown,
    selectPOSupplier: searchHook.selectItem,
  };
}
