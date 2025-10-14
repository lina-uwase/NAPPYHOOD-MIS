"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface MultiSelectOption {
  id: string;
  name: string;
  subtitle?: string;
  value?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyStateText?: string;
  maxHeight?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  renderOption?: (option: MultiSelectOption, isSelected: boolean) => React.ReactNode;
  renderSelectedChip?: (option: MultiSelectOption, onRemove: () => void) => React.ReactNode;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onSelectionChange,
  placeholder,
  searchPlaceholder,
  emptyStateText = "No options found",
  maxHeight = "max-h-60",
  disabled = false,
  error,
  label,
  required = false,
  renderOption,
  renderSelectedChip
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionToggle = (optionId: string) => {
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];

    onSelectionChange(newSelectedIds);
  };

  const handleRemoveOption = (optionId: string) => {
    const newSelectedIds = selectedIds.filter(id => id !== optionId);
    onSelectionChange(newSelectedIds);
  };

  const defaultRenderOption = (option: MultiSelectOption, isSelected: boolean) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center">
          {isSelected && <span className="text-[#5A8621] mr-2 font-semibold">✓</span>}
          <span className={isSelected ? 'font-medium' : ''}>{option.name}</span>
        </div>
        {option.subtitle && (
          <div className="text-sm text-gray-500 mt-1">{option.subtitle}</div>
        )}
      </div>
      {option.value && (
        <div className="text-sm text-gray-600 font-medium ml-2">{option.value}</div>
      )}
    </div>
  );

  const defaultRenderSelectedChip = (option: MultiSelectOption, onRemove: () => void) => (
    <div className="inline-flex items-center bg-blue-500 text-white text-sm rounded-full px-3 py-1.5 m-1">
      <span className="max-w-32 truncate">{option.name}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-2 hover:bg-blue-600 rounded-full p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`relative border rounded-lg bg-white min-h-[42px] ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'
        } ${error ? 'border-red-500' : 'border-gray-300'} ${
          isOpen ? 'ring-2 ring-[#5A8621] border-[#5A8621]' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {/* Selected chips area */}
        <div className="flex flex-wrap items-center p-2 pr-10">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <div key={option.id}>
                {renderSelectedChip
                  ? renderSelectedChip(option, () => handleRemoveOption(option.id))
                  : defaultRenderSelectedChip(option, () => handleRemoveOption(option.id))
                }
              </div>
            ))
          ) : (
            <span className="text-gray-500 text-sm ml-1">{placeholder}</span>
          )}
        </div>

        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <div className={`${maxHeight} overflow-y-auto`}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionToggle(option.id);
                    }}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    {renderOption
                      ? renderOption(option, isSelected)
                      : defaultRenderOption(option, isSelected)
                    }
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                {emptyStateText}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default MultiSelect;