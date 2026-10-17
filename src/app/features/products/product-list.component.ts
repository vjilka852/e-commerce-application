import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ProductService } from '../../service/product.service';
import { CategoryService } from '../../service/category.service';
import { Product } from '../../models/product.model';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/types/paginator';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    PaginatorModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);

  // Search & Filter
  readonly searchQuery = signal('');
  readonly selectedCategory = signal<string>('All');
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly rowsPerPageOptions = [5, 10, 20];

  // Delete Confirmation Modal State
  readonly productToDelete = signal<Product | null>(null);
  readonly isDeleteModalOpen = signal(false);

  // Available Categories
  readonly categories = computed(() => {
    const managed = this.categoryService.categories().map(category => category.name);
    const legacy = this.productService.products().map(product => product.category).filter(Boolean);
    return ['All', ...new Set([...managed, ...legacy])];
  });

  // Filtered Products
  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.productService.products().filter(product => {
      if (cat !== 'All' && product.category !== cat) {
        return false;
      }

      if (query) {
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku?.toLowerCase().includes(query) ?? false;
        const matchesCat = product.category.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        return matchesName || matchesSku || matchesCat || matchesDesc;
      }

      return true;
    });
  });

  readonly paginatedProducts = computed(() =>
    this.filteredProducts().slice(this.first(), this.first() + this.rows())
  );

  // SVG Fallback for broken images
  readonly fallbackImageSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="%23f1f5f9"><rect width="60" height="60" fill="%23f1f5f9" rx="6"/><circle cx="30" cy="30" r="12" fill="%23cbd5e1"/></svg>';

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.fallbackImageSvg;
    }
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.first.set(0);
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.first.set(0);
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  // Delete Confirmation Popup Handlers
  promptDelete(product: Product): void {
    if (!this.authService.hasPermission('products.delete')) {
      return;
    }
    this.productToDelete.set(product);
    this.isDeleteModalOpen.set(true);
  }

  cancelDelete(): void {
    this.isDeleteModalOpen.set(false);
    this.productToDelete.set(null);
  }

  executeDelete(): void {
    const target = this.productToDelete();
    if (!target || !this.authService.hasPermission('products.delete')) {
      return;
    }

    this.productService.deleteProduct(target.id);
    this.messageService.add({
      severity: 'success',
      summary: 'Product Deleted',
      detail: `"${target.name}" was successfully removed.`,
      life: 3000
    });
    this.cancelDelete();
  }
}
