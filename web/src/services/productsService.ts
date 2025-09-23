import api from '@/config/api';

export interface Product {
  product_id: number;
  name: string;
  manufacturer: string;
  manufacturing_country: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateProductDto {
  name: string;
  manufacturer: string;
  manufacturing_country: string;
}

export interface UpdateProductDto {
  name?: string;
  manufacturer?: string;
  manufacturing_country?: string;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  manufacturer?: string;
  manufacturing_country?: string;
}

class ProductsService {
  async getAll(params?: QueryParams): Promise<ProductsResponse> {
    const response = await api.get<ProductsResponse>('/v1/products', { params });
    return response.data;
  }

  async getOne(id: number): Promise<ProductResponse> {
    const response = await api.get<ProductResponse>(`/v1/products/${id}`);
    return response.data;
  }

  async create(data: CreateProductDto): Promise<ProductResponse> {
    const response = await api.post<ProductResponse>('/v1/products', data);
    return response.data;
  }

  async update(id: number, data: UpdateProductDto): Promise<ProductResponse> {
    const response = await api.put<ProductResponse>(`/v1/products/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/v1/products/${id}`);
    return response.data;
  }

  async restore(id: number): Promise<ProductResponse> {
    const response = await api.put<ProductResponse>(`/v1/products/${id}/restore`);
    return response.data;
  }

  async getStatistics(): Promise<unknown> {
    const response = await api.get('/v1/products/statistics');
    return response.data;
  }
}

const productsService = new ProductsService();
export default productsService;