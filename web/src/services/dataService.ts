import { 
  apiSimulator 
} from '../data/dummyData';
import { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  STORAGE_KEYS 
} from '../utils/localStorage';

const calculateStatus = (expiringDate: string): 'Good' | 'Expiring soon' | 'Expired' => {
  const today = new Date();
  const expiring = new Date(expiringDate);
  const diffTime = expiring.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays <= 30) {
    return 'Expiring soon';
  } else {
    return 'Good';
  }
};

export interface Product {
  id: number;
  name: string;
  manufacturer: string;
  country: string;
  category?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Purchase {
  id: number;
  batchNo: string;
  productId: number;
  productName: string;
  expiringDate: string;
  status: 'Good' | 'Expired' | 'Expiring soon';
  quantity: number;
  salesPrice: number;
  totalPrice: number;
  supplier: string;
  purchaseDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  salesperson: string;
  saleDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  lastLogin?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  total?: number;
  page?: number;
  limit?: number;
}

export const productsAPI = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    await apiSimulator.delay(500);
    const products = loadFromLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []) || [];
    return apiSimulator.simulateResponse(products);
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    await apiSimulator.delay(300);
    const products = loadFromLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []) || [];
    const product = products.find((p: Product) => p.id === id);
    if (!product) throw new Error('Product not found');
    return apiSimulator.simulateResponse(product);
  },

  create: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    await apiSimulator.delay(800);
    const products = loadFromLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []) || [];
    const newProduct: Product = {
      ...productData,
      id: Math.max(...products.map((p: Product) => p.id), 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedProducts = [...products, newProduct];
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, updatedProducts);
    return apiSimulator.simulateResponse(newProduct);
  },

  update: async (id: number, productData: Partial<Product>): Promise<ApiResponse<Product>> => {
    await apiSimulator.delay(800);
    const products = loadFromLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []) || [];
    const productIndex = products.findIndex((p: Product) => p.id === id);
    
    if (productIndex === -1) throw new Error('Product not found');
    
    const updatedProduct = {
      ...products[productIndex],
      ...productData,
      updatedAt: new Date().toISOString()
    };
    
    products[productIndex] = updatedProduct;
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, products);
    return apiSimulator.simulateResponse(updatedProduct);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await apiSimulator.delay(500);
    const products = loadFromLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []) || [];
    const filteredProducts = products.filter((p: Product) => p.id !== id);
    saveToLocalStorage(STORAGE_KEYS.PRODUCTS, filteredProducts);
    return apiSimulator.simulateResponse(null);
  }
};

export const purchasesAPI = {
  getAll: async (): Promise<ApiResponse<Purchase[]>> => {
    await apiSimulator.delay(500);
    const purchases = loadFromLocalStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []) || [];
    return apiSimulator.simulateResponse(purchases);
  },

  getById: async (id: number): Promise<ApiResponse<Purchase>> => {
    await apiSimulator.delay(300);
    const purchases = loadFromLocalStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []) || [];
    const purchase = purchases.find((p: Purchase) => p.id === id);
    if (!purchase) throw new Error('Purchase not found');
    return apiSimulator.simulateResponse(purchase);
  },

  create: async (purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'totalPrice' | 'status'>): Promise<ApiResponse<Purchase>> => {
    await apiSimulator.delay(800);
    const purchases = loadFromLocalStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []) || [];
    const newPurchase: Purchase = {
      ...purchaseData,
      totalPrice: purchaseData.quantity * purchaseData.salesPrice,
      status: calculateStatus(purchaseData.expiringDate),
      id: Math.max(...purchases.map((p: Purchase) => p.id), 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedPurchases = [...purchases, newPurchase];
    saveToLocalStorage(STORAGE_KEYS.PURCHASES, updatedPurchases);
    return apiSimulator.simulateResponse(newPurchase);
  },

  update: async (id: number, purchaseData: Partial<Purchase>): Promise<ApiResponse<Purchase>> => {
    await apiSimulator.delay(800);
    const purchases = loadFromLocalStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []) || [];
    const purchaseIndex = purchases.findIndex((p: Purchase) => p.id === id);
    
    if (purchaseIndex === -1) throw new Error('Purchase not found');
    
    const expiringDate = purchaseData.expiringDate || purchases[purchaseIndex].expiringDate;
    const updatedPurchase = {
      ...purchases[purchaseIndex],
      ...purchaseData,
      totalPrice: (purchaseData.quantity || purchases[purchaseIndex].quantity) * 
                 (purchaseData.salesPrice || purchases[purchaseIndex].salesPrice),
      status: calculateStatus(expiringDate),
      updatedAt: new Date().toISOString()
    };
    
    purchases[purchaseIndex] = updatedPurchase;
    saveToLocalStorage(STORAGE_KEYS.PURCHASES, purchases);
    return apiSimulator.simulateResponse(updatedPurchase);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await apiSimulator.delay(500);
    const purchases = loadFromLocalStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []) || [];
    const filteredPurchases = purchases.filter((p: Purchase) => p.id !== id);
    saveToLocalStorage(STORAGE_KEYS.PURCHASES, filteredPurchases);
    return apiSimulator.simulateResponse(null);
  }
};

export const salesAPI = {
  getAll: async (): Promise<ApiResponse<Sale[]>> => {
    await apiSimulator.delay(500);
    const sales = loadFromLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []) || [];
    return apiSimulator.simulateResponse(sales);
  },

  getById: async (id: number): Promise<ApiResponse<Sale>> => {
    await apiSimulator.delay(300);
    const sales = loadFromLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []) || [];
    const sale = sales.find((s: Sale) => s.id === id);
    if (!sale) throw new Error('Sale not found');
    return apiSimulator.simulateResponse(sale);
  },

  create: async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'totalPrice'>): Promise<ApiResponse<Sale>> => {
    await apiSimulator.delay(800);
    const sales = loadFromLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []) || [];
    const newSale: Sale = {
      ...saleData,
      totalPrice: saleData.quantity * saleData.unitPrice,
      id: Math.max(...sales.map((s: Sale) => s.id), 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedSales = [...sales, newSale];
    saveToLocalStorage(STORAGE_KEYS.SALES, updatedSales);
    return apiSimulator.simulateResponse(newSale);
  },

  update: async (id: number, saleData: Partial<Sale>): Promise<ApiResponse<Sale>> => {
    await apiSimulator.delay(800);
    const sales = loadFromLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []) || [];
    const saleIndex = sales.findIndex((s: Sale) => s.id === id);
    
    if (saleIndex === -1) throw new Error('Sale not found');
    
    const updatedSale = {
      ...sales[saleIndex],
      ...saleData,
      totalPrice: (saleData.quantity || sales[saleIndex].quantity) * 
                 (saleData.unitPrice || sales[saleIndex].unitPrice),
      updatedAt: new Date().toISOString()
    };
    
    sales[saleIndex] = updatedSale;
    saveToLocalStorage(STORAGE_KEYS.SALES, sales);
    return apiSimulator.simulateResponse(updatedSale);
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await apiSimulator.delay(500);
    const sales = loadFromLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []) || [];
    const filteredSales = sales.filter((s: Sale) => s.id !== id);
    saveToLocalStorage(STORAGE_KEYS.SALES, filteredSales);
    return apiSimulator.simulateResponse(null);
  }
};


export const dashboardAPI = {
  getStats: async () => {
    await apiSimulator.delay(300);
    const products = loadFromLocalStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []) || [];
    const purchases = loadFromLocalStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []) || [];
    const sales = loadFromLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []) || [];
    
    const totalProducts = products.length;
    const totalPurchases = purchases.length;
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum: number, sale: Sale) => sum + sale.totalPrice, 0);
    const totalPurchaseValue = purchases.reduce((sum: number, purchase: Purchase) => sum + purchase.totalPrice, 0);
    
    return apiSimulator.simulateResponse({
      totalProducts,
      totalPurchases,
      totalSales,
      totalRevenue,
      totalPurchaseValue,
      profit: totalRevenue - totalPurchaseValue
    });
  }
};
