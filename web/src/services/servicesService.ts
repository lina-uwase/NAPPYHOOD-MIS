import api from '@/config/api';

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  singlePrice: number;
  combinedPrice: number | null;
  childPrice: number | null;
  childCombinedPrice: number | null;
  isActive: boolean;
  isComboEligible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceDto {
  name: string;
  category: string;
  description: string;
  singlePrice: number;
  combinedPrice?: number;
  childPrice?: number;
  childCombinedPrice?: number;
  isComboEligible?: boolean;
  isActive?: boolean;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> {
  id?: string;
}

export interface GetServicesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
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

class ServicesService {
  async getAll(params: GetServicesParams = {}): Promise<ApiResponse<Service[]>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await api.get<ApiResponse<Service[]>>(`/services?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<Service>> {
    const response = await api.get<ApiResponse<Service>>(`/services/${id}`);
    return response.data;
  }

  async create(serviceData: CreateServiceDto): Promise<ApiResponse<Service>> {
    const response = await api.post<ApiResponse<Service>>('/services', serviceData);
    return response.data;
  }

  async update(id: string, serviceData: UpdateServiceDto): Promise<ApiResponse<Service>> {
    const response = await api.put<ApiResponse<Service>>(`/services/${id}`, serviceData);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/services/${id}`);
    return response.data;
  }

  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>('/services/categories');
    return response.data;
  }
}

const servicesService = new ServicesService();
export default servicesService;