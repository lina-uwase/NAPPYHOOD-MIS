"use client"
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../services/customersService';

interface AddCustomerModalProps {
  onClose: () => void;
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => void;
  editingCustomer?: Customer | null;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  onClose,
  onSubmit,
  editingCustomer
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'FEMALE',
    phone: '',
    email: '',
    birthday: '',
    location: '',
    district: '',
    province: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const rwandanProvinces = [
    'Kigali City',
    'Eastern Province',
    'Western Province',
    'Northern Province',
    'Southern Province'
  ];

  const districtsByProvince: Record<string, string[]> = {
    'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
    'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango']
  };

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        fullName: editingCustomer.fullName || editingCustomer.name || '',
        gender: editingCustomer.gender,
        phone: editingCustomer.phone,
        email: editingCustomer.email || '',
        birthday: editingCustomer.birthday ? editingCustomer.birthday.split('T')[0] : '',
        location: editingCustomer.location,
        district: editingCustomer.district,
        province: editingCustomer.province
      });
    }
  }, [editingCustomer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset district when province changes
    if (name === 'province') {
      setFormData(prev => ({
        ...prev,
        district: ''
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

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Customer name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+250|0)?[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Rwandan phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.district) {
      newErrors.district = 'District is required';
    }

    if (!formData.province) {
      newErrors.province = 'Province is required';
    }

    if (formData.birthday) {
      const birthday = new Date(formData.birthday);
      const today = new Date();
      if (birthday > today) {
        newErrors.birthday = 'Birthday cannot be in the future';
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
      // Parse birthday if provided
      let birthDay: number | undefined;
      let birthMonth: number | undefined;
      let birthYear: number | undefined;

      if (formData.birthday) {
        const dateObj = new Date(formData.birthday);
        birthDay = dateObj.getDate();
        birthMonth = dateObj.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
        birthYear = dateObj.getFullYear();
      }

      const submitData = {
        fullName: formData.fullName.trim(),
        gender: formData.gender as 'MALE' | 'FEMALE',
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        birthDay,
        birthMonth,
        birthYear,
        location: formData.location.trim(),
        district: formData.district,
        province: formData.province
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to submit customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableDistricts = formData.province ? districtsByProvince[formData.province] || [] : [];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter customer's full name"
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., +250 788 123 456"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="customer@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.birthday ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.birthday && <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province *
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.province ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Province</option>
                {rwandanProvinces.map(province => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                disabled={!formData.province}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.district ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select District</option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Kimisagara, Sector ABC"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
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
              {loading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;