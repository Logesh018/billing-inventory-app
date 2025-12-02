import React, { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../lib/axios";

/**
 * Reusable dropdown component for product attributes
 * Features:
 * - Search/filter existing values
 * - "Others >" option to add new values
 * - Auto-save new values to database
 * - Keyboard navigation support
 */
export default function AttributeDropdown({
  attributeType,     // "category", "list", "style", "fabric"
  value,             // Current selected value
  onChange,          // Callback when value changes
  placeholder = "Select or type to search",
  required = false,
  disabled = false,
  className = ""
}) {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [allOptions, setAllOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOthersMode, setIsOthersMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Load all options on mount
  useEffect(() => {
    loadAllOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeType]);

  // Update search term when value changes externally
  useEffect(() => {
    if (value) {
      setSearchTerm(value);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setIsOthersMode(false);
        // Reset to original value if nothing selected
        if (!value && searchTerm) {
          setSearchTerm("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, searchTerm]);

  const loadAllOptions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/product-attributes?type=${attributeType}`);
      // Ensure data is an array
      const options = Array.isArray(data) ? data : [];
      setAllOptions(options);
      setSuggestions(options);
      setError(null);
    } catch (err) {
      console.error(`Error loading ${attributeType} options:`, err);
      setError("Failed to load options");
      setAllOptions([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const searchOptions = async (term) => {
    if (!term || term.length < 1) {
      setSuggestions(allOptions);
      return;
    }

    try {
      const { data } = await axiosInstance.get(
        `/product-attributes/search?type=${attributeType}&q=${encodeURIComponent(term)}`
      );
      // Ensure data is an array
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Error searching ${attributeType}:`, err);
      // Fallback to local filtering
      setSuggestions(allOptions.filter(opt => 
        opt.value.toLowerCase().includes(term.toLowerCase())
      ));
    }
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOthersMode(false);
    
    if (term.length === 0) {
      setSuggestions(allOptions);
    } else {
      searchOptions(term);
    }
    
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setSuggestions(allOptions);
    setShowDropdown(true);
  };

  const selectOption = (option) => {
    setSearchTerm(option.value);
    onChange(option.value);
    setShowDropdown(false);
    setIsOthersMode(false);
  };

  const handleOthersClick = () => {
    setIsOthersMode(true);
    setShowDropdown(false);
    // Focus input for user to type
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const saveNewValue = async (newValue) => {
    if (!newValue || !newValue.trim()) {
      return;
    }

    const trimmedValue = newValue.trim();

    // Check if it already exists
    const existing = allOptions.find(
      opt => opt.value.toLowerCase() === trimmedValue.toLowerCase()
    );

    if (existing) {
      // Already exists, just use it
      selectOption(existing);
      return;
    }

    try {
      setLoading(true);
      const { data } = await axiosInstance.post("/product-attributes", {
        attributeType,
        value: trimmedValue
      });

      console.log(`✅ Added new ${attributeType}:`, data.attribute.value);

      // Update local state
      setAllOptions(prev => [...prev, data.attribute]);
      setSearchTerm(data.attribute.value);
      onChange(data.attribute.value);
      setIsOthersMode(false);
      setError(null);

      // Reload all options to get updated list
      loadAllOptions();
    } catch (err) {
      console.error(`Error saving new ${attributeType}:`, err);
      setError(err.response?.data?.message || "Failed to save new value");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      if (isOthersMode) {
        // Save the new value
        saveNewValue(searchTerm);
      } else if (suggestions.length > 0) {
        // Select first suggestion
        selectOption(suggestions[0]);
      } else if (searchTerm.trim()) {
        // No matches, treat as new value
        saveNewValue(searchTerm);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setIsOthersMode(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow click events to process
    setTimeout(() => {
      if (isOthersMode && searchTerm.trim()) {
        saveNewValue(searchTerm);
      }
      setShowDropdown(false);
    }, 200);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder={isOthersMode ? "Type new value and press Enter" : placeholder}
        className={`w-full border border-gray-300 text-gray-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 ${
          isOthersMode ? "border-blue-500 ring-1 ring-blue-500" : ""
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""} ${className}`}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        required={required}
      />

      {isOthersMode && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
          💡 Type new value and press Enter to save
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          ⚠️ {error}
        </div>
      )}

      {showDropdown && !isOthersMode && (
        <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">
              Loading...
            </div>
          ) : Array.isArray(suggestions) && suggestions.length > 0 ? (
            <>
              {suggestions.map((option, index) => (
                <div
                  key={option._id || index}
                  className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-xs text-gray-800 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                  onClick={() => selectOption(option)}
                >
                  <span className="font-medium">{option.value}</span>
                  {option.usageCount > 0 && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      Used {option.usageCount}x
                    </span>
                  )}
                </div>
              ))}
              
              {/* Others option */}
              <div
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs text-blue-600 font-medium border-t-2 border-blue-200 sticky bottom-0 bg-white"
                onClick={handleOthersClick}
              >
                + Others &gt;
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs text-gray-500">
                No matches found for "{searchTerm}"
              </div>
              <div
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs text-blue-600 font-medium border-t-2 border-blue-200"
                onClick={handleOthersClick}
              >
                + Add "{searchTerm}" as new value
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}