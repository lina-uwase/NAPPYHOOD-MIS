import api from '@/config/api';

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'STYLIST';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffDto {
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'STYLIST';
  password: string;
}

export interface UpdateStaffDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'ADMIN' | 'MANAGER' | 'STYLIST';
  isActive?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

class StaffService {
  async getAll(): Promise<ApiResponse<Staff[]>> {
    const response = await api.get<ApiResponse<Staff[]>>('/auth/staff');
    return response.data;
  }

  async getActiveStaff(): Promise<ApiResponse<Staff[]>> {
    const response = await api.get<ApiResponse<Staff[]>>('/auth/staff?isActive=true');
    return response.data;
  }

  async create(data: CreateStaffDto): Promise<ApiResponse<Staff>> {
    const response = await api.post<ApiResponse<Staff>>('/auth/staff', data);
    return response.data;
  }

  async update(id: string, data: UpdateStaffDto): Promise<ApiResponse<Staff>> {
    const response = await api.put<ApiResponse<Staff>>(`/auth/staff/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/auth/staff/${id}`);
    return response.data;
  }
}

const staffService = new StaffService();
export default staffService;