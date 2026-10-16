import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Category, CategoryInput } from '../models/category.model';
import { ProductService } from './product.service';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Hydraulics',
    description: 'Industrial hydraulic variable pumps, cylinders, valves, and power packs.',
    active: true
  },
  {
    id: 2,
    name: 'Pneumatics',
    description: 'Pneumatic valve manifolds, FRL air preparation units, cylinders, and push-in fittings.',
    active: true
  },
  {
    id: 3,
    name: 'Motors & Drives',
    description: 'High-efficiency IE3 three-phase electric motors, helical gearboxes, and inverter drives.',
    active: true
  },
  {
    id: 4,
    name: 'Instrumentation',
    description: 'Digital ultrasonic clamp-on flow meters, pressure transmitters, and temperature telemetry.',
    active: true
  },
  {
    id: 5,
    name: 'Safety & PPE',
    description: 'UKCA optoelectronic safety light curtains, interlocking switches, and protective machinery barriers.',
    active: true
  },
  {
    id: 6,
    name: 'Fluid Handling',
    description: 'Stainless steel 316 flanged ball valves, butterfly valves, and sanitary process pumps.',
    active: true
  },
  {
    id: 7,
    name: 'Automation & Sensors',
    description: 'Laser time-of-flight distance sensors, photoelectric, inductive proximity, and IO-Link modules.',
    active: true
  },
  {
    id: 8,
    name: 'Workshop & Tooling',
    description: 'Heavy-duty steel mobile workbenches, CNC tool cabinets, and precision engineering storage.',
    active: true
  }
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly storageKey = 'ecommerce_categories';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly productService = inject(ProductService);
  private readonly categoriesState = signal<Category[]>([]);

  readonly categories = this.categoriesState.asReadonly();
  readonly totalCategories = computed(() => this.categoriesState().length);

  constructor() {
    if (this.isBrowser) {
      this.categoriesState.set(this.loadCategories());
    }
  }

  private loadCategories(): Category[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.seedDefaultCategories();
      }
      const parsed = JSON.parse(stored) as Category[];
      if (!Array.isArray(parsed)) {
        throw new Error('Saved categories must be an array.');
      }
      const normalized = parsed.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description ?? '',
        active: category.active ?? true
      }));
      if (parsed.some(category => !('active' in category) || 'code' in category)) {
        localStorage.setItem(this.storageKey, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return this.seedDefaultCategories();
    }
  }

  private seedDefaultCategories(): Category[] {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_CATEGORIES));
    }
    return INITIAL_CATEGORIES;
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
    const id = list.reduce((maxId, c) => Math.max(maxId, c.id), 0) + 1;
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
    if (index === -1) {
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
    if (!category || this.productService.countProductsInCategory(category.name) > 0) {
      return false;
    }
    const filtered = list.filter(c => c.id !== id);
    this.saveCategories(filtered);
    return true;
  }
}
