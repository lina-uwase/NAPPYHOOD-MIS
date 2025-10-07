"use client"
import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Search, Trash2, Edit, ChevronDown, Plus, ShieldCheck, FileDown, UploadCloud } from 'lucide-react';
import FileUploadButton from '../../components/FileUploadButton';
import { useTitle } from '../../contexts/TitleContext';
import AddStaffModal from './AddStaffModal';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import staffService, { Staff, CreateStaffDto, UpdateStaffDto } from '../../services/staffService';
import { useAuth } from '../../contexts/AuthContext';

export default function StaffPage() {
  const { setTitle } = useTitle();
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setTitle("Staff Management");
  }, [setTitle]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ADMIN' | 'MANAGER' | 'STAFF' | ''>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasError, setHasError] = useState(false);

  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;

  const loadStaff = useCallback(async (showError = true) => {
    try {
      setLoading(true);
      setHasError(false);
      const response = await staffService.getAll();

      if (response.success) {
        const staffData = Array.isArray(response.data) ? response.data : [];
        setStaff(staffData);
        setTotalStaff(staffData.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setHasError(true);
      setStaff([]);

      if (showError) {
        addToastRef.current({
          type: 'error',
          title: 'Error loading staff',
          message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load staff. Please check your permissions or try again later.'
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleAddStaff = async (newStaff: CreateStaffDto | UpdateStaffDto) => {
    try {
      const response = await staffService.create(newStaff as CreateStaffDto);
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Staff member added successfully',
          message: `${(newStaff as CreateStaffDto).name} has been added to the team.`
        });
        setShowAddModal(false);
        loadStaff();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error adding staff member',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add staff member. Please try again.'
      });
    }
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (updatedStaff: CreateStaffDto | UpdateStaffDto) => {
    if (!editingStaff) return;

    try {
      const response = await staffService.update(editingStaff.id, updatedStaff as UpdateStaffDto);
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Staff member updated successfully',
          message: `${(updatedStaff as UpdateStaffDto).name || editingStaff.name} has been updated.`
        });
        setShowEditModal(false);
        setEditingStaff(null);
        loadStaff();
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error updating staff member',
        message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update staff member. Please try again.'
      });
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (currentUser?.id === id) {
      addToast({
        type: 'error',
        title: 'Cannot delete',
        message: 'You cannot delete your own account.'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await staffService.delete(id);
        if (response.success) {
          addToast({
            type: 'success',
            title: 'Staff member deleted successfully',
            message: 'The staff member has been removed from the system.'
          });
          loadStaff();
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error deleting staff member',
          message: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete staff member. Please try again.'
        });
      }
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="text-base text-gray-900">
          Admin
        </span>
      );
    }
    if (role === 'MANAGER') {
      return (
        <span className="text-base text-gray-900">
          Manager
        </span>
      );
    }
    return (
      <span className="text-base text-gray-900">
        Staff
      </span>
    );
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only administrators can access staff management.</p>
        </div>
      </div>
    );
  }

  // Default A→Z sorting by staff name
  const sortedStaff = [...staff].sort((a, b) => {
    const an = (a.name || '').toLowerCase();
    const bn = (b.name || '').toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });

  // Excel upload for staff
  const handleExcelUpload = async (file: File) => {
    try {
      const allowed = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!allowed.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
        addToast({ type: 'error', title: 'Invalid file type', message: 'Only Excel files are allowed.' });
        return;
      }
      setLoading(true);
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!rows.length) {
        addToast({ type: 'error', title: 'Empty file', message: 'No rows found.' });
        return;
      }
      const norm = (k: string) => k.trim().toLowerCase().replace(/\s+/g, '_');
      let ok = 0, fail = 0;
      for (const row of rows) {
        const n: Record<string, unknown> = {};
        Object.keys(row).forEach(k => n[norm(k)] = row[k]);

        const name = (n['name'] || '') as string;
        const email = (n['email'] || '') as string;
        const phone = (n['phone'] || '') as string;
        const role = (n['role'] || '') as 'ADMIN' | 'MANAGER' | 'STAFF' | '';

        if (!name || !email) { fail += 1; continue; }

        try {
          const res = await staffService.create({
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || undefined,
            role: role || 'STAFF',
            password: 'defaultpassword' // Default password
          });
          if (res.success) ok += 1; else fail += 1;
        } catch {
          fail += 1;
        }
      }
      addToast({ type: ok > 0 ? 'success' : 'error', title: 'Import finished', message: `${ok} added, ${fail} failed` });
      if (ok > 0) await loadStaff();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search Staff"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5A8621] focus:border-[#5A8621] w-64 text-base"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-[#F8FAFC] text-base"
            >
              <span className="text-gray-600">Filter by Role</span>
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
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] first:rounded-t-lg ${
                    !roleFilter ? 'bg-[#F8FAFC] text-[#5A8621]' : ''
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
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] ${
                    roleFilter === 'ADMIN' ? 'bg-[#F8FAFC] text-[#5A8621]' : ''
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setRoleFilter('MANAGER');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] ${
                    roleFilter === 'MANAGER' ? 'bg-[#F8FAFC] text-[#5A8621]' : ''
                  }`}
                >
                  Manager
                </button>
                <button
                  onClick={() => {
                    setRoleFilter('STAFF');
                    setShowFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#F8FAFC] last:rounded-b-lg ${
                    roleFilter === 'STAFF' ? 'bg-[#F8FAFC] text-[#5A8621]' : ''
                  }`}
                >
                  Staff
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#5A8621] text-white px-6 py-3 rounded-lg hover:bg-[#4A7219] transition-colors font-medium text-base flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add Staff Member
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
            accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,.xlsx"
            onSelect={handleExcelUpload}
          />
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 px-6 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5A8621] mr-2"></div>
                    Loading staff...
                  </div>
                </td>
              </tr>
            ) : hasError ? (
              <tr>
                <td colSpan={7} className="py-8 px-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-red-600 mb-4">Failed to load staff</p>
                    <button
                      onClick={() => loadStaff(true)}
                      className="px-4 py-2 bg-[#5A8621] text-white rounded-lg hover:bg-[#4A7219] transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : Array.isArray(staff) && staff.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-6 text-center text-gray-500">
                  No staff members found
                </td>
              </tr>
            ) : (
              Array.isArray(sortedStaff) && sortedStaff.map((staffMember, index) => (
                <tr key={staffMember.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-base text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="py-4 px-6 text-base text-gray-900 font-medium">{staffMember.name}</td>
                  <td className="py-4 px-6 text-base">{getRoleBadge(staffMember.role)}</td>
                  <td className="py-4 px-6 text-base text-gray-600">{staffMember.email}</td>
                  <td className="py-4 px-6 text-base text-gray-600">{staffMember.phone || '-'}</td>
                  <td className="py-4 px-6 text-base">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${staffMember.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-gray-900">{staffMember.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDeleteStaff(staffMember.id, staffMember.name)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete staff member"
                        disabled={currentUser?.id === staffMember.id}
                      >
                        <Trash2 className={`h-5 w-5 ${currentUser?.id === staffMember.id ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="p-2 text-gray-400 hover:text-[#5A8621] hover:bg-[#F8FAFC] rounded transition-colors"
                        title="Edit staff member"
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

        {!loading && Array.isArray(staff) && staff.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalStaff}
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
        <AddStaffModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddStaff={handleAddStaff}
        />
      )}

      {showEditModal && editingStaff && (
        <AddStaffModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingStaff(null);
          }}
          onAddStaff={handleUpdateStaff}
          editingStaff={editingStaff}
        />
      )}
    </div>
  );
}