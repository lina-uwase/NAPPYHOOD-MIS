import api from '@/config/api';

export interface LoginCredentials {
  phone?: string;
  email?: string;
  password: string;
}

export interface User {
  id: string;
  user_id?: string; // For backward compatibility
  name: string;
  names?: string; // For backward compatibility with profile page
  phone: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  profile_picture?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface UpdateProfileData {
  names?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    if (response.data.success && response.data.data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }

    return response.data;
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!token && !!user;
  }

  hasRole(role: 'ADMIN' | 'STAFF'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse> {
    try {
      const response = await api.put<ApiResponse>('/auth/profile', data);
      
      if (response.data.success && response.data.data) {
        const updatedUser = response.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error('Profile update failed');
    }
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    try {
      const requestData = {
        current_password: data.currentPassword,
        new_password: data.newPassword
      };
      const response = await api.put<ApiResponse>('/auth/change-password', requestData);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error('Password change failed');
    }
  }

  async getUserProfile(): Promise<ApiResponse> {
    const response = await api.get<ApiResponse>('/auth/profile');
    
    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }
    
    return response.data;
  }

  async updateProfilePicture(file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('picture', file);

      const response = await api.post<ApiResponse>('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success && response.data.data) {
        const updatedUser = response.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }
      throw new Error('Profile picture update failed');
    }
  }
}

const authService = new AuthService();
export default authService;