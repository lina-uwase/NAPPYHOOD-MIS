import React, { useState, useEffect } from 'react';
import discountService, { DiscountRule } from '../services/discountService';
import servicesService from '../services/servicesService';
import Pagination from './Pagination'; // Use if pagination needed, though currently list is small
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../contexts/NotificationContext';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Calendar,
    Tag,
    Scissors,
    AlertCircle
} from 'lucide-react';

const DiscountsSection: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<any[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State - value string | number for placeholder support
    const [formData, setFormData] = useState<{
        name: string;
        type: string;
        value: string | number;
        isPercentage: boolean;
        isActive: boolean;
        description: string;
        startDate: string;
        endDate: string;
        applyToAllServices: boolean;
        serviceIds: string[];
    }>({
        name: '',
        type: 'SEASONAL',
        value: '', // Empty string for placeholder
        isPercentage: true,
        isActive: true,
        description: '',
        startDate: '',
        endDate: '',
        applyToAllServices: false,
        serviceIds: []
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);
    const [deletingLoad, setDeletingLoad] = useState(false);

    useEffect(() => {
        fetchDiscounts();
        fetchServices();
    }, []);

    const fetchDiscounts = async () => {
        try {
            const response = await discountService.getAll();
            setDiscounts(response.data || []);
        } catch (error) {
            console.error('Failed to fetch discounts', error);
            showError('Error', 'Failed to load discounts');
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await servicesService.getAll({ limit: 100 });
            setServices(response.data || []);
        } catch (error) {
            console.error('Failed to fetch services', error);
        }
    };

    const validateForm = () => {
        if (!formData.name) return 'Name is required';
        if (!formData.value || Number(formData.value) <= 0) return 'Value must be greater than 0';
        if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
            return 'Start date cannot be after end date';
        }
        if (!formData.applyToAllServices && formData.serviceIds.length === 0) {
            return 'Please select at least one service or apply to all';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            showError('Validation Error', error);
            return;
        }

        try {
            const payload: Partial<DiscountRule> = {
                ...formData,
                value: Number(formData.value),
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                // Ensure serviceIds is sent correctly
                serviceIds: formData.serviceIds
            };

            if (editingId) {
                await discountService.update(editingId, payload);
                showSuccess('Success', 'Discount updated successfully');
            } else {
                await discountService.create(payload);
                showSuccess('Success', 'Discount created successfully');
            }
            setIsModalOpen(false);
            fetchDiscounts();
            resetForm();
        } catch (error: any) {
            console.error('Failed to save discount', error);
            showError('Error', error.response?.data?.error || 'Failed to save discount');
        }
    };

    const confirmDelete = (id: string) => {
        setDiscountToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!discountToDelete) return;
        try {
            setDeletingLoad(true);
            await discountService.delete(discountToDelete);
            showSuccess('Success', 'Discount deleted (deactivated) successfully');
            setDeleteModalOpen(false);
            setDiscountToDelete(null);
            fetchDiscounts();
        } catch (error) {
            console.error('Failed to delete discount', error);
            showError('Error', 'Failed to delete discount');
        } finally {
            setDeletingLoad(false);
        }
    };

    const handleEdit = (discount: DiscountRule) => {
        setEditingId(discount.id);
        setFormData({
            name: discount.name,
            type: discount.type,
            value: discount.value,
            isPercentage: discount.isPercentage,
            isActive: discount.isActive,
            description: discount.description || '',
            startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
            endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
            applyToAllServices: discount.applyToAllServices,
            serviceIds: discount.services ? discount.services.map((s: any) => s.id) : []
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            type: 'SEASONAL',
            value: '',
            isPercentage: true,
            isActive: true,
            description: '',
            startDate: '',
            endDate: '',
            applyToAllServices: false,
            serviceIds: []
        });
    };

    const toggleService = (serviceId: string) => {
        const currentIds = formData.serviceIds || [];
        if (currentIds.includes(serviceId)) {
            setFormData({ ...formData, serviceIds: currentIds.filter(id => id !== serviceId) });
        } else {
            setFormData({ ...formData, serviceIds: [...currentIds, serviceId] });
        }
    };

    return (
        <div className="py-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Discount Rules</h2>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7318] flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Discount
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A8621]"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discounts.map(discount => (
                        <div key={discount.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => handleEdit(discount)} className="text-blue-600 hover:text-blue-800 p-1">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => confirmDelete(discount.id)} className="text-red-600 hover:text-red-800 p-1">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="mb-4">
                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${discount.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {discount.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    {discount.type.replace('_', ' ')}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">{discount.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{discount.description || 'No description'}</p>

                            <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className="text-gray-400" />
                                    <span className="font-semibold">{discount.value}{discount.isPercentage ? '%' : ' RWF'} OFF</span>
                                </div>

                                {(discount.startDate || discount.endDate) && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>
                                            {discount.startDate ? new Date(discount.startDate).toLocaleDateString() : 'Any'} -
                                            {discount.endDate ? new Date(discount.endDate).toLocaleDateString() : 'Any'}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Scissors size={16} className="text-gray-400" />
                                    <span>
                                        {discount.applyToAllServices
                                            ? 'All Services'
                                            : `${discount.services?.length || 0} Specific Services`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {discounts.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No discount rules found. Create one to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? 'Edit Discount Rule' : 'Create New Discount'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#5A8621]"
                                        placeholder="e.g. Early Bird"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#5A8621]"
                                    >
                                        <option value="SEASONAL">Seasonal</option>
                                        <option value="PROMOTIONAL">Promotional</option>
                                        <option value="LOYALTY_POINTS">Loyalty Points</option>
                                        <option value="BIRTHDAY_MONTH">Birthday</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="0"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#5A8621]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Unit</label>
                                    <div className="flex gap-4 items-center h-[42px]">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={formData.isPercentage}
                                                onChange={() => setFormData({ ...formData, isPercentage: true })}
                                                className="text-[#5A8621] focus:ring-[#5A8621]"
                                            />
                                            Percentage (%)
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={!formData.isPercentage}
                                                onChange={() => setFormData({ ...formData, isPercentage: false })}
                                                className="text-[#5A8621] focus:ring-[#5A8621]"
                                            />
                                            Fixed Amount (RWF)
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#5A8621]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#5A8621]"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-gray-700 font-medium mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#5A8621]"
                                        rows={2}
                                        placeholder="Optional description..."
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-800">Applicable Services</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.applyToAllServices}
                                            onChange={e => setFormData({ ...formData, applyToAllServices: e.target.checked })}
                                            className="w-4 h-4 text-[#5A8621] rounded focus:ring-[#5A8621]"
                                        />
                                        <span className="text-gray-700 font-medium">Apply to All Services</span>
                                    </label>
                                </div>

                                {!formData.applyToAllServices && (
                                    <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto border border-gray-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                            {services.map(service => (
                                                <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.serviceIds?.includes(service.id)}
                                                        onChange={() => toggleService(service.id)}
                                                        className="rounded text-[#5A8621] focus:ring-[#5A8621]"
                                                    />
                                                    <span>{service.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#5A8621] text-white px-6 py-2 rounded-lg hover:bg-[#4A7318] flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDiscountToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Discount"
                message="Are you sure you want to delete this discount? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                loading={deletingLoad}
            />
        </div>
    );
};

export default DiscountsSection;
