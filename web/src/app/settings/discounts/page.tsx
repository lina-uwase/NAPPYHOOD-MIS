"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Calendar,
    Tag,
    Scissors,
    Check,
    X,
    AlertCircle,
    Share2
} from 'lucide-react';
import { useTitle } from '../../../contexts/TitleContext';
import { useNotification } from '../../../contexts/NotificationContext';
import discountService, { DiscountRule } from '../../../services/discountService';
import servicesService, { Service } from '../../../services/servicesService';
import ConfirmationModal from '../../../components/ConfirmationModal';
import CustomerSelectionModal from '../../../components/CustomerSelectionModal';

export default function DiscountSettingsPage() {
    const { setTitle } = useTitle();
    const { showSuccess, showError } = useNotification();

    const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<DiscountRule | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'PROMOTIONAL',
        value: 0,
        isPercentage: true,
        description: '',
        startDate: '',
        endDate: '',
        applyToAllServices: false,
        serviceIds: [] as string[]
    });

    // Delete State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

    // Notification State
    const [notifyModalOpen, setNotifyModalOpen] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [discountToNotify, setDiscountToNotify] = useState<DiscountRule | null>(null);

    useEffect(() => {
        setTitle('Discount Configuration');
        fetchData();
    }, [setTitle]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [discountsRes, servicesRes] = await Promise.all([
                discountService.getAll(),
                servicesService.getAll({ limit: 100 })
            ]);

            setDiscounts(discountsRes.data || []);
            setServices(servicesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showError('Error', 'Failed to load discounts or services');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'PROMOTIONAL',
            value: 0,
            isPercentage: true,
            description: '',
            startDate: '',
            endDate: '',
            applyToAllServices: false,
            serviceIds: []
        });
        setEditingDiscount(null);
    };

    const handleOpenModal = (discount?: DiscountRule) => {
        if (discount) {
            setEditingDiscount(discount);
            setFormData({
                name: discount.name,
                type: discount.type,
                value: discount.value,
                isPercentage: discount.isPercentage,
                description: discount.description || '',
                startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
                endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
                applyToAllServices: discount.applyToAllServices,
                serviceIds: discount.services ? discount.services.map((s: any) => s.id) : []
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const validateForm = () => {
        if (!formData.name) return 'Name is required';
        if (formData.value <= 0) return 'Value must be greater than 0';
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
            const payload = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
            };

            if (editingDiscount) {
                await discountService.update(editingDiscount.id, payload);
                showSuccess('Success', 'Discount updated successfully');
            } else {
                await discountService.create(payload);
                showSuccess('Success', 'Discount created successfully');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            showError('Error', error.response?.data?.error || 'Failed to save discount');
        }
    };

    const handleDelete = async () => {
        if (!discountToDelete) return;
        try {
            await discountService.delete(discountToDelete);
            showSuccess('Success', 'Discount deleted (deactivated) successfully');
            setDeleteModalOpen(false);
            fetchData();
        } catch (error) {
            showError('Error', 'Failed to delete discount');
        }
    };

    const handleNotifyClick = (discount: DiscountRule) => {
        setDiscountToNotify(discount);
        setNotifyModalOpen(true);
    };

    const handleSendNotification = async (selectedCustomerIds: string[]) => {
        if (!discountToNotify) return;

        try {
            setNotificationLoading(true);
            const message = `High there {name}, we have a special offer for you! Get ${discountToNotify.isPercentage ? discountToNotify.value + '%' : discountToNotify.value + ' RWF'} OFF on ${discountToNotify.name}. Valid until ${discountToNotify.endDate ? new Date(discountToNotify.endDate).toLocaleDateString() : 'forever'}!`;

            await discountService.notify(discountToNotify.id, {
                customerIds: selectedCustomerIds,
                message
            });

            showSuccess('Success', 'Notifications queued successfully');
            setNotifyModalOpen(false);
            setDiscountToNotify(null);
        } catch (error) {
            console.error('Notification error:', error);
            showError('Error', 'Failed to send notifications');
        } finally {
            setNotificationLoading(false);
        }
    };

    const toggleService = (serviceId: string) => {
        setFormData(prev => ({
            ...prev,
            serviceIds: prev.serviceIds.includes(serviceId)
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId]
        }));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Discount Rules</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#5A8621] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#4A7219]"
                >
                    <Plus size={20} />
                    <span>New Discount</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A8621]"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {discounts.map((discount) => (
                        <div key={discount.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{discount.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${discount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {discount.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                        {discount.type}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mt-1">
                                    {discount.isPercentage ? `${discount.value}%` : `${discount.value} RWF`} off
                                    {discount.applyToAllServices ? ' on ALL Services' : ` on ${discount.services?.length || 0} services`}
                                </p>
                                {discount.startDate && discount.endDate && (
                                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleNotifyClick(discount)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                    title="Notify Customers"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleOpenModal(discount)}
                                    className="p-2 text-gray-500 hover:text-[#5A8621]"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        setDiscountToDelete(discount.id);
                                        setDeleteModalOpen(true);
                                    }}
                                    className="p-2 text-gray-500 hover:text-red-600"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {discounts.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No discounts found. Create one to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingDiscount ? 'Edit Discount' : 'New Discount'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#5A8621]"
                                        placeholder="e.g. Christmas Sale"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#5A8621]"
                                    >
                                        <option value="PROMOTIONAL">Promotional</option>
                                        <option value="SEASONAL">Seasonal</option>
                                        <option value="LOYALTY_POINTS">Loyalty Points</option>
                                        <option value="BIRTHDAY_MONTH">Birthday</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#5A8621]"
                                    />
                                </div>
                                <div className="flex items-center mt-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPercentage}
                                            onChange={e => setFormData({ ...formData, isPercentage: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5A8621]"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900">
                                            Is Percentage (%)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#5A8621]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#5A8621]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Applicability</label>
                                <div className="flex items-center mb-4">
                                    <input
                                        type="checkbox"
                                        id="applyAll"
                                        checked={formData.applyToAllServices}
                                        onChange={e => setFormData({ ...formData, applyToAllServices: e.target.checked })}
                                        className="h-4 w-4 text-[#5A8621] focus:ring-[#5A8621] border-gray-300 rounded"
                                    />
                                    <label htmlFor="applyAll" className="ml-2 block text-sm text-gray-900">
                                        Apply to ALL Services
                                    </label>
                                </div>

                                {!formData.applyToAllServices && (
                                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                                        <h4 className="text-sm font-semibold mb-2">Select Services:</h4>
                                        <div className="space-y-2">
                                            {services.map(service => (
                                                <label key={service.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.serviceIds.includes(service.id)}
                                                        onChange={() => toggleService(service.id)}
                                                        className="text-[#5A8621] focus:ring-[#5A8621] rounded"
                                                    />
                                                    <span className="text-sm">{service.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#5A8621] text-white rounded-lg hover:bg-[#4A7219]"
                                >
                                    Save Discount
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <CustomerSelectionModal
                isOpen={notifyModalOpen}
                onClose={() => setNotifyModalOpen(false)}
                onConfirm={handleSendNotification}
                loading={notificationLoading}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Discount"
                message="Are you sure you want to delete this discount? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
}
