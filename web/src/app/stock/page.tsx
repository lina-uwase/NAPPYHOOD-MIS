"use client"
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Package, TrendingUp } from 'lucide-react';
import { useTitle } from '../../contexts/TitleContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import productsService, { Product, CreateProductDto, UpdateProductDto } from '../../services/productsService';
import AddProductModal from './AddProductModal';

export default function StockPage() {
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const userRole = user?.role;
  const canManageStock = userRole === 'ADMIN' || userRole === 'MANAGER';
  const canViewStock = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'STAFF';

  useEffect(() => {
    setTitle("Stock");
  }, [setTitle]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToIncrease, setProductToIncrease] = useState<Product | null>(null);
  const [increaseQuantity, setIncreaseQuantity] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletingLoad, setDeletingLoad] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsService.getAll();
      if (response.success) {
        setProducts(response.data);
      } else {
        showError('Failed to load products');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (data: CreateProductDto | UpdateProductDto) => {
    try {
      const response = await productsService.create(data as CreateProductDto);
      if (response.success) {
        showSuccess('Product added successfully');
        setShowAddModal(false);
        fetchProducts();
      } else {
        showError(response.message || 'Failed to add product');
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to add product');
    }
  };

  const handleUpdateProduct = async (data: CreateProductDto | UpdateProductDto) => {
    if (!editingProduct) return;
    try {
      const response = await productsService.update(editingProduct.id, data as UpdateProductDto);
      if (response.success) {
        showSuccess('Product updated successfully');
        setShowEditModal(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        showError(response.message || 'Failed to update product');
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to update product');
    }
  };

  const handleIncreaseStock = async () => {
    if (!productToIncrease || !increaseQuantity) return;
    const quantity = parseInt(increaseQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      showError('Please enter a valid quantity');
      return;
    }

    try {
      const response = await productsService.increaseStock(productToIncrease.id, quantity);
      if (response.success) {
        showSuccess(`Stock increased by ${quantity}. New quantity: ${response.data.quantity}`);
        setShowIncreaseModal(false);
        setProductToIncrease(null);
        setIncreaseQuantity('');
        fetchProducts();
      } else {
        showError(response.message || 'Failed to increase stock');
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to increase stock');
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeletingLoad(true);
    try {
      const response = await productsService.delete(productToDelete.id);
      if (response.success) {
        showSuccess(response.message || 'Product deleted successfully');
        setShowDeleteModal(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        showError(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeletingLoad(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canViewStock) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">You don't have permission to access stock management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-end mb-6">
        {canManageStock && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#5A8621] text-white rounded-lg hover:bg-[#4A7318] transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && filteredProducts.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{filteredProducts.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Sales Revenue</div>
            <div className="text-2xl font-bold text-[#5A8621] mt-1">
              {formatCurrency(
                filteredProducts.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Low Stock Items</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {filteredProducts.filter(p => p.quantity < 10 && p.quantity > 0).length}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A8621]"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Get started by adding a new product'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {canManageStock && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{product.description || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(Number(product.price))}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${product.quantity === 0 ? 'text-red-600' :
                        product.quantity < 10 ? 'text-yellow-600' :
                          'text-gray-900'
                        }`}>
                        {product.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#5A8621]">
                        {formatCurrency(product.totalRevenue || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManageStock && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setProductToIncrease(product);
                              setIncreaseQuantity('');
                              setShowIncreaseModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            title="Increase Stock"
                          >
                            <TrendingUp className="h-4 w-4" />
                            <span>Increase</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowEditModal(true);
                            }}
                            className="text-[#5A8621] hover:text-[#4A7318]"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => handleAddProduct(data)}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <AddProductModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSubmit={handleUpdateProduct}
          editingProduct={editingProduct}
        />
      )}

      {/* Increase Stock Modal */}
      {showIncreaseModal && productToIncrease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Increase Stock</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product: <span className="font-semibold">{productToIncrease.name}</span>
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock: <span className="font-semibold">{productToIncrease.quantity}</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Add *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={increaseQuantity === '0' ? '' : String(increaseQuantity).replace(/^0+/, '')}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d]/g, '');
                    value = value.replace(/^0+/, '') || '';
                    setIncreaseQuantity(value);
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '').replace(/^0+/, '');
                    setIncreaseQuantity(value);
                  }}
                  placeholder="Enter quantity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowIncreaseModal(false);
                  setProductToIncrease(null);
                  setIncreaseQuantity('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleIncreaseStock}
                disabled={!increaseQuantity || parseInt(increaseQuantity) <= 0}
                className="px-4 py-2 bg-[#5A8621] text-white rounded-lg hover:bg-[#4A7318] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Increase Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={
          productToDelete
            ? `Are you sure you want to delete "${productToDelete.name}"? ${productToDelete.quantity > 0
              ? 'This product has stock remaining. If it has been sold, it will be deactivated instead of deleted.'
              : ''
            }`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        loading={deletingLoad}
      />
    </div>
  );
}
