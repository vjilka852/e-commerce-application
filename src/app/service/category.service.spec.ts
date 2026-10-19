import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';

describe('CategoryService', () => {
  let categories: CategoryService;
  let products: ProductService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('ecommerce_categories');
    localStorage.removeItem('ecommerce_products');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    categories = TestBed.inject(CategoryService);
    products = TestBed.inject(ProductService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem('ecommerce_categories');
    localStorage.removeItem('ecommerce_products');
  });

  it('loads and merges categories returned by the product API', () => {
    let loaded: string[] | undefined;
    categories.getCategories().subscribe(result => {
      loaded = result.map(category => category.name);
    });

    const request = httpTesting.expectOne('https://dummyjson.com/products/category-list');
    expect(request.request.method).toBe('GET');
    request.flush(['beauty', 'fragrances']);

    expect(loaded).toEqual(['beauty', 'fragrances']);
    expect(categories.categories().slice(0, 2).map(category => category.name)).toEqual(['beauty', 'fragrances']);
    expect(categories.categories().map(category => category.name)).not.toContain('Hydraulics');
    expect(categories.categories().find(category => category.name === 'beauty')).toMatchObject({
      source: 'api',
      active: true
    });
  });

  it('removes legacy demo categories from saved data but keeps user-created categories', () => {
    localStorage.setItem('ecommerce_categories', JSON.stringify([
      { id: 1, name: 'Hydraulics', description: 'Old demo category', active: true },
      { id: 2, name: 'Pneumatics', description: 'Old demo category', active: true },
      { id: 9, name: 'Electrical Parts', description: 'User-created category', active: true }
    ]));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    categories = TestBed.inject(CategoryService);
    httpTesting = TestBed.inject(HttpTestingController);

    expect(categories.categories().map(category => category.name)).toEqual(['Electrical Parts']);
    expect(JSON.parse(localStorage.getItem('ecommerce_categories') ?? '[]'))
      .toEqual(categories.categories());
  });

  it('creates categories and rejects duplicate names', () => {
    const created = categories.addCategory({
      name: 'Electrical Parts',
      description: 'Electrical parts and accessories.',
      active: true
    });

    expect(created?.id).toBeGreaterThan(0);
    expect(categories.addCategory({
      name: 'electrical parts',
      description: 'Duplicate name.',
      active: true
    })).toBeUndefined();
  });

  it('renames product assignments when a category is updated', () => {
    const category = categories.addCategory({
      name: 'Hydraulics',
      description: 'Hydraulic products.',
      active: true
    });
    if (!category) {
      throw new Error('Expected the category to be created.');
    }
    expect(category.name).toBe('Hydraulics');

    expect(categories.updateCategory(category.id, {
      name: 'Hydraulic Systems',
      description: 'Updated hydraulic product range.',
      active: true
    })).toBe(true);

    expect(products.products().filter(product => product.category === 'Hydraulics')).toHaveLength(0);
    expect(products.products().some(product => product.category === 'Hydraulic Systems')).toBe(true);
  });

  it('prevents deleting a category that is still assigned to products', () => {
    const category = categories.addCategory({
      name: 'Hydraulics',
      description: 'Hydraulic products.',
      active: true
    });

    if (!category) {
      throw new Error('Expected the category to be created.');
    }

    expect(categories.deleteCategory(category.id)).toBe(false);
    expect(categories.getCategoryById(category.id)?.name).toBe('Hydraulics');
  });

  it('deletes an unused category', () => {
    const category = categories.addCategory({
      name: 'Temporary Category',
      description: 'Unused category for a deletion test.',
      active: true
    });

    if (!category) {
      throw new Error('Expected the test category to be created.');
    }

    expect(categories.deleteCategory(category.id)).toBe(true);
    expect(categories.getCategoryById(category.id)).toBeUndefined();
  });
});
