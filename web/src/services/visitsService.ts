import api from '@/config/api';

export interface VisitService {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  price: number;
  duration: number;
}

export interface VisitStaff {
  id: string;
  staffId: string;
  staffName: string;
}

export interface Visit {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  visitDate: string;
  services: VisitService[];
  staff: VisitStaff[];
  subtotal: number;
  discountAmount: number;
  discountType?: string;
  finalAmount: number;
  loyaltyPointsEarned: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitDto {
  customerId: string;
  serviceIds: string[];
  staffIds: string[];
  visitDate?: string;
  notes?: string;
}

export interface UpdateVisitDto {
  serviceIds?: string[];
  staffIds?: string[];
  visitDate?: string;
  notes?: string;
  isCompleted?: boolean;
}

export interface GetVisitsParams {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
}

export interface VisitSummary {
  totalVisits: number;
  totalRevenue: number;
  totalDiscounts: number;
  averageVisitValue: number;
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

class VisitsService {
  async getAll(params: GetVisitsParams = {}): Promise<ApiResponse<Visit[]>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.staffId) queryParams.append('staffId', params.staffId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.isCompleted !== undefined) queryParams.append('isCompleted', params.isCompleted.toString());

    const response = await api.get<ApiResponse<Visit[]>>(`/visits?${queryParams.toString()}`);
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<Visit>> {
    const response = await api.get<ApiResponse<Visit>>(`/visits/${id}`);
    return response.data;
  }

  async create(visitData: CreateVisitDto): Promise<ApiResponse<Visit>> {
    const response = await api.post<ApiResponse<Visit>>('/visits', visitData);
    return response.data;
  }

  async update(id: string, visitData: UpdateVisitDto): Promise<ApiResponse<Visit>> {
    const response = await api.put<ApiResponse<Visit>>(`/visits/${id}`, visitData);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/visits/${id}`);
    return response.data;
  }

  async markCompleted(id: string): Promise<ApiResponse<Visit>> {
    const response = await api.patch<ApiResponse<Visit>>(`/visits/${id}/complete`);
    return response.data;
  }

  async getSummary(params: { startDate?: string; endDate?: string } = {}): Promise<ApiResponse<VisitSummary>> {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get<ApiResponse<VisitSummary>>(`/visits/summary?${queryParams.toString()}`);
    return response.data;
  }

  async getByCustomer(customerId: string, params: GetVisitsParams = {}): Promise<ApiResponse<Visit[]>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<Visit[]>>(`/visits/customer/${customerId}?${queryParams.toString()}`);
    return response.data;
  }
}

const visitsService = new VisitsService();
export default visitsService;