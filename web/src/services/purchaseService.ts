import api from '@/config/api';

export interface Purchase {
  purchase_id: number;
  product_id: number;
  Product?: {
    product_id: number;
    name: string;
    manufacturer: string;
    manufacturing_country: string;
  };
  batch_number: string;
  quantity: number;
  remaining_quantity: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreatePurchaseDto {
  product_id: number;
  batch_number: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
  supplier?: string;
}

export interface UpdatePurchaseDto {
  product_id?: number;
  batch_number?: string;
  quantity?: number;
  purchase_price?: number;
  selling_price?: number;
  expiry_date?: string;
  supplier?: string;
}

export interface PurchasesResponse {
  success: boolean;
  message: string;
  data: Purchase[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data: Purchase;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  product_id?: number;
  batch_number?: string;
  supplier?: string;
  expiring_in_days?: number;
}

export interface AvailablePurchase {
  purchase_id: number;
  product_id: number;
  batch_number: string;
  quantity: number;
  remaining_quantity: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
  supplier?: string;
  registered_by?: number;
  created_at: string;
  updated_at: string;
  Product: {
    product_id: number;
    name: string;
    manufacturer: string;
    manufacturing_country: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
  };
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
}

export interface AvailableProduct {
  product: {
    product_id: number;
    name: string;
    manufacturer: string;
    manufacturing_country: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
  };
  purchases: AvailablePurchase[];
  totalStock: number;
  lowestPrice: number;
  earliestExpiry: string;
}

class PurchasesService {
  async getAll(params?: QueryParams): Promise<PurchasesResponse> {
    const response = await api.get<PurchasesResponse>('/v1/purchases', { params });
    return response.data;
  }

  async getOne(id: number): Promise<PurchaseResponse> {
    const response = await api.get<PurchaseResponse>(`/v1/purchases/${id}`);
    return response.data;
  }

  async create(data: CreatePurchaseDto): Promise<PurchaseResponse> {
    const response = await api.post<PurchaseResponse>('/v1/purchases', data);
    return response.data;
  }

  async update(id: number, data: UpdatePurchaseDto): Promise<PurchaseResponse> {
    const response = await api.put<PurchaseResponse>(`/v1/purchases/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/v1/purchases/${id}`);
    return response.data;
  }

  async getExpiringPurchases(days?: number): Promise<PurchasesResponse> {
    const response = await api.get<PurchasesResponse>('/v1/purchases/expiring', { 
      params: { days } 
    });
    return response.data;
  }

  async getExpiredPurchases(): Promise<PurchasesResponse> {
    const response = await api.get<PurchasesResponse>('/v1/purchases/expired');
    return response.data;
  }

  async searchAvailable(query: string): Promise<{ success: boolean; data: AvailableProduct[] }> {
    const response = await api.get<{ success: boolean; data: AvailableProduct[] }>(
      '/v1/purchases/search-available',
      { params: { q: query } }
    );
    return response.data;
  }

  async getLowStock(threshold?: number): Promise<PurchasesResponse> {
    const response = await api.get<PurchasesResponse>('/v1/purchases/low-stock', {
      params: { threshold }
    });
    return response.data;
  }

  async getStatistics(): Promise<unknown> {
    const response = await api.get('/v1/purchases/statistics');
    return response.data;
  }
}

const purchasesService = new PurchasesService();
export default purchasesService;