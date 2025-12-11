import api from '@/config/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  isActive?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

class ProductsService {
  async getAll(isActive?: boolean): Promise<ApiResponse<Product[]>> {
    const params: any = {};
    if (isActive !== undefined) {
      params.isActive = isActive;
    }
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<Product>> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  }

  async create(data: CreateProductDto): Promise<ApiResponse<Product>> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data;
  }

  async update(id: string, data: UpdateProductDto): Promise<ApiResponse<Product>> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data;
  }

  async increaseStock(id: string, quantity: number): Promise<ApiResponse<Product>> {
    const response = await api.post<ApiResponse<Product>>(`/products/${id}/increase-stock`, { quantity });
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/products/${id}`);
    return response.data;
  }
}

const productsService = new ProductsService();
export default productsService;
