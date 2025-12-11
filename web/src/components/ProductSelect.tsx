"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search, Package } from 'lucide-react';
import { Product } from '../services/productsService';

interface ProductSelectProps {
  products: Product[];
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  placeholder?: string;
  error?: string;
}

const ProductSelect: React.FC<ProductSelectProps> = ({
  products,
  selectedProductIds,
  onSelectionChange,
  placeholder = "Select products...",
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive && p.quantity > 0);
    if (!searchTerm.trim()) {
      return activeProducts;
    }
    const searchLower = searchTerm.toLowerCase();
    return activeProducts.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower))
    );
  }, [products, searchTerm]);

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

  const toggleProduct = (productId: string) => {
    const isSelected = selectedProductIds.includes(productId);
    if (isSelected) {
      onSelectionChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedProductIds, productId]);
    }
  };

  const getSelectedProductDetails = () => {
    return selectedProductIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  };

  const selectedProductDetails = getSelectedProductDetails();

  const formatPrice = (price: number | string) => {
    return `${Number(price).toLocaleString()} RWF`;
  };

  return (
    <div className="w-full space-y-2 relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-3 border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${isOpen ? 'ring-2 ring-[#5A8621]' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedProductDetails.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-2 w-full">
                {selectedProductDetails.map(product => (
                  <span
                    key={product.id}
                    className="inline-flex items-center px-3 py-1 bg-[#5A8621] text-white text-sm rounded-full shadow-sm"
                  >
                    <Package className="h-3 w-3 mr-1" />
                    <span className="font-medium">{product.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProduct(product.id);
                      }}
                      className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621] focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Products List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                {searchTerm ? (
                  <p>No products found matching "{searchTerm}"</p>
                ) : (
                  <p>No products available in stock</p>
                )}
              </div>
            ) : (
              filteredProducts.map(product => {
                const isSelected = selectedProductIds.includes(product.id);
                const isLowStock = product.quantity < 10;

                return (
                  <div
                    key={product.id}
                    className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                      isSelected ? 'bg-green-50' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className="w-full flex items-start justify-between text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-start">
                          <div className={`w-4 h-4 border rounded mr-3 mt-0.5 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-[#5A8621] border-[#5A8621]'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{product.name}</span>
                              <span className="text-sm text-gray-600">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Stock:</span>
                              <span className={`text-xs font-medium ${
                                isLowStock ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {product.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ProductSelect;
