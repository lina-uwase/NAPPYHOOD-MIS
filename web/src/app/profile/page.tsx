"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useTitle } from "@/contexts/TitleContext";
import { Mail, Plus, Pencil, X, Phone, Lock, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile, changePassword, updateProfilePicture } = useAuth();
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Profile");
  }, [setTitle]);

  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editNames, setEditNames] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setEditNames(user?.name || '');
    setEditPhone(user?.phone || '');

    // Set profile picture from backend or localStorage fallback
    if (user?.profile_picture) {
      const fullUrl = user.profile_picture.startsWith('http')
        ? user.profile_picture
        : `http://localhost:5001${user.profile_picture}`;
      setAvatarDataUrl(fullUrl);
    } else if (typeof window !== "undefined") {
      const saved = localStorage.getItem("profileAvatar");
      if (saved) setAvatarDataUrl(saved);
    }
  }, [user]);

  const handlePickImage = () => inputRef.current?.click();

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ image: 'Please select a valid image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ image: 'Image size must be less than 5MB' });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      
      await updateProfilePicture(file);

      // Profile picture is updated through the user context,
      // but we'll also update the local state immediately for better UX
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAvatarDataUrl(result);
        if (typeof window !== "undefined") {
          localStorage.setItem("profileAvatar", result);
          window.dispatchEvent(new Event("profileAvatarUpdated"));
        }
      };
      reader.readAsDataURL(file);

      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('File too large')) {
        setErrors({ image: 'Image file is too large. Please choose a smaller image.' });
      } else if (errorMessage.includes('Invalid file type')) {
        setErrors({ image: 'Please select a valid image file (JPG, PNG, etc.)' });
      } else if (errorMessage.includes('Profile picture update failed')) {
        setErrors({ image: 'Failed to upload profile picture. Please try again.' });
      } else {
        setErrors({ image: 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
      e.target.value = "";
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});
      setSuccessMessage('');

      if (!editNames.trim()) {
        setErrors({ names: 'Full name is required' });
        return;
      }

      if (editNames.trim().length < 2) {
        setErrors({ names: 'Full name must be at least 2 characters long' });
        return;
      }

      if (!editPhone.trim()) {
        setErrors({ phone: 'Phone number is required' });
        return;
      }

      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(editPhone.trim())) {
        setErrors({ phone: 'Please enter a valid phone number' });
        return;
      }

      await updateProfile({
        names: editNames.trim(),
        phone: editPhone.trim()
      });

      setSuccessMessage('Profile updated successfully!');
      setShowEditModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('names must be longer than or equal to 2 characters')) {
        setErrors({ names: 'Full name must be at least 2 characters long' });
      } else if (errorMessage.includes('names must be a string')) {
        setErrors({ names: 'Please enter your full name' });
      } else if (errorMessage.includes('phone must be longer than or equal to 10 characters')) {
        setErrors({ phone: 'Phone number must be at least 10 characters long' });
      } else if (errorMessage.includes('phone must be a string')) {
        setErrors({ phone: 'Please enter your phone number' });
      } else if (errorMessage.includes('Profile update failed')) {
        setErrors({ general: 'Failed to update profile. Please try again.' });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      if (!currentPassword) {
        setErrors({ currentPassword: 'Current password is required' });
        setIsSubmitting(false);
        return;
      }

      if (!newPassword) {
        setErrors({ newPassword: 'New password is required' });
        setIsSubmitting(false);
        return;
      }

      if (newPassword.length < 6) {
        setErrors({ newPassword: 'New password must be at least 6 characters' });
        setIsSubmitting(false);
        return;
      }

      await changePassword({
        currentPassword,
        newPassword
      });

      setSuccessMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('current_password must be longer than or equal to 6 characters')) {
        setErrors({ currentPassword: 'Current password must be at least 6 characters long' });
      } else if (errorMessage.includes('current_password must be a string')) {
        setErrors({ currentPassword: 'Please enter your current password' });
      } else if (errorMessage.includes('new_password must be longer than or equal to 6 characters')) {
        setErrors({ newPassword: 'New password must be at least 6 characters long' });
      } else if (errorMessage.includes('new_password must be a string')) {
        setErrors({ newPassword: 'Please enter a new password' });
      } else if (errorMessage.includes('Invalid current password') || errorMessage.includes('incorrect') || errorMessage.includes('wrong') || errorMessage.includes('invalid')) {
        setErrors({ currentPassword: 'The current password you entered is incorrect' });
      } else if (errorMessage.includes('Password change failed')) {
        setErrors({ general: 'Failed to change password. Please try again.' });
      } else {
        setErrors({ general: `Password change failed: ${errorMessage}` });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const InputField = ({ label, value, placeholder }: { label: string; value: string; placeholder: string }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent"
        placeholder={placeholder}
        value={value}
        readOnly
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            {avatarDataUrl ? (
              <Image
                src={avatarDataUrl || ''}
                alt="Profile"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const initialsDiv = parent.querySelector('.initials-fallback');
                    if (initialsDiv) {
                      (initialsDiv as HTMLElement).style.display = 'flex';
                    }
                  }
                }}
              />
            ) : null}
            <div 
              className="w-20 h-20 rounded-full bg-[#009900] flex items-center justify-center initials-fallback" 
              style={{ display: avatarDataUrl ? 'none' : 'flex' }}
            >
              <span className="text-2xl font-medium text-white">
                {(user?.name || user?.names) ? (user?.name || user?.names)!.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </span>
            </div>
            <button
              onClick={handlePickImage}
              disabled={isSubmitting}
              className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Change photo"
              title="Change photo"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Pencil className="w-5 h-5 text-white" />
              )}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{user?.name || user?.names || 'User'}</h1>
              {user?.role && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-[#009900] font-medium">
                  {user.role === 'ADMIN' ? 'Admin' : 'Staff'}
                </span>
              )}
            </div>
            <p className="text-gray-500">{user?.phone || ''}</p>
            {errors.image && (
              <p className="text-red-600 text-sm mt-1">{errors.image}</p>
            )}
          </div>
        </div>
        <button onClick={() => setShowEditModal(true)} className="px-6 py-2 bg-[#009900] text-white font-medium rounded-lg hover:bg-[#008800] transition-colors">
          Edit
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <InputField label="Full Name" value={user?.name || user?.names || ''} placeholder="Your Full Name" />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">{user?.phone || 'No phone number'}</span>
          </div>
        </div>
        <InputField label="Country" value={'Rwanda'} placeholder="Country" />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Account Security</label>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">My email Address</h2>
        <div className="space-y-3">
          {user?.email ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-[#BCF099] rounded-lg">
                <Mail className="w-5 h-5 text-[#166534]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-500">Primary email</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No email address available</p>
            </div>
          )}
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-[#009900] font-medium rounded-lg hover:bg-green-100 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Email Address</span>
        </button>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setErrors({});
                }} 
                className="text-gray-400 hover:text-gray-600" 
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input 
                  value={editNames} 
                  onChange={(e) => {
                    setEditNames(e.target.value);
                    if (errors.names) setErrors(prev => ({ ...prev, names: '' }));
                  }} 
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                    errors.names ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.names && <p className="mt-1 text-sm text-red-600">{errors.names}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input 
                  value={editPhone} 
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }} 
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setErrors({});
                  }} 
                  className="px-6 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProfileUpdate}
                  className="px-6 py-2 rounded-lg bg-[#009900] text-white hover:bg-[#008800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setErrors({});
                  setCurrentPassword('');
                  setNewPassword('');
                }} 
                className="text-gray-400 hover:text-gray-600" 
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPasswords.current ? 'text' : 'password'}
                    value={currentPassword} 
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: '' }));
                    }} 
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                      errors.currentPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input 
                    type={showPasswords.new ? 'text' : 'password'}
                    value={newPassword} 
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
                    }} 
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009900] focus:border-transparent ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setErrors({});
                    setCurrentPassword('');
                    setNewPassword('');
                  }} 
                  className="px-6 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePasswordChange}
                  className="px-6 py-2 rounded-lg bg-[#009900] text-white hover:bg-[#008800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


