"use client"
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Staff, CreateStaffDto, UpdateStaffDto } from '../../services/staffService';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaff: (staff: CreateStaffDto | UpdateStaffDto) => void;
  editingStaff?: Staff | null;
}

export default function AddStaffModal({ isOpen, onClose, onAddStaff, editingStaff }: AddStaffModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF' as 'ADMIN' | 'MANAGER' | 'STAFF',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name || '',
        email: editingStaff.email || '',
        phone: editingStaff.phone || '',
        role: editingStaff.role as 'ADMIN' | 'MANAGER' | 'STAFF',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'STAFF',
      });
    }
  }, [editingStaff, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onAddStaff({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
              placeholder="+250 788 000 000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'MANAGER' | 'STAFF' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
              required
            >
              <option value="STAFF">Stylist</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.email.trim()}
              className="flex-1 px-4 py-2 bg-[#5A8621] text-white rounded-lg hover:bg-[#4A7219] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                editingStaff ? 'Update Staff' : 'Add Staff'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}