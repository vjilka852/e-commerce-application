import { TestBed } from '@angular/core/testing';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';

describe('CategoryService', () => {
  let categories: CategoryService;
  let products: ProductService;

  beforeEach(() => {
    localStorage.removeItem('ecommerce_categories');
    localStorage.removeItem('ecommerce_products');
    TestBed.configureTestingModule({});
    categories = TestBed.inject(CategoryService);
    products = TestBed.inject(ProductService);
  });

  it('creates categories and rejects duplicate names or codes', () => {
    const created = categories.addCategory({
      name: 'Electrical Parts',
      code: 'ELC',
      description: 'Electrical parts and accessories.'
    });

    expect(created?.id).toBeGreaterThan(0);
    expect(categories.addCategory({
      name: 'electrical parts',
      code: 'OTHER',
      description: 'Duplicate name.'
    })).toBeUndefined();
    expect(categories.addCategory({
      name: 'Electrical Components',
      code: 'elc',
      description: 'Duplicate code.'
    })).toBeUndefined();
  });

  it('renames product assignments when a category is updated', () => {
    const category = categories.getCategoryById(1);
    expect(category?.name).toBe('Hydraulics');

    expect(categories.updateCategory(1, {
      name: 'Hydraulic Systems',
      code: 'HYD',
      description: 'Updated hydraulic product range.'
    })).toBe(true);

    expect(products.products().filter(product => product.category === 'Hydraulics')).toHaveLength(0);
    expect(products.products().some(product => product.category === 'Hydraulic Systems')).toBe(true);
  });

  it('prevents deleting a category that is still assigned to products', () => {
    expect(categories.deleteCategory(1)).toBe(false);
    expect(categories.getCategoryById(1)?.name).toBe('Hydraulics');
  });

  it('deletes an unused category', () => {
    const category = categories.addCategory({
      name: 'Temporary Category',
      code: 'TMP',
      description: 'Unused category for a deletion test.'
    });

    if (!category) {
      throw new Error('Expected the test category to be created.');
    }

    expect(categories.deleteCategory(category.id)).toBe(true);
    expect(categories.getCategoryById(category.id)).toBeUndefined();
  });
});
