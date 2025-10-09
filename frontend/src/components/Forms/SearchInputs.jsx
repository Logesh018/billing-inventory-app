// hooks/useSearch.js
// Generic search hook for any entity
import { useState } from 'react';
import { axiosInstance } from '../../lib/axios';

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

      const { data: results } = await axiosInstance.get(
        `${searchEndpoint}?q=${encodeURIComponent(searchTerm)}`
      );

      // Deduplicate results by _id or name
      const uniqueResults = results.filter(
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
    // Add null/undefined check
    if (item && callback) {
      callback(item);
    }
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

// hooks/useBuyerSearch.js
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

// hooks/useSupplierSearch.js
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

// hooks/useProductSearch.js
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

// services/searchService.js
// Generic search service for any entity type
//import { axiosInstance } from '../lib/axios';

class SearchService {
  constructor(baseURL = "") {
    this.baseURL = baseURL;
    this.cache = new Map(); // Simple caching
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  getCacheKey(endpoint, searchTerm) {
    return `${endpoint}:${searchTerm.toLowerCase()}`;
  }

  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheExpiry;
  }

  async search(endpoint, searchTerm, options = {}) {
    const {
      minLength = 2,
      useCache = true,
      deduplicateBy = ['_id', 'name']
    } = options;

    if (searchTerm.length < minLength) {
      return [];
    }

    // Check cache first
    const cacheKey = this.getCacheKey(endpoint, searchTerm);
    if (useCache && this.cache.has(cacheKey)) {
      const cacheEntry = this.cache.get(cacheKey);
      if (this.isCacheValid(cacheEntry)) {
        return cacheEntry.data;
      }
    }

    try {
      const { data: results } = await axiosInstance.get(
        `${endpoint}?q=${encodeURIComponent(searchTerm)}`
      );

      // Deduplicate results
      let deduplicated = results;
      if (deduplicateBy.length > 0) {
        deduplicated = this.deduplicateResults(results, deduplicateBy);
      }

      // Cache the results
      if (useCache) {
        this.cache.set(cacheKey, {
          data: deduplicated,
          timestamp: Date.now()
        });
      }

      return deduplicated;
    } catch (error) {
      console.error(`Error searching ${endpoint}:`, error);
      throw error;
    }
  }

  deduplicateResults(results, fields) {
    return results.filter((item, index, self) =>
      index === self.findIndex((i) => {
        return fields.some(field => {
          if (field === '_id') {
            return i._id && i._id === item._id;
          }
          return i[field] === item[field];
        });
      })
    );
  }

  // Specific search methods
  async searchBuyers(searchTerm, options = {}) {
    return this.search("/orders/search/buyers", searchTerm, {
      ...options,
      deduplicateBy: ['_id', 'name', 'mobile']
    });
  }

  async searchProducts(searchTerm, options = {}) {
    return this.search("/products/search", searchTerm, {
      ...options,
      deduplicateBy: ['_id', 'name', 'hsn']
    });
  }

  async searchSuppliers(searchTerm, options = {}) {
    return this.search("/purchases/search/suppliers", searchTerm, {
      ...options,
      deduplicateBy: ['_id', 'name', 'mobile', 'code']
    });
  }

  async searchCustomers(searchTerm, options = {}) {
    return this.search("/customers/search", searchTerm, options);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entries
  clearCacheForEndpoint(endpoint) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(endpoint + ":")) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
export const searchService = new SearchService();

// components/SearchDropdown/SearchDropdown.jsx
// Reusable search dropdown component

export function SearchDropdown({
  suggestions,
  onSelect,
  renderItem,
  className = "",
  maxHeight = "40",
  emptyMessage = "No results found"
}) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-${maxHeight} overflow-y-auto mt-1 ${className}`}>
      {suggestions.length > 0 ? (
        suggestions.map((item, index) => (
          <div
            key={item._id || index}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs border-b border-gray-100 last:border-b-0"
            onClick={() => onSelect(item)}
          >
            {renderItem ? renderItem(item) : (
              <div>
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-gray-500">{item.mobile || item.hsn || item.email}</div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="px-3 py-2 text-xs text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

// components/Forms/BuyerSearchInput.jsx
import { SearchableInput } from '../UI/FormComponents';
export function BuyerSearchInput({
  value,
  onChange,
  onSelect,
  label = "Buyer",
  placeholder = "Enter buyer name",
  required = false,
  className = ""
}) {
  const {
    buyerSuggestions,
    showBuyerDropdown,
    searchBuyers,
    selectBuyer,
    setShowBuyerDropdown
  } = useBuyerSearch();

  const handleSelect = (buyer) => {
    // Add safety check
    if (buyer && onSelect) {
      selectBuyer(buyer, onSelect);
    }
  };

  return (
    <SearchableInput
      label={label}
      value={value}
      onChange={onChange}
      onSearch={searchBuyers}
      onSelect={handleSelect}
      suggestions={buyerSuggestions}
      showDropdown={showBuyerDropdown}
      onDropdownToggle={setShowBuyerDropdown}
      placeholder={placeholder}
      required={required}
      className={className}
      renderSuggestion={(buyer) => (
        <div>
          <div className="font-medium">{buyer.name}</div>
          <div className="text-gray-500">{buyer.mobile}</div>
        </div>
      )}
    />
  );
}

// components/Forms/SupplierSearchInput.jsx
// import { SearchableInput } from '../UI/FormComponents';
// import { useSupplierSearch } from '../../hooks/useSearch';

export function SupplierSearchInput({
  value,
  onChange,
  onSelect,
  label = "Supplier",
  placeholder = "Enter supplier name",
  required = false,
  className = ""
}) {
  const {
    supplierSuggestions,
    showSupplierDropdown,
    searchSuppliers,
    selectSupplier,
    setShowSupplierDropdown
  } = useSupplierSearch();

  const handleSelect = (supplier) => {
    // Add safety check
    if (supplier && onSelect) {
      selectSupplier(supplier, onSelect);
    }
  };

  return (
    <SearchableInput
      label={label}
      value={value}
      onChange={onChange}
      onSearch={searchSuppliers}
      onSelect={handleSelect}
      suggestions={supplierSuggestions}
      showDropdown={showSupplierDropdown}
      onDropdownToggle={setShowSupplierDropdown}
      placeholder={placeholder}
      required={required}
      className={className}
      renderSuggestion={(supplier) => (
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="text-gray-500">
            {supplier.mobile || supplier.code || supplier.email}
          </div>
        </div>
      )}
    />
  );
}

// components/Forms/ProductSearchInput.jsx

export function ProductSearchInput({
  value,
  onChange,
  onSelect,
  label = "Product",
  placeholder = "Enter product name",
  required = false,
  className = ""
}) {
  const {
    productSuggestions,
    showProductDropdown,
    searchProducts,
    selectProduct,
    setShowProductDropdown
  } = useProductSearch();

  const handleSelect = (product) => {
    // Add safety check
    if (product && onSelect) {
      selectProduct(product, onSelect);
    }
  };

  return (
    <SearchableInput
      label={label}
      value={value}
      onChange={onChange}
      onSearch={searchProducts}
      onSelect={handleSelect}
      suggestions={productSuggestions}
      showDropdown={showProductDropdown}
      onDropdownToggle={setShowProductDropdown}
      placeholder={placeholder}
      required={required}
      className={className}
      renderSuggestion={(product) => (
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-gray-500">HSN: {product.hsn}</div>
        </div>
      )}
    />
  );
}