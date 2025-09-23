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
}

const staffService = new StaffService();
export default staffService;