import purchasesService from './purchaseService';
import salesService from './salesService';

export interface DashboardStats {
  totalProducts: number;
  totalProductsInStock: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  outOfStock: number;
  expiringSoon: number;
  expired: number;
  lowStock: number;
}

export interface RevenueData {
  month: string;
  value: number;
}

export interface SalesData {
  day: string;
  value: number;
  label: string;
}

export interface ExpiringItem {
  id: number;
  productName: string;
  expiringDate: string;
  status: string;
  quantity: number;
}

export interface TopSellingProduct {
  id: number;
  productName: string;
  revenue: number;
  sales: number;
}

export interface SaleData {
  sale_id: number;
  quantity: number;
  total_price: number;
  created_at: string;
  Purchase?: {
    Product?: {
      product_id: number;
      name: string;
    };
  };
}

export interface PurchaseData {
  purchase_id: number;
  product_id: number;
  quantity: number;
  remaining_quantity: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
  Product?: {
    name: string;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  revenueData: RevenueData[];
  salesData: SalesData[];
  expiringItems: ExpiringItem[];
  topSellingProducts: TopSellingProduct[];
}

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [
        purchasesResponse,
        salesResponse,
        expiringResponse,
        expiredResponse,
        lowStockResponse
      ] = await Promise.allSettled([
        purchasesService.getAll(),
        salesService.getAll(),
        purchasesService.getExpiringPurchases(30),
        purchasesService.getExpiredPurchases(),
        purchasesService.getLowStock(10)
      ]);

      const purchases: PurchaseData[] = purchasesResponse.status === 'fulfilled' ? purchasesResponse.value.data : [];
      const sales: SaleData[] = salesResponse.status === 'fulfilled' ? salesResponse.value.data : [];
      const expiringPurchases: PurchaseData[] = expiringResponse.status === 'fulfilled' ? expiringResponse.value.data : [];
      const expiredPurchases: PurchaseData[] = expiredResponse.status === 'fulfilled' ? expiredResponse.value.data : [];
      const lowStockPurchases: PurchaseData[] = lowStockResponse.status === 'fulfilled' ? lowStockResponse.value.data : [];

      const uniqueProductsWithStock = new Set(purchases.filter(p => p.remaining_quantity > 0).map(p => p.product_id));
      const totalProducts = uniqueProductsWithStock.size;
      const totalProductsInStock = purchases.reduce((sum, purchase) => sum + purchase.remaining_quantity, 0);
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0);
      const totalPurchaseValue = purchases.reduce((sum, purchase) => sum + (purchase.purchase_price * purchase.quantity), 0);
      const totalProfit = totalRevenue - totalPurchaseValue;
      const outOfStock = purchases.filter(p => p.remaining_quantity === 0).length;
      const expiringSoon = expiringPurchases.length;
      const expired = expiredPurchases.length;
      const lowStock = lowStockPurchases.length;

      const revenueData = this.generateRevenueData(sales);
      const salesData = this.generateSalesData(sales);
      const expiringItems = this.generateExpiringItems(expiringPurchases);
      const topSellingProducts = this.generateTopSellingProducts(sales);

      return {
        stats: {
          totalProducts,
          totalProductsInStock,
          totalSales,
          totalRevenue,
          totalProfit,
          outOfStock,
          expiringSoon,
          expired,
          lowStock
        },
        revenueData,
        salesData,
        expiringItems,
        topSellingProducts
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  private generateRevenueData(sales: SaleData[]): RevenueData[] {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentDate = new Date();
    const revenueData: RevenueData[] = [];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.getMonth() === targetDate.getMonth() && 
               saleDate.getFullYear() === targetDate.getFullYear();
      });
      
      const revenue = monthSales.reduce((sum, sale) => sum + sale.total_price, 0);
      revenueData.push({
        month: months[targetDate.getMonth()],
        value: Math.round(revenue / 1000)
      });
    }

    return revenueData;
  }

  private generateSalesData(sales: SaleData[]): SalesData[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesData: SalesData[] = [];
    const currentDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDate.getDate() - i);
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate.toDateString() === targetDate.toDateString();
      });
      
      const revenue = daySales.reduce((sum, sale) => sum + sale.total_price, 0);
      const dayName = days[targetDate.getDay()];
      const dayNumber = targetDate.getDate().toString();
      
      salesData.push({
        day: dayName,
        value: revenue,
        label: dayNumber
      });
    }

    return salesData;
  }

  private generateExpiringItems(expiringPurchases: PurchaseData[]): ExpiringItem[] {
    return expiringPurchases.slice(0, 4).map(purchase => {
      const expiringDate = new Date(purchase.expiry_date);
      const today = new Date();
      const diffTime = expiringDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status = 'Good';
      if (diffDays < 0) {
        status = 'Expired';
      } else if (diffDays <= 30) {
        status = 'Expiring soon';
      }

      return {
        id: purchase.purchase_id,
        productName: purchase.Product?.name || 'Unknown Product',
        expiringDate: expiringDate.toLocaleDateString(),
        status,
        quantity: purchase.remaining_quantity
      };
    });
  }

  private generateTopSellingProducts(sales: SaleData[]): TopSellingProduct[] {
    const productSales = new Map<number, { name: string; revenue: number; sales: number }>();
    
    sales.forEach(sale => {
      const productId = sale.Purchase?.Product?.product_id;
      const productName = sale.Purchase?.Product?.name || 'Unknown Product';
      
      if (productId) {
        if (!productSales.has(productId)) {
          productSales.set(productId, { name: productName, revenue: 0, sales: 0 });
        }
        
        const product = productSales.get(productId)!;
        product.revenue += sale.total_price;
        product.sales += sale.quantity;
      }
    });

    return Array.from(productSales.entries())
      .map(([id, data]) => ({
        id,
        productName: data.name,
        revenue: data.revenue,
        sales: data.sales
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
