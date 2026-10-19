export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Made to Order';

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  sku?: string;
  stockStatus?: StockStatus;
  stockCount?: number;
  leadTime?: string;
  specifications?: string;
  manufacturer?: string;
  isUkcaCertified?: boolean;
  apiProduct?: ApiProduct;
}

export type ProductInput = Omit<Product, 'id'>;

export interface ApiProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  thumbnail: string;
  images: string[];
}

export interface ProductsApiResponse {
  products: ApiProduct[];
  total: number;
  skip: number;
  limit: number;
}

export type ApiProductUpdateResponse = Partial<ApiProduct> & { id: number };

export type ApiProductDeleteResponse = Partial<ApiProduct> & {
  id: number;
  isDeleted: boolean;
  deletedOn: string;
};

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}
