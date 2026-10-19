import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  ApiProduct,
  ApiProductDeleteResponse,
  ApiProductUpdateResponse,
  Product,
  ProductInput,
  ProductsApiResponse,
  StockStatus
} from '../models/product.model';
import { HttpClient } from '@angular/common/http';
import { enviornment } from '../../environments/environment';
import { map, Observable, tap } from 'rxjs';

export const INITIAL_INDUSTRIAL_PRODUCTS: Product[] = [


  {
    id: 8,
    name: 'Heavy-Duty Industrial Mobile Workbench 1000kg',
    description: 'Welded 2mm steel framework mobile assembly bench with 40mm solid beech worktop, lockable central drawers, and 200mm castors.',
    category: 'Workshop & Tooling',
    price: 780.00,
    imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-WKP-9040',
    stockStatus: 'Made to Order',
    stockCount: 5,
    leadTime: '5-7 Working Days',
    specifications: 'Load Capacity 1000kg | 1500 x 750 x 850mm | Powder Coated Slate',
    manufacturer: 'Titan Fabrications (Sheffield)',
    isUkcaCertified: true
  }
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly storageKey = 'ecommerce_products';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly productsState = signal<Product[]>([]);

  readonly products = this.productsState.asReadonly();


  private readonly http = inject(HttpClient);
  private readonly api = `${enviornment.apiUrl}/products`;

  getProducts(limit = 200) {
    return this.http.get<ProductsApiResponse>(`${this.api}?limit=${limit}`);
  }

  searchProducts(query: string, limit = 200) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return this.http.get<ProductsApiResponse>(`${this.api}/search?${params.toString()}`);
  }

  hasApiProducts(): boolean {
    return this.productsState().some(product => product.apiProduct !== undefined);
  }

  setProductsFromApi(apiProducts: ApiProduct[]): void {
    this.saveProduct(this.mapApiProducts(apiProducts));
  }

  mapApiProducts(apiProducts: ApiProduct[]): Product[] {
    return apiProducts.map(product => this.mapApiProduct(product));
  }

  private mapApiProduct(product: ApiProduct): Product {
    const stockStatus: StockStatus = product.availabilityStatus === 'In Stock'
      || product.availabilityStatus === 'Low Stock'
      || product.availabilityStatus === 'Out of Stock'
      ? product.availabilityStatus
      : 'Made to Order';

    return {
      id: product.id,
      name: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      imageUrl: product.thumbnail || product.images[0] || '',
      sku: product.sku,
      stockStatus,
      stockCount: product.stock,
      leadTime: product.shippingInformation,
      manufacturer: product.brand,
      apiProduct: product
    };
  }

  // Computed Industrial Metrics
  readonly totalProducts = computed(() => this.productsState().length);
  readonly totalValue = computed(() =>
    this.productsState().reduce((sum, p) => sum + (Number(p.price) || 0) * (p.stockCount || 1), 0)
  );
  readonly inStockCount = computed(() =>
    this.productsState().filter(p => p.stockStatus === 'In Stock' || !p.stockStatus).length
  );
  readonly categoriesCount = computed(() => {
    const cats = new Set(this.productsState().map(p => p.category).filter(Boolean));
    return cats.size;
  });

  constructor() {
    if (this.isBrowser) {
      this.productsState.set(this.loadProducts());
    }
  }

  private loadProducts(): Product[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.seedDefaultProducts();
      }
      const parsed = JSON.parse(stored) as Product[];

      // If the stored dataset is empty or contains old dummy items like "mobile #1", upgrade to the industrial suite
      const hasOnlyDummy = parsed.length === 0 || parsed.some(p => p.name.toLowerCase().startsWith('mobile'));
      if (hasOnlyDummy) {
        return this.seedDefaultProducts();
      }

      // Ensure every product has safe defaults
      return parsed.map((p, index) => ({
        ...p,
        sku: p.sku || `UK-IND-${1000 + (p.id || index + 1)}`,
        stockStatus: p.stockStatus || 'In Stock',
        stockCount: p.stockCount ?? 12,
        leadTime: p.leadTime || 'Next-Day UK Dispatch',
        isUkcaCertified: p.isUkcaCertified ?? true,
      }));
    } catch {
      return this.seedDefaultProducts();
    }
  }

  private seedDefaultProducts(): Product[] {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_INDUSTRIAL_PRODUCTS));
    }
    return INITIAL_INDUSTRIAL_PRODUCTS;
  }

  private saveProduct(products: Product[]): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(products));
      } catch (e) {
        console.warn('Storage quota exceeded, state maintained in-memory', e);
      }
    }
    this.productsState.set(products);
  }

  resetToIndustrialDefaults(): void {
    this.saveProduct(INITIAL_INDUSTRIAL_PRODUCTS);
  }

  getProductById(productId: number): Product | undefined {
    return this.productsState().find(product => product.id === productId);
  }

  addProduct(product: ProductInput): Product {
    const products = this.productsState();
    const id = products.reduce((maxId, current) => Math.max(maxId, current.id), 0) + 1;
    const newProduct: Product = {
      ...product,
      id,
      sku: product.sku || `UK-${product.category.substring(0, 3).toUpperCase()}-${1000 + id}`,
      stockStatus: product.stockStatus || 'In Stock',
      stockCount: product.stockCount ?? 10,
      leadTime: product.leadTime || 'Next-Day UK Dispatch',
      isUkcaCertified: product.isUkcaCertified ?? true
    };
    this.saveProduct([newProduct, ...products]);
    return newProduct;
  }

  updateProduct(productId: number, updatedProduct: ProductInput): boolean {
    const products = this.productsState();
    const index = products.findIndex(product => product.id === productId);
    if (index === -1) {
      return false;
    }

    const existing = products[index];
    const updated: Product = {
      ...existing,
      ...updatedProduct,
      id: productId,
      sku: updatedProduct.sku || existing.sku || `UK-IND-${1000 + productId}`
    };
    this.saveProduct(products.map(product => product.id === productId ? updated : product));
    return true;
  }

  updateApiProduct(productId: number, changes: Partial<ApiProduct>): Observable<ApiProduct> {
    const existing = this.productsState().find(product => product.id === productId)?.apiProduct;
    if (!existing) {
      throw new Error(`API product ${productId} is not available in the current catalog.`);
    }

    return this.http.patch<ApiProductUpdateResponse>(`${this.api}/${productId}`, changes).pipe(
      map(response => ({ ...existing, ...response })),
      tap(updatedApiProduct => {
        const updatedProduct = this.mapApiProduct(updatedApiProduct);
        this.saveProduct(this.productsState().map(product =>
          product.id === productId ? updatedProduct : product
        ));
      })
    );
  }

  deleteApiProduct(productId: number): Observable<ApiProductDeleteResponse> {
    return this.http.delete<ApiProductDeleteResponse>(`${this.api}/${productId}`).pipe(
      tap(response => {
        if (response.id !== productId || response.isDeleted !== true) {
          throw new Error('The product API did not confirm that this product was deleted.');
        }
        this.removeProductFromState(productId);
      })
    );
  }

  renameCategory(previousName: string, newName: string): void {
    const products = this.productsState();
    const updatedProducts = products.map(product =>
      product.category === previousName ? { ...product, category: newName } : product
    );

    if (updatedProducts.some((product, index) => product !== products[index])) {
      this.saveProduct(updatedProducts);
    }
  }

  countProductsInCategory(categoryName: string): number {
    return this.productsState().filter(product => product.category === categoryName).length;
  }

  deleteProduct(productId: number): boolean {
    if (!this.productsState().some(product => product.id === productId)) {
      return false;
    }
    this.removeProductFromState(productId);
    return true;
  }

  private removeProductFromState(productId: number): void {
    this.saveProduct(this.productsState().filter(product => product.id !== productId));
  }

  duplicateProduct(productId: number): Product | undefined {
    const target = this.getProductById(productId);
    if (!target) return undefined;

    const { id, ...rest } = target;
    return this.addProduct({
      ...rest,
      name: `${target.name} (Copy)`,
      sku: `UK-${target.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    });
  }
}
