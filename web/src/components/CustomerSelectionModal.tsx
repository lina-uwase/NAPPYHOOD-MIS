import React, { useState, useEffect } from 'react';
import { X, Search, Check, Smartphone, Users } from 'lucide-react';
import customersService, { Customer } from '../services/customersService';
import { useNotification } from '../contexts/NotificationContext';

interface CustomerSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedIds: string[]) => void;
    loading?: boolean;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    loading = false
}) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [fetching, setFetching] = useState(false);
    const { showError } = useNotification();

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
        }
    }, [isOpen]);

    const fetchCustomers = async () => {
        try {
            setFetching(true);
            // Fetch all customers (limit 1000 for now, could be paginated)
            const res = await customersService.getAll({ limit: 1000 });
            // Filter only those with phone numbers
            const validCustomers = (res.data || []).filter(c => c.phone);
            setCustomers(validCustomers);
        } catch (error) {
            console.error('Failed to fetch customers', error);
            showError('Error', 'Failed to load customers');
        } finally {
            setFetching(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === filteredCustomers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCustomers.map(c => c.id));
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Select Customers to Notify
                                </h3>
                                <div className="mt-2">
                                    <div className="relative rounded-md shadow-sm mb-4">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="focus:ring-[#5A8621] focus:border-[#5A8621] block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Search customers..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
                                        <span>{selectedIds.length} selected</span>
                                        <button onClick={selectAll} className="text-[#5A8621] hover:underline">
                                            {selectedIds.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto border rounded-md">
                                        {fetching ? (
                                            <div className="p-4 text-center">Loading...</div>
                                        ) : filteredCustomers.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">No customers found</div>
                                        ) : (
                                            <ul className="divide-y divide-gray-200">
                                                {filteredCustomers.map((customer) => (
                                                    <li
                                                        key={customer.id}
                                                        className={`p-3 flex items-center hover:bg-gray-50 cursor-pointer ${selectedIds.includes(customer.id) ? 'bg-green-50' : ''}`}
                                                        onClick={() => toggleSelection(customer.id)}
                                                    >
                                                        <div className="flex-shrink-0 mr-3">
                                                            <div className={`w-5 h-5 border rounded flex items-center justify-center ${selectedIds.includes(customer.id) ? 'bg-[#5A8621] border-[#5A8621]' : 'border-gray-300'}`}>
                                                                {selectedIds.includes(customer.id) && <Check size={14} className="text-white" />}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{customer.fullName}</p>
                                                            <p className="text-xs text-gray-500 truncate flex items-center">
                                                                <Smartphone size={10} className="mr-1" /> {customer.phone}
                                                            </p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#5A8621] text-base font-medium text-white hover:bg-[#4A7219] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            onClick={() => onConfirm(selectedIds)}
                            disabled={loading || selectedIds.length === 0}
                        >
                            {loading ? 'Sending...' : `Send to ${selectedIds.length}`}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSelectionModal;
