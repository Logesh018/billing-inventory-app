// hooks/useSearch.js
// Generic search hook for any entity
import { useState } from 'react';

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
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${searchEndpoint}?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const results = await response.json();
      
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
