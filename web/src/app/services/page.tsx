"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Trash2, Edit, ChevronDown, Plus } from 'lucide-react';
import { useTitle } from '../../contexts/TitleContext';
import AddServiceModal from './AddServiceModal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import servicesService, { Service, CreateServiceDto, UpdateServiceDto } from '../../services/servicesService';

export default function ServicesPage() {
  const { setTitle } = useTitle();
  const { addToast } = useToast();
  const { user } = useAuth();

  const canManageServices = user?.role === 'ADMIN';

  useEffect(() => {
    setTitle("Services");
  }, [setTitle]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalServices, setTotalServices] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const serviceCategories = [
    'HAIR_TREATMENTS',
    'TWIST_HAIRSTYLE',
    'CORNROWS_BRAIDS',
    'STRAWSET_CURLS',
    'STYLING_SERVICE',
    'SPECIAL_OFFERS'
  ];

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'HAIR_TREATMENTS': 'Hair Treatments',
      'TWIST_HAIRSTYLE': 'Twist Hairstyles',
      'CORNROWS_BRAIDS': 'Cornrows & Braids',
      'STRAWSET_CURLS': 'Strawset & Curls',
      'STYLING_SERVICE': 'Styling Services',
      'SPECIAL_OFFERS': 'Special Offers'
    };
    return categoryMap[category] || category;
  };

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await servicesService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: categoryFilter || undefined,
      });

      if (response.success) {
        setServices(response.data);
        if (response.meta) {
          setTotalServices(response.meta.total);
          setTotalPages(response.meta.totalPages);
        }

        // Extract unique categories
        // const uniqueCategories = [...new Set(response.data.map(service => service.category))];
      } else {
        addToast({ type: 'error', title: response.message || 'Failed to load services' });
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      addToast({ type: 'error', title: 'Failed to load services' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, addToast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadServices();
  };

  const handleAddService = async (serviceData: CreateServiceDto | UpdateServiceDto) => {
    try {
      const response = await servicesService.create(serviceData as CreateServiceDto);
      if (response.success) {
        addToast({ type: 'success', title: 'Service added successfully' });
        setShowAddModal(false);
        loadServices();
      } else {
        addToast({ type: 'error', title: response.message || 'Failed to add service' });
      }
    } catch (error) {
      console.error('Failed to add service:', error);
      addToast({ type: 'error', title: 'Failed to add service' });
    }
  };

  const handleEditService = async (serviceData: CreateServiceDto | UpdateServiceDto) => {
    if (!editingService) return;

    try {
      const response = await servicesService.update(editingService.id, serviceData as UpdateServiceDto);
      if (response.success) {
        addToast({ type: 'success', title: 'Service updated successfully' });
        setShowEditModal(false);
        setEditingService(null);
        loadServices();
      } else {
        addToast({ type: 'error', title: response.message || 'Failed to update service' });
      }
    } catch (error) {
      console.error('Failed to update service:', error);
      addToast({ type: 'error', title: 'Failed to update service' });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await servicesService.delete(serviceId);
      if (response.success) {
        addToast({ type: 'success', title: 'Service deleted successfully' });
        loadServices();
      } else {
        addToast({ type: 'error', title: response.message || 'Failed to delete service' });
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      addToast({ type: 'error', title: 'Failed to delete service' });
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setShowEditModal(true);
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'N/A';
    return `RWF ${price.toLocaleString()}`;
  };

  // Server-side pagination and filtering handles all the logic

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {canManageServices && (
        <div className="mb-4">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7318] flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Service</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8621] focus:border-transparent"
                />
              </div>
            </form>

            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">All Categories</option>
                      {serviceCategories.map(category => (
                        <option key={category} value={category}>
                          {getCategoryDisplayName(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-3 py-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setCategoryFilter('');
                        setCurrentPage(1);
                        setShowFilterDropdown(false);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Service Name
                  {sortField === 'name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Category
                  {sortField === 'category' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSort('singlePrice')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Single Price
                  {sortField === 'singlePrice' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Combined Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {canManageServices && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5A8621]"></div>
                      <span className="ml-2 text-gray-500">Loading services...</span>
                    </div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No services found
                  </td>
                </tr>
              ) : (
                Array.isArray(services) && services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{service.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#BCF099', color: '#166534'}}>
                        {getCategoryDisplayName(service.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(service.singlePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(service.combinedPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(service.childPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        service.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManageServices && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(service)}
                            className="text-[#BCF099] hover:text-[#9ACD32]"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalServices}
            />
          </div>
        )}
      </div>

      {canManageServices && showAddModal && (
        <AddServiceModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddService}
        />
      )}

      {canManageServices && showEditModal && editingService && (
        <AddServiceModal
          onClose={() => {
            setShowEditModal(false);
            setEditingService(null);
          }}
          onSubmit={handleEditService}
          editingService={editingService}
        />
      )}
    </div>
  );
}