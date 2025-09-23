
"use client"
import React, { useState } from 'react';
import { Product, CreateProductDto, UpdateProductDto } from '../../services/productsService';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: CreateProductDto | UpdateProductDto) => void;
  editingProduct?: Product | null;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAddProduct, editingProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    manufacturing_country: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        manufacturer: editingProduct.manufacturer,
        manufacturing_country: editingProduct.manufacturing_country
      });
    } else {
      setFormData({
        name: '',
        manufacturer: '',
        manufacturing_country: ''
      });
    }
    setErrors({});
  }, [editingProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters';
    }
    
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    } else if (formData.manufacturer.trim().length < 2) {
      newErrors.manufacturer = 'Manufacturer must be at least 2 characters';
    }
    
    if (!formData.manufacturing_country.trim()) {
      newErrors.manufacturing_country = 'Manufacturing country is required';
    } else if (formData.manufacturing_country.trim().length < 2) {
      newErrors.manufacturing_country = 'Country must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productData: CreateProductDto | UpdateProductDto = {
        name: formData.name.trim(),
        manufacturer: formData.manufacturer.trim(),
        manufacturing_country: formData.manufacturing_country.trim()
      };
      
      await onAddProduct(productData);
      
      setFormData({
        name: '',
        manufacturer: '',
        manufacturing_country: ''
      });
      setErrors({});
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (Object.values(formData).some(value => value.trim() !== '')) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
        setFormData({
          name: '',
          manufacturer: '',
          manufacturing_country: ''
        });
        setErrors({});
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Manufacturer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                errors.manufacturer ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter manufacturer name"
            />
            {errors.manufacturer && (
              <p className="mt-1 text-xs text-red-600">{errors.manufacturer}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Manufacturing Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="manufacturing_country"
              value={formData.manufacturing_country}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                errors.manufacturing_country ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter manufacturing country"
            />
            {errors.manufacturing_country && (
              <p className="mt-1 text-xs text-red-600">{errors.manufacturing_country}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#009900] text-white hover:bg-[#008800] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingProduct ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingProduct ? 'Update Product' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;