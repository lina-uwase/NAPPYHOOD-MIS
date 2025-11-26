"use client"
import React, { useState, useEffect } from 'react';
import { User, CreateUserDto, UpdateUserDto } from '../../services/usersService';
import { Eye, EyeOff } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: CreateUserDto | UpdateUserDto) => void;
  editingUser?: User | null;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAddUser, editingUser }) => {
  const [formData, setFormData] = useState({
    names: '',
    phone: '',
    email: '',
    password: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF'
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        names: editingUser.names || '',
        phone: editingUser.phone || '',
        email: editingUser.email || '',
        password: '', // Don't populate password when editing
        role: editingUser.role || 'STAFF'
      });
    } else {
      setFormData({
        names: '',
        phone: '',
        email: '',
        password: '',
        role: 'STAFF'
      });
    }
    setErrors({});
  }, [editingUser, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.names.trim()) {
      newErrors.names = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!editingUser && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateData: UpdateUserDto = {
          names: formData.names,
          phone: formData.phone,
          role: formData.role
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await onAddUser(updateData);
      } else {
        const createData: CreateUserDto = {
          names: formData.names,
          phone: formData.phone,
          role: formData.role,
          email: formData.email.trim() || undefined, // Email is optional - only send if provided
          password: formData.password
        };
        await onAddUser(createData);
      }
      
      onClose();
      setFormData({
        names: '',
        phone: '',
        email: '',
        password: '',
        role: 'STAFF'
      });
      setErrors({});
      setErrors({});
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (Object.values(formData).some(value => value !== '' && value !== 'STAFF')) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
        setFormData({
          names: '',
          phone: '',
          email: '',
          password: '',
          role: 'STAFF'
        });
        setErrors({});
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-4" style={{ marginTop: 0 }}>
                <label htmlFor="names" className="block text-sm text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="names"
                  name="names"
                  value={formData.names}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                    errors.names 
                      ? 'border-red-500' 
                      : 'border-gray-200'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.names && (
                  <p className="mt-1 text-xs text-red-500">{errors.names}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm text-gray-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                    errors.phone 
                      ? 'border-red-500' 
                      : 'border-gray-200'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
                  Email Address <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required={false}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                    errors.email 
                      ? 'border-red-500' 
                      : 'border-gray-200'
                  }`}
                  placeholder="Enter email address (optional)"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block text-sm text-gray-600 mb-1">
                  Password {editingUser && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                      errors.password 
                        ? 'border-red-500' 
                        : 'border-gray-200'
                    }`}
                    placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="role" className="block text-sm text-gray-600 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent"
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#009900] text-white hover:bg-[#008800] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;