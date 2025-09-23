"use client"
import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Calendar, Search } from 'lucide-react';
import { Purchase, CreatePurchaseDto, UpdatePurchaseDto } from '../../services/purchaseService';
import productsService, { Product } from '../../services/productsService';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPurchase: (purchase: CreatePurchaseDto | UpdatePurchaseDto) => void;
  editingPurchase?: Purchase | null;
}

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({ isOpen, onClose, onAddPurchase, editingPurchase }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    batch_number: '',
    quantity: '',
    purchase_price: '',
    selling_price: '',
    expiry_date: '',
    supplier: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await productsService.getAll({ limit: 100 });
        if (response.success) {
          setProducts(response.data);
          setFilteredProducts(response.data);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (productSearch) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.manufacturer.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productSearch, products]);

  useEffect(() => {
    if (editingPurchase) {
      setFormData({
        product_id: editingPurchase.product_id.toString(),
        batch_number: editingPurchase.batch_number,
        quantity: editingPurchase.quantity.toString(),
        purchase_price: editingPurchase.purchase_price.toString(),
        selling_price: editingPurchase.selling_price.toString(),
        expiry_date: editingPurchase.expiry_date.split('T')[0], // Format date for input
        supplier: editingPurchase.supplier || ''
      });
      
      const product = products.find(p => p.product_id === editingPurchase.product_id);
      if (product) {
        setProductSearch(product.name);
      }
    } else {
      setFormData({
        product_id: '',
        batch_number: '',
        quantity: '',
        purchase_price: '',
        selling_price: '',
        expiry_date: '',
        supplier: ''
      });
      setProductSearch('');
    }
    setErrors({});
  }, [editingPurchase, products]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProductSelect = (product: Product) => {
    setFormData(prev => ({
      ...prev,
      product_id: product.product_id.toString()
    }));
    setProductSearch(product.name);
    setShowProductDropdown(false);
    
    if (errors.product_id) {
      setErrors(prev => ({
        ...prev,
        product_id: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.product_id) {
      newErrors.product_id = 'Product is required';
    }
    
    if (!formData.batch_number.trim()) {
      newErrors.batch_number = 'Batch number is required';
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.purchase_price || parseFloat(formData.purchase_price) <= 0) {
      newErrors.purchase_price = 'Purchase price must be greater than 0';
    }
    
    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      newErrors.selling_price = 'Selling price must be greater than 0';
    }
    
    if (!formData.expiry_date) {
      newErrors.expiry_date = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate <= today) {
        newErrors.expiry_date = 'Expiry date must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const purchaseData: CreatePurchaseDto | UpdatePurchaseDto = {
        product_id: parseInt(formData.product_id),
        batch_number: formData.batch_number.trim(),
        quantity: parseInt(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        expiry_date: formData.expiry_date,
        supplier: formData.supplier.trim() || undefined
      };
      
      await onAddPurchase(purchaseData);
      
      setFormData({
        product_id: '',
        batch_number: '',
        quantity: '',
        purchase_price: '',
        selling_price: '',
        expiry_date: '',
        supplier: ''
      });
      setProductSearch('');
      setErrors({});
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (Object.values(formData).some(value => value.trim() !== '')) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
        setFormData({
          product_id: '',
          batch_number: '',
          quantity: '',
          purchase_price: '',
          selling_price: '',
          expiry_date: '',
          supplier: ''
        });
          setProductSearch('');
        setErrors({});
      }
    } else {
      onClose();
    }
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.purchase_price) || 0;
    return quantity * price;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingPurchase ? 'Edit Purchase' : 'Record Purchase'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Search for a product..."
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                      errors.product_id ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
                
                {showProductDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {loadingProducts ? (
                      <div className="px-4 py-3 text-sm text-gray-500">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                    ) : (
                      filteredProducts.map(product => (
                        <button
                          key={product.product_id}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className="w-full px-4 py-2 text-left hover:bg-[#F8FAFC] border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.manufacturer}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.product_id && (
                <p className="mt-1 text-xs text-red-600">{errors.product_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Batch Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                  errors.batch_number ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter batch number"
              />
              {errors.batch_number && (
                <p className="mt-1 text-xs text-red-600">{errors.batch_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                  errors.quantity ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Purchase Price (RWF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                  errors.purchase_price ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter purchase price"
              />
              {errors.purchase_price && (
                <p className="mt-1 text-xs text-red-600">{errors.purchase_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Selling Price (RWF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                  errors.selling_price ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter selling price"
              />
              {errors.selling_price && (
                <p className="mt-1 text-xs text-red-600">{errors.selling_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                    errors.expiry_date ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              </div>
              {errors.expiry_date && (
                <p className="mt-1 text-xs text-red-600">{errors.expiry_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent"
                placeholder="Enter supplier name"
              />
            </div>
          </div>

          {formData.quantity && formData.purchase_price && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Purchase Value:</span>
                <span className="text-lg font-semibold text-[#009900]">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#009900] text-white hover:bg-[#008800] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingPurchase ? 'Updating...' : 'Recording...'}
                </>
              ) : (
                editingPurchase ? 'Update Purchase' : 'Record Purchase'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseModal;