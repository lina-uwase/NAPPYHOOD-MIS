"use client"
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product, CreateProductDto, UpdateProductDto } from '../../services/productsService';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => void;
  editingProduct?: Product | null;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProduct
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price: String(editingProduct.price),
        quantity: String(editingProduct.quantity),
        isActive: editingProduct.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        quantity: '0',
        isActive: true
      });
    }
    setErrors({});
  }, [editingProduct, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.quantity !== undefined && formData.quantity !== '') {
      const qty = parseInt(formData.quantity);
      if (isNaN(qty) || qty < 0) {
        newErrors.quantity = 'Quantity must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
      };

      if (editingProduct) {
        // For updates, include all fields
        submitData.quantity = formData.quantity ? parseInt(formData.quantity) : undefined;
        submitData.isActive = formData.isActive;
      } else {
        // For creation, include quantity if provided
        if (formData.quantity && formData.quantity !== '0') {
          submitData.quantity = parseInt(formData.quantity);
        }
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to submit product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Onion Oil"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
                placeholder="Optional product description"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (RWF) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="price"
                name="price"
                value={formData.price === '0' ? '' : String(formData.price).replace(/^0+/, '')}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, '');
                  value = value.replace(/^0+/, '') || '';
                  setFormData({ ...formData, price: value });
                  if (errors.price) {
                    setErrors({ ...errors, price: '' });
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '').replace(/^0+/, '');
                  setFormData({ ...formData, price: value });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 7000"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            {/* Initial Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Stock Quantity {editingProduct ? '(Update)' : '(Optional)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="quantity"
                name="quantity"
                value={formData.quantity === '0' ? '' : String(formData.quantity).replace(/^0+/, '')}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, '');
                  value = value.replace(/^0+/, '') || '';
                  setFormData({ ...formData, quantity: value || '0' });
                  if (errors.quantity) {
                    setErrors({ ...errors, quantity: '' });
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '').replace(/^0+/, '');
                  setFormData({ ...formData, quantity: value || '0' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 50"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
              {!editingProduct && (
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty or set to 0 if you'll add stock later
                </p>
              )}
            </div>

            {/* Active Status (only for editing) */}
            {editingProduct && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Product is active
                </label>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#5A8621] text-white rounded-lg hover:bg-[#4A7318] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
