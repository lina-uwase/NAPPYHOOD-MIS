"use client"
import React, { useState, useEffect } from 'react';
import { X, Search, Loader, XCircle, Send } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import customersService, { Customer } from '../../services/customersService';

interface SendWhatsAppModalProps {
  onClose: () => void;
  onSend: () => void; // Triggered when successfully sent to refresh data if needed
}

export type MessageTarget = 'ALL' | 'MALE' | 'FEMALE' | 'SPECIFIC';

const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({ onClose, onSend }) => {
  const { showSuccess, showError } = useNotification();
  
  const [target, setTarget] = useState<MessageTarget>('ALL');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Specific Customer Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const searchCustomers = async () => {
      if (target !== 'SPECIFIC' || !searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await customersService.getAll({
          search: searchQuery,
          limit: 10
        });
        
        // Filter out customers that are already selected
        const results = response.data.filter(c => 
          !selectedCustomers.find(selected => selected.id === c.id) && c.phone
        );
        
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search customers:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchCustomers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, target, selectedCustomers]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomers(prev => [...prev, customer]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveCustomer = (id: string) => {
    setSelectedCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showError('Message content cannot be empty');
      return;
    }

    if (target === 'SPECIFIC' && selectedCustomers.length === 0) {
      showError('Please select at least one customer');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        message: message.trim(),
        target,
        customerIds: target === 'SPECIFIC' ? selectedCustomers.map(c => c.id) : undefined
      };

      const res = await customersService.sendBulkMessage(payload);
      
      if (res.success) {
        showSuccess(`Successfully sent ${res.data?.successCount || 0} messages. (${res.data?.failCount || 0} failed)`);
        onSend();
        onClose();
      } else {
        showError(res.message || 'Failed to send messages');
      }
    } catch (error: any) {
      console.error('Failed to send bulk message:', error);
      showError(error.response?.data?.error || error.message || 'Failed to send messages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send WhatsApp Message</h2>
            <p className="text-sm text-gray-500 mt-1">Broadcast custom messages to a group of customers.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audience *</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { value: 'ALL', label: 'All Customers' },
                { value: 'MALE', label: 'Male Only' },
                { value: 'FEMALE', label: 'Female Only' },
                { value: 'SPECIFIC', label: 'Specific...' },
              ].map((option) => (
                <div 
                  key={option.value}
                  onClick={() => setTarget(option.value as MessageTarget)}
                  className={`border rounded-md p-3 text-center cursor-pointer transition-colors ${
                    target === option.value 
                      ? 'bg-[#5A8621] text-white border-[#5A8621]' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specific Customer Selection UI */}
          {target === 'SPECIFIC' && (
            <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <label className="block text-sm font-medium text-gray-700">Search Customers</label>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621] bg-white"
                />
                {isSearching && (
                  <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
              </div>

              {showDropdown && searchQuery.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white shadow-lg relative z-10">
                  {searchResults.length > 0 ? (
                    searchResults.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium">{customer.fullName || customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center text-sm">
                      {isSearching ? 'Searching...' : 'No customers found with a registered phone number'}
                    </div>
                  )}
                </div>
              )}

              {selectedCustomers.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Selected ({selectedCustomers.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomers.map(customer => (
                      <div key={customer.id} className="flex items-center bg-[#5A8621]/10 text-[#5A8621] px-3 py-1 rounded-full text-sm font-medium border border-[#5A8621]/20">
                        {customer.fullName || customer.name}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveCustomer(customer.id)}
                          className="ml-2 text-[#5A8621] hover:text-red-600 focus:outline-none"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Content *
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] resize-none"
              placeholder="Type your WhatsApp message here. Use {CustomerName} to substitute their actual name. e.g. 'Hello {CustomerName}, happy holidays from Nappyhood!'"
            />
            <p className="mt-1 text-xs text-gray-500">
              Hint: You can use <strong>{`{CustomerName}`}</strong> to automatically insert their name.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-[#009900] rounded-md hover:bg-[#008800] transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendWhatsAppModal;
