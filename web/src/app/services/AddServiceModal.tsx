"use client"
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Service, CreateServiceDto, UpdateServiceDto } from '../../services/servicesService';

interface AddServiceModalProps {
  onClose: () => void;
  onSubmit: (data: CreateServiceDto | UpdateServiceDto) => void;
  editingService?: Service | null;
}

const AddServiceModal: React.FC<AddServiceModalProps> = ({
  onClose,
  onSubmit,
  editingService
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'HAIR_TREATMENTS',
    description: '',
    singlePrice: '',
    combinedPrice: '',
    childPrice: '',
    childCombinedPrice: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const serviceCategories = [
    { value: 'HAIR_TREATMENTS', label: 'Hair Treatments' },
    { value: 'TWIST_HAIRSTYLE', label: 'Twist Hairstyles' },
    { value: 'CORNROWS_BRAIDS', label: 'Cornrows & Braids' },
    { value: 'STRAWSET_CURLS', label: 'Strawset & Curls' },
    { value: 'STYLING_SERVICE', label: 'Styling Services' },
    { value: 'SPECIAL_OFFERS', label: 'Special Offers' }
  ];

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        category: editingService.category,
        description: editingService.description,
        singlePrice: editingService.singlePrice?.toString() || '',
        combinedPrice: editingService.combinedPrice?.toString() || '',
        childPrice: editingService.childPrice?.toString() || '',
        childCombinedPrice: editingService.childCombinedPrice?.toString() || '',
        isActive: editingService.isActive
      });
    }
  }, [editingService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      newErrors.name = 'Service name is required';
    }


    if (!formData.singlePrice || parseFloat(formData.singlePrice) <= 0) {
      newErrors.singlePrice = 'Single price must be greater than 0';
    }


    if (formData.combinedPrice && parseFloat(formData.combinedPrice) <= 0) {
      newErrors.combinedPrice = 'Combined price must be greater than 0';
    }

    if (formData.childPrice && parseFloat(formData.childPrice) <= 0) {
      newErrors.childPrice = 'Child price must be greater than 0';
    }

    if (formData.childCombinedPrice && parseFloat(formData.childCombinedPrice) <= 0) {
      newErrors.childCombinedPrice = 'Child combined price must be greater than 0';
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
      const submitData = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim() || undefined,
        singlePrice: parseFloat(formData.singlePrice),
        combinedPrice: formData.combinedPrice ? parseFloat(formData.combinedPrice) : undefined,
        childPrice: formData.childPrice ? parseFloat(formData.childPrice) : undefined,
        childCombinedPrice: formData.childCombinedPrice ? parseFloat(formData.childCombinedPrice) : undefined,
        isActive: formData.isActive
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to submit service:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter service name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
              >
                {serviceCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Single Price (RWF) *
              </label>
              <input
                type="number"
                name="singlePrice"
                value={formData.singlePrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.singlePrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 15000"
              />
              {errors.singlePrice && <p className="mt-1 text-sm text-red-600">{errors.singlePrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Combined Price (RWF)
              </label>
              <input
                type="number"
                name="combinedPrice"
                value={formData.combinedPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.combinedPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 20000"
              />
              {errors.combinedPrice && <p className="mt-1 text-sm text-red-600">{errors.combinedPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child Price (RWF)
              </label>
              <input
                type="number"
                name="childPrice"
                value={formData.childPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.childPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 12000"
              />
              {errors.childPrice && <p className="mt-1 text-sm text-red-600">{errors.childPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child Combined Price (RWF)
              </label>
              <input
                type="number"
                name="childCombinedPrice"
                value={formData.childCombinedPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.childCombinedPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 17000"
              />
              {errors.childCombinedPrice && <p className="mt-1 text-sm text-red-600">{errors.childCombinedPrice}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the service..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Service is active
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[#5A8621] border border-transparent rounded-md hover:bg-[#4A7318] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;