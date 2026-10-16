export type StockStatus = 'In Stock' | 'Low Stock' | 'Made to Order';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  sku?: string;
  stockStatus?: StockStatus;
  stockCount?: number;
  leadTime?: string;
  specifications?: string;
  manufacturer?: string;
  isUkcaCertified?: boolean;
}

export type ProductInput = Omit<Product, 'id'>;
