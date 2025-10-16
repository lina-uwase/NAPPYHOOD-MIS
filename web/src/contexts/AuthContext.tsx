'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User, LoginCredentials, UpdateProfileData, ChangePasswordData } from '@/services/authService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  updateProfilePicture: (file: File) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run authentication check on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const currentUser = authService.getCurrentUser();
    const authStatus = authService.isAuthenticated();

    if (currentUser && authStatus) {
      setUser(currentUser);
      setIsAuthenticated(true);
    } else {
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        router.push('/'); // Redirect to dashboard
      } else {
        throw new Error('Login failed');
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        throw new Error(axiosError.response?.data?.error || 'Invalid credentials');
      }
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      const response = await authService.updateProfile(data);
      if (response.success && response.data) {
        setUser(response.data as User);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: unknown) {
      throw new Error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Profile update failed');
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    try {
      const response = await authService.changePassword(data);
      if (!response.success) {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      throw new Error(errorMessage);
    }
  };

  const updateProfilePicture = async (file: File) => {
    try {
      const response = await authService.updateProfilePicture(file);
      if (response.success && response.data) {
        setUser(response.data as User);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Profile picture update failed');
      }
    } catch (error: unknown) {
      throw new Error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Profile picture update failed');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getUserProfile();
      if (response.success && response.data) {
        setUser(response.data as User);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        updateProfile,
        changePassword,
        updateProfilePicture,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}