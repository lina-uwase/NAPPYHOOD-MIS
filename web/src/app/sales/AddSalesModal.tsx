"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, User, Scissors, Users, Calendar, Package } from 'lucide-react';
import { Sale, CreateSaleDto, UpdateSaleDto, SaleDiscount } from '../../services/salesService';
import discountService, { DiscountRule } from '../../services/discountService';
import customersService, { Customer } from '../../services/customersService';
import servicesService, { Service } from '../../services/servicesService';
import staffService, { Staff } from '../../services/staffService';
import productsService, { Product } from '../../services/productsService';
import CategorizedServiceSelect, { SelectedServiceWithCombo } from '../../components/CategorizedServiceSelect';
import CustomStaffSelect, { StaffOption, CustomStaff } from '../../components/CustomStaffSelect';
import ProductSelect from '../../components/ProductSelect';
import AddCustomerModal from '../customers/AddCustomerModal';
import { CreateCustomerDto } from '../../services/customersService';
import PhoneInput from '../../components/PhoneInput';

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
    productIds: [] as string[],
    productQuantities: {} as Record<string, number | undefined>,
    staffIds: [] as string[],
    customStaffNames: [] as string[],
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
    applyManualDiscount: false,
    manualIncrementAmount: 0,
    manualIncrementReason: '',
    applyManualIncrement: false
  });

  const [payments, setPayments] = useState([
    { paymentMethod: 'MOMO', amount: 0 }
  ]);

  const [serviceShampooOptions, setServiceShampooOptions] = useState<Record<string, boolean>>({});
  const [selectedServices, setSelectedServices] = useState<SelectedServiceWithCombo[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<(StaffOption | CustomStaff)[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [isQuickAddMode, setIsQuickAddMode] = useState(false);
  const [showKidsServices, setShowKidsServices] = useState(false);
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

  const [activeDiscounts, setActiveDiscounts] = useState<DiscountRule[]>([]);

  // Quick Customer Add State
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [showQuickInput, setShowQuickInput] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchServices();
    fetchProducts();
    fetchStaff();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsService.getAll(true); // Only active products
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  // Re-fetch services when toggle changes to ensure fresh data
  useEffect(() => {
    if (services.length === 0) {
      fetchServices();
    }
  }, [showKidsServices]);

  // Fetch active discounts
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await discountService.getAll();
        const allDiscounts = response.data || [];
        // Filter for active and date-valid discounts
        const now = new Date();
        const active = allDiscounts.filter(d => {
          if (!d.isActive) return false;
          if (d.startDate && new Date(d.startDate) > now) return false;
          if (d.endDate) {
            const endDate = new Date(d.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (endDate < now) return false;
          }
          return true;
        });
        setActiveDiscounts(active);
      } catch (error) {
        console.error('Failed to fetch discounts:', error);
      }
    };
    fetchDiscounts();
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


  // Auto-switch to quick input when products are selected and no customer is selected
  useEffect(() => {
    if (formData.productIds.length > 0 && !formData.customerId && !editingSale) {
      setShowQuickInput(true);
    }
  }, [formData.productIds, formData.customerId, editingSale]);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    try {
      // Fetch all active customers without pagination limit
      const response = await customersService.getAll({ limit: 10000, isActive: true });
      const customersData = Array.isArray(response.data) ? response.data : [];

      console.log('📋 Fetched customers for sale:', {
        total: customersData.length,
        sample: customersData.slice(0, 3).map(c => ({
          name: c.fullName || c.name,
          phone: c.phone,
          isActive: c.isActive
        }))
      });

      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const fetchServices = async () => {
    try {
      // First try to fetch active services
      let response = await servicesService.getAll({ limit: 1000, isActive: true });
      console.log('🔍 Full API Response (active):', response);
      console.log('🔍 Response data type:', typeof response.data, Array.isArray(response.data));

      let servicesData = Array.isArray(response.data) ? response.data : [];

      // If no active services found, try fetching all services (including inactive)
      if (servicesData.length === 0) {
        console.warn('⚠️ No active services found, trying to fetch all services...');
        response = await servicesService.getAll({ limit: 1000 });
        servicesData = Array.isArray(response.data) ? response.data : [];
      }

      console.log('Fetched services:', {
        total: servicesData.length,
        categories: [...new Set(servicesData.map((s: Service) => s.category))],
        kidsServices: servicesData.filter((s: Service) => s.category === 'KIDS_SERVICES').length,
        sampleService: servicesData[0] || null,
        allServiceNames: servicesData.slice(0, 5).map((s: Service) => s.name)
      });

      if (servicesData.length === 0) {
        console.error('❌ No services found in database! Please seed services.');
        setSubmitError('No services available. Please ensure services are seeded in the database.');
      }

      setServices(servicesData);
    } catch (error: any) {
      console.error('❌ Failed to fetch services:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setServices([]);
      setSubmitError(`Failed to load services: ${error.message || 'Unknown error'}`);
    }
  };

  // Filter services based on kids/adults toggle
  const filteredServices = useMemo(() => {
    console.log('🔍 Filtering services:', {
      showKidsServices,
      totalServices: services.length,
      serviceCategories: [...new Set(services.map(s => s.category))]
    });

    if (showKidsServices) {
      // Show only kids services
      const kidsServices = services.filter(service => {
        const matches = service.category === 'KIDS_SERVICES';
        // Only log mismatches when we're looking for kids services to reduce noise
        return matches;
      });
      console.log('Kids services filter:', {
        totalServices: services.length,
        kidsServicesCount: kidsServices.length,
        allCategories: [...new Set(services.map(s => s.category))],
        kidsServicesNames: kidsServices.map(s => s.name)
      });
      return kidsServices;
    } else {
      // Show all services except kids services
      const adultServices = services.filter(service => {
        // If category is undefined or null, include it (for backward compatibility)
        if (!service.category) {
          return true;
        }
        return service.category !== 'KIDS_SERVICES';
      });
      console.log('Adult services filter:', {
        totalServices: services.length,
        adultServicesCount: adultServices.length,
        excludedKids: services.filter(s => s.category === 'KIDS_SERVICES').length,
        allCategories: [...new Set(services.map(s => s.category))]
      });

      // If filtering removed all services, show all services (fallback)
      if (adultServices.length === 0 && services.length > 0) {
        console.warn('⚠️ Filtering removed all services, showing all services as fallback');
        console.warn('⚠️ This might indicate a category issue. Showing all services.');
        return services;
      }

      return adultServices;
    }
  }, [services, showKidsServices]);

  const fetchStaff = async () => {
    try {
      // Fetch all staff (including inactive) for sales recording
      const response = await staffService.getAll();
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const handleCreateCustomer = async (data: any) => {
    try {
      // The AddCustomerModal calls this with the form data
      // We need to call the API to create the customer
      const response = await customersService.create(data);

      if (response.success && response.data) {
        // Add new customer to the list
        setCustomers(prev => [response.data, ...prev]);

        // Select the new customer
        setFormData(prev => ({ ...prev, customerId: response.data.id }));

        // Close the modal
        setShowAddCustomerModal(false);

        // Reset search
        setCustomerSearch('');
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error; // Propagate to modal to show error
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


  const handleServiceSelectionChange = (selectedServicesData: SelectedServiceWithCombo[]) => {
    try {
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
    } catch (error) {
      console.error('Error in handleServiceSelectionChange:', error);
    }
  };

  const handleStaffSelectionChange = (staffList: (StaffOption | CustomStaff)[]) => {
    setSelectedStaff(staffList);

    // Extract staff IDs for form data (only system staff have real IDs)
    const staffIds = staffList.filter(s => !('isCustom' in s)).map(s => s.id);
    // Extract custom staff names for form data
    const customStaffNames = staffList.filter(s => 'isCustom' in s && s.isCustom).map(s => s.name);

    setFormData(prev => ({
      ...prev,
      staffIds,
      customStaffNames
    }));

    // Clear staff errors if staff are selected
    if (staffList.length > 0 && errors.staffIds) {
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

    if (!formData.customerId && !showQuickInput) {
      newErrors.customerId = 'Please select a customer';
    }

    if (showQuickInput && !quickCustomerName) {
      newErrors.customerId = 'Customer Name is required';
    }

    // Allow either services OR products (or both)
    if (formData.serviceIds.length === 0 && formData.productIds.length === 0) {
      newErrors.serviceIds = 'Please select at least one service or product';
    }

    // Validate product quantities
    formData.productIds.forEach(productId => {
      const quantity = formData.productQuantities[productId];
      const product = products.find(p => p.id === productId);
      if (!quantity || quantity <= 0) {
        newErrors[`product_${productId}`] = 'Quantity must be greater than 0';
      } else if (product && quantity > product.quantity) {
        newErrors[`product_${productId}`] = `Only ${product.quantity} available in stock`;
      }
    });

    if (selectedStaff.length === 0) {
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

      if (formData.applyManualIncrement && !formData.manualIncrementReason.trim()) {
        setSubmitError('Reason for increment is required');
        setLoading(false);
        return;
      }

      // Handle Quick Customer Creation
      let finalCustomerId = formData.customerId;

      if (showQuickInput && !finalCustomerId) {
        if (!quickCustomerName.trim()) {
          setSubmitError('Customer name is required');
          setLoading(false);
          return;
        }

        try {
          // Check if customer exists by phone first (if phone provided)
          if (quickCustomerPhone.trim()) {
            const existingCustomer = customers.find(c =>
              c.phone && normalizePhone(c.phone) === normalizePhone(quickCustomerPhone)
            );

            if (existingCustomer) {
              // Use existing customer
              finalCustomerId = existingCustomer.id;
              console.log('✅ Found existing customer by phone:', existingCustomer.fullName);
            }
          }

          // If still no customer ID, create new one
          if (!finalCustomerId) {
            const newCustomerData: CreateCustomerDto = {
              fullName: quickCustomerName,
              gender: 'OTHER', // Default for quick add
              phone: quickCustomerPhone || undefined,
              // Default required fields
              isDependent: false,
              location: 'Kigali',
              district: 'Gasabo',
              province: 'Kigali City',
              saleCount: 0
            };

            const response = await customersService.create(newCustomerData);
            if (response.success && response.data) {
              finalCustomerId = response.data.id;
              // Add to local list to reflect immediately
              setCustomers(prev => [response.data, ...prev]);
            } else {
              throw new Error('Failed to create quick customer');
            }
          }
        } catch (error: any) {
          console.error('Quick customer creation failed:', error);
          // If error is about phone uniqueness, try to find the customer again (backend might have caught it)
          if (error.response?.data?.error?.includes('already exists')) {
            setSubmitError(`Customer with this phone likely already exists. Please search for them instead.`);
          } else {
            setSubmitError(`Failed to create customer: ${error.message || 'Unknown error'}`);
          }
          setLoading(false);
          return;
        }
      }

      if (!finalCustomerId) {
        setSubmitError('Please select or create a customer');
        setLoading(false);
        return;
      }

      // Prepare staff data for submission
      const submitStaffData = {
        staffIds: selectedStaff.filter(s => !('isCustom' in s)).map(s => s.id),
        customStaffNames: selectedStaff.filter(s => 'isCustom' in s && s.isCustom).map(s => s.name)
      };

      // Prepare products data
      const productsData = formData.productIds.map(productId => {
        const quantity = formData.productQuantities[productId];
        // Validation already ensures quantity > 0, but add safety check
        if (!quantity || quantity <= 0) {
          throw new Error(`Product quantity must be greater than 0`);
        }
        return {
          productId,
          quantity: quantity
        };
      });

      const submitData = {
        customerId: finalCustomerId,
        serviceIds: formData.serviceIds.length > 0 ? formData.serviceIds : undefined,
        products: productsData.length > 0 ? productsData : undefined,
        serviceShampooOptions: serviceShampooOptions,
        staffIds: submitStaffData.staffIds,
        customStaffNames: submitStaffData.customStaffNames,
        saleDate: formData.saleDate,
        notes: formData.notes.trim() || undefined,
        ownShampooDiscount: formData.bringOwnProduct,
        addShampoo: formData.addShampoo,
        payments: payments,
        manualDiscountAmount: formData.applyManualDiscount ? Number(formData.manualDiscountAmount) : 0,
        manualDiscountReason: formData.applyManualDiscount ? (formData.manualDiscountReason?.trim() || undefined) : undefined,
        manualIncrementAmount: formData.applyManualIncrement ? Number(formData.manualIncrementAmount) : 0,
        manualIncrementReason: formData.applyManualIncrement ? (formData.manualIncrementReason?.trim() || undefined) : undefined
      };

      console.log('📤 SUBMITTING SALE DATA:', {
        applyManualIncrement: formData.applyManualIncrement,
        manualIncrementAmount: submitData.manualIncrementAmount,
        manualIncrementReason: submitData.manualIncrementReason,
        payments: submitData.payments,
        paymentsTotal: submitData.payments?.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
      });

      await onSubmit(submitData);
      onClose();
    } catch (error: any) {
      console.error('Failed to submit sale:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to record sale. Please try again.';
      console.error('Backend error message:', errorMessage);
      console.error('Full error response:', error.response?.data);
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Normalize phone number for searching (more flexible matching)
  const normalizePhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    // Remove all non-digit characters
    let normalized = phone.replace(/[^\d]/g, '');
    // Remove leading zeros
    normalized = normalized.replace(/^0+/, '');
    return normalized;
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase().trim();
    if (!searchLower) return true; // Show all if search is empty

    // Search by name (case-insensitive) - check both fullName and name
    const fullName = (customer.fullName || '').toLowerCase();
    const name = (customer.name || '').toLowerCase();
    const nameMatch = fullName.includes(searchLower) || name.includes(searchLower);

    // Search by phone - multiple matching strategies
    if (customer.phone) {
      const customerPhone = customer.phone.toLowerCase().trim();
      const searchTerm = customerSearch.trim();

      // Strategy 1: Direct string match (case-insensitive)
      const directMatch = customerPhone.includes(searchTerm.toLowerCase());

      // Strategy 2: Normalized phone match (removes spaces, dashes, country codes)
      const customerPhoneNormalized = normalizePhone(customer.phone);
      const searchPhoneNormalized = normalizePhone(searchTerm);
      const normalizedMatch = customerPhoneNormalized && searchPhoneNormalized &&
        (customerPhoneNormalized.includes(searchPhoneNormalized) ||
          searchPhoneNormalized.includes(customerPhoneNormalized));

      // Strategy 3: Last N digits match (for partial phone searches)
      const lastDigitsMatch = customerPhoneNormalized && searchPhoneNormalized &&
        customerPhoneNormalized.length >= searchPhoneNormalized.length &&
        customerPhoneNormalized.slice(-searchPhoneNormalized.length) === searchPhoneNormalized;

      // Strategy 4: Exact match after normalization
      const exactNormalizedMatch = customerPhoneNormalized === searchPhoneNormalized;

      const phoneMatch = directMatch || normalizedMatch || lastDigitsMatch || exactNormalizedMatch;

      return nameMatch || phoneMatch;
    }

    return nameMatch;
  });

  const staffOptions: StaffOption[] = staff.map(member => ({
    id: member.id,
    name: member.name,
    role: member.role
  }));

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  // Memoize selected services details to prevent infinite re-renders
  const selectedServicesDetails = useMemo(() => {
    return selectedServices.map(selected => {
      const service = services.find(s => s.id === selected.serviceId);
      return service ? { ...service, isCombined: selected.isCombined } : null;
    }).filter((service): service is Service & { isCombined: boolean } => service !== null);
  }, [selectedServices, services]);

  const calculateTotals = () => {
    try {
      let subtotal = 0;

      // Calculate service costs with individual shampoo options
      selectedServicesDetails.forEach(service => {
        const hasShampooForThisService = serviceShampooOptions[service.id] || false;

        if (hasShampooForThisService && service.combinedPrice && service.combinedPrice !== service.singlePrice) {
          // Use combined price if shampoo is added for this service and service has combined pricing
          subtotal += Number(service.combinedPrice) || 0;
        } else {
          // Use single price
          subtotal += Number(service.singlePrice) || 0;
        }
      });

      // Calculate product costs
      formData.productIds.forEach(productId => {
        const product = products.find(p => p.id === productId);
        const quantity = formData.productQuantities[productId] || 1; // Default to 1 for calculation if not set
        if (product && quantity > 0) {
          subtotal += Number(product.price) * quantity;
        }
      });

      // When editing, preserve original discount structure
      if (editingSale) {
        // Get original amounts from the sale
        // Backend returns totalAmount, frontend interface uses subtotal - check both
        const originalSubtotal = Number((editingSale as any).totalAmount || editingSale.subtotal || subtotal);
        const originalFinalAmount = Number(editingSale.finalAmount || 0);
        const calculatedSubtotal = subtotal;

        // Extract discount amounts from existing discounts
        let ownProductDiscount = 0;
        let birthdayDiscount = 0;
        let sixthVisitDiscount = 0;
        let originalManualDiscount = 0;
        let promotionalDiscount = 0;

        if (editingSale.discounts && Array.isArray(editingSale.discounts)) {
          editingSale.discounts.forEach((d: SaleDiscount) => {
            const amount = Number(d.discountAmount || 0);
            const type = d.discountRule?.type;

            if (type === 'BRING_OWN_PRODUCT') {
              ownProductDiscount = amount;
            } else if (type === 'BIRTHDAY_MONTH') {
              birthdayDiscount = amount;
            } else if (type === 'SIXTH_VISIT') {
              sixthVisitDiscount = amount;
            } else if (type === 'MANUAL_DISCOUNT') {
              originalManualDiscount = amount;
            } else {
              promotionalDiscount += amount;
            }
          });
        } else {
          // Fallback: calculate from original sale fields
          if (editingSale.ownShampooDiscount) {
            ownProductDiscount = 1000;
          }
          if (editingSale.birthMonthDiscount) {
            birthdayDiscount = Math.round(originalSubtotal * 0.2);
          }
        }

        // Manual discount - use form data if changed, otherwise use original
        const manualDiscount = formData.applyManualDiscount
          ? Number(formData.manualDiscountAmount)
          : originalManualDiscount;

        // Manual increment - check formData first, then extract from notes
        let manualIncrement = 0;
        if (formData.applyManualIncrement && formData.manualIncrementAmount > 0) {
          // Use form data if user changed it
          manualIncrement = Number(formData.manualIncrementAmount);
        } else {
          // Extract from notes if formData doesn't have it yet
          if (editingSale.notes) {
            const incrementMatch = editingSale.notes.match(/\[Manual Increment:\s*(\d+)\s*RWF\s*-\s*([^\]]+?)\]/);
            if (incrementMatch) {
              manualIncrement = Number(incrementMatch[1]) || 0;
            }
          }
        }

        // Calculate final amount: subtotal - discounts + increment
        const totalDiscounts = ownProductDiscount + birthdayDiscount + sixthVisitDiscount + manualDiscount + promotionalDiscount;
        const finalAmount = Math.max(0, calculatedSubtotal - totalDiscounts + manualIncrement);

        console.log('💰 Editing sale totals calculation:', {
          originalSubtotal,
          calculatedSubtotal,
          ownProductDiscount,
          birthdayDiscount,
          sixthVisitDiscount,
          manualDiscount,
          originalManualDiscount,
          manualIncrement,
          totalDiscounts,
          finalAmount,
          formDataApplyManualIncrement: formData.applyManualIncrement,
          formDataManualIncrementAmount: formData.manualIncrementAmount,
          notes: editingSale.notes
        });

        return {
          subtotal: calculatedSubtotal,
          ownProductDiscount,
          birthdayDiscount,
          sixthVisitDiscount,
          manualDiscount,
          promotionalDiscount,
          manualIncrement: manualIncrement || 0,
          finalAmount
        };
      }

      // For new sales, calculate discounts based on eligibility
      const ownProductDiscount = formData.bringOwnProduct ? 1000 : 0;

      // Automatic discounts based on eligibility
      let birthdayDiscount = 0;
      let sixthVisitDiscount = 0;
      let promotionalDiscount = 0;

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

      // Apply Configurable Discounts (Promotional, Seasonal, etc.)
      activeDiscounts.forEach(discount => {
        let discountVal = 0;

        if (discount.applyToAllServices) {
          if (discount.isPercentage) {
            discountVal = subtotal * (Number(discount.value) / 100);
          } else {
            discountVal = Number(discount.value);
          }
        } else if (discount.serviceIds && discount.serviceIds.length > 0) {
          // Calculate discount for specific services
          selectedServicesDetails.forEach(s => {
            if (discount.serviceIds!.includes(s.id)) {
              // Determine price of this service instance
              let price = Number(s.singlePrice) || 0;
              if ((serviceShampooOptions[s.id] || false) && s.combinedPrice) {
                price = Number(s.combinedPrice) || 0;
              }

              if (discount.isPercentage) {
                discountVal += price * (Number(discount.value) / 100);
              } else {
                discountVal += Number(discount.value); // Assuming flat discount per service instance
              }
            }
          });
        }
        promotionalDiscount += discountVal;
      });

      // Manual discount
      const manualDiscount = formData.applyManualDiscount ? Number(formData.manualDiscountAmount) : 0;

      // Manual increment (add money to total)
      const manualIncrement = formData.applyManualIncrement ? Number(formData.manualIncrementAmount) : 0;

      const totalDiscounts = ownProductDiscount + birthdayDiscount + sixthVisitDiscount + manualDiscount + promotionalDiscount;
      const finalAmount = Math.max(0, subtotal - totalDiscounts + manualIncrement);

      return {
        subtotal,
        ownProductDiscount,
        birthdayDiscount,
        sixthVisitDiscount,
        promotionalDiscount,
        manualDiscount,
        manualIncrement: manualIncrement || 0,
        finalAmount
      };
    } catch (error) {
      console.error('Error in calculateTotals:', error);
      return {
        subtotal: 0,
        ownProductDiscount: 0,
        birthdayDiscount: 0,
        promotionalDiscount: 0,
        sixthVisitDiscount: 0,
        manualDiscount: 0,
        manualIncrement: 0,
        finalAmount: 0
      };
    }
  };

  const { subtotal, ownProductDiscount, birthdayDiscount, sixthVisitDiscount, promotionalDiscount, manualDiscount, manualIncrement = 0, finalAmount } = calculateTotals();

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
        const manualDiscount = editingSale.discounts.find((discount: SaleDiscount) =>
          discount.discountRule && discount.discountRule.type === 'MANUAL_DISCOUNT'
        );

        if (manualDiscount) {
          manualDiscountAmount = Number(manualDiscount.discountAmount || 0);
          // Use the description field which contains the user's custom reason
          manualDiscountReason = manualDiscount.discountRule?.description || '';
          hasManualDiscount = true;
        }
      }

      // Extract manual increment from notes
      let manualIncrementAmount = 0;
      let manualIncrementReason = '';
      let hasManualIncrement = false;

      if (editingSale.notes) {
        // Parse notes for manual increment: [Manual Increment: 700 RWF - reason]
        // Handle both single line and multi-line notes
        const incrementMatch = editingSale.notes.match(/\[Manual Increment:\s*(\d+)\s*RWF\s*-\s*([^\]]+?)\]/);
        if (incrementMatch) {
          manualIncrementAmount = Number(incrementMatch[1]) || 0;
          manualIncrementReason = incrementMatch[2]?.trim() || '';
          hasManualIncrement = manualIncrementAmount > 0 && manualIncrementReason.length > 0;
          console.log('🔍 Extracted manual increment from notes:', {
            notes: editingSale.notes,
            match: incrementMatch,
            amount: manualIncrementAmount,
            reason: manualIncrementReason,
            hasManualIncrement
          });
        } else {
          console.log('⚠️ No manual increment found in notes:', editingSale.notes);
        }
      }

      // Check for "bring own product" discount
      const bringOwnProduct = editingSale.ownShampooDiscount || (
        editingSale.discounts &&
        editingSale.discounts.some((d: SaleDiscount) => d.discountRule?.type === 'BRING_OWN_PRODUCT')
      );

      // Extract staff IDs and custom staff names for editing
      // Note: This is just for formData, actual staff selection is handled in separate useEffect
      const systemStaffIds: string[] = [];
      const customStaffNames: string[] = [];

      if (editingSale.staff) {
        editingSale.staff.forEach((saleStaff: any) => {
          const staffId = saleStaff.staffId || saleStaff.staff?.id;
          if (staffId) {
            systemStaffIds.push(staffId);
          } else if (saleStaff.customName) {
            customStaffNames.push(saleStaff.customName);
          }
        });
      }

      // Load products from editingSale
      const productIds: string[] = [];
      const productQuantities: Record<string, number | undefined> = {};
      const saleProducts = (editingSale as any).products;
      if (saleProducts && Array.isArray(saleProducts)) {
        saleProducts.forEach((saleProduct: any) => {
          const productId = saleProduct.productId || saleProduct.product?.id;
          const quantity = saleProduct.quantity || 1;
          if (productId && quantity > 0) {
            productIds.push(productId);
            productQuantities[productId] = quantity;
          }
        });
      }

      setFormData({
        customerId: editingSale.customerId || '',
        serviceIds: editingSale.services?.map(s => s.serviceId) || [],
        productIds: productIds,
        productQuantities: productQuantities,
        staffIds: systemStaffIds,
        customStaffNames: customStaffNames,
        saleDate: saleDate.toISOString().slice(0, 16),
        notes: editingSale.notes || '',
        paymentMethod: 'CASH', // Will be overridden by payments array
        bringOwnProduct: Boolean(bringOwnProduct),
        addShampoo: false, // TODO: Add this to sale model if needed
        manualDiscountAmount: manualDiscountAmount,
        manualDiscountReason: manualDiscountReason,
        applyManualDiscount: hasManualDiscount,
        manualIncrementAmount: manualIncrementAmount,
        manualIncrementReason: manualIncrementReason,
        applyManualIncrement: hasManualIncrement
      });

      console.log('🔍 Set formData for editing sale:', {
        manualIncrementAmount,
        manualIncrementReason,
        applyManualIncrement: hasManualIncrement,
        bringOwnProduct: Boolean(bringOwnProduct),
        ownShampooDiscount: editingSale.ownShampooDiscount
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
  }, [editingSale, staff]); // Added staff to dependencies

  // Separate useEffect to populate staff when editingSale is available
  useEffect(() => {
    console.log('🔍 Staff population useEffect triggered:', {
      hasEditingSale: !!editingSale,
      editingSaleId: editingSale?.id,
      hasStaffArray: !!editingSale?.staff,
      staffArrayType: Array.isArray(editingSale?.staff),
      staffArrayLength: editingSale?.staff?.length,
      availableStaffCount: staff.length,
      editingSaleStaffDetails: editingSale?.staff?.map((s: any) => ({
        id: s.id,
        staffId: s.staffId,
        customName: s.customName,
        staff: s.staff,
        fullObject: s
      }))
    });

    if (editingSale && editingSale.staff && Array.isArray(editingSale.staff) && editingSale.staff.length > 0) {
      console.log('🔍 Populating staff for editing sale:', {
        editingSaleStaff: editingSale.staff,
        availableStaff: staff,
        staffCount: staff.length,
        editingSaleStaffLength: editingSale.staff.length
      });

      const staffSelections: (StaffOption | CustomStaff)[] = [];

      editingSale.staff.forEach((saleStaff: any) => {
        console.log('🔍 Processing saleStaff item:', saleStaff);

        // Handle custom staff first
        if (saleStaff.customName) {
          console.log('✅ Adding custom staff:', saleStaff.customName);
          staffSelections.push({
            id: `custom-${Date.now()}-${Math.random()}`,
            name: saleStaff.customName,
            isCustom: true as const
          });
          return;
        }

        // Handle system staff
        // Get staffId from either direct field or nested staff object
        const staffId = saleStaff.staffId || saleStaff.staff?.id;
        // Get staff name from nested staff object
        const staffName = saleStaff.staff?.name || saleStaff.staff?.fullName || saleStaff.staffName;
        const staffRole = saleStaff.staff?.role;

        console.log('🔍 Extracted staff data:', {
          staffId,
          staffName,
          staffRole,
          saleStaffObject: saleStaff
        });

        if (!staffId) {
          console.warn('⚠️ No staffId found in saleStaff:', saleStaff);
          return;
        }

        // Try to find in system staff by ID to get the role (if staff array is loaded)
        if (staff.length > 0) {
          const systemStaff = staff.find(s => s.id === staffId);
          if (systemStaff) {
            console.log('✅ Found system staff by ID:', systemStaff);
            staffSelections.push({
              id: systemStaff.id,
              name: systemStaff.name,
              role: systemStaff.role
            });
            return;
          }
        }

        // If not found in system staff or staff array not loaded, use data from sale
        if (staffName) {
          console.log('✅ Using staff data from sale:', { staffId, staffName, staffRole });
          staffSelections.push({
            id: staffId,
            name: staffName,
            role: staffRole || 'STAFF'
          });
        } else {
          // If we only have staffId but no name, create placeholder (will be updated when staff loads)
          console.log('⚠️ Only have staffId, creating placeholder:', staffId);
          staffSelections.push({
            id: staffId,
            name: 'Loading...',
            role: staffRole || 'STAFF'
          });
        }
      });

      console.log('✅ Final staff selections:', staffSelections);
      console.log('✅ Setting selectedStaff with', staffSelections.length, 'items');
      // Always set staff selections, even if empty (to clear previous state)
      setSelectedStaff(staffSelections);
    } else if (editingSale && (!editingSale.staff || !Array.isArray(editingSale.staff) || editingSale.staff.length === 0)) {
      console.log('⚠️ Editing sale has no staff array or staff is empty:', {
        hasStaff: !!editingSale.staff,
        isArray: Array.isArray(editingSale.staff),
        length: editingSale.staff?.length
      });
      setSelectedStaff([]);
    } else if (!editingSale) {
      // Clear staff when not editing
      setSelectedStaff([]);
    }
  }, [editingSale, staff]);

  // Update staff selections when staff list loads (in case it loads after editingSale)
  useEffect(() => {
    if (editingSale && editingSale.staff && Array.isArray(editingSale.staff) && editingSale.staff.length > 0 && staff.length > 0 && selectedStaff.length > 0) {
      // Check if any selected staff has placeholder name and update it
      const updatedStaff = selectedStaff.map(selected => {
        if (selected.name === 'Loading...' || !selected.name) {
          const systemStaff = staff.find(s => s.id === selected.id);
          if (systemStaff) {
            console.log('🔄 Updating placeholder staff with real data:', systemStaff);
            return {
              id: systemStaff.id,
              name: systemStaff.name,
              role: systemStaff.role
            };
          }
        }
        return selected;
      });

      // Check if we need to update any staff
      const needsUpdate = updatedStaff.some((updated, index) => {
        const current = selectedStaff[index];
        if (!current) return true;
        if ('isCustom' in updated && updated.isCustom) {
          return updated.name !== (current && 'isCustom' in current ? current.name : '');
        }
        if ('isCustom' in current && current.isCustom) {
          return true; // Converting from custom to system staff
        }
        return updated.name !== current.name || ('role' in updated && 'role' in current && updated.role !== current.role);
      });

      if (needsUpdate) {
        console.log('🔄 Updating staff selections with loaded staff data');
        setSelectedStaff(updatedStaff);
      }
    }
  }, [staff, editingSale]); // Only depend on staff and editingSale, not selectedStaff to avoid loops

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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <div className="space-y-4">
              <div className="customer-dropdown-container dropdown-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Select Customer *
                </label>

                {/* Quick Add Toggle (only visible if we are in searchable mode or quick add mode) */}
                {!selectedCustomer && (
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => setShowQuickInput(!showQuickInput)}
                      className="text-xs text-[#5A8621] hover:underline"
                    >
                      {showQuickInput ? 'Switch to Search' : 'Quick Add (Name/Phone)'}
                    </button>
                  </div>
                )}

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
                ) : showQuickInput ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-medium text-gray-700">Quick Customer Details</h4>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Customer Name *"
                        value={quickCustomerName}
                        onChange={(e) => setQuickCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                      />
                    </div>
                    <div>
                      <PhoneInput
                        value={quickCustomerPhone}
                        onChange={setQuickCustomerPhone}
                        placeholder="Phone Number (Recommended)"
                        required={false}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      This will create a new customer record automatically.
                    </p>
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
                          const searchValue = e.target.value;
                          setCustomerSearch(searchValue);
                          setShowCustomerDropdown(true);

                          // Debug logging
                          if (searchValue.length > 0) {
                            console.log('🔍 Customer search:', {
                              searchTerm: searchValue,
                              totalCustomers: customers.length,
                              filteredCount: filteredCustomers.length,
                              sampleMatches: filteredCustomers.slice(0, 3).map(c => ({
                                name: c.fullName || c.name,
                                phone: c.phone
                              }))
                            });
                          }
                        }}
                        onFocus={() => {
                          setShowCustomerDropdown(true);
                          console.log('📋 Customer dropdown opened:', {
                            totalCustomers: customers.length,
                            searchTerm: customerSearch
                          });
                        }}
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
                            <div className="text-gray-500 mb-2">
                              {customers.length === 0
                                ? 'No customers available.'
                                : `No customers found matching "${customerSearch}".`
                              }
                            </div>
                            <div className="flex flex-col space-y-2 mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsQuickAddMode(true);
                                  setShowAddCustomerModal(true);
                                  setShowCustomerDropdown(false);
                                }}
                                className="text-sm bg-[#5A8621] text-white py-2 px-3 rounded-md hover:bg-[#4A7318] font-medium transition-colors w-full"
                              >
                                Quick Register (Product Sale)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsQuickAddMode(false);
                                  setShowAddCustomerModal(true);
                                  setShowCustomerDropdown(false);
                                }}
                                className="text-sm text-[#5A8621] hover:text-[#4A7318] font-medium underline py-1"
                              >
                                Full Registration
                              </button>
                            </div>
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
                    onClick={() => setPayments([...payments, { paymentMethod: 'MOMO', amount: 0 }])}
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
                      <option value="MOMO">MoMo</option>
                      <option value="CASH">Cash</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="BANK_CARD">Bank Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Amount"
                      value={payment.amount === 0 ? '' : String(payment.amount).replace(/^0+/, '')}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
                        // Remove leading zeros
                        value = value.replace(/^0+/, '') || '';
                        // Convert to number
                        const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
                        const newPayments = [...payments];
                        newPayments[index].amount = numValue;
                        setPayments(newPayments);
                      }}
                      onBlur={(e) => {
                        // Ensure clean value on blur
                        const value = e.target.value.replace(/[^\d]/g, '').replace(/^0+/, '');
                        const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
                        const newPayments = [...payments];
                        newPayments[index].amount = numValue;
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
                    {editingSale.discounts.map((discount: SaleDiscount, index: number) => (
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
                        type="text"
                        inputMode="numeric"
                        value={formData.manualDiscountAmount === 0 ? '' : String(formData.manualDiscountAmount).replace(/^0+/, '')}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
                          // Remove leading zeros
                          value = value.replace(/^0+/, '') || '';
                          // Convert to number
                          const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
                          setFormData({ ...formData, manualDiscountAmount: numValue });
                        }}
                        onBlur={(e) => {
                          // Ensure clean value on blur
                          const value = e.target.value.replace(/[^\d]/g, '').replace(/^0+/, '');
                          const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
                          setFormData({ ...formData, manualDiscountAmount: numValue });
                        }}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                        placeholder="0"
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

              {/* Manual Increment */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="applyManualIncrement"
                    checked={formData.applyManualIncrement}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        applyManualIncrement: e.target.checked,
                        manualIncrementAmount: e.target.checked ? formData.manualIncrementAmount : 0
                      });
                    }}
                    className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Apply manual increment</span>
                </label>

                {formData.applyManualIncrement && (
                  <div className="ml-6 space-y-2 mt-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Increment Amount (RWF)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.manualIncrementAmount === 0 ? '' : formData.manualIncrementAmount}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
                          // Remove leading zeros
                          value = value.replace(/^0+/, '') || '';
                          // Convert to number
                          const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
                          setFormData({ ...formData, manualIncrementAmount: numValue });
                        }}
                        onBlur={(e) => {
                          // Ensure clean value on blur
                          const value = e.target.value.replace(/[^\d]/g, '').replace(/^0+/, '');
                          const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
                          setFormData({ ...formData, manualIncrementAmount: numValue });
                        }}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Reason for Increment *</label>
                      <input
                        type="text"
                        value={formData.manualIncrementReason}
                        onChange={(e) => {
                          setFormData({ ...formData, manualIncrementReason: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                        placeholder="e.g., Additional service charge, premium styling"
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Scissors className="inline h-4 w-4 mr-1" />
                    Select Services *
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showKidsServices}
                      onChange={(e) => setShowKidsServices(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showKidsServices ? 'bg-[#5A8621]' : 'bg-gray-300'
                      }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showKidsServices ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </div>
                    <span className="ml-2 text-sm text-gray-700">
                      {showKidsServices ? 'Kids Services' : 'Adult Services'}
                    </span>
                  </label>
                </div>
                <CategorizedServiceSelect
                  services={filteredServices}
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

              {/* Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Select Products (Optional)
                </label>
                <ProductSelect
                  products={products}
                  selectedProductIds={formData.productIds}
                  onSelectionChange={(productIds) => {
                    // When products are deselected, remove their quantities
                    const removedIds = formData.productIds.filter(id => !productIds.includes(id));
                    const newQuantities = { ...formData.productQuantities };
                    removedIds.forEach(id => {
                      delete newQuantities[id];
                      // Clear errors for removed products
                      const errorKey = `product_${id}`;
                      if (errors[errorKey]) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    });
                    // Don't set default quantity - let user enter it
                    productIds.forEach(id => {
                      if (!formData.productIds.includes(id)) {
                        // Don't set initial value, leave it undefined so placeholder shows
                      }
                    });
                    setFormData(prev => ({
                      ...prev,
                      productIds: productIds,
                      productQuantities: newQuantities
                    }));
                  }}
                  placeholder="Select products..."
                  error={errors.productIds}
                />

                {/* Quantity inputs for selected products */}
                {formData.productIds.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.productIds.map(productId => {
                      const product = products.find(p => p.id === productId);
                      if (!product) return null;
                      const quantity = formData.productQuantities[productId];
                      const errorKey = `product_${productId}`;

                      return (
                        <div key={productId} className="border border-[#5A8621] bg-green-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-[#5A8621]" />
                                <span className="font-medium text-gray-900">{product.name}</span>
                                <span className="text-sm text-gray-600">
                                  ({Number(product.price).toLocaleString()} RWF)
                                </span>
                              </div>
                              {product.description && (
                                <p className="text-xs text-gray-500 mt-1 ml-6">{product.description}</p>
                              )}
                              <div className="text-xs text-gray-500 mt-1 ml-6">
                                Stock: <span className={product.quantity < 10 ? 'text-yellow-600 font-medium' : 'text-gray-600'}>{product.quantity}</span>
                              </div>
                            </div>
                            <div className="ml-4 flex items-center space-x-2">
                              <label className="text-sm text-gray-700 whitespace-nowrap">Qty:</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={quantity && quantity > 0 ? String(quantity) : ''}
                                placeholder="0"
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^\d]/g, '');
                                  // Allow empty value, allow 0 to be typed
                                  const numValue = value === '' ? undefined : (parseInt(value, 10) || (value === '0' ? 0 : undefined));
                                  setFormData(prev => {
                                    const newQuantities = { ...prev.productQuantities };
                                    if (numValue === undefined) {
                                      // Remove the key if undefined to keep type clean
                                      delete newQuantities[productId];
                                    } else {
                                      newQuantities[productId] = numValue;
                                    }
                                    return {
                                      ...prev,
                                      productQuantities: newQuantities
                                    };
                                  });
                                  // Clear error when user types
                                  if (errors[errorKey]) {
                                    setErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors[errorKey];
                                      return newErrors;
                                    });
                                  }
                                }}
                                className={`w-20 px-2 py-1 border rounded ${errors[errorKey] ? 'border-red-500' : 'border-gray-300'
                                  } focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]`}
                                max={product.quantity}
                              />
                              {errors[errorKey] && (
                                <span className="text-xs text-red-600">{errors[errorKey]}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Staff */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Select Staff *
                </label>
                <CustomStaffSelect
                  options={staffOptions}
                  selectedStaff={selectedStaff}
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
          {(selectedCustomer || selectedServicesDetails.length > 0 || formData.productIds.length > 0) && (
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

              {formData.productIds.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Products: </span>
                  <div className="mt-1 space-y-1">
                    {formData.productIds.map(productId => {
                      const product = products.find(p => p.id === productId);
                      const quantity = formData.productQuantities[productId] || 1; // Default to 1 for display
                      if (!product) return null;
                      const totalPrice = Number(product.price) * quantity;
                      return (
                        <div key={productId} className="flex justify-between text-sm">
                          <span>
                            {product.name} (x{quantity})
                          </span>
                          <span>{totalPrice.toLocaleString()} RWF</span>
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

                {(promotionalDiscount || 0) > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Promotional/Seasonal Discount:</span>
                    <span className="font-medium">-{(promotionalDiscount || 0).toLocaleString()} RWF</span>
                  </div>
                )}

                {manualDiscount > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span className="text-sm">Manual Discount:</span>
                    <span className="font-medium">-{manualDiscount.toLocaleString()} RWF</span>
                  </div>
                )}

                {manualIncrement > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Manual Increment:</span>
                    <span className="font-medium">+{manualIncrement.toLocaleString()} RWF</span>
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

      {showAddCustomerModal && (
        <AddCustomerModal
          onClose={() => setShowAddCustomerModal(false)}
          onSubmit={handleCreateCustomer}
          isQuickAdd={isQuickAddMode}
        />
      )}
    </div>
  );
};

export default AddSalesModal;