import api from '@/config/api';

export interface DiscountRule {
    id: string;
    name: string;
    type: string;
    value: number;
    isPercentage: boolean;
    isActive: boolean;
    description?: string;
    minAmount?: number;
    maxDiscount?: number;
    startDate?: string;
    endDate?: string;
    applyToAllServices: boolean;
    services?: any[];
    serviceIds?: string[];
}

const discountService = {
    getAll: () => api.get<DiscountRule[]>('/discounts'),
    create: (data: Partial<DiscountRule>) => api.post<DiscountRule>('/discounts', data),
    update: (id: string, data: Partial<DiscountRule>) => api.put<DiscountRule>(`/discounts/${id}`, data),
    delete: (id: string) => api.delete(`/discounts/${id}`),
    notify: (id: string, data: { customerIds: string[], message: string }) => api.post<{ success: boolean, message: string, stats: any }>(`/discounts/${id}/notify`, data)
};

export default discountService;
