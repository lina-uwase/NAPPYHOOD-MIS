"use client"
import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { CreateSaleDto } from '../../services/salesService';
import purchaseService, { AvailablePurchase, AvailableProduct } from '../../services/purchaseService';

interface AddSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSale: (sale: CreateSaleDto) => Promise<void>;
}

const AddSalesModal: React.FC<AddSalesModalProps> = ({ isOpen, onClose, onAddSale }) => {
  const [formData, setFormData] = useState({
    purchase_id: '',
    quantity: '',
    unit_price: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<AvailablePurchase | null>(null);
  const [showPurchaseDropdown, setShowPurchaseDropdown] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);

  const searchAvailablePurchases = async (query: string) => {
    if (!query || query.length < 2) {
      setAvailableProducts([]);
      return;
    }

    try {
      setLoadingPurchases(true);
      const response = await purchaseService.searchAvailable(query);
      if (response.success) {
        setAvailableProducts(response.data);
      }
    } catch (error) {
      console.error('Error searching purchases:', error);
      setAvailableProducts([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchAvailablePurchases(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePurchaseSelect = (purchase: AvailablePurchase) => {
    setSelectedPurchase(purchase);
    setFormData(prev => ({
      ...prev,
      purchase_id: purchase.purchase_id.toString(),
      unit_price: purchase.selling_price.toString()
    }));
    setMaxQuantity(purchase.remaining_quantity);
    setSearchTerm(purchase.Product.name);
    setShowPurchaseDropdown(false);
    
    if (errors.purchase_id) {
      setErrors(prev => ({
        ...prev,
        purchase_id: ''
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity' && selectedPurchase) {
      const qty = parseInt(value) || 0;
      if (qty > maxQuantity) {
        setErrors(prev => ({
          ...prev,
          quantity: `Maximum available quantity is ${maxQuantity}`
        }));
        return;
      }
    }
    
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.purchase_id) {
      newErrors.purchase_id = 'Please select a product';
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    } else if (selectedPurchase && parseInt(formData.quantity) > maxQuantity) {
      newErrors.quantity = `Maximum available quantity is ${maxQuantity}`;
    }
    
    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      newErrors.unit_price = 'Selling price must be greater than 0';
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
      const saleData: CreateSaleDto = {
        purchase_id: parseInt(formData.purchase_id),
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price)
      };
      
      await onAddSale(saleData);
      
      setFormData({
        purchase_id: '',
        quantity: '',
        unit_price: ''
      });
      setSelectedPurchase(null);
      setSearchTerm('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error recording sale:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (Object.values(formData).some(value => value)) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const price = parseFloat(formData.unit_price) || 0;
    return quantity * price;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Record Sale</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowPurchaseDropdown(true);
                    if (!e.target.value) {
                      setSelectedPurchase(null);
                      setFormData(prev => ({ ...prev, purchase_id: '', unit_price: '' }));
                      setMaxQuantity(0);
                    }
                  }}
                  onFocus={() => searchTerm && setShowPurchaseDropdown(true)}
                  placeholder="Search for a product..."
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                    errors.purchase_id ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              
              {showPurchaseDropdown && searchTerm && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingPurchases ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                  ) : availableProducts.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No available products found</div>
                  ) : (
                    availableProducts.map(availableProduct => (
                      <div key={availableProduct.product.product_id} className="border-b border-gray-100 last:border-b-0">
                        <div className="px-4 py-2 bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{availableProduct.product.name}</div>
                          <div className="text-xs text-gray-500">
                            {availableProduct.product.manufacturer} | Total stock: {availableProduct.totalStock} units
                          </div>
                        </div>
                        {availableProduct.purchases.map(purchase => (
                          <button
                            key={purchase.purchase_id}
                            type="button"
                            onClick={() => handlePurchaseSelect(purchase)}
                            className="w-full px-4 py-2 text-left hover:bg-[#F8FAFC]"
                          >
                            <div className="text-xs text-gray-700">
                              Batch: {purchase.batch_number} | Available: {purchase.remaining_quantity} units
                            </div>
                            <div className="text-xs text-gray-500">
                              Expires: {new Date(purchase.expiry_date).toLocaleDateString()} | Price: {formatCurrency(purchase.selling_price)}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.purchase_id && (
              <p className="mt-1 text-xs text-red-600">{errors.purchase_id}</p>
            )}
            {selectedPurchase && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                Selected: {selectedPurchase.Product.name} (Batch: {selectedPurchase.batch_number}) - 
                Available: {selectedPurchase.remaining_quantity} units
              </div>
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
              max={maxQuantity || undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                errors.quantity ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter quantity"
              disabled={!selectedPurchase}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Selling Price per Item (RWF) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                errors.unit_price ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter selling price"
              disabled={!selectedPurchase}
            />
            {errors.unit_price && (
              <p className="mt-1 text-xs text-red-600">{errors.unit_price}</p>
            )}
          </div>

          {formData.quantity && formData.unit_price && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
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
              disabled={isSubmitting || !selectedPurchase}
              className="px-4 py-2 rounded-lg bg-[#009900] text-white hover:bg-[#008800] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recording...
                </>
              ) : (
                'Record Sale'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalesModal;