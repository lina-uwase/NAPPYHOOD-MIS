"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Trash2, Edit, ChevronDown, Plus, RefreshCw, FileDown, UploadCloud } from 'lucide-react';
import FileUploadButton from '../../components/FileUploadButton';
import { useTitle } from '../../contexts/TitleContext';
import AddProductModal from './AddProductModal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import productsService, { Product, CreateProductDto, UpdateProductDto } from '../../services/productsService';

export default function ProductsPage() {
  const { setTitle } = useTitle();
  const { addToast } = useToast();

  useEffect(() => {
    setTitle("Products");
  }, [setTitle]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productsService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        manufacturer: manufacturerFilter || undefined,
      });
      
      if (response.success) {
        setProducts(response.data);
        if (response.meta) {
          setTotalProducts(response.meta.total);
          setTotalPages(response.meta.totalPages);
        }
        
        const uniqueManufacturers = [...new Set(response.data.map(p => p.manufacturer))];
        setManufacturers(uniqueManufacturers);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      addToast({
        type: 'error',
        title: 'Error loading products',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load products. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, manufacturerFilter, addToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddProduct = async (newProduct: CreateProductDto | UpdateProductDto) => {
    try {
      const response = await productsService.create(newProduct as CreateProductDto);
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Product added successfully',
          message: `${(newProduct as CreateProductDto).name} has been added to the inventory.`
        });
        setShowAddModal(false);
        loadProducts();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error adding product',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add product. Please try again.'
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (updatedProduct: CreateProductDto | UpdateProductDto) => {
    if (!editingProduct) return;
    
    try {
      const response = await productsService.update(editingProduct.product_id, updatedProduct as UpdateProductDto);
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Product updated successfully',
          message: `${(updatedProduct as UpdateProductDto).name || 'Product'} has been updated.`
        });
        setShowEditModal(false);
        setEditingProduct(null);
        loadProducts();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error updating product',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update product. Please try again.'
      });
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await productsService.delete(id);
        if (response.success) {
          addToast({
            type: 'success',
            title: 'Product deleted successfully',
            message: 'The product has been removed from the inventory.'
          });
          loadProducts();
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error deleting product',
          message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete product. Please try again.'
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

  const sortedProducts = [...products].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof Product];
    const bValue = b[sortField as keyof Product];
    
    if (aValue == null || bValue == null) return 0;
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
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
                {manufacturerFilter || 'All Manufacturers'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setManufacturerFilter('');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] first:rounded-t-lg ${
                    !manufacturerFilter ? 'bg-[#F8FAFC] text-[#009900]' : ''
                  }`}
                >
                  All Manufacturers
                </button>
                {manufacturers.map(manufacturer => (
                  <button
                    key={manufacturer}
                    onClick={() => {
                      setManufacturerFilter(manufacturer);
                      setShowFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] last:rounded-b-lg ${
                      manufacturerFilter === manufacturer ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                  >
                    {manufacturer}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={loadProducts}
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
          Add Product
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
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th 
                className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Product name
                  {sortField === 'name' && (
                    <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('manufacturer')}
              >
                <div className="flex items-center">
                  Manufacturer
                  {sortField === 'manufacturer' && (
                    <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </th>
              <th 
                className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('manufacturing_country')}
              >
                <div className="flex items-center">
                  Manufacturing country
                  {sortField === 'manufacturing_country' && (
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
                <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#009900] mr-2"></div>
                    Loading products...
                  </div>
                </td>
              </tr>
            ) : sortedProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              Array.isArray(sortedProducts) && sortedProducts.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-base text-gray-900">{product.product_id}</td>
                  <td className="py-4 px-6 text-base text-gray-900 font-medium">{product.name}</td>
                  <td className="py-4 px-6 text-base text-gray-600">{product.manufacturer}</td>
                  <td className="py-4 px-6 text-base text-gray-600">{product.manufacturing_country}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-gray-400 hover:text-[#009900] hover:bg-[#F8FAFC] rounded transition-colors"
                        title="Edit product"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.product_id, product.name)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete product"
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

        {!loading && products.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalProducts}
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
        <AddProductModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onAddProduct={handleAddProduct}
        />
      )}

      {showEditModal && editingProduct && (
        <AddProductModal 
          isOpen={showEditModal} 
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onAddProduct={handleUpdateProduct}
          editingProduct={editingProduct}
        />
      )}
    </div>
  );
}