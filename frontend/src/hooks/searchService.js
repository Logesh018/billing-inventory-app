import { axiosInstance } from '../../lib/axios';

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