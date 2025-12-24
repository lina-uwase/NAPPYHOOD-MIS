"use client"
import React, { useState, useEffect } from 'react';
import { X, Search, Users, Loader } from 'lucide-react';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../../services/customersService';
import customersService from '../../services/customersService';
import PhoneInput, { validatePhoneNumber } from '../../components/PhoneInput';
import { kigaliLocations } from '../../utils/kigaliLocations';

interface AddCustomerModalProps {
  onClose: () => void;
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => void;
  editingCustomer?: Customer | null;
  allowDependent?: boolean;
  isQuickAdd?: boolean;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  onClose,
  onSubmit,
  editingCustomer,
  allowDependent = true,
  isQuickAdd = false
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
    additionalLocation: '',
    isDependent: false,
    parentId: '',
    isFirstTime: true,
    previousVisits: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Parent search state
  const [parentCustomers, setParentCustomers] = useState<Customer[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [isSearchingParents, setIsSearchingParents] = useState(false);

  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [additionalLocationSuggestions, setAdditionalLocationSuggestions] = useState<string[]>([]);
  const [showAdditionalLocationDropdown, setShowAdditionalLocationDropdown] = useState(false);

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await customersService.getProvinces();
        const defaultProvinces = ['Kigali City', 'North', 'South', 'East', 'West'];
        const allProvinces = Array.from(new Set([...response.data, ...defaultProvinces])).sort();
        setProvinces(allProvinces);
      } catch (error) {
        console.error('Error loading provinces:', error);
        setProvinces(['Kigali City', 'North', 'South', 'East', 'West']);
      }
    };
    if (!isQuickAdd) loadProvinces();
  }, [isQuickAdd]);

  // Update districts when province changes
  useEffect(() => {
    if (formData.province && !isQuickAdd) {
      if (formData.province === 'Kigali City') {
        const kigaliDistricts = Object.keys(kigaliLocations);
        setDistricts(kigaliDistricts);
      } else {
        const loadDistricts = async () => {
          try {
            const response = await customersService.getDistrictsByProvince(formData.province);
            setDistricts(response.data);
          } catch (error) {
            console.error('Error loading districts:', error);
            setDistricts([]);
          }
        };
        loadDistricts();
      }

      if (!editingCustomer) {
        setFormData(prev => ({ ...prev, district: '', sector: '' }));
        setSectors([]);
      }
    } else {
      setDistricts([]);
      setSectors([]);
    }
  }, [formData.province, editingCustomer, isQuickAdd]);

  // Update sectors when district changes
  useEffect(() => {
    if (formData.province && formData.district && !isQuickAdd) {
      if (formData.province === 'Kigali City' && kigaliLocations[formData.district as keyof typeof kigaliLocations]) {
        setSectors(kigaliLocations[formData.district as keyof typeof kigaliLocations]);
      } else {
        const loadSectors = async () => {
          try {
            const response = await customersService.getSectorsByDistrict(formData.province, formData.district);
            setSectors(response.data);
          } catch (error) {
            console.error('Error loading sectors:', error);
            setSectors([]);
          }
        };
        loadSectors();
      }

      if (!editingCustomer) {
        setFormData(prev => ({ ...prev, sector: '' }));
      }
    } else {
      setSectors([]);
    }
  }, [formData.province, formData.district, editingCustomer, isQuickAdd]);

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        fullName: editingCustomer.fullName || editingCustomer.name || '',
        gender: editingCustomer.gender,
        phone: editingCustomer.phone || '',
        email: editingCustomer.email || '',
        birthMonth: editingCustomer.birthMonth ? editingCustomer.birthMonth.toString().padStart(2, '0') : '',
        birthDay: editingCustomer.birthDay ? editingCustomer.birthDay.toString().padStart(2, '0') : '',
        birthYear: editingCustomer.birthYear ? editingCustomer.birthYear.toString() : '',
        district: editingCustomer.district || '',
        sector: editingCustomer.sector || '',
        province: editingCustomer.province || '',
        additionalLocation: editingCustomer.additionalLocation || '',
        isDependent: editingCustomer.isDependent || false,
        parentId: editingCustomer.parentId || '',
        isFirstTime: (editingCustomer.saleCount || 0) === 0,
        previousVisits: editingCustomer.saleCount || 0
      });

      // If editing a dependent, fetch the parent details
      if (editingCustomer.isDependent && editingCustomer.parentId) {
        fetchParentDetails(editingCustomer.parentId);
      }
    }
  }, [editingCustomer]);

  const fetchParentDetails = async (parentId: string) => {
    try {
      const response = await customersService.getById(parentId);
      if (response.success && response.data) {
        // Add to parent list so it displays correctly
        setParentCustomers([response.data]);
      }
    } catch (error) {
      console.error('Failed to fetch parent details:', error);
    }
  };

  // Search parents effect
  useEffect(() => {
    const searchParents = async () => {
      if (!parentSearch.trim()) {
        setParentCustomers([]);
        return;
      }

      setIsSearchingParents(true);
      try {
        const response = await customersService.getAll({
          search: parentSearch,
          isActive: true,
          limit: 20 // Limit results for performance
        });

        // Filter out current customer if editing (prevent self-selection)
        const results = response.data.filter(c =>
          !c.isDependent && // Only non-dependents can be parents
          c.id !== editingCustomer?.id
        );

        setParentCustomers(results);
      } catch (error) {
        console.error('Failed to search parents:', error);
      } finally {
        setIsSearchingParents(false);
      }
    };

    const timeoutId = setTimeout(searchParents, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [parentSearch, editingCustomer]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.parent-dropdown-container')) {
        setShowParentDropdown(false);
      }
      if (!target.closest('.additional-location-container')) {
        setShowAdditionalLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const capitalizeName = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    let processedValue = value;
    if (name === 'fullName' && value) {
      processedValue = capitalizeName(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));

    if (name === 'province' && !editingCustomer && !isQuickAdd) {
      setFormData(prev => ({ ...prev, district: '' }));
    }

    if (name === 'isDependent' && !checked) {
      setFormData(prev => ({
        ...prev,
        parentId: '',
        phone: ''
      }));
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (submitError) setSubmitError('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Customer name is required';
    }

    // Phone validation
    if (!formData.isDependent) {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else {
        const phoneError = validatePhoneNumber(formData.phone, true);
        if (phoneError) newErrors.phone = phoneError;
      }
    } else if (formData.phone && formData.phone.trim()) {
      const phoneError = validatePhoneNumber(formData.phone, false);
      if (phoneError) newErrors.phone = phoneError;
    }

    if (formData.isDependent && !formData.parentId) {
      newErrors.parentId = 'Please select a parent customer';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Skip address/birthday validation for Quick Add or if not provided (backend allows nulls now)
    if (!isQuickAdd) {
      if ((formData.birthMonth && !formData.birthDay) || (!formData.birthMonth && formData.birthDay)) {
        newErrors.birthday = 'Both Month and Day are required if entering birthday';
      } else if (formData.birthMonth || formData.birthDay) {
        // If provided, validate
        const month = parseInt(formData.birthMonth);
        const day = parseInt(formData.birthDay);

        if (isNaN(month) || month < 1 || month > 12) {
          newErrors.birthday = 'Please enter a valid month (1-12)';
        } else if (isNaN(day) || day < 1 || day > 31) {
          newErrors.birthday = 'Please enter a valid day (1-31)';
        }
      } else {
        // Enforce birthday for standard registration
        if (!editingCustomer && !formData.birthMonth) {
          newErrors.birthday = 'Birthday month and day are required';
        }
      }

      if (!formData.province) {
        newErrors.province = 'Province is required';
      }

      if (!formData.district) {
        newErrors.district = 'District is required';
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
      const birthDay = formData.birthDay ? parseInt(formData.birthDay) : undefined;
      const birthMonth = formData.birthMonth ? parseInt(formData.birthMonth) : undefined;
      const birthYear = formData.birthYear ? parseInt(formData.birthYear) : undefined;

      const submitData = {
        fullName: formData.fullName.trim(),
        gender: formData.gender as 'MALE' | 'FEMALE',
        phone: formData.phone?.trim() || undefined,
        email: formData.email.trim() || undefined,
        birthDay,
        birthMonth,
        birthYear,
        location: formData.district || undefined,
        district: formData.district || undefined,
        sector: formData.sector?.trim() || undefined,
        province: formData.province || undefined,
        additionalLocation: formData.additionalLocation?.trim() || undefined,
        isDependent: formData.isDependent,
        parentId: formData.isDependent ? formData.parentId : undefined,
        saleCount: formData.isFirstTime ? 0 : formData.previousVisits
      };

      setSubmitError('');
      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Failed to submit customer:', error);
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
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingCustomer ? 'Edit Customer' : (isQuickAdd ? 'Quick Customer Registration (Product Only)' : 'Add New Customer')}
            </h2>
            {isQuickAdd && (
              <p className="text-sm text-gray-500 mt-1">Simplified registration for product buyers</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
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
              <PhoneInput
                value={formData.phone}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, phone: value }));
                  if (errors.phone) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.phone;
                      return newErrors;
                    });
                  }
                }}
                disabled={formData.isDependent}
                placeholder={formData.isDependent ? 'Inherited from parent' : 'Enter phone number'}
                error={errors.phone}
                required={!formData.isDependent}
              />
            </div>

            {/* Hide non-essential fields in Quick Add mode */}
            {!isQuickAdd && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
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
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${errors.birthday ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                            {new Date(2000, i).toLocaleDateString('en', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        name="birthDay"
                        value={formData.birthDay}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${errors.birthday ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        name="birthYear"
                        value={formData.birthYear}
                        onChange={handleInputChange}
                        placeholder="Year"
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${errors.province ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Province</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] disabled:bg-gray-100 ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <p className="mt-1 text-sm text-red-600">{errors.district}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector (Optional)</label>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    disabled={!formData.district}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] disabled:bg-gray-100"
                  >
                    <option value="">Select Sector</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="additional-location-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="additionalLocation"
                      value={formData.additionalLocation}
                      onChange={handleInputChange}
                      onFocus={() => setShowAdditionalLocationDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Landmark, building, etc."
                    />
                    {showAdditionalLocationDropdown && additionalLocationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg">
                        {additionalLocationSuggestions.filter(s => s.toLowerCase().includes(formData.additionalLocation.toLowerCase())).map((s, i) => (
                          <div key={i} onClick={() => { setFormData(prev => ({ ...prev, additionalLocation: s })); setShowAdditionalLocationDropdown(false); }} className="p-3 cursor-pointer hover:bg-gray-50">{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Visit Tracking - Always show for both modes */}
            <div className="md:col-span-2 p-3 border border-gray-300 rounded-md mb-4">
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
                <label htmlFor="isFirstTime" className="text-sm text-gray-700">First time visiting our salon</label>
              </div>
              {!formData.isFirstTime && (
                <div className="ml-7">
                  <label className="block text-sm text-gray-600 mb-1">Previous visits:</label>
                  <input
                    type="number"
                    name="previousVisits"
                    value={formData.previousVisits}
                    onChange={handleInputChange}
                    min="0"
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

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

                  {formData.parentId ? (
                    <div className="mb-3 p-3 bg-[#5A8621] text-white rounded-md flex justify-between items-center">
                      <div>
                        {/* Try to find parent in search results, OR fallback if it was preloaded via editingCustomer */}
                        <div className="font-medium">
                          {parentCustomers.find(c => c.id === formData.parentId)?.fullName ||
                            parentCustomers.find(c => c.id === formData.parentId)?.name ||
                            'Parent Selected'}
                        </div>
                        <div className="text-sm opacity-90">
                          {parentCustomers.find(c => c.id === formData.parentId)?.phone ||
                            'Has Phone Number'}
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
                  ) : (
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
                        {isSearchingParents && (
                          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                        )}
                      </div>

                      {showParentDropdown && parentSearch.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg">
                          {parentCustomers.length > 0 ? (
                            parentCustomers.map(customer => (
                              <div
                                key={customer.id}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    parentId: customer.id,
                                    phone: customer.phone || ''
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
                            <div className="p-3 text-gray-500 text-center">
                              {isSearchingParents ? 'Searching...' : 'No customers found'}
                            </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-[#5A8621] rounded-md hover:bg-[#4A7318] disabled:opacity-50 flex items-center"
            >
              {loading && <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />}
              {editingCustomer ? 'Update Customer' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;