import api from '@/config/api';

export interface User {
  user_id: number;
  names: string;
  phone: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  names: string;
  phone: string;
  email?: string;
  password: string;
  role?: 'ADMIN' | 'STAFF';
}

export interface UpdateUserDto {
  names?: string;
  phone?: string;
  password?: string;
  role?: 'ADMIN' | 'STAFF';
}

export interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'STAFF';
}

class UsersService {
  async getAll(params?: QueryParams): Promise<UsersResponse> {
    const response = await api.get<UsersResponse>('/auth/users', { params });
    return response.data;
  }

  async getOne(id: number): Promise<UserResponse> {
    const response = await api.get<UserResponse>(`/auth/users/${id}`);
    return response.data;
  }

  async create(data: CreateUserDto): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/auth/register', data);
    return response.data;
  }

  async update(id: number, data: UpdateUserDto): Promise<UserResponse> {
    const response = await api.put<UserResponse>(`/auth/users/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
  }
}

const usersService = new UsersService();
export default usersService;