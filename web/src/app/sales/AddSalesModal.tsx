"use client"
import React, { useState, useEffect } from 'react';
import { X, Search, User, Scissors, Users, Calendar } from 'lucide-react';
import { Sale, CreateSaleDto, UpdateSaleDto } from '../../services/salesService';
import customersService, { Customer } from '../../services/customersService';
import servicesService, { Service } from '../../services/servicesService';
import staffService, { Staff } from '../../services/staffService';

interface AddSalesModalProps {
  onClose: () => void;
  onSubmit: (data: CreateSaleDto | UpdateSaleDto) => Promise<void>;
  editingSale?: Sale | null;
}

const AddSalesModal: React.FC<AddSalesModalProps> = ({
  onClose,
  onSubmit,
  
  editingSale
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    serviceIds: [] as string[],
    staffIds: [] as string[],
    saleDate: new Date().toISOString().slice(0, 16),
    notes: '',
    paymentMethod: 'CASH',
    bringOwnShampoo: false
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchServices();
    fetchStaff();
  }, []);

  useEffect(() => {
    if (editingSale) {
      setFormData({
        customerId: editingSale.customerId,
        serviceIds: editingSale.services.map(s => s.serviceId),
        staffIds: editingSale.staff.map(s => s.staffId),
        saleDate: new Date(editingSale.saleDate).toISOString().slice(0, 16),
        notes: editingSale.notes || '',
        paymentMethod: editingSale.paymentMethod || 'CASH',
        bringOwnShampoo: editingSale.ownShampooDiscount || false
      });
    }
  }, [editingSale]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowCustomerDropdown(false);
        setShowServiceDropdown(false);
        setShowStaffDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getAll({ limit: 1000, isActive: true });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await servicesService.getAll({ limit: 1000, isActive: true });
      setServices(response.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await staffService.getActiveStaff();
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }));
  };

  const handleStaffToggle = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      staffIds: prev.staffIds.includes(staffId)
        ? prev.staffIds.filter(id => id !== staffId)
        : [...prev.staffIds, staffId]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    if (formData.serviceIds.length === 0) {
      newErrors.serviceIds = 'Please select at least one service';
    }

    if (formData.staffIds.length === 0) {
      newErrors.staffIds = 'Please select at least one staff member';
    }

    if (!formData.saleDate) {
      newErrors.saleDate = 'Sale date is required';
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
    setSubmitError(null);

    try {
      const submitData = {
        customerId: formData.customerId,
        serviceIds: formData.serviceIds,
        staffIds: formData.staffIds,
        saleDate: formData.saleDate,
        notes: formData.notes.trim() || undefined,
        paymentMethod: formData.paymentMethod,
        ownShampooDiscount: formData.bringOwnShampoo
      };

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      console.error('Failed to submit sale:', error);
      setSubmitError(error.response?.data?.error || error.message || 'Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.fullName || customer.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
  const selectedStaff = staff.filter(s => formData.staffIds.includes(s.id));

  const calculateTotals = () => {
    const subtotal = selectedServices.reduce((total, service) => total + Number(service.singlePrice), 0);
    const ownShampooDiscount = formData.bringOwnShampoo ? 1000 : 0;
    const finalAmount = Math.max(0, subtotal - ownShampooDiscount);
    return { subtotal, ownShampooDiscount, finalAmount };
  };

  const { subtotal, ownShampooDiscount, finalAmount } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingSale ? 'Edit Sale' : 'Record New Sale'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <div className="space-y-4">
              <div className="dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Select Customer *
                </label>

                {/* Selected Customer Display */}
                {selectedCustomer ? (
                  <div className="mb-3 p-3 bg-[#5A8621] text-white rounded-md flex justify-between items-center">
                    <div>
                      <div className="font-medium">{selectedCustomer.fullName || selectedCustomer.name}</div>
                      <div className="text-sm opacity-90">{selectedCustomer.phone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, customerId: '' }));
                        setCustomerSearch('');
                        setShowCustomerDropdown(true);
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
                        placeholder="Search customer by name or phone..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] bg-white"
                      />
                    </div>

                    {showCustomerDropdown && (
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, customerId: customer.id }));
                                setShowCustomerDropdown(false);
                                setCustomerSearch('');
                              }}
                              className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <div className="font-medium">{customer.fullName || customer.name}</div>
                              <div className="text-sm text-gray-600">{customer.phone}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center">
                            <div className="text-gray-500 mb-2">No customers found</div>
                            <button
                              type="button"
                              onClick={() => {
                                // Navigate to customers page to add new customer
                                window.location.href = '/customers';
                              }}
                              className="text-sm text-[#5A8621] hover:text-[#4A7318] font-medium underline"
                            >
                              Customer not found? Record them
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
              </div>

              {/* Sale Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Sale Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={(e) => {
                    handleInputChange(e);
                    // Close any open dropdowns when date changes
                    setShowCustomerDropdown(false);
                    setShowServiceDropdown(false);
                    setShowStaffDropdown(false);
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                    errors.saleDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.saleDate && <p className="mt-1 text-sm text-red-600">{errors.saleDate}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_CARD">Bank Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              {/* Bring Own Shampoo */}
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="bringOwnShampoo"
                    checked={formData.bringOwnShampoo}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Customer brought own shampoo (-1,000 RWF)
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                  placeholder="Any additional notes about the sale..."
                />
              </div>
            </div>

            {/* Services and Staff Selection */}
            <div className="space-y-4">
              {/* Services */}
              <div className="dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scissors className="inline h-4 w-4 mr-1" />
                  Select Services *
                </label>

                {/* Selected Services Display */}
                {selectedServices.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="text-sm text-gray-600">Selected Services:</div>
                    {selectedServices.map(service => (
                      <div key={service.id} className="flex justify-between items-center p-2 bg-[#5A8621] text-white rounded-md">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm opacity-90">{service.category}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="font-medium">{Number(service.singlePrice).toLocaleString()} RWF</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleServiceToggle(service.id)}
                            className="text-white hover:text-gray-200 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => {
                      setServiceSearch(e.target.value);
                      setShowServiceDropdown(true);
                    }}
                    onFocus={() => setShowServiceDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] bg-white"
                  />
                </div>

                {showServiceDropdown && (
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg">
                    {filteredServices.length > 0 ? (
                      filteredServices.map(service => (
                        <div
                          key={service.id}
                          onClick={() => {
                            handleServiceToggle(service.id);
                            if (!formData.serviceIds.includes(service.id)) {
                              setShowServiceDropdown(false);
                              setServiceSearch('');
                            }
                          }}
                          className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                            formData.serviceIds.includes(service.id) ? 'bg-green-50 border-l-4 border-l-[#5A8621]' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center">
                                {formData.serviceIds.includes(service.id) && <span className="text-[#5A8621] mr-2">✓</span>}
                                {service.name}
                              </div>
                              <div className="text-sm text-gray-600">{service.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{Number(service.singlePrice).toLocaleString()} RWF</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-center">No services found</div>
                    )}
                  </div>
                )}
                {errors.serviceIds && <p className="mt-1 text-sm text-red-600">{errors.serviceIds}</p>}
              </div>

              {/* Staff */}
              <div className="dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Select Staff *
                </label>

                {/* Selected Staff Display */}
                {selectedStaff.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="text-sm text-gray-600">Selected Staff:</div>
                    {selectedStaff.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 bg-[#5A8621] text-white rounded-md">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm opacity-90">{member.role}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStaffToggle(member.id)}
                          className="text-white hover:text-gray-200 text-lg font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Staff Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search staff by name..."
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value);
                      setShowStaffDropdown(true);
                    }}
                    onFocus={() => setShowStaffDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
                  />
                </div>

                {/* Staff Dropdown */}
                {showStaffDropdown && (
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg">
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map(member => (
                        <div
                          key={member.id}
                          onClick={() => {
                            handleStaffToggle(member.id);
                            setStaffSearch('');
                            if (formData.staffIds.length === 0) {
                              setShowStaffDropdown(false);
                            }
                          }}
                          className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium flex items-center">
                                {formData.staffIds.includes(member.id) && <span className="text-[#5A8621] mr-2">✓</span>}
                                {member.name}
                              </div>
                              <div className="text-sm text-gray-600">{member.role}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-center">No staff found</div>
                    )}
                  </div>
                )}
                {errors.staffIds && <p className="mt-1 text-sm text-red-600">{errors.staffIds}</p>}
              </div>
            </div>
          </div>

          {/* Summary */}
          {(selectedCustomer || selectedServices.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Visit Summary</h3>

              {selectedCustomer && (
                <div>
                  <span className="text-sm text-gray-600">Customer: </span>
                  <span className="font-medium">{selectedCustomer.fullName || selectedCustomer.name}</span>
                </div>
              )}

              {selectedServices.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Services: </span>
                  <div className="mt-1 space-y-1">
                    {selectedServices.map(service => (
                      <div key={service.id} className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span>{Number(service.singlePrice).toLocaleString()} RWF</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedStaff.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Staff: </span>
                  <span className="font-medium">{selectedStaff.map(s => s.name).join(', ')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="font-medium">{subtotal.toLocaleString()} RWF</span>
                </div>
                {ownShampooDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Own Shampoo Discount:</span>
                    <span className="font-medium">-{ownShampooDiscount.toLocaleString()} RWF</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Final Total:</span>
                  <span className="font-bold text-[#5A8621]">{finalAmount.toLocaleString()} RWF</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                * Final amount may vary due to additional automatic discounts (6th visit, birthday)
              </p>
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
              {loading ? 'Saving...' : editingSale ? 'Update Sale' : 'Record Sale'}
            </button>
          </div>
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddSalesModal;