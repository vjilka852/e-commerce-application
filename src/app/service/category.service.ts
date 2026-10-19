import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Category, CategoryInput } from '../models/category.model';
import { ProductService } from './product.service';
import { HttpClient } from '@angular/common/http';
import { enviornment } from '../../environments/environment';
import { map, Observable, tap } from 'rxjs';

const API_CATEGORY_ID_START = 1_000_000;
const LEGACY_DEMO_CATEGORY_NAMES = new Set([
  'hydraulics',
  'pneumatics',
  'motors & drives',
  'instrumentation',
  'safety & ppe',
  'fluid handling',
  'automation & sensors',
  'workshop & tooling'
]);

@Injectable({ providedIn: 'any' })
export class CategoryService {
  private readonly storageKey = 'ecommerce_categories';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly productService = inject(ProductService);
  private readonly categoriesState = signal<Category[]>([]);

  private readonly http = inject(HttpClient);
  private readonly api = `${enviornment.apiUrl}/products/category-list`;

  readonly categories = this.categoriesState.asReadonly();
  readonly totalCategories = computed(() => this.categoriesState().length);

  constructor() {
    if (this.isBrowser) {
      this.categoriesState.set(this.loadCategories());
    }
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<string[]>(this.api).pipe(
      map(names => names.map((name, index): Category => ({
        id: API_CATEGORY_ID_START + index,
        name,
        description: `Products in the ${name} category from the product catalog.`,
        active: true,
        source: 'api'
      }))),
      tap(apiCategories => this.mergeApiCategories(apiCategories))
    );
  }

  private mergeApiCategories(apiCategories: Category[]): void {
    const localCategories = this.categoriesState().filter(category =>
      category.source !== 'api' && !this.isLegacyDemoCategory(category)
    );
    const localNames = new Set(localCategories.map(category => category.name.toLocaleLowerCase()));
    this.saveCategories([
      ...apiCategories.filter(category => !localNames.has(category.name.toLocaleLowerCase())),
      ...localCategories
    ]);
  }

  private loadCategories(): Category[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored) as Category[];
      if (!Array.isArray(parsed)) {
        throw new Error('Saved categories must be an array.');
      }
      const normalized = parsed
        .filter(category => !this.isLegacyDemoCategory(category))
        .map(category => ({
          id: category.id,
          name: category.name,
          description: category.description ?? '',
          active: category.active ?? true,
          ...(category.source === 'api' ? { source: 'api' as const } : {})
        }));
      if (
        normalized.length !== parsed.length
        || parsed.some(category => !('active' in category) || 'code' in category)
      ) {
        localStorage.setItem(this.storageKey, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  }

  private isLegacyDemoCategory(category: Category): boolean {
    return category.source !== 'api'
      && LEGACY_DEMO_CATEGORY_NAMES.has(category.name.trim().toLocaleLowerCase());
  }

  private saveCategories(categories: Category[]): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(categories));
      } catch (e) {
        console.warn('Storage quota exceeded, state maintained in-memory', e);
      }
    }
    this.categoriesState.set(categories);
  }

  getCategoryById(id: number): Category | undefined {
    return this.categoriesState().find(c => c.id === id);
  }

  hasDuplicate(category: CategoryInput, excludingId?: number): boolean {
    const name = category.name.trim().toLocaleLowerCase();
    return this.categoriesState().some(existing =>
      existing.id !== excludingId && existing.name.toLocaleLowerCase() === name
    );
  }

  addCategory(category: CategoryInput): Category | undefined {
    const normalized = {
      ...category,
      name: category.name.trim(),
      description: category.description.trim()
    };
    if (this.hasDuplicate(normalized)) {
      return undefined;
    }

    const list = this.categoriesState();
    const id = list
      .filter(existing => existing.source !== 'api')
      .reduce((maxId, existing) => Math.max(maxId, existing.id), 0) + 1;
    const newCategory: Category = {
      ...normalized,
      id,
    };
    this.saveCategories([...list, newCategory]);
    return newCategory;
  }

  updateCategory(id: number, updated: CategoryInput): boolean {
    const list = this.categoriesState();
    const index = list.findIndex(c => c.id === id);
    if (index === -1 || list[index].source === 'api') {
      return false;
    }

    const normalized = {
      ...updated,
      name: updated.name.trim(),
      description: updated.description.trim()
    };
    if (this.hasDuplicate(normalized, id)) {
      return false;
    }

    const previousName = this.categoriesState()[index].name;
    const merged: Category = {
      ...list[index],
      ...normalized,
      id,
    };

    this.saveCategories(list.map(c => (c.id === id ? merged : c)));
    if (previousName !== merged.name) {
      this.productService.renameCategory(previousName, merged.name);
    }
    return true;
  }

  deleteCategory(id: number): boolean {
    const list = this.categoriesState();
    const category = list.find(c => c.id === id);
    if (!category || category.source === 'api' || this.productService.countProductsInCategory(category.name) > 0) {
      return false;
    }
    const filtered = list.filter(c => c.id !== id);
    this.saveCategories(filtered);
    return true;
  }
}
