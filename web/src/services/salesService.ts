import api from '@/config/api';

export interface Sale {
  sale_id: number;
  purchase_id: number;
  Purchase?: {
    purchase_id: number;
    batch_number: string;
    selling_price: number;
    Product?: {
      product_id: number;
      name: string;
      manufacturer: string;
    };
  };
  User?: {
    user_id: number;
    names?: string;
    phone?: string;
    role?: string;
  };
  customer_name?: string;
  customer_phone?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method?: 'CASH' | 'MOMO' | 'BANK' | 'CREDIT';
  payment_status?: 'PAID' | 'PENDING' | 'PARTIAL';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateSaleDto {
  purchase_id: number;
  customer_name?: string;
  customer_phone?: string;
  quantity: number;
  unit_price: number;
  payment_method?: 'CASH' | 'MOMO' | 'BANK' | 'CREDIT';
  payment_status?: 'PAID' | 'PENDING' | 'PARTIAL';
}

export interface UpdateSaleDto {
  purchase_id?: number;
  customer_name?: string;
  customer_phone?: string;
  quantity?: number;
  unit_price?: number;
  payment_method?: 'CASH' | 'MOMO' | 'BANK' | 'CREDIT';
  payment_status?: 'PAID' | 'PENDING' | 'PARTIAL';
}

export interface SalesResponse {
  success: boolean;
  message: string;
  data: Sale[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SaleResponse {
  success: boolean;
  message: string;
  data: Sale;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  purchase_id?: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
}

export interface SalesStatistics {
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
  averageSaleAmount: number;
  topSellingProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

class SalesService {
  async getAll(params?: QueryParams): Promise<SalesResponse> {
    const response = await api.get<SalesResponse>('/v1/sales', { params });
    return response.data;
  }

  async getOne(id: number): Promise<SaleResponse> {
    const response = await api.get<SaleResponse>(`/v1/sales/${id}`);
    return response.data;
  }

  async create(data: CreateSaleDto): Promise<SaleResponse> {
    const response = await api.post<SaleResponse>('/v1/sales', data);
    return response.data;
  }

  async update(id: number, data: UpdateSaleDto): Promise<SaleResponse> {
    const response = await api.put<SaleResponse>(`/v1/sales/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/v1/sales/${id}`);
    return response.data;
  }

  async getDailySales(): Promise<SalesResponse> {
    const response = await api.get<SalesResponse>('/v1/sales/daily');
    return response.data;
  }

  async getSalesByProduct(productId: number): Promise<SalesResponse> {
    const response = await api.get<SalesResponse>(`/v1/sales/product/${productId}`);
    return response.data;
  }

  async getSalesByUser(userId: number): Promise<SalesResponse> {
    const response = await api.get<SalesResponse>(`/v1/sales/user/${userId}`);
    return response.data;
  }

  async getStatistics(): Promise<unknown> {
    const response = await api.get('/v1/sales/statistics');
    return response.data;
  }

  async generateReceipt(id: number): Promise<Blob> {
    const response = await api.get(`/v1/sales/${id}/receipt`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

const salesService = new SalesService();
export default salesService;