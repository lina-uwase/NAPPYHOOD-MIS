"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface StaffOption {
  id: string;
  name: string;
  role?: string;
}

interface CustomStaff {
  id: string;
  name: string;
  isCustom: true;
}

interface CustomStaffSelectProps {
  options: StaffOption[];
  selectedStaff: (StaffOption | CustomStaff)[];
  onSelectionChange: (selectedStaff: (StaffOption | CustomStaff)[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyStateText?: string;
  error?: string;
}

const CustomStaffSelect: React.FC<CustomStaffSelectProps> = ({
  options,
  selectedStaff,
  onSelectionChange,
  placeholder,
  searchPlaceholder,
  emptyStateText = "No staff found",
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.role && option.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStaff = (staff: StaffOption) => {
    const isSelected = selectedStaff.some(s => s.id === staff.id);

    if (isSelected) {
      // Remove staff
      const newSelection = selectedStaff.filter(s => s.id !== staff.id);
      onSelectionChange(newSelection);
    } else {
      // Add staff
      const newSelection = [...selectedStaff, staff];
      onSelectionChange(newSelection);
    }
  };

  const removeStaff = (staffId: string) => {
    const newSelection = selectedStaff.filter(s => s.id !== staffId);
    onSelectionChange(newSelection);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Staff Display */}
      {selectedStaff.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedStaff.map((staff) => (
            <div
              key={staff.id}
              className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-[#5A8621] text-white"
            >
              <span>{staff.name}</span>
              {'isCustom' in staff && staff.isCustom && (
                <span className="ml-1 text-xs opacity-75">(Custom)</span>
              )}
              <button
                type="button"
                onClick={() => removeStaff(staff.id)}
                className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div
        className={`border rounded-lg cursor-pointer bg-white ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-[#5A8621] border-[#5A8621]' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <span className={selectedStaff.length === 0 ? 'text-gray-400' : 'text-gray-700'}>
            {selectedStaff.length === 0
              ? placeholder
              : `${selectedStaff.length} staff selected`}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>


          {/* Staff Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(staff => {
                const isSelected = selectedStaff.some(s => s.id === staff.id);
                return (
                  <div
                    key={staff.id}
                    onClick={() => toggleStaff(staff)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#5A8621] border-[#5A8621]'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="h-2 w-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        {staff.role && (
                          <div className="text-sm text-gray-500">{staff.role}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                {emptyStateText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CustomStaffSelect;
export type { StaffOption, CustomStaff };