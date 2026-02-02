import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, X } from "lucide-react";

/**
 * SearchableSelect Component
 * Provides a dropdown with search/filter capability and optional "Add New" button
 * 
 * Props:
 *   label: string - Field label
 *   name: string - Field name
 *   value: string - Current selected value
 *   onChange: function - Callback when selection changes
 *   onAddNew: function - Callback when "Add New" is clicked (optional)
 *   options: array - Array of options (can be strings or {label, value} objects)
 *   error: string - Error message (optional)
 *   placeholder: string - Placeholder text (optional)
 *   showAddButton: boolean - Show "Add New" button (default: false)
 *   isLoading: boolean - Show loading state (default: false)
 */
const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  onAddNew,
  options = [],
  error,
  placeholder = "Search or select...",
  showAddButton = false,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) => {
    const optionLabel = typeof option === "string" ? option : option.label;
    return optionLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayLabel = () => {
    if (!value) return placeholder;
    const selected = options.find((opt) => {
      const optValue = typeof opt === "string" ? opt : opt.value;
      return optValue === value || optValue.toString() === value.toString();
    });
    return selected 
      ? (typeof selected === "string" ? selected : selected.label)
      : placeholder;
  };

  return (
    <div className="flex flex-col" ref={containerRef}>
      <label className="text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>

      <div className="relative">
        {/* Main dropdown button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`w-full border px-4 py-3 rounded-md text-sm bg-white focus:outline-none shadow-sm flex items-center justify-between ${
            error
              ? "border-red-500 focus:ring-red-300"
              : "border-gray-300 focus:ring-lime-400"
          } focus:ring-2 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="text-left truncate">
            {isLoading ? "Loading..." : getDisplayLabel()}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
              />
            </div>

            {/* Options list */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const optValue = typeof option === "string" ? option : option.value;
                  const optLabel = typeof option === "string" ? option : option.label;
                  const isSelected = optValue === value || optValue.toString() === value.toString();

                  return (
                    <button
                      key={optValue}
                      type="button"
                      onClick={() => handleSelect(optValue)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b last:border-b-0 ${
                        isSelected ? "bg-blue-100 font-semibold text-blue-900" : ""
                      }`}
                    >
                      {optLabel}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm text-center">
                  No options found
                </div>
              )}
            </div>

            {/* Add New button */}
            {showAddButton && (
              <div className="border-t border-gray-200 p-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchTerm("");
                    if (onAddNew) onAddNew(searchTerm);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New {label}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
