"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check, X, Search } from 'lucide-react';

interface ServiceOption {
  id: string;
  name: string;
  category: string;
  singlePrice: number;
  combinedPrice?: number | null;
}

export interface SelectedServiceWithCombo {
  serviceId: string;
  isCombined: boolean;
}

interface CategorizedServiceSelectProps {
  services: ServiceOption[];
  selectedServices: SelectedServiceWithCombo[];
  onSelectionChange: (services: SelectedServiceWithCombo[]) => void;
  placeholder?: string;
  error?: string;
}

const CategorizedServiceSelect: React.FC<CategorizedServiceSelectProps> = ({
  services,
  selectedServices,
  onSelectionChange,
  placeholder = "Select services...",
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Start with all categories expanded
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(services.reduce((acc, service) => ({ ...acc, [service.category]: true }), {}))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter services based on search term
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) {
      return services;
    }
    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  // Group filtered services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceOption[]>);

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: Record<string, string> = {
      'HAIR_TREATMENTS': 'Hair Treatments',
      'TWIST_HAIRSTYLE': 'Twist Hairstyles',
      'CORNROWS_BRAIDS': 'Cornrows & Braids',
      'STRAWSET_CURLS': 'Strawset & Curls',
      'STYLING_SERVICE': 'Styling Services',
      'SPECIAL_OFFERS': 'Special Offers'
    };
    return categoryNames[category] || category;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  const toggleService = (serviceId: string) => {
    const isSelected = selectedServices.some(s => s.serviceId === serviceId);

    if (isSelected) {
      // Remove service
      const newSelection = selectedServices.filter(s => s.serviceId !== serviceId);
      onSelectionChange(newSelection);
    } else {
      // Add service with single price by default
      const newSelection = [...selectedServices, { serviceId, isCombined: false }];
      onSelectionChange(newSelection);
    }
  };

  const toggleCombination = (serviceId: string, isCombined: boolean) => {
    const newSelection = selectedServices.map(s =>
      s.serviceId === serviceId ? { ...s, isCombined } : s
    );
    onSelectionChange(newSelection);
  };

  const getSelectedServiceDetails = () => {
    return selectedServices.map(selected => {
      const service = services.find(s => s.id === selected.serviceId);
      return service ? { ...service, isCombined: selected.isCombined } : null;
    }).filter(Boolean) as (ServiceOption & { isCombined: boolean })[];
  };

  const selectedServiceDetails = getSelectedServiceDetails();

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  const getTotalPrice = () => {
    return selectedServiceDetails.reduce((total, service) => {
      const price = service.isCombined && service.combinedPrice ? service.combinedPrice : service.singlePrice;
      return total + price;
    }, 0);
  };

  return (
    <div className="w-full space-y-4 relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-3 border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-[#5A8621]' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedServiceDetails.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-2 w-full">
                {selectedServiceDetails.map(service => (
                  <span
                    key={service.id}
                    className="inline-flex items-center px-4 py-2 bg-[#5A8621] text-white text-sm rounded-full shadow-sm"
                  >
                    <span className="font-medium">{service.name}</span>
                    <span className="ml-1 text-xs opacity-90">
                      {service.isCombined ? '(Combined)' : '(Single)'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleService(service.id);
                      }}
                      className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621] focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Services List */}
          <div className="max-h-80 overflow-y-auto">
          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <div key={category} className="border-b border-gray-100 last:border-0">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left font-medium text-gray-700"
              >
                <span>{getCategoryDisplayName(category)}</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {categoryServices.length} services
                  </span>
                  {expandedCategories.includes(category) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </button>

              {expandedCategories.includes(category) && (
                <div>
                  {categoryServices.map(service => {
                    const isSelected = selectedServices.some(s => s.serviceId === service.id);
                    const selectedService = selectedServices.find(s => s.serviceId === service.id);

                    return (
                      <div key={service.id} className="px-6 py-3 hover:bg-gray-50">
                        <button
                          onClick={() => toggleService(service.id)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${
                                isSelected
                                  ? 'bg-[#5A8621] border-[#5A8621]'
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{service.name}</div>
                                <div className="text-sm text-gray-500">
                                  Single: {formatPrice(service.singlePrice)}
                                  {service.combinedPrice && (
                                    <> • Combined: {formatPrice(service.combinedPrice)}</>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}


      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CategorizedServiceSelect;