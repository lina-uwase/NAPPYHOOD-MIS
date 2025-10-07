"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Search,
  Plus,
  User,
  Star,
  Edit,
  Trash2
} from 'lucide-react';
import salesService, { Sale, GetSalesParams, CreateSaleDto, UpdateSaleDto } from '../../services/salesService';
import customersService, { Customer } from '../../services/customersService';
import AddSalesModal from './AddSalesModal';
import { useTitle } from '../../contexts/TitleContext';

const SalesPage: React.FC = () => {
  const { setTitle } = useTitle();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

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
        startDate: dateFilter.start || undefined,
        endDate: dateFilter.end || undefined,
      };

      const response = await salesService.getAll(params);
      // Handle the nested data structure from backend
      const salesData = response.data?.sales || response.data || [];
      setSales(Array.isArray(salesData) ? salesData : []);

      // Get pagination from backend structure
      const pagination = response.data?.pagination || response.meta;
      setTotalPages(pagination?.pages || pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, customerFilter, dateFilter]);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [fetchSales]);

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getAll({ limit: 1000 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const handleAddSale = async (saleData: CreateSaleDto) => {
    try {
      await salesService.create(saleData);
      setIsModalOpen(false);
      fetchSales();
    } catch (error: any) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  };

  const handleEditSale = async (saleData: UpdateSaleDto) => {
    if (!editingSale) return;

    try {
      await salesService.update(editingSale.id, saleData);
      setIsModalOpen(false);
      setEditingSale(null);
      fetchSales();
    } catch (error: any) {
      console.error('Failed to update sale:', error);
      throw error;
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Are you sure you want to delete this sale?')) return;

    try {
      await salesService.delete(saleId);
      fetchSales();
    } catch (error) {
      console.error('Failed to delete sale:', error);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      <div className="mb-4">
        <div className="flex items-center justify-end">
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
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search sales..."
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
              value={dateFilter.start}
              onChange={(e) => {
                setDateFilter(prev => ({ ...prev, start: e.target.value }));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
              placeholder="Start date"
            />

            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => {
                setDateFilter(prev => ({ ...prev, end: e.target.value }));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
              placeholder="End date"
            />
          </div>
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
                          {sale.customer?.fullName || sale.customerName || 'Unknown Customer'}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {sale.customer?.phone || sale.customerPhone || 'No phone'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(sale.saleDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingSale(sale);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
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
                            <span className="text-gray-600">{service.service?.name || service.serviceName}</span>
                            <span className="font-medium">{formatCurrency(service.unitPrice || service.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Staff</h4>
                      <div className="space-y-1">
                        {sale.staff && sale.staff.length > 0 ? sale.staff.map((staffRecord, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {staffRecord.staff?.name || staffRecord.staffName || 'Unknown Staff'}
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
    </div>
  );
};

export default SalesPage;