"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  MapPin,
  Phone,
  Calendar,
  Award
} from 'lucide-react';
import customersService, { Customer, GetCustomersParams, CreateCustomerDto, UpdateCustomerDto } from '../../services/customersService';
import AddCustomerModal from './AddCustomerModal';
import { useTitle } from '../../contexts/TitleContext';

const CustomersPage: React.FC = () => {
  const { setTitle } = useTitle();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  const itemsPerPage = 12;

  useEffect(() => {
    setTitle('Customer Management');
  }, [setTitle]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params: GetCustomersParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        gender: genderFilter !== 'ALL' ? genderFilter : undefined,
        province: provinceFilter || undefined,
        district: districtFilter || undefined,
      };

      const response = await customersService.getAll(params);
      console.log('Customers API Response:', response); // Debug log

      // Handle the data structure from service (already transformed)
      const customersData = response.data || [];
      setCustomers(Array.isArray(customersData) ? customersData : []);

      // Get pagination from service response
      const pagination = response.meta;
      setTotalPages(pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, genderFilter, provinceFilter, districtFilter]);

  useEffect(() => {
    fetchCustomers();
    fetchProvinces();
  }, [fetchCustomers]);

  useEffect(() => {
    if (provinceFilter) {
      fetchDistricts(provinceFilter);
    } else {
      setDistricts([]);
      setDistrictFilter('');
    }
  }, [provinceFilter]);

  const fetchProvinces = async () => {
    try {
      const response = await customersService.getProvinces();
      setProvinces(response.data);
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  };

  const fetchDistricts = async (province: string) => {
    try {
      const response = await customersService.getDistrictsByProvince(province);
      setDistricts(response.data);
    } catch (error) {
      console.error('Failed to fetch districts:', error);
    }
  };

  const handleAddCustomer = async (customerData: CreateCustomerDto | UpdateCustomerDto) => {
    try {
      await customersService.create(customerData as CreateCustomerDto);
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  };

  const handleEditCustomer = async (customerData: CreateCustomerDto | UpdateCustomerDto) => {
    if (!editingCustomer) return;

    try {
      await customersService.update(editingCustomer.id, customerData as UpdateCustomerDto);
      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      await customersService.delete(customerId);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const handleToggleActive = async (customerId: string) => {
    try {
      await customersService.toggleActive(customerId);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to toggle customer status:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7318] flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-transparent"
              />
            </div>

            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value as 'ALL' | 'MALE' | 'FEMALE');
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>

            <select
              value={provinceFilter}
              onChange={(e) => {
                setProvinceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
            >
              <option value="">All Provinces</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>

            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
              disabled={!provinceFilter}
            >
              <option value="">All Districts</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A8621]"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first customer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {Array.isArray(customers) && customers.map((customer) => (
                <div
                  key={customer.id}
                  className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
                    !customer.isActive ? 'opacity-60 bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {customer.fullName || customer.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Phone className="h-4 w-4 mr-1" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-600 mb-2">
                          {customer.email}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-[#BCF099]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(customer.id)}
                        className={`p-2 ${customer.isActive ? 'text-green-600 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
                      >
                        {customer.isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {customer.location}, {customer.district}, {customer.province}
                    </div>

                    {(customer.birthday || (customer.birthDay && customer.birthMonth)) && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Birthday: {customer.birthday ? formatDate(customer.birthday) :
                          `${customer.birthDay}/${customer.birthMonth}${customer.birthYear ? `/${customer.birthYear}` : ''}`}
                      </div>
                    )}

                    <div className="flex items-center text-gray-600">
                      <Award className="h-4 w-4 mr-2" />
                      {customer.loyaltyPoints} loyalty points
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Sales:</span>
                        <div className="font-semibold">{customer.totalSales}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Spent:</span>
                        <div className="font-semibold">{formatCurrency(customer.totalSpent)}</div>
                      </div>
                    </div>
                    {customer.lastVisit && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Last Visit:</span>
                        <div className="font-semibold">{formatDate(customer.lastVisit)}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      customer.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      customer.gender === 'FEMALE'
                        ? 'bg-pink-100 text-pink-800'
                        : 'text-[#166534]'
                    } ${customer.gender === 'MALE' ? 'bg-[#BCF099]' : ''}
                    `}>
                      {customer.gender}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && customers.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddCustomerModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          onSubmit={editingCustomer ? handleEditCustomer : handleAddCustomer}
          editingCustomer={editingCustomer}
        />
      )}
    </div>
  );
};

export default CustomersPage;