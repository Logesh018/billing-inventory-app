import React, { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../lib/axios";

/**
 * Multi-select dropdown component for product types
 * Features:
 * - Multiple selections with checkboxes
 * - Display selected items as chips/tags
 * - Search/filter options
 * - "Others >" option to add new values
 * - Remove individual selections
 */
export default function MultiSelectDropdown({
  attributeType = "type",  // Usually "type" for Product Type
  values = [],             // Array of selected values
  onChange,                // Callback(newValuesArray)
  placeholder = "Select types",
  required = false,
  disabled = false,
  className = ""
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allOptions, setAllOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOthersMode, setIsOthersMode] = useState(false);
  const [newValueInput, setNewValueInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Ensure values is always an array
  const selectedValues = Array.isArray(values) ? values : [];

  // Load all options on mount
  useEffect(() => {
    loadAllOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributeType]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setIsOthersMode(false);
        setSearchTerm("");
        setNewValueInput("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadAllOptions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/product-attributes?type=${attributeType}`);
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

  const searchOptions = (term) => {
    if (!term || term.length < 1) {
      setSuggestions(allOptions);
      return;
    }

    const filtered = Array.isArray(allOptions)
      ? allOptions.filter(opt => opt.value.toLowerCase().includes(term.toLowerCase()))
      : [];
    setSuggestions(filtered);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchOptions(term);
  };

  const handleInputClick = () => {
    if (!showDropdown) {
      setSuggestions(allOptions);
      setShowDropdown(true);
    }
  };

  const toggleOption = (optionValue) => {
    let newValues;
    
    if (selectedValues.includes(optionValue)) {
      // Remove if already selected
      newValues = selectedValues.filter(v => v !== optionValue);
    } else {
      // Add if not selected
      newValues = [...selectedValues, optionValue];
    }
    
    onChange(newValues);
  };

  const removeValue = (valueToRemove) => {
    const newValues = selectedValues.filter(v => v !== valueToRemove);
    onChange(newValues);
  };

  const handleOthersClick = () => {
    setIsOthersMode(true);
    setNewValueInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const saveNewValue = async () => {
    const trimmedValue = newValueInput.trim();
    
    if (!trimmedValue) {
      setIsOthersMode(false);
      return;
    }

    // Check if it already exists
    const existing = allOptions.find(
      opt => opt.value.toLowerCase() === trimmedValue.toLowerCase()
    );

    if (existing) {
      // Already exists, just add it to selection
      if (!selectedValues.includes(existing.value)) {
        onChange([...selectedValues, existing.value]);
      }
      setIsOthersMode(false);
      setNewValueInput("");
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
      setSuggestions(prev => [...prev, data.attribute]);
      
      // Add to selection
      onChange([...selectedValues, data.attribute.value]);
      
      setIsOthersMode(false);
      setNewValueInput("");
      setError(null);

      // Reload all options
      loadAllOptions();
    } catch (err) {
      console.error(`Error saving new ${attributeType}:`, err);
      setError(err.response?.data?.message || "Failed to save new value");
    } finally {
      setLoading(false);
    }
  };

  const handleNewValueKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveNewValue();
    } else if (e.key === "Escape") {
      setIsOthersMode(false);
      setNewValueInput("");
    }
  };

  const cancelOthersMode = () => {
    setIsOthersMode(false);
    setNewValueInput("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Display Selected Values as Chips */}
      <div 
        className={`min-h-[32px] w-full border border-gray-300 rounded px-2 py-1 text-xs cursor-text ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        } ${className}`}
        onClick={handleInputClick}
      >
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map((value, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-medium"
              >
                {value}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(value);
                    }}
                    className="hover:text-purple-600 font-bold"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && !isOthersMode && (
        <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <input
              type="text"
              placeholder="Search types..."
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                Loading...
              </div>
            ) : Array.isArray(suggestions) && suggestions.length > 0 ? (
              <>
                {suggestions.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value);
                  
                  return (
                    <div
                      key={option._id || index}
                      className={`px-3 py-2 hover:bg-purple-50 cursor-pointer text-xs border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                        isSelected ? "bg-purple-50" : ""
                      }`}
                      onClick={() => toggleOption(option.value)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={`font-medium ${isSelected ? "text-purple-700" : "text-gray-800"}`}>
                          {option.value}
                        </span>
                      </div>
                      {option.usageCount > 0 && (
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {option.usageCount}x
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="px-3 py-2 text-xs text-gray-500">
                No matches found for "{searchTerm}"
              </div>
            )}
          </div>

          {/* Others Option */}
          <div
            className="sticky bottom-0 bg-white border-t-2 border-blue-200 px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs text-blue-600 font-medium"
            onClick={handleOthersClick}
          >
            + Others &gt;
          </div>
        </div>
      )}

      {/* Others Mode - Add New Value */}
      {isOthersMode && (
        <div className="absolute z-20 w-full bg-white border-2 border-blue-400 rounded-md shadow-lg mt-1 p-3">
          <div className="text-xs font-medium text-gray-700 mb-2">
            Add New Type:
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type new value and press Enter"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
            value={newValueInput}
            onChange={(e) => setNewValueInput(e.target.value)}
            onKeyDown={handleNewValueKeyDown}
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveNewValue}
              disabled={loading || !newValueInput.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Add"}
            </button>
            <button
              type="button"
              onClick={cancelOthersMode}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white rounded px-3 py-1 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-600">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      {/* Required Field Indicator */}
      {required && selectedValues.length === 0 && (
        <input
          type="text"
          required
          value=""
          onChange={() => {}}
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      )}
    </div>
  );
}