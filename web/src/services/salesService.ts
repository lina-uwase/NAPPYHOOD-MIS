import api from '@/config/api';

export interface SaleService {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  price: number;
  duration: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isChild: boolean;
  isCombined: boolean;
}

export interface SaleStaff {
  id: string;
  staffId: string;
  staffName: string;
}

export interface SalePayment {
  id: string;
  paymentMethod: string;
  amount: number;
  createdAt: string;
}

export interface DiscountRule {
  id: string;
  type: string;
  description?: string;
}

export interface SaleDiscount {
  id: string;
  discountAmount: number;
  discountRule?: DiscountRule;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerVisitCount: number;
  saleDate: string;
  services: SaleService[];
  staff: SaleStaff[];
  subtotal: number;
  discountAmount: number;
  discountType?: string;
  discounts?: SaleDiscount[];
  finalAmount: number;
  loyaltyPointsEarned: number;
  notes?: string;
  paymentMethod?: string;
  payments?: SalePayment[];
  ownShampooDiscount?: boolean;
  birthMonthDiscount?: boolean;
  isCompleted: boolean;
  createdBy?: {
    id: string;
    name?: string;
    fullName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleDto {
  customerId: string;
  serviceIds: string[];
  serviceShampooOptions?: Record<string, boolean>;
  staffIds: string[];
  saleDate?: string;
  notes?: string;
  paymentMethod?: string;
  ownShampooDiscount?: boolean;
  addShampoo?: boolean;
}

export interface UpdateSaleDto {
  serviceIds?: string[];
  staffIds?: string[];
  saleDate?: string;
  notes?: string;
  isCompleted?: boolean;
}

export interface GetSalesParams {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
}

export interface SaleSummary {
  totalSales: number;
  totalRevenue: number;
  totalDiscounts: number;
  averageSaleValue: number;
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

// Backend response structure for sales
interface BackendSalesResponse {
  success: boolean;
  data: {
    sales: Sale[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class SalesService {
  async getAll(params: GetSalesParams = {}): Promise<ApiResponse<Sale[]>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.staffId) queryParams.append('staffId', params.staffId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.isCompleted !== undefined) queryParams.append('isCompleted', params.isCompleted.toString());

    const response = await api.get<BackendSalesResponse>(`/sales?${queryParams.toString()}`);
    // Transform backend format to frontend format
    return {
      success: response.data.success,
      data: response.data.data.sales,
      meta: {
        total: response.data.data.pagination.total,
        totalPages: response.data.data.pagination.pages,
        currentPage: response.data.data.pagination.page,
        limit: response.data.data.pagination.limit
      }
    };
  }

  async getById(id: string): Promise<ApiResponse<Sale>> {
    const response = await api.get<ApiResponse<Sale>>(`/sales/${id}`);
    return response.data;
  }

  async create(saleData: CreateSaleDto): Promise<ApiResponse<Sale>> {
    const response = await api.post<ApiResponse<Sale>>('/sales', saleData);
    return response.data;
  }

  async update(id: string, saleData: UpdateSaleDto): Promise<ApiResponse<Sale>> {
    const response = await api.put<ApiResponse<Sale>>(`/sales/${id}`, saleData);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/sales/${id}`);
    return response.data;
  }

  async markCompleted(id: string): Promise<ApiResponse<Sale>> {
    const response = await api.patch<ApiResponse<Sale>>(`/sales/${id}/complete`);
    return response.data;
  }

  async getSummary(params: { startDate?: string; endDate?: string } = {}): Promise<ApiResponse<SaleSummary>> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get<ApiResponse<SaleSummary>>(`/sales/summary?${queryParams.toString()}`);
    return response.data;
  }

  async getByCustomer(customerId: string, params: GetSalesParams = {}): Promise<ApiResponse<Sale[]>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<Sale[]>>(`/sales/customer/${customerId}?${queryParams.toString()}`);
    return response.data;
  }
}

const salesService = new SalesService();
export default salesService;