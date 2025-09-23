"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Trash2, ChevronDown, Plus, RefreshCw, User, CalendarDays, FileDown, UploadCloud } from 'lucide-react';
import FileUploadButton from '../../components/FileUploadButton';
import { useTitle } from '../../contexts/TitleContext';
import AddSalesModal from './AddSalesModal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import salesService, { Sale, CreateSaleDto } from '../../services/salesService';

export default function SalesPage() {
  const { setTitle } = useTitle();
  const { addToast } = useToast();

  useEffect(() => {
    setTitle("Sales");
  }, [setTitle]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [users, setUsers] = useState<string[]>([]);


  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      };

      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await salesService.getAll(params);
      
      if (response.success) {
        const salesData = Array.isArray(response.data) ? response.data : [];
        setSales(salesData);
        if (response.meta) {
          setTotalSales(response.meta.total);
          setTotalPages(response.meta.totalPages);
        }

        const uniqueUsers = [...new Set(salesData
          .map(s => s.User?.names)
          .filter(u => u) as string[])];
        setUsers(uniqueUsers);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
      setUsers([]);
      addToast({
        type: 'error',
        title: 'Error loading sales',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load sales. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, startDate, endDate, addToast]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const handleAddSale = async (newSale: CreateSaleDto) => {
    try {
      const response = await salesService.create(newSale);
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Sale recorded successfully',
          message: `Sale of ${newSale.quantity} units has been recorded.`
        });
        setShowAddModal(false);
        loadSales();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error recording sale',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to record sale. Please try again.'
      });
      throw error; // Re-throw to handle in modal
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this sale record?')) {
      try {
        const response = await salesService.delete(id);
        if (response.success) {
          addToast({
            type: 'success',
            title: 'Sale deleted successfully',
            message: 'The sale record has been removed.'
          });
          loadSales();
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error deleting sale',
          message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete sale. Please try again.'
        });
      }
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedSales = [...sales]
    .filter(sale => {
      if (userFilter && sale.User?.names !== userFilter) {
        return false;
      }
      if (productFilter && sale.Purchase?.Product?.name !== productFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      const aValue = a[sortField as keyof Sale];
      const bValue = b[sortField as keyof Sale];
      
      if (aValue == null || bValue == null) return 0;
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-RW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };




  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-wrap">
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
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#009900] focus:border-[#009900] w-48 text-base"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowProductDropdown(false);
                setShowDatePicker(false);
              }}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-[#F8FAFC]"
            >
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-base text-gray-600">
                {userFilter || 'All Users'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            
            {showUserDropdown && (
              <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setUserFilter('');
                    setShowUserDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] first:rounded-t-lg ${
                    !userFilter ? 'bg-[#F8FAFC] text-[#009900]' : ''
                  }`}
                >
                  All Users
                </button>
                {Array.isArray(users) && users.map(user => (
                  <button
                    key={user}
                    onClick={() => {
                      setUserFilter(user);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] last:rounded-b-lg ${
                      userFilter === user ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                  >
                    {user}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowProductDropdown(!showProductDropdown);
                setShowUserDropdown(false);
                setShowDatePicker(false);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-[#F8FAFC]"
            >
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {productFilter || 'All Products'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            
            {showProductDropdown && (
              <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setProductFilter('');
                    setShowProductDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] first:rounded-t-lg ${
                    !productFilter ? 'bg-[#F8FAFC] text-[#009900]' : ''
                  }`}
                >
                  All Products
                </button>
                {Array.isArray(sales) && [...new Set(sales.map(s => s.Purchase?.Product?.name).filter(p => p))].map(product => (
                  <button
                    key={product}
                    onClick={() => {
                      setProductFilter(product as string);
                      setShowProductDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] last:rounded-b-lg ${
                      productFilter === product ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                  >
                    {product}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowUserDropdown(false);
                setShowProductDropdown(false);
              }}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-[#F8FAFC]"
            >
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <span className="text-base text-gray-600">
                {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Date Range'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            
            {showDatePicker && (
              <div className="absolute z-10 mt-1 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#009900] focus:border-[#009900]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#009900] focus:border-[#009900]"
                    />
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setCurrentPage(1);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="text-xs text-[#009900] hover:text-[#008800] font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={loadSales}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#009900] text-white px-6 py-3 rounded-lg hover:bg-[#008800] transition-colors font-medium text-base flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add Sale
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-end p-4 border-b border-gray-200 gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50">
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          <FileUploadButton
            label={
              <span className="flex items-center gap-1">
                <UploadCloud className="w-4 h-4" />
                Upload
              </span> as unknown as string
            }
            className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onSelect={(file) => addToast({ type: 'success', title: 'File selected', message: file.name })}
          />
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
              <th 
                className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('total_price')}
              >
                <div className="flex items-center">
                  Total Price
                  {sortField === 'total_price' && (
                    <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Sold By</th>
              <th 
                className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Date & Time
                  {sortField === 'created_at' && (
                    <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#009900] mr-2"></div>
                    Loading sales...
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                  No sales found
                </td>
              </tr>
            ) : (
              Array.isArray(filteredAndSortedSales) && filteredAndSortedSales.map((sale) => (
                <tr key={sale.sale_id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <p className="text-base font-medium text-gray-900">
                      {sale.Purchase?.Product?.name || 'Unknown Product'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Batch: {sale.Purchase?.batch_number}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-base text-gray-900">{sale.quantity}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-base text-gray-900">{formatCurrency(sale.Purchase?.selling_price || 0)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-base font-medium text-gray-900">{formatCurrency(sale.total_price)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-base text-gray-900">
                        {sale.User?.names || 'System'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-base text-gray-900">{formatDate(sale.created_at)}</p>
                      <p className="text-sm text-gray-500">{formatTime(sale.created_at)}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button 
                      onClick={() => handleDeleteSale(sale.sale_id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete sale"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && sales.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalSales}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </div>

      {showAddModal && (
        <AddSalesModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onAddSale={handleAddSale}
        />
      )}
    </div>
  );
}