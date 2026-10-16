import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    localStorage.removeItem('ecommerce_products');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updates an existing product while preserving its id', () => {
    service.addProduct({
      name: 'Desk lamp',
      description: 'Adjustable lamp',
      category: 'Lighting',
      imageUrl: 'https://example.com/lamp.jpg',
      price: 24.99,
    });

    const updated = service.updateProduct(1, {
      name: 'Updated desk lamp',
      description: 'Dimmable adjustable lamp',
      category: 'Lighting',
      imageUrl: 'https://example.com/updated-lamp.jpg',
      price: 29.99,
    });

    expect(updated).toBe(true);
    expect(service.getProductById(1)).toMatchObject({
      id: 1,
      name: 'Updated desk lamp',
      description: 'Dimmable adjustable lamp',
      category: 'Lighting',
      imageUrl: 'https://example.com/updated-lamp.jpg',
      price: 29.99,
    });
    expect(JSON.parse(localStorage.getItem('ecommerce_products') ?? '[]')).toEqual(service.products());
  });

  it('returns false when the product to update does not exist', () => {
    expect(service.updateProduct(999, {
      name: 'Missing product',
      description: 'Not stored',
      category: 'Other',
      imageUrl: 'https://example.com/missing.jpg',
      price: 1,
    })).toBe(false);
  });
});
