"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Edit, ChevronDown, Plus, ShieldCheck, FileDown, UploadCloud } from 'lucide-react';
import FileUploadButton from '../../components/FileUploadButton';
import { useTitle } from '../../contexts/TitleContext';
import AddUserModal from './AddUserModal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import usersService, { User, CreateUserDto, UpdateUserDto } from '../../services/usersService';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersPage() {
  const { setTitle } = useTitle();
  const { addToast } = useToast();
  const { showSuccess, showError } = useNotification();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setTitle("Users Management");
  }, [setTitle]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ADMIN' | 'STAFF' | 'HAIRSTYLIST' | 'RECEPTIONIST' | ''>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingLoad, setDeletingLoad] = useState(false);

  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;

  const loadUsers = useCallback(async (shouldShowError = true) => {
    try {
      setLoading(true);
      setHasError(false);
      const response = await usersService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        role: roleFilter || undefined,
      });

      if (response.success) {
        setUsers(response.data);
        if (response.meta) {
          setTotalUsers(response.meta.total);
          setTotalPages(response.meta.totalPages);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setHasError(true);
      setUsers([]);

      if (shouldShowError) {
        showError('Failed to load users. Please check your permissions or try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, roleFilter, showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = async (newUser: CreateUserDto | UpdateUserDto) => {
    try {
      const response = await usersService.create(newUser as CreateUserDto);
      if (response.success) {
        showSuccess(`${(newUser as CreateUserDto).names} has been added successfully!`);
        setShowAddModal(false);
        loadUsers();
      }
    } catch (error) {
      showError('Failed to add user. Please try again.');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedUser: CreateUserDto | UpdateUserDto) => {
    if (!editingUser) return;

    try {
      const response = await usersService.update(editingUser.user_id, updatedUser as UpdateUserDto);
      if (response.success) {
        showSuccess(`${(updatedUser as UpdateUserDto).names || editingUser.names} has been updated successfully!`);
        setShowEditModal(false);
        setEditingUser(null);
        loadUsers();
      }
    } catch (error) {
      showError('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingLoad(true);
      const response = await usersService.delete(userToDelete.user_id);
      if (response.success) {
        showSuccess(`${userToDelete.names} has been deleted successfully!`);
        setShowDeleteModal(false);
        setUserToDelete(null);
        loadUsers();
      }
    } catch (error) {
      showError('Failed to delete user. Please try again.');
    } finally {
      setDeletingLoad(false);
    }
  };

  const confirmDelete = (user: User) => {
    if (currentUser?.user_id === String(user.user_id)) {
      showError('You cannot delete your own account.');
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };


  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="text-base text-gray-900">Admin</span>;
      case 'MANAGER':
        return <span className="text-base text-gray-900">Manager</span>;
      case 'HAIRSTYLIST':
        return <span className="text-base text-gray-900">Hairstylist</span>;
      case 'RECEPTIONIST':
        return <span className="text-base text-gray-900">Receptionist</span>;
      default:
        return <span className="text-base text-gray-900">Staff</span>;
    }
  };
 
  const isAdmin = currentUser?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search Users"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#009900] focus:border-[#009900] w-64 text-base"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-[#F8FAFC] text-base"
            >
              <span className="text-gray-600">Filter by</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                <button
                  onClick={() => {
                    setRoleFilter('');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] first:rounded-t-lg ${!roleFilter ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                >
                  All Roles
                </button>
                <button
                  onClick={() => {
                    setRoleFilter('ADMIN');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] ${roleFilter === 'ADMIN' ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setRoleFilter('STAFF');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] last:rounded-b-lg ${roleFilter === 'STAFF' ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                >
                  Staff
                </button>
                <button
                  onClick={() => {
                    setRoleFilter('HAIRSTYLIST');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] ${roleFilter === 'HAIRSTYLIST' ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                >
                  Hairstylist
                </button>
                <button
                  onClick={() => {
                    setRoleFilter('RECEPTIONIST');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] last:rounded-b-lg ${roleFilter === 'RECEPTIONIST' ? 'bg-[#F8FAFC] text-[#009900]' : ''
                    }`}
                >
                  Receptionist
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#009900] text-white px-6 py-3 rounded-lg hover:bg-[#008800] transition-colors font-medium text-base flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add User
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
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Telephone</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 px-6 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#009900] mr-2"></div>
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : hasError ? (
              <tr>
                <td colSpan={6} className="py-8 px-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-red-600 mb-4">Failed to load users</p>
                    <button
                      onClick={() => loadUsers(true)}
                      className="px-4 py-2 bg-[#009900] text-white rounded-lg hover:bg-[#008800] transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 px-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              Array.isArray(users) && users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-base text-gray-900">{user.user_id}</td>
                  <td className="py-4 px-6 text-base text-gray-900 font-medium">{user.names}</td>
                  <td className="py-4 px-6 text-base">{getRoleBadge(user.role)}</td>
                  <td className="py-4 px-6 text-base text-gray-600">{user.phone}</td>
                  <td className="py-4 px-6 text-base">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-900">Active</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => confirmDelete(user)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                        disabled={currentUser?.user_id === String(user.user_id)}
                      >
                        <Trash2 className={`h-5 w-5 ${currentUser?.user_id === String(user.user_id) ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-400 hover:text-[#009900] hover:bg-[#F8FAFC] rounded transition-colors"
                        title="Edit user"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && users.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalUsers}
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
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddUser={handleAddUser}
        />
      )}

      {showEditModal && editingUser && (
        <AddUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onAddUser={handleUpdateUser}
          editingUser={editingUser}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${userToDelete?.names}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deletingLoad}
      />
    </div>
  );
}