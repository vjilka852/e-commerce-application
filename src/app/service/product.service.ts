import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product, ProductInput } from '../models/product.model';

export const INITIAL_INDUSTRIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Hydraulic Variable Piston Pump 250 Bar',
    description: 'Heavy-duty variable displacement axial piston pump designed for continuous industrial hydraulic press systems and power units.',
    category: 'Hydraulics',
    price: 1450.00,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-HYD-4029',
    stockStatus: 'In Stock',
    stockCount: 28,
    leadTime: 'Next-Day UK Dispatch',
    specifications: '250 Bar | 45 L/min | Flanged ISO 3019/2 | Cast Iron Housing',
    manufacturer: 'Apex Fluid Power Ltd (Sheffield)',
    isUkcaCertified: true
  },
  {
    id: 2,
    name: 'UKCA Industrial Optical Safety Light Curtain',
    description: 'High-resolution perimeter finger & hand protection optoelectronic safety barrier with dual OSSD PNP solid-state outputs.',
    category: 'Safety & PPE',
    price: 820.00,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-SAF-8102',
    stockStatus: 'In Stock',
    stockCount: 14,
    leadTime: 'Next-Day UK Dispatch',
    specifications: 'Type 4 SIL 3 | 14mm Resolution | 600mm Height | IP67 Rated',
    manufacturer: 'Sentinel Safety Systems (Birmingham)',
    isUkcaCertified: true
  },
  {
    id: 3,
    name: 'High-Torque Helical Bevel Gear Motor 1.5kW',
    description: 'High-efficiency IE3 three-phase industrial geared motor with hollow shaft output for conveyor drives and automated machinery.',
    category: 'Motors & Drives',
    price: 645.00,
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-MOT-1950',
    stockStatus: 'In Stock',
    stockCount: 9,
    leadTime: 'Next-Day UK Dispatch',
    specifications: '1.5kW / 2HP | 400V 50Hz | Output 48 RPM | IP55 Rated',
    manufacturer: 'TorqDrive UK (Leeds)',
    isUkcaCertified: true
  },
  {
    id: 4,
    name: 'Digital Ultrasonic Clamp-On Flow Meter',
    description: 'Non-invasive clamp-on ultrasonic transit-time flow meter for pipe sizes DN15 to DN700 with high-accuracy pulse and telemetry.',
    category: 'Instrumentation',
    price: 1120.00,
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-INS-3340',
    stockStatus: 'Low Stock',
    stockCount: 3,
    leadTime: '48h UK Mainland',
    specifications: 'Accuracy ±1.0% | Pipe DN15-DN700 | 4-20mA / Modbus RTU | IP68',
    manufacturer: 'PrecisionSense UK (Bristol)',
    isUkcaCertified: true
  },
  {
    id: 5,
    name: 'Pneumatic 5/2 Double Solenoid Valve Manifold',
    description: '5-station modular pneumatic valve terminal with 24V DC pilot coils, built-in LED status indicators, and manual overrides.',
    category: 'Pneumatics',
    price: 295.00,
    imageUrl: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-PNE-6041',
    stockStatus: 'In Stock',
    stockCount: 32,
    leadTime: 'Next-Day UK Dispatch',
    specifications: '1.5 - 8 Bar | 24V DC 1.2W | 800 L/min Flow | G 1/4" Ports',
    manufacturer: 'AeroFlow Pneumatics (Manchester)',
    isUkcaCertified: true
  },
  {
    id: 6,
    name: 'Stainless Steel 316 2-Piece Ball Valve PN16',
    description: 'Full-bore CF8M stainless steel ball valve with ISO 5211 direct mounting pad for pneumatic or electric actuation.',
    category: 'Fluid Handling',
    price: 185.00,
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-VLV-2280',
    stockStatus: 'In Stock',
    stockCount: 45,
    leadTime: 'Next-Day UK Dispatch',
    specifications: '316 Stainless Steel | DN50 (2") Flanged PN16 | PTFE Seats | Firesafe',
    manufacturer: 'Apex Valve Works (Aberdeen)',
    isUkcaCertified: true
  },
  {
    id: 7,
    name: 'Laser Time-of-Flight Distance Sensor 0.1-50m',
    description: 'Long-range optical laser measurement sensor with visible red Class 2 laser and IO-Link communication for automation.',
    category: 'Automation & Sensors',
    price: 540.00,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    sku: 'UK-AUT-5512',
    stockStatus: 'Low Stock',
    stockCount: 2,
    leadTime: '2-3 Working Days',
    specifications: 'Range 0.1–50m | Repeatability ±1mm | IO-Link / 0-10V | IP67 M12',
    manufacturer: 'OptiScan Instruments (Cambridge)',
    isUkcaCertified: true
  },
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
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) {
      return false;
    }

    const existing = products[index];
    const merged: Product = {
      ...existing,
      ...updatedProduct,
      id: productId,
      sku: updatedProduct.sku || existing.sku || `UK-IND-${1000 + productId}`
    };

    this.saveProduct(products.map(p => (p.id === productId ? merged : p)));
    return true;
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
    const products = this.productsState();
    const filtered = products.filter(p => p.id !== productId);
    if (filtered.length === products.length) {
      return false;
    }
    this.saveProduct(filtered);
    return true;
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
