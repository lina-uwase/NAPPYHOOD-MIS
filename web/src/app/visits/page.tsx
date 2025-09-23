"use client"
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Plus,
  User,
  Clock,
  Star,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';
import visitsService, { Visit, GetVisitsParams, CreateVisitDto, UpdateVisitDto } from '../../services/visitsService';
import customersService, { Customer } from '../../services/customersService';
import AddVisitModal from './AddVisitModal';
import { useTitle } from '../../contexts/TitleContext';

const VisitsPage: React.FC = () => {
  const { setTitle } = useTitle();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    setTitle('Visit Management');
  }, [setTitle]);

  useEffect(() => {
    fetchVisits();
    fetchCustomers();
  }, [currentPage, searchTerm, customerFilter, statusFilter, dateFilter]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params: GetVisitsParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        customerId: customerFilter || undefined,
        isCompleted: statusFilter === 'ALL' ? undefined : statusFilter === 'COMPLETED',
        startDate: dateFilter.start || undefined,
        endDate: dateFilter.end || undefined,
      };

      const response = await visitsService.getAll(params);
      // Extract visits array from nested structure
      const visitsData = response.data?.visits || response.data || [];
      setVisits(Array.isArray(visitsData) ? visitsData : []);

      // Get pagination from either nested or meta structure
      const pagination = response.data?.pagination || response.meta;
      setTotalPages(pagination?.pages || pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersService.getAll({ limit: 1000 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const handleAddVisit = async (visitData: CreateVisitDto) => {
    try {
      await visitsService.create(visitData);
      setIsModalOpen(false);
      fetchVisits();
    } catch (error) {
      console.error('Failed to add visit:', error);
      throw error;
    }
  };

  const handleEditVisit = async (visitData: UpdateVisitDto) => {
    if (!editingVisit) return;

    try {
      await visitsService.update(editingVisit.id, visitData);
      setIsModalOpen(false);
      setEditingVisit(null);
      fetchVisits();
    } catch (error) {
      console.error('Failed to update visit:', error);
      throw error;
    }
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm('Are you sure you want to delete this visit?')) return;

    try {
      await visitsService.delete(visitId);
      fetchVisits();
    } catch (error) {
      console.error('Failed to delete visit:', error);
    }
  };

  const handleMarkCompleted = async (visitId: string) => {
    try {
      await visitsService.markCompleted(visitId);
      fetchVisits();
    } catch (error) {
      console.error('Failed to mark visit as completed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalDuration = (visit: Visit) => {
    return visit.services.reduce((total, service) => total + service.duration, 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setEditingVisit(null);
              setIsModalOpen(true);
            }}
            className="bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7318] flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Record Visit</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search visits..."
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

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'COMPLETED' | 'PENDING');
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
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
          ) : visits.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No visits found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by recording your first customer visit.
              </p>
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setEditingVisit(null);
                }}
                className="mt-4 bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7219] transition-colors"
              >
                Record New Visit
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {Array.isArray(visits) && visits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {visit.customer?.fullName || visit.customerName || 'Unknown Customer'}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          visit.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {visit.isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {visit.customer?.phone || visit.customerPhone || 'No phone'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(visit.visitDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {getTotalDuration(visit)} min
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingVisit(visit);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!visit.isCompleted && (
                        <button
                          onClick={() => handleMarkCompleted(visit.id)}
                          className="p-2 text-gray-400 hover:text-green-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteVisit(visit.id)}
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
                        {visit.services.map((service, index) => (
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
                        {visit.staff && visit.staff.length > 0 ? visit.staff.map((staffRecord, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {staffRecord.staff?.name || staffRecord.staffName || staffRecord.name || 'Unknown Staff'}
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
                          <span className="ml-2 font-medium">{formatCurrency(visit.subtotal)}</span>
                        </div>
                        {visit.discountAmount > 0 && (
                          <div>
                            <span className="text-gray-500">Discount:</span>
                            <span className="ml-2 font-medium text-green-600">
                              -{formatCurrency(visit.discountAmount)}
                              {visit.discountType && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({visit.discountType})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Final Amount:</span>
                          <span className="ml-2 text-lg font-bold text-[#5A8621]">
                            {formatCurrency(visit.finalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{visit.loyaltyPointsEarned} points earned</span>
                      </div>
                    </div>

                    {visit.notes && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Notes:</span>
                        <span className="ml-2 text-gray-700">{visit.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && visits.length > 0 && (
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
        <AddVisitModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingVisit(null);
          }}
          onSubmit={async (data: CreateVisitDto | UpdateVisitDto) => {
            if (editingVisit) {
              await handleEditVisit(data as UpdateVisitDto);
            } else {
              await handleAddVisit(data as CreateVisitDto);
            }
          }}
          editingVisit={editingVisit}
        />
      )}
    </div>
  );
};

export default VisitsPage;