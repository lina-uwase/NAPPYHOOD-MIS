import api from '@/config/api';

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStaffDto {
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}

export interface UpdateStaffDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF';
  isActive?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

class StaffService {
  async getAll(): Promise<ApiResponse<Staff[]>> {
    const response = await api.get<ApiResponse<Staff[]>>('/staff');
    return response.data;
  }

  async getActiveStaff(): Promise<ApiResponse<Staff[]>> {
    const response = await api.get<ApiResponse<Staff[]>>('/staff?isActive=true');
    return response.data;
  }

  async create(data: CreateStaffDto): Promise<ApiResponse<Staff>> {
    const response = await api.post<ApiResponse<Staff>>('/auth/register', data);
    return response.data;
  }

  async update(id: string, data: UpdateStaffDto): Promise<ApiResponse<Staff>> {
    const response = await api.put<ApiResponse<Staff>>(`/staff/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/auth/users/${id}`);
    return response.data;
  }
}

const staffService = new StaffService();
export default staffService;