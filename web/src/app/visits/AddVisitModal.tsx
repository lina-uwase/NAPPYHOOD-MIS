"use client"
import React, { useState, useEffect } from 'react';
import { X, Search, User, Scissors, Users, Calendar } from 'lucide-react';
import { Visit, CreateVisitDto, UpdateVisitDto } from '../../services/visitsService';
import customersService, { Customer } from '../../services/customersService';
import servicesService, { Service } from '../../services/servicesService';
import staffService, { Staff } from '../../services/staffService';

interface AddVisitModalProps {
  onClose: () => void;
  onSubmit: (data: CreateVisitDto | UpdateVisitDto) => void;
  editingVisit?: Visit | null;
}

const AddVisitModal: React.FC<AddVisitModalProps> = ({
  onClose,
  onSubmit,
  editingVisit
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    serviceIds: [] as string[],
    staffIds: [] as string[],
    visitDate: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchServices();
    fetchStaff();
  }, []);

  useEffect(() => {
    if (editingVisit) {
      setFormData({
        customerId: editingVisit.customerId,
        serviceIds: editingVisit.services.map(s => s.serviceId),
        staffIds: editingVisit.staff.map(s => s.staffId),
        visitDate: new Date(editingVisit.visitDate).toISOString().slice(0, 16),
        notes: editingVisit.notes || ''
      });
    }
  }, [editingVisit]);

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
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

    if (!formData.visitDate) {
      newErrors.visitDate = 'Visit date is required';
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
        customerId: formData.customerId,
        serviceIds: formData.serviceIds,
        staffIds: formData.staffIds,
        visitDate: formData.visitDate,
        notes: formData.notes.trim() || undefined
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Failed to submit visit:', error);
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

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
  const selectedStaff = staff.filter(s => formData.staffIds.includes(s.id));

  const calculateTotals = () => {
    const subtotal = selectedServices.reduce((total, service) => total + Number(service.singlePrice), 0);
    const duration = selectedServices.reduce((total, service) => total + Number(service.duration), 0);
    return { subtotal, duration };
  };

  const { subtotal, duration } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingVisit ? 'Edit Visit' : 'Record New Visit'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Select Customer *
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621]"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      onClick={() => setFormData(prev => ({ ...prev, customerId: customer.id }))}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        formData.customerId === customer.id ? 'bg-[#5A8621] text-white' : ''
                      }`}
                    >
                      <div className="font-medium">{customer.fullName || customer.name}</div>
                      <div className="text-sm opacity-75">{customer.phone}</div>
                    </div>
                  ))}
                </div>
                {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
              </div>

              {/* Visit Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Visit Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
                    errors.visitDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.visitDate && <p className="mt-1 text-sm text-red-600">{errors.visitDate}</p>}
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
                  placeholder="Any additional notes about the visit..."
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
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621]"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                  {filteredServices.map(service => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                        formData.serviceIds.includes(service.id) ? 'bg-[#5A8621] text-white' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm opacity-75">{service.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{Number(service.singlePrice).toLocaleString()} RWF</div>
                          <div className="text-sm opacity-75">{service.duration} min</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.serviceIds && <p className="mt-1 text-sm text-red-600">{errors.serviceIds}</p>}
              </div>

              {/* Staff */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Select Staff *
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {staff.map(member => (
                    <div
                      key={member.id}
                      onClick={() => handleStaffToggle(member.id)}
                      className={`p-2 cursor-pointer rounded border ${
                        formData.staffIds.includes(member.id)
                          ? 'bg-[#5A8621] text-white border-[#5A8621]'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm opacity-75">{member.role}</div>
                    </div>
                  ))}
                </div>
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

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <div>
                  <span className="text-sm text-gray-600">Total Duration: </span>
                  <span className="font-medium">{duration} minutes</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Estimated Total: </span>
                  <span className="font-bold text-[#5A8621]">{subtotal.toLocaleString()} RWF</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                * Final amount may vary due to automatic discounts (6th visit, birthday, combos)
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
              {loading ? 'Saving...' : editingVisit ? 'Update Visit' : 'Record Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVisitModal;