"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Search,
  Plus,
  User,
  Star,
  Edit,
  Trash2,
  Banknote,
  CreditCard,
  Smartphone,
  DollarSign
} from 'lucide-react';
import salesService, { Sale, GetSalesParams, CreateSaleDto, UpdateSaleDto, DailyPaymentSummary } from '../../services/salesService';
import customersService, { Customer } from '../../services/customersService';
import AddSalesModal from './AddSalesModal';
import { useTitle } from '../../contexts/TitleContext';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/ConfirmationModal';

const SalesPage: React.FC = () => {
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useNotification();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [deletingLoad, setDeletingLoad] = useState(false);

  // Payment summary state
  const [paymentSummary, setPaymentSummary] = useState<DailyPaymentSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const itemsPerPage = 10;

  useEffect(() => {
    setTitle('Sales Management');
  }, [setTitle]);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const params: GetSalesParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        customerId: customerFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      };

      const response = await salesService.getAll(params);
      console.log('Sales API Response:', response); // Debug log

      // Handle the data structure from service (already transformed)
      const salesData = response.data || [];

      // Transform the backend data to match frontend expectations
      const transformedSales = Array.isArray(salesData) ? salesData.map((sale: any) => ({
        ...sale,
        customerName: sale.customer?.fullName || 'Unknown Customer',
        customerPhone: sale.customer?.phone || 'No phone',
        customerVisitCount: sale.customer?.saleCount || 0,
        subtotal: Number(sale.totalAmount || 0),
        discountAmount: Number(sale.discountAmount || 0),
        finalAmount: Number(sale.finalAmount || 0),
        services: sale.services?.map((saleService: any) => ({
          serviceName: saleService.service?.name || 'Unknown Service',
          price: Number(saleService.totalPrice || 0),
          serviceCategory: saleService.service?.category || 'UNKNOWN'
        })) || [],
        staff: sale.staff?.map((saleStaff: any) => ({
          staffName: saleStaff.staff?.name || saleStaff.customName || 'Unknown Staff'
        })) || []
      })) : [];

      console.log('Transformed Sales:', transformedSales); // Debug log
      setSales(transformedSales);

      // Get pagination from service response
      const pagination = response.meta;
      setTotalPages(pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Response error:', (error as any).response?.data);
      }
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, customerFilter, startDateFilter, endDateFilter]);

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getAll({ limit: 1000 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const fetchPaymentSummary = useCallback(async () => {
    try {
      const response = await salesService.getDailyPaymentSummary(selectedDate);
      
      if (response.data && response.data.summary) {
        // Ensure all 5 payment methods are present
        const allMethods = ['CASH', 'MOBILE_MONEY', 'MOMO', 'BANK_CARD', 'BANK_TRANSFER'];
        
        // Create a map of existing methods for quick lookup (case-insensitive)
        const existingMethodsMap = new Map<string, { method: string; total: number; count: number }>();
        
        // Process the received summary - filter out any invalid entries
        if (Array.isArray(response.data.summary)) {
          response.data.summary.forEach((p: any) => {
            if (p && p.method && typeof p.method === 'string') {
              const methodKey = p.method.toUpperCase().trim();
              existingMethodsMap.set(methodKey, {
                method: methodKey,
                total: Number(p.total) || 0,
                count: Number(p.count) || 0
              });
            }
          });
        }
        
        // Build the final summary ensuring all methods are present in correct order
        const finalSummary = allMethods.map(method => {
          const existing = existingMethodsMap.get(method);
          if (existing) {
            return existing;
          }
          // Method not found, add with zero values
          return { method, total: 0, count: 0 };
        });
        
        // Update the response data with the complete summary
        response.data.summary = finalSummary;
      } else {
        console.error('No summary in response data!', response);
        // Create empty summary if no data
        if (response.data) {
          response.data.summary = [
            { method: 'CASH', total: 0, count: 0 },
            { method: 'MOBILE_MONEY', total: 0, count: 0 },
            { method: 'MOMO', total: 0, count: 0 },
            { method: 'BANK_CARD', total: 0, count: 0 },
            { method: 'BANK_TRANSFER', total: 0, count: 0 }
          ];
          response.data.grandTotal = 0;
        }
      }
      
      setPaymentSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch payment summary:', error);
      setPaymentSummary(null);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [fetchSales]);

  useEffect(() => {
    fetchPaymentSummary();
  }, [fetchPaymentSummary]);

  const handleAddSale = async (saleData: CreateSaleDto) => {
    try {
      const response = await salesService.create(saleData);
      setIsModalOpen(false);
      
      // Get the sale date from the created sale and update selectedDate to match
      if (response.data && response.data.saleDate) {
        const saleDate = new Date(response.data.saleDate);
        const saleDateString = saleDate.toISOString().split('T')[0];
        setSelectedDate(saleDateString);
      }
      
      // Refresh data
      await fetchSales();
      // Force refresh payment summary immediately and again after delay
      fetchPaymentSummary();
      setTimeout(() => {
        fetchPaymentSummary();
      }, 1000);
      
      showSuccess('Sale recorded successfully', 'The sale has been added to the system.');
    } catch (error: any) {
      console.error('Failed to add sale:', error);
      showError('Failed to record sale', error.response?.data?.error || error.message || 'Please try again.');
      throw error;
    }
  };

  const handleEditSale = async (saleData: UpdateSaleDto) => {
    if (!editingSale) return;

    try {
      const response = await salesService.update(editingSale.id, saleData);
      setIsModalOpen(false);
      setEditingSale(null);
      
      // Update selectedDate to match the sale date if it changed
      if (response.data && response.data.saleDate) {
        const saleDate = new Date(response.data.saleDate);
        const saleDateString = saleDate.toISOString().split('T')[0];
        setSelectedDate(saleDateString);
      }
      
      // Refresh data
      await fetchSales();
      // Force refresh payment summary immediately and again after delay
      fetchPaymentSummary();
      setTimeout(() => {
        fetchPaymentSummary();
      }, 1000);
      
      showSuccess('Sale updated successfully', 'The sale has been updated in the system.');
    } catch (error: any) {
      console.error('Failed to update sale:', error);
      showError('Failed to update sale', error.response?.data?.error || error.message || 'Please try again.');
      throw error;
    }
  };

  const handleEditClick = async (saleId: string) => {
    try {
      setLoadingEdit(true);
      const response = await salesService.getById(saleId);
      console.log('🔍 Sale fetched for editing:', {
        saleId,
        responseData: response.data,
        staff: response.data?.staff,
        staffType: typeof response.data?.staff,
        staffIsArray: Array.isArray(response.data?.staff),
        staffLength: response.data?.staff?.length,
        staffDetails: response.data?.staff?.map((s: any) => ({
          id: s.id,
          staffId: s.staffId,
          customName: s.customName,
          staff: s.staff,
          fullObject: s
        }))
      });
      setEditingSale(response.data);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Failed to fetch sale details:', error);
      showError('Failed to load sale details', error.response?.data?.error || error.message || 'Please try again.');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteClick = (saleId: string) => {
    setSaleToDelete(saleId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return;

    try {
      setDeletingLoad(true);
      await salesService.delete(saleToDelete);
      await fetchSales();
      setTimeout(() => {
        fetchPaymentSummary(); // Refresh payment summary when a sale is deleted
      }, 500);
      setShowDeleteModal(false);
      setSaleToDelete(null);
      showSuccess('Sale deleted successfully', 'The sale has been removed from the system.');
    } catch (error: any) {
      console.error('Failed to delete sale:', error);
      showError('Failed to delete sale', error.response?.data?.error || error.message || 'Please try again.');
    } finally {
      setDeletingLoad(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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
      {/* Date Selector, Record Sale Button, and Payment Summary Cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Payment Summary for:</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5A8621] focus:border-transparent"
            />
          </div>

          <button
            onClick={() => {
              setEditingSale(null);
              setIsModalOpen(true);
            }}
            className="bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7318] flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Record Sale</span>
          </button>
        </div>

        {/* Payment Summary Cards - Same line as Add Sale button */}
        {paymentSummary && paymentSummary.summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {paymentSummary.summary.map((payment) => {
            const getPaymentConfig = (method: string) => {
              switch (method) {
                case 'CASH':
                  return {
                    icon: <Banknote className="w-4 h-4 text-yellow-600" />,
                    label: 'Cash Payments',
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-600'
                  };
                case 'BANK_TRANSFER':
                  return {
                    icon: <CreditCard className="w-4 h-4 text-blue-600" />,
                    label: 'Bank Transfer',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-600'
                  };
                case 'MOMO':
                  return {
                    icon: <Smartphone className="w-4 h-4 text-green-600" />,
                    label: 'MoMo',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-600'
                  };
                case 'MOBILE_MONEY':
                  return {
                    icon: <Smartphone className="w-4 h-4 text-purple-600" />,
                    label: 'Mobile Money',
                    bgColor: 'bg-purple-100',
                    textColor: 'text-purple-600'
                  };
                case 'BANK_CARD':
                  return {
                    icon: <CreditCard className="w-4 h-4 text-indigo-600" />,
                    label: 'Bank Card',
                    bgColor: 'bg-indigo-100',
                    textColor: 'text-indigo-600'
                  };
                default:
                  return {
                    icon: <Banknote className="w-4 h-4 text-gray-600" />,
                    label: method,
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-600'
                  };
              }
            };

            const config = getPaymentConfig(payment.method);

            return (
              <div key={payment.method} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-8 h-8 ${config.bgColor} rounded-full flex items-center justify-center`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-xs font-medium truncate">{config.label}</p>
                    <p className="text-base font-bold text-gray-900">{formatCurrency(payment.total)}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {payment.count} transaction{payment.count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}

          {/* Grand Total Card */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-[#5A8621]/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#5A8621]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 text-xs font-medium">Total Revenue</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(paymentSummary.grandTotal)}</p>
              </div>
            </div>
            <div className="text-xs text-[#5A8621] font-medium">
              All payment methods
            </div>
          </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by customer name, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-transparent"
              />
            </div>

            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
            >
              <option value="">All Customers</option>
              {Array.isArray(customers) && customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName || customer.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
              placeholder="Start date"
              title="Start date"
            />

            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
              placeholder="End date"
              title="End date"
            />
          </div>

          {(searchTerm || customerFilter || startDateFilter || endDateFilter) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {customerFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  Customer: {customers.find(c => c.id === customerFilter)?.fullName || customers.find(c => c.id === customerFilter)?.name}
                  <button
                    onClick={() => {
                      setCustomerFilter('');
                      setCurrentPage(1);
                    }}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {startDateFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  From: {new Date(startDateFilter).toLocaleDateString()}
                  <button
                    onClick={() => {
                      setStartDateFilter('');
                      setCurrentPage(1);
                    }}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {endDateFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  To: {new Date(endDateFilter).toLocaleDateString()}
                  <button
                    onClick={() => {
                      setEndDateFilter('');
                      setCurrentPage(1);
                    }}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(searchTerm || customerFilter || startDateFilter || endDateFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCustomerFilter('');
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A8621]"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by recording your first customer sale.
              </p>
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setEditingSale(null);
                }}
                className="mt-4 bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7219] transition-colors"
              >
                Record New Sale
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {Array.isArray(sales) && sales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {sale.customerName || 'Unknown Customer'}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {sale.customerPhone || 'No phone'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(sale.saleDate)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Recorded by: {sale.createdBy?.name || sale.createdBy?.fullName || 'Admin'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditClick(sale.id)}
                        disabled={loadingEdit}
                        className="p-2 text-gray-400 hover:text-[#BCF099] disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(sale.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                      <div className="space-y-1">
                        {sale.services.map((service, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{service.serviceName}</span>
                            <span className="font-medium">{formatCurrency(service.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Staff</h4>
                      <div className="space-y-1">
                        {sale.staff && sale.staff.length > 0 ? sale.staff.map((staffRecord, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {staffRecord.staffName || 'Unknown Staff'}
                          </div>
                        )) : (
                          <div className="text-sm text-gray-500">No staff assigned</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="ml-2 font-medium">{formatCurrency(sale.subtotal)}</span>
                        </div>
                        {sale.discountAmount > 0 && (
                          <div>
                            <span className="text-gray-500">Discount:</span>
                            <span className="ml-2 font-medium text-green-600">
                              -{formatCurrency(sale.discountAmount)}
                              {sale.discountType && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({sale.discountType})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Final Amount:</span>
                          <span className="ml-2 text-lg font-bold text-[#5A8621]">
                            {formatCurrency(sale.finalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{sale.loyaltyPointsEarned} points earned</span>
                      </div>
                    </div>

                    {sale.notes && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Notes:</span>
                        <span className="ml-2 text-gray-700">{sale.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && sales.length > 0 && (
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
        <AddSalesModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingSale(null);
          }}
          onSubmit={async (data: CreateSaleDto | UpdateSaleDto) => {
            if (editingSale) {
              await handleEditSale(data as UpdateSaleDto);
            } else {
              await handleAddSale(data as CreateSaleDto);
            }
          }}
          editingSale={editingSale}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteSale}
        title="Delete Sale"
        message="Are you sure you want to delete this sale? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deletingLoad}
      />
    </div>
  );
};

export default SalesPage;