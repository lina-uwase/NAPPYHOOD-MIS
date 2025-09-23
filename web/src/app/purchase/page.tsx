"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Trash2, Edit, ChevronDown, Plus, RefreshCw, AlertTriangle, ShieldCheck, FileDown, UploadCloud } from 'lucide-react';
import { useTitle } from '../../contexts/TitleContext';
import AddPurchaseModal from './AddPurchaseModal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import purchaseService, { Purchase, CreatePurchaseDto, UpdatePurchaseDto } from '../../services/purchaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function PurchasePage() {
  const { setTitle } = useTitle();
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setTitle("Purchases");
  }, [setTitle]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [suppliers, setSuppliers] = useState<string[]>([]);

  const loadPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await purchaseService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        supplier: supplierFilter || undefined,
      });
      
      if (response.success) {
        console.log("response.data: ", response.data);
        setPurchases(response.data);
        if (response.meta) {
          setTotalPurchases(response.meta.total);
          setTotalPages(response.meta.totalPages);
        }
        
        const uniqueSuppliers = [...new Set(response.data
          .map(p => p.supplier)
          .filter(s => s) as string[])];
        setSuppliers(uniqueSuppliers);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      addToast({
        type: 'error',
        title: 'Error loading purchases',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load purchases. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, supplierFilter, addToast]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const handleAddPurchase = async (newPurchase: CreatePurchaseDto | UpdatePurchaseDto) => {
    try {
      const response = await purchaseService.create(newPurchase as CreatePurchaseDto);
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Purchase recorded successfully',
          message: `Purchase of ${(newPurchase as CreatePurchaseDto).quantity} units has been recorded.`
        });
        setShowAddModal(false);
        loadPurchases();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error recording purchase',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to record purchase. Please try again.'
      });
    }
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setShowEditModal(true);
  };

  const handleUpdatePurchase = async (updatedPurchase: CreatePurchaseDto | UpdatePurchaseDto) => {
    if (!editingPurchase) return;
    
    try {
      const response = await purchaseService.update(editingPurchase.purchase_id, updatedPurchase as UpdatePurchaseDto);
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Purchase updated successfully',
          message: 'The purchase record has been updated.'
        });
        setShowEditModal(false);
        setEditingPurchase(null);
        loadPurchases();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error updating purchase',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update purchase. Please try again.'
      });
    }
  };

  const handleDeletePurchase = async (id: number, batchNumber: string) => {
    if (window.confirm(`Are you sure you want to delete purchase with batch number "${batchNumber}"?`)) {
      try {
        const response = await purchaseService.delete(id);
        if (response.success) {
          addToast({
            type: 'success',
            title: 'Purchase deleted successfully',
            message: 'The purchase record has been removed.'
          });
          loadPurchases();
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error deleting purchase',
          message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete purchase. Please try again.'
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

  const sortedPurchases = [...purchases].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof Purchase];
    const bValue = b[sortField as keyof Purchase];
    
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

  const isExpiringNear = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only administrators can access purchase management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by batch or product"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#009900] focus:border-[#009900] w-64 text-base"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-[#F8FAFC]"
            >
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-base text-gray-600">
                {supplierFilter || 'All Suppliers'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setSupplierFilter('');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] first:rounded-t-lg ${
                    !supplierFilter ? 'bg-[#F8FAFC] text-[#009900]' : ''
                  }`}
                >
                  All Suppliers
                </button>
                {suppliers.map(supplier => (
                  <button
                    key={supplier}
                    onClick={() => {
                      setSupplierFilter(supplier);
                      setShowFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] last:rounded-b-lg ${
                      supplierFilter === supplier ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                  >
                    {supplier}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={loadPurchases}
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
          Add Purchase
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-end p-4 border-b border-gray-200 gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50">
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50">
            <UploadCloud className="w-4 h-4" />
            Upload
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th 
                className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('batch_number')}
              >
                <div className="flex items-center">
                  Batch number
                  {sortField === 'batch_number' && (
                    <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Initial Qty</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Remaining Qty</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Purchase price</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Selling price</th>
              <th 
                className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('expiry_date')}
              >
                <div className="flex items-center">
                  Expiry date
                  {sortField === 'expiry_date' && (
                    <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#009900] mr-2"></div>
                    Loading purchases...
                  </div>
                </td>
              </tr>
            ) : sortedPurchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                  No purchases found
                </td>
              </tr>
            ) : (
              Array.isArray(sortedPurchases) && sortedPurchases.map((purchase) => (
                <tr key={purchase.purchase_id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-base font-medium text-gray-900">
                        {purchase.Product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {purchase.Product?.manufacturer}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-base text-gray-900">{purchase.batch_number}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <span className="text-base text-gray-900">{purchase.quantity}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-base font-medium ${
                      purchase.remaining_quantity === 0 ? 'text-red-600' :
                      purchase.remaining_quantity < purchase.quantity * 0.2 ? 'text-yellow-600' :
                      'text-gray-900'
                    }`}>
                      {purchase.remaining_quantity}
                    </span>
                    {purchase.remaining_quantity === 0 && (
                      <span className="ml-1 text-sm text-red-500">(Out of stock)</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-base text-gray-900">{formatCurrency(purchase.purchase_price)}</td>
                  <td className="py-4 px-6 text-base text-gray-900">{formatCurrency(purchase.selling_price)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      {isExpired(purchase.expiry_date) && (
                        <span title="Expired">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </span>
                      )}
                      {!isExpired(purchase.expiry_date) && isExpiringNear(purchase.expiry_date) && (
                        <span title="Expiring soon">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                      <span className={`text-base ${
                        isExpired(purchase.expiry_date) ? 'text-red-600 font-medium' :
                        isExpiringNear(purchase.expiry_date) ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {formatDate(purchase.expiry_date)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-base text-gray-600">{purchase.supplier || '-'}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleEditPurchase(purchase)}
                        className="p-2 text-gray-400 hover:text-[#009900] hover:bg-[#F8FAFC] rounded transition-colors"
                        title="Edit purchase"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeletePurchase(purchase.purchase_id, purchase.batch_number)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete purchase"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && purchases.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalPurchases}
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
        <AddPurchaseModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onAddPurchase={handleAddPurchase}
        />
      )}

      {showEditModal && editingPurchase && (
        <AddPurchaseModal 
          isOpen={showEditModal} 
          onClose={() => {
            setShowEditModal(false);
            setEditingPurchase(null);
          }}
          onAddPurchase={handleUpdatePurchase}
          editingPurchase={editingPurchase}
        />
      )}
    </div>
  );
}