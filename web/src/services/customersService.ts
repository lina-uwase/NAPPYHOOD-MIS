import api from '@/config/api';

export interface Customer {
  id: string;
  fullName: string;
  name?: string; // For backward compatibility
  gender: 'MALE' | 'FEMALE';
  phone: string;
  email?: string;
  birthday?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  location: string;
  district: string;
  province: string;
  loyaltyPoints: number;
  totalSales: number;
  totalSpent: number;
  lastSale?: string;
  lastVisit?: string;
  isActive: boolean;
  isDependent: boolean;
  parentId?: string;
  parent?: Customer;
  dependents?: Customer[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  phone?: string;
  email?: string;
  birthday?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  location: string;
  district: string;
  province: string;
  isDependent?: boolean;
  parentId?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  id?: string;
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: 'MALE' | 'FEMALE';
  district?: string;
  province?: string;
  isActive?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

interface BackendCustomersResponse {
  success: boolean;
  data: {
    customers: Customer[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
}

class CustomersService {
  async getAll(params: GetCustomersParams = {}): Promise<ApiResponse<Customer[]>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.gender) queryParams.append('gender', params.gender);
    if (params.district) queryParams.append('district', params.district);
    if (params.province) queryParams.append('province', params.province);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await api.get<BackendCustomersResponse>(`/customers?${queryParams.toString()}`);
    // Backend returns { success: true, data: { customers: [...], pagination: {...} } }
    // But frontend expects { success: true, data: [...] }
    return {
      success: response.data.success,
      data: response.data.data.customers,
      meta: response.data.data.pagination
    };
  }

  async getById(id: string): Promise<ApiResponse<Customer>> {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  }

  async create(customerData: CreateCustomerDto): Promise<ApiResponse<Customer>> {
    console.log('Creating customer with data:', customerData);
    try {
      const response = await api.post<ApiResponse<Customer>>('/customers', customerData);
      console.log('Customer creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Customer creation error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      throw error;
    }
  }

  async update(id: string, customerData: UpdateCustomerDto): Promise<ApiResponse<Customer>> {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, customerData);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/customers/${id}`);
    return response.data;
  }

  async toggleActive(id: string): Promise<ApiResponse<Customer>> {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}/toggle-active`);
    return response.data;
  }

  async getProvinces(): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>('/customers/locations/provinces');
    return response.data;
  }

  async getDistrictsByProvince(province: string): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>(`/customers/locations/districts/${province}`);
    return response.data;
  }

  async getTopCustomers(limit: number = 5): Promise<ApiResponse<Customer[]>> {
    const response = await api.get<ApiResponse<Customer[]>>(`/customers/top?limit=${limit}`);
    return response.data;
  }
}

const customersService = new CustomersService();
export default customersService;