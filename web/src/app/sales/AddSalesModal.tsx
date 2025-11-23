"use client"
import React, { useState, useEffect } from 'react';
import { X, Search, User, Scissors, Users, Calendar } from 'lucide-react';
import { Sale, CreateSaleDto, UpdateSaleDto } from '../../services/salesService';
import customersService, { Customer } from '../../services/customersService';
import servicesService, { Service } from '../../services/servicesService';
import staffService, { Staff } from '../../services/staffService';
import MultiSelect from '../../components/MultiSelect';
import CategorizedServiceSelect, { SelectedServiceWithCombo } from '../../components/CategorizedServiceSelect';

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
    saleDate: (() => {
      const now = new Date();
      // Adjust for timezone offset to get local time
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    })(),
    notes: '',
    paymentMethod: 'CASH',
    bringOwnProduct: false,
    addShampoo: false,
    manualDiscountAmount: 0,
    manualDiscountReason: '',
    applyManualDiscount: false
  });

  const [payments, setPayments] = useState([
    { paymentMethod: 'CASH', amount: 0 }
  ]);

  const [serviceShampooOptions, setServiceShampooOptions] = useState<Record<string, boolean>>({});
  const [selectedServices, setSelectedServices] = useState<SelectedServiceWithCombo[]>([]);

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
  const [discountEligibility, setDiscountEligibility] = useState<{
    sixthVisitEligible: boolean;
    isBirthdayMonth: boolean;
    birthdayDiscountAvailable: boolean;
    birthdayDiscountUsed: boolean;
    nextSaleCount: number;
  } | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchServices();
    fetchStaff();
  }, []);

  // Fetch discount eligibility when customer is selected
  useEffect(() => {
    const fetchDiscountEligibility = async () => {
      if (formData.customerId) {
        try {
          const response = await customersService.getDiscountEligibility(formData.customerId);
          setDiscountEligibility(response.data);
        } catch (error) {
          console.error('Failed to fetch discount eligibility:', error);
          setDiscountEligibility(null);
        }
      } else {
        setDiscountEligibility(null);
      }
    };

    fetchDiscountEligibility();
  }, [formData.customerId]);


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

  const handleServiceSelectionChange = (selectedServicesData: SelectedServiceWithCombo[]) => {
    // Update the selectedServices state for CategorizedServiceSelect
    setSelectedServices(selectedServicesData);

    // Extract service IDs for formData compatibility
    const serviceIds = selectedServicesData.map(s => s.serviceId);
    setFormData(prev => ({
      ...prev,
      serviceIds
    }));

    // Clear service errors if services are selected
    if (serviceIds.length > 0 && errors.serviceIds) {
      setErrors(prev => ({ ...prev, serviceIds: '' }));
    }

    // Clean up shampoo options for removed services
    setServiceShampooOptions(prev => {
      const newOptions = { ...prev };
      Object.keys(newOptions).forEach(serviceId => {
        if (!serviceIds.includes(serviceId)) {
          delete newOptions[serviceId];
        }
      });
      return newOptions;
    });
  };

  const handleStaffSelectionChange = (staffIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      staffIds
    }));

    // Clear staff errors if staff are selected
    if (staffIds.length > 0 && errors.staffIds) {
      setErrors(prev => ({ ...prev, staffIds: '' }));
    }
  };

  const handleServiceShampooToggle = (serviceId: string, addShampoo: boolean) => {
    setServiceShampooOptions(prev => ({
      ...prev,
      [serviceId]: addShampoo
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
      // Validate payment amounts
      const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaymentAmount - finalAmount) > 0.01) {
        setSubmitError('Payment amounts must equal the final total');
        setLoading(false);
        return;
      }

      // Validate manual discount reason
      if (formData.applyManualDiscount && !formData.manualDiscountReason.trim()) {
        setSubmitError('Reason for discount is required');
        setLoading(false);
        return;
      }

      const submitData = {
        customerId: formData.customerId,
        serviceIds: formData.serviceIds,
        serviceShampooOptions: serviceShampooOptions,
        staffIds: formData.staffIds,
        saleDate: formData.saleDate,
        notes: formData.notes.trim() || undefined,
        ownShampooDiscount: formData.bringOwnProduct,
        addShampoo: formData.addShampoo,
        payments: payments,
        manualDiscountAmount: formData.applyManualDiscount ? formData.manualDiscountAmount : 0,
        manualDiscountReason: formData.applyManualDiscount ? formData.manualDiscountReason : undefined
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

  // Prepare data for MultiSelect components
  const serviceOptions = services.map(service => ({
    id: service.id,
    name: service.name,
    subtitle: service.category,
    value: `${Number(service.singlePrice).toLocaleString()} RWF`
  }));

  const staffOptions = staff.map(member => ({
    id: member.id,
    name: member.name,
    subtitle: member.role
  }));

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  // Get detailed service information for selected services
  const getSelectedServicesDetails = () => {
    return selectedServices.map(selected => {
      const service = services.find(s => s.id === selected.serviceId);
      return service ? { ...service, isCombined: selected.isCombined } : null;
    }).filter((service): service is Service & { isCombined: boolean } => service !== null);
  };

  const selectedServicesDetails = getSelectedServicesDetails();
  const selectedStaff = staff.filter(s => formData.staffIds.includes(s.id));

  const calculateTotals = () => {
    let subtotal = 0;

    // Calculate service costs with individual shampoo options
    selectedServicesDetails.forEach(service => {
      const hasShampooForThisService = serviceShampooOptions[service.id] || false;

      if (hasShampooForThisService && service.combinedPrice && service.combinedPrice !== service.singlePrice) {
        // Use combined price if shampoo is added for this service and service has combined pricing
        subtotal += Number(service.combinedPrice);
      } else {
        // Use single price
        subtotal += Number(service.singlePrice);
      }
    });

    // When editing, allow discount modifications while preserving current form state
    if (editingSale) {
      // For editing mode, we still want to allow discount changes
      // But we need to preserve existing eligibility from the original sale
      const ownProductDiscount = formData.bringOwnProduct ? 1000 : 0;

      // Check if original sale had automatic discounts - preserve them unless user explicitly changes
      let birthdayDiscount = 0;
      let sixthVisitDiscount = 0;

      // Use discountEligibility if available (user might have refreshed), otherwise infer from original sale
      if (discountEligibility) {
        // User can toggle these discounts even when editing
        if (discountEligibility.birthdayDiscountAvailable) {
          birthdayDiscount = Math.round(subtotal * 0.2);
        }
        if (discountEligibility.sixthVisitEligible) {
          sixthVisitDiscount = Math.round(subtotal * 0.2);
        }
      } else {
        // Fallback: preserve original automatic discounts if no new eligibility data
        if (editingSale.birthMonthDiscount) {
          birthdayDiscount = Math.round(subtotal * 0.2);
        }

        // Check if original sale likely had sixth visit discount
        const originalTotalDiscount = Number(editingSale.discountAmount || 0);
        const originalOwnProductDiscount = editingSale.ownShampooDiscount ? 1000 : 0;
        const originalManualDiscount = editingSale.discounts?.find(d => d.discountRule?.type === 'MANUAL_DISCOUNT')?.discountAmount || 0;
        const originalBirthdayDiscount = editingSale.birthMonthDiscount ? Math.round(Number(editingSale.subtotal || subtotal) * 0.2) : 0;

        const remainingDiscount = originalTotalDiscount - originalOwnProductDiscount - originalBirthdayDiscount - Number(originalManualDiscount);
        if (remainingDiscount > 0) {
          sixthVisitDiscount = Math.round(subtotal * 0.2); // Recalculate based on new subtotal
        }
      }

      // Manual discount is always editable
      const manualDiscount = formData.applyManualDiscount ? Number(formData.manualDiscountAmount) : 0;

      const totalDiscounts = ownProductDiscount + birthdayDiscount + sixthVisitDiscount + manualDiscount;
      const finalAmount = Math.max(0, subtotal - totalDiscounts);

      return {
        subtotal,
        ownProductDiscount,
        birthdayDiscount,
        sixthVisitDiscount,
        manualDiscount,
        finalAmount
      };
    }

    // For new sales, calculate discounts based on eligibility
    const ownProductDiscount = formData.bringOwnProduct ? 1000 : 0;

    // Automatic discounts based on eligibility
    let birthdayDiscount = 0;
    let sixthVisitDiscount = 0;

    if (discountEligibility) {
      // Birthday discount (20%)
      if (discountEligibility.birthdayDiscountAvailable) {
        birthdayDiscount = Math.round(subtotal * 0.2);
      }

      // 6th visit discount (20%)
      if (discountEligibility.sixthVisitEligible) {
        sixthVisitDiscount = Math.round(subtotal * 0.2);
      }
    }

    // Manual discount
    const manualDiscount = formData.applyManualDiscount ? Number(formData.manualDiscountAmount) : 0;

    const totalDiscounts = ownProductDiscount + birthdayDiscount + sixthVisitDiscount + manualDiscount;
    const finalAmount = Math.max(0, subtotal - totalDiscounts);

    return {
      subtotal,
      ownProductDiscount,
      birthdayDiscount,
      sixthVisitDiscount,
      manualDiscount,
      finalAmount
    };
  };

  const { subtotal, ownProductDiscount, birthdayDiscount, sixthVisitDiscount, manualDiscount, finalAmount } = calculateTotals();

  // Populate form data when editing a sale
  useEffect(() => {
    if (editingSale) {
      // Format the date for datetime-local input
      const saleDate = new Date(editingSale.saleDate);
      saleDate.setMinutes(saleDate.getMinutes() - saleDate.getTimezoneOffset());

      // Extract manual discount from discounts array
      let manualDiscountAmount = 0;
      let manualDiscountReason = '';
      let hasManualDiscount = false;

      if (editingSale.discounts && Array.isArray(editingSale.discounts)) {
        // Look for manual discounts with type 'MANUAL_DISCOUNT'
        const manualDiscount = editingSale.discounts.find(discount =>
          discount.discountRule && discount.discountRule.type === 'MANUAL_DISCOUNT'
        );

        if (manualDiscount) {
          manualDiscountAmount = Number(manualDiscount.discountAmount || 0);
          // Use the description field which contains the user's custom reason
          manualDiscountReason = manualDiscount.discountRule.description || '';
          hasManualDiscount = true;
        }
      }

      // Check for "bring own product" discount
      const bringOwnProduct = editingSale.ownShampooDiscount || (
        editingSale.discounts &&
        editingSale.discounts.some(d => d.discountRule?.type === 'BRING_OWN_PRODUCT')
      );

      setFormData({
        customerId: editingSale.customerId || '',
        serviceIds: editingSale.services?.map(s => s.serviceId) || [],
        staffIds: editingSale.staff?.map(s => s.staffId) || [],
        saleDate: saleDate.toISOString().slice(0, 16),
        notes: editingSale.notes || '',
        paymentMethod: 'CASH', // Will be overridden by payments array
        bringOwnProduct: bringOwnProduct,
        addShampoo: false, // TODO: Add this to sale model if needed
        manualDiscountAmount: manualDiscountAmount,
        manualDiscountReason: manualDiscountReason,
        applyManualDiscount: hasManualDiscount
      });

      // Set selected services
      if (editingSale.services) {
        const serviceSelections: SelectedServiceWithCombo[] = editingSale.services.map(ss => ({
          serviceId: ss.serviceId,
          isChild: ss.isChild,
          isCombined: ss.isCombined,
          quantity: ss.quantity,
          addShampoo: ss.isCombined || false
        }));
        setSelectedServices(serviceSelections);

        // Initialize shampoo options based on existing sale
        const shampooOptions: Record<string, boolean> = {};
        editingSale.services.forEach(s => {
          shampooOptions[s.serviceId] = s.isCombined || false;
        });
        setServiceShampooOptions(shampooOptions);
      }

      // Set payments - use actual payments array from backend if available
      if (editingSale.payments && Array.isArray(editingSale.payments) && editingSale.payments.length > 0) {
        // Use the actual payments from the backend
        setPayments(editingSale.payments.map(payment => ({
          paymentMethod: payment.paymentMethod,
          amount: Number(payment.amount)
        })));
      } else if (editingSale.paymentMethod && editingSale.finalAmount) {
        // Fallback to single payment for backward compatibility
        setPayments([{
          paymentMethod: editingSale.paymentMethod as any,
          amount: Number(editingSale.finalAmount)
        }]);
      }
    }
  }, [editingSale]);

  // Update payment amounts when final amount changes
  useEffect(() => {
    if (!editingSale) { // Don't auto-update when editing
      setPayments(prev => {
        if (prev.length === 1) {
          return [{ ...prev[0], amount: finalAmount }];
        }
        return prev;
      });
    }
  }, [finalAmount, editingSale]);

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
              <div className="customer-dropdown-container dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Select Customer *
                </label>

                {/* Selected Customer Display */}
                {selectedCustomer ? (
                  <div className="mb-3">
                    <div className="inline-flex items-center text-sm rounded-lg px-4 py-2 bg-[#5A8621] text-white">
                      <div className="flex flex-col">
                        <div className="font-medium flex items-center">
                          {selectedCustomer.fullName || selectedCustomer.name}
                          {selectedCustomer.isDependent && (
                            <span className="ml-2 px-2 py-1 text-xs bg-white bg-opacity-20 rounded-full">
                              Dependent
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-90">
                          {selectedCustomer.phone || (selectedCustomer.isDependent ? 'Via parent' : 'No phone')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, customerId: '' }));
                          setCustomerSearch('');
                          setShowCustomerDropdown(true);
                        }}
                        className="ml-3 rounded-full p-1 hover:bg-white hover:bg-opacity-30 transition-colors"
                        title="Change customer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] bg-white"
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
                                // Clear customer errors when customer is selected
                                if (errors.customerId) {
                                  setErrors(prev => ({ ...prev, customerId: '' }));
                                }
                              }}
                              className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium flex items-center">
                                    {customer.fullName || customer.name}
                                    {customer.isDependent && (
                                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                        Dependent
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {customer.phone || (customer.isDependent ? 'Via parent' : 'No phone')}
                                  </div>
                                </div>
                              </div>
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

              {/* Sale Date & Time - Auto-generated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Sale Date & Time
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {new Date(formData.saleDate).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })} (Auto-generated)
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Methods *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPayments([...payments, { paymentMethod: 'CASH', amount: 0 }])}
                    className="text-sm text-[#5A8621] hover:text-[#4a7219]"
                  >
                    + Add Payment
                  </button>
                </div>

                {payments.map((payment, index) => (
                  <div key={index} className="flex space-x-2">
                    <select
                      value={payment.paymentMethod}
                      onChange={(e) => {
                        const newPayments = [...payments];
                        newPayments[index].paymentMethod = e.target.value as any;
                        setPayments(newPayments);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="BANK_CARD">Bank Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={payment.amount}
                      onChange={(e) => {
                        const newPayments = [...payments];
                        newPayments[index].amount = Number(e.target.value);
                        setPayments(newPayments);
                      }}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                    />
                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                        className="px-2 py-2 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <div className="text-xs text-gray-500">
                  Total: {payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} RWF
                  {Math.abs(payments.reduce((sum, p) => sum + p.amount, 0) - finalAmount) > 0.01 && (
                    <span className="text-red-600 ml-2">
                      (Must equal {finalAmount.toLocaleString()} RWF)
                    </span>
                  )}
                </div>
              </div>

              {/* Bring Own Shampoo */}
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="bringOwnProduct"
                    checked={formData.bringOwnProduct}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Customer brought their own product (-1,000 RWF)
                  </label>
                </div>
              </div>

              {/* Existing Discounts (when editing) */}
              {editingSale && editingSale.discounts && editingSale.discounts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Applied Discounts:</h4>
                  <div className="space-y-1">
                    {editingSale.discounts.map((discount, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-blue-800">
                          {discount.discountRule?.type === 'MANUAL_DISCOUNT' ? 'Manual Discount' :
                           discount.discountRule?.type === 'SIXTH_VISIT' ? 'Sixth Visit Discount' :
                           discount.discountRule?.type === 'BRING_OWN_PRODUCT' ? 'Bring Own Product' :
                           discount.discountRule?.type === 'BIRTHDAY_MONTH' ? 'Birthday Month Discount' :
                           discount.discountRule?.description || discount.discountRule?.type}
                          {discount.discountRule?.type === 'MANUAL_DISCOUNT' && discount.discountRule?.description &&
                            ` (${discount.discountRule.description})`
                          }
                        </span>
                        <span className="text-blue-900 font-medium">-{Number(discount.discountAmount || 0).toLocaleString()} RWF</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Discount */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.applyManualDiscount}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        applyManualDiscount: e.target.checked,
                        manualDiscountAmount: e.target.checked ? formData.manualDiscountAmount : 0
                      });
                    }}
                    className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Apply manual discount
                  </label>
                </div>

                {formData.applyManualDiscount && (
                  <div className="ml-6 space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Discount Amount (RWF)</label>
                      <input
                        type="number"
                        value={formData.manualDiscountAmount}
                        onChange={(e) => {
                          setFormData({ ...formData, manualDiscountAmount: Number(e.target.value) });
                        }}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Reason for Discount *</label>
                      <input
                        type="text"
                        value={formData.manualDiscountReason}
                        onChange={(e) => {
                          setFormData({ ...formData, manualDiscountReason: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                        placeholder="e.g., VIP customer, promotional offer"
                        required
                      />
                    </div>
                  </div>
                )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                  placeholder="Any additional notes about the sale..."
                />
              </div>
            </div>

            {/* Services and Staff Selection */}
            <div className="space-y-4">
              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scissors className="inline h-4 w-4 mr-1" />
                  Select Services *
                </label>
                <CategorizedServiceSelect
                  services={services}
                  selectedServices={selectedServices}
                  onSelectionChange={handleServiceSelectionChange}
                  placeholder="Select services..."
                  error={errors.serviceIds}
                />

                {/* Individual Service Shampoo Options */}
                {selectedServicesDetails.length > 0 && selectedServicesDetails.some(service => service.combinedPrice && service.combinedPrice !== service.singlePrice) && (
                  <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Add Shampoo to Services</h4>
                    <div className="space-y-3">
                      {selectedServicesDetails.map(service => {
                        // Only show shampoo option if the service has combined pricing
                        if (!service.combinedPrice || service.combinedPrice === service.singlePrice) {
                          return null;
                        }

                        const hasShampoo = serviceShampooOptions[service.id] || false;
                        const savings = Number(service.singlePrice) + 9000 - Number(service.combinedPrice);

                        return (
                          <div key={service.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{service.name}</div>
                              <div className="text-xs text-gray-500">
                                Regular: {Number(service.singlePrice).toLocaleString()} RWF + 9,000 RWF (Shampoo) = {(Number(service.singlePrice) + 9000).toLocaleString()} RWF
                              </div>
                              <div className="text-xs text-green-600">
                                With shampoo: {Number(service.combinedPrice).toLocaleString()} RWF (Save {savings.toLocaleString()} RWF)
                              </div>
                            </div>
                            <label className="flex items-center cursor-pointer ml-4">
                              <input
                                type="checkbox"
                                checked={hasShampoo}
                                onChange={(e) => handleServiceShampooToggle(service.id, e.target.checked)}
                                className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm font-medium">Add Shampoo</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Staff */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Select Staff *
                </label>
                <MultiSelect
                  options={staffOptions}
                  selectedIds={formData.staffIds}
                  onSelectionChange={handleStaffSelectionChange}
                  placeholder="Select staff..."
                  searchPlaceholder="Search staff by name..."
                  emptyStateText="No staff found"
                  error={errors.staffIds}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {(selectedCustomer || selectedServicesDetails.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Visit Summary</h3>

              {selectedCustomer && (
                <div>
                  <span className="text-sm text-gray-600">Customer: </span>
                  <span className="font-medium">{selectedCustomer.fullName || selectedCustomer.name}</span>
                </div>
              )}

              {selectedServicesDetails.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Services: </span>
                  <div className="mt-1 space-y-1">
                    {selectedServicesDetails.map(service => {
                      const hasShampooForThisService = serviceShampooOptions[service.id] || false;
                      const useCombined = hasShampooForThisService && service.combinedPrice && service.combinedPrice !== service.singlePrice;
                      const price = useCombined ? Number(service.combinedPrice) : Number(service.singlePrice);
                      return (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span>
                            {service.name}
                            {useCombined && <span className="text-xs text-green-600 ml-1">(with Shampoo)</span>}
                          </span>
                          <span>{price.toLocaleString()} RWF</span>
                        </div>
                      );
                    })}
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

                {ownProductDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Own Product Discount:</span>
                    <span className="font-medium">-{ownProductDiscount.toLocaleString()} RWF</span>
                  </div>
                )}

                {birthdayDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Birthday Month Discount (20%):</span>
                    <span className="font-medium">-{birthdayDiscount.toLocaleString()} RWF</span>
                  </div>
                )}

                {sixthVisitDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">6th Visit Discount (20%):</span>
                    <span className="font-medium">-{sixthVisitDiscount.toLocaleString()} RWF</span>
                  </div>
                )}

                {manualDiscount > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span className="text-sm">Manual Discount:</span>
                    <span className="font-medium">-{manualDiscount.toLocaleString()} RWF</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Final Total:</span>
                  <span className="font-bold text-[#5A8621]">{finalAmount.toLocaleString()} RWF</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                {discountEligibility ? (
                  <div>
                    <p>* Discount eligibility for this sale:</p>
                    <ul className="ml-4 space-y-1">
                      {discountEligibility.sixthVisitEligible && (
                        <li className="text-green-600">• 6th visit discount (20%) - Sale #{discountEligibility.nextSaleCount}</li>
                      )}
                      {discountEligibility.birthdayDiscountAvailable && (
                        <li className="text-green-600">• Birthday month discount (20%) available</li>
                      )}
                      {discountEligibility.isBirthdayMonth && discountEligibility.birthdayDiscountUsed && (
                        <li className="text-orange-600">• Birthday discount already used this month</li>
                      )}
                      {!discountEligibility.sixthVisitEligible && !discountEligibility.isBirthdayMonth && (
                        <li className="text-gray-500">• No automatic discounts apply to this sale</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <p>* Final amount may vary due to additional automatic discounts</p>
                )}
              </div>
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