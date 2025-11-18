"use client"
import React, { useState, useEffect } from 'react';
import { X, Search, Users } from 'lucide-react';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../services/customersService';
import customersService from '../../services/customersService';

interface AddCustomerModalProps {
  onClose: () => void;
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => void;
  editingCustomer?: Customer | null;
  allowDependent?: boolean;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  onClose,
  onSubmit,
  editingCustomer,
  allowDependent = true
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'FEMALE',
    phone: '',
    email: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    district: '',
    sector: '',
    province: '',
    isDependent: false,
    parentId: '',
    isFirstTime: true,
    previousVisits: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);

  

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await customersService.getProvinces();
        setProvinces(response.data);
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    loadProvinces();
  }, []);

  // Update districts when province changes
  useEffect(() => {
    if (formData.province) {
      const loadDistricts = async () => {
        try {
          const response = await customersService.getDistrictsByProvince(formData.province);
          setDistricts(response.data);
        } catch (error) {
          console.error('Error loading districts:', error);
        }
      };
      loadDistricts();
      setFormData(prev => ({ ...prev, district: '', sector: '' }));
      setSectors([]);
    } else {
      setDistricts([]);
      setSectors([]);
    }
  }, [formData.province]);

  // Update sectors when district changes
  useEffect(() => {
    if (formData.province && formData.district) {
      const loadSectors = async () => {
        try {
          const response = await customersService.getSectorsByDistrict(formData.province, formData.district);
          setSectors(response.data);
        } catch (error) {
          console.error('Error loading sectors:', error);
        }
      };
      loadSectors();
      setFormData(prev => ({ ...prev, sector: '' }));
    } else {
      setSectors([]);
    }
  }, [formData.province, formData.district]);

  useEffect(() => {
    fetchCustomers();
    if (editingCustomer) {
      setFormData({
        fullName: editingCustomer.fullName || editingCustomer.name || '',
        gender: editingCustomer.gender,
        phone: editingCustomer.phone || '',
        email: editingCustomer.email || '',
        birthMonth: editingCustomer.birthMonth ? editingCustomer.birthMonth.toString().padStart(2, '0') : '',
        birthDay: editingCustomer.birthDay ? editingCustomer.birthDay.toString().padStart(2, '0') : '',
        birthYear: editingCustomer.birthYear ? editingCustomer.birthYear.toString() : '',
        district: editingCustomer.district,
        sector: editingCustomer.sector || '',
        province: editingCustomer.province,
        isDependent: editingCustomer.isDependent || false,
        parentId: editingCustomer.parentId || '',
        isFirstTime: false, // When editing, it's not first time
        previousVisits: editingCustomer.saleCount || 0
      });
    }
  }, [editingCustomer]);

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getAll({ limit: 1000, isActive: true });
      setCustomers(response.data.filter(c => !c.isDependent)); // Only show non-dependents as potential parents
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  // Close parent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.parent-dropdown-container')) {
        setShowParentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset district when province changes
    if (name === 'province') {
      setFormData(prev => ({
        ...prev,
        district: ''
      }));
    }

    // Reset parent when isDependent changes
    if (name === 'isDependent' && !checked) {
      setFormData(prev => ({
        ...prev,
        parentId: '',
        phone: '' // Clear phone when no longer dependent
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Customer name is required';
    }

    // Phone is optional for dependents
    if (!formData.isDependent && !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone && !/^(\+250|0)?[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Rwandan phone number';
    }

    if (formData.isDependent && !formData.parentId) {
      newErrors.parentId = 'Please select a parent customer';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }


    if (!formData.birthMonth || !formData.birthDay) {
      newErrors.birthday = 'Birthday month and day are required';
    } else {
      const month = parseInt(formData.birthMonth);
      const day = parseInt(formData.birthDay);

      if (isNaN(month) || month < 1 || month > 12) {
        newErrors.birthday = 'Please enter a valid month (1-12)';
      } else if (isNaN(day) || day < 1 || day > 31) {
        newErrors.birthday = 'Please enter a valid day (1-31)';
      }

      // Validate year if provided
      if (formData.birthYear) {
        const year = parseInt(formData.birthYear);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1900 || year > currentYear) {
          newErrors.birthday = 'Please enter a valid birth year';
        }
      }
    }

    if (!formData.province) {
      newErrors.province = 'Province is required';
    }

    if (!formData.district) {
      newErrors.district = 'District is required';
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
      // Parse birthday fields
      const birthDay = parseInt(formData.birthDay);
      const birthMonth = parseInt(formData.birthMonth);
      const birthYear = formData.birthYear ? parseInt(formData.birthYear) : undefined;

      // Validate parsed numbers
      if (isNaN(birthDay) || isNaN(birthMonth)) {
        console.error('Invalid birthday fields:', { birthDay: formData.birthDay, birthMonth: formData.birthMonth });
        return;
      }

      const submitData = {
        fullName: formData.fullName.trim(),
        gender: formData.gender as 'MALE' | 'FEMALE',
        phone: formData.phone?.trim() || undefined,
        email: formData.email.trim() || undefined,
        birthDay,
        birthMonth,
        birthYear,
        location: formData.district, // Use district as location for now
        district: formData.district,
        sector: formData.sector?.trim() || undefined,
        province: formData.province,
        isDependent: formData.isDependent,
        parentId: formData.isDependent ? formData.parentId : undefined,
        saleCount: formData.isFirstTime ? 0 : formData.previousVisits
      };

      console.log('Submitting customer data:', submitData); // Debug log

      // Clear any previous submit errors
      setSubmitError('');

      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Failed to submit customer:', error);

      // Extract error message from the response
      let errorMessage = 'Failed to create customer. Please try again.';

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          {/* Error Message Display */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{submitError}</p>
            </div>
          )}

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
                Phone Number {!formData.isDependent && '*'}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={formData.isDependent}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                  formData.isDependent ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.isDependent ? 'Inherited from parent' : 'e.g., +250 788 123 456'}
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
                Birthday *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <select
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                      errors.birthday ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {new Date(2000, i).toLocaleDateString('en', { month: 'long' })}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <select
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                      errors.birthday ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      return (
                        <option key={day} value={day.toString().padStart(2, '0')}>
                          {day}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    name="birthYear"
                    value={formData.birthYear}
                    onChange={handleInputChange}
                    placeholder="Year (optional)"
                    min="1900"
                    max={new Date().getFullYear()}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                      errors.birthday ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
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
                {provinces.map(province => (
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
                {districts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector (Optional)
              </label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
                disabled={!formData.district}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Sector</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* VISIT TRACKING - SIMPLE SECTION */}
          <div className="p-3 border border-gray-300 rounded-md mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Visit Tracking</h3>

            <div className="flex items-center space-x-3 mb-2">
              <input
                type="checkbox"
                id="isFirstTime"
                name="isFirstTime"
                checked={formData.isFirstTime}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isFirstTime" className="text-sm text-gray-700">
                First time visiting our salon
              </label>
            </div>

            {!formData.isFirstTime && (
              <div className="ml-7">
                <label className="block text-sm text-gray-600 mb-1">
                  Previous visits:
                </label>
                <input
                  type="number"
                  name="previousVisits"
                  value={formData.previousVisits}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {allowDependent && (
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isDependent"
                  id="isDependent"
                  checked={formData.isDependent}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                />
                <label htmlFor="isDependent" className="ml-2 text-sm text-gray-700">
                  This is a dependent (child/family member without their own phone)
                </label>
              </div>

              {formData.isDependent && (
                <div className="parent-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Select Parent Customer *
                  </label>

                  {/* Selected Parent Display */}
                  {formData.parentId && (
                    <div className="mb-3 p-3 bg-[#5A8621] text-white rounded-md flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {customers.find(c => c.id === formData.parentId)?.fullName || customers.find(c => c.id === formData.parentId)?.name}
                        </div>
                        <div className="text-sm opacity-90">
                          {customers.find(c => c.id === formData.parentId)?.phone}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, parentId: '' }));
                          setParentSearch('');
                          setShowParentDropdown(true);
                        }}
                        className="text-white hover:text-gray-200 text-sm underline"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {!formData.parentId && (
                    <>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search parent by name or phone..."
                          value={parentSearch}
                          onChange={(e) => {
                            setParentSearch(e.target.value);
                            setShowParentDropdown(true);
                          }}
                          onFocus={() => setShowParentDropdown(true)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] bg-white"
                        />
                      </div>

                      {showParentDropdown && (
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg">
                          {customers.filter(customer =>
                            (customer.fullName || customer.name || '').toLowerCase().includes(parentSearch.toLowerCase()) ||
                            customer.phone?.includes(parentSearch)
                          ).length > 0 ? (
                            customers.filter(customer =>
                              (customer.fullName || customer.name || '').toLowerCase().includes(parentSearch.toLowerCase()) ||
                              customer.phone?.includes(parentSearch)
                            ).map(customer => (
                              <div
                                key={customer.id}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    parentId: customer.id,
                                    phone: customer.phone || '' // Auto-populate phone from parent
                                  }));
                                  setShowParentDropdown(false);
                                  setParentSearch('');
                                }}
                                className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
                              >
                                <div className="font-medium">{customer.fullName || customer.name}</div>
                                <div className="text-sm text-gray-600">{customer.phone}</div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500 text-center">No customers found</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {errors.parentId && <p className="mt-1 text-sm text-red-600">{errors.parentId}</p>}
                </div>
              )}
            </div>
          )}


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