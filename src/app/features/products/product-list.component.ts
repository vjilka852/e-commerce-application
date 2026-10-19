import { Component, DestroyRef, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { catchError, map, of, Subject, switchMap, timer } from 'rxjs';
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
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    CurrencyPipe,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    PaginatorModule,
    LoaderComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Search & Filter
  readonly searchQuery = signal('');
  readonly apiSearchProducts = signal<Product[] | null>(null);
  readonly apiSearchTotal = signal(0);
  readonly isSearching = signal(false);
  readonly searchError = signal('');
  private readonly searchInput$ = new Subject<string>();
  readonly selectedCategory = signal<string>('All');
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly rowsPerPageOptions = [5, 10, 20];
  readonly isLoadingProducts = signal(true);
  readonly productsLoadError = signal('');
  readonly selectedProduct = signal<Product | null>(null);
  readonly isDetailsOpen = signal(false);

  // Delete Confirmation Modal State
  readonly productToDelete = signal<Product | null>(null);
  readonly isDeleteModalOpen = signal(false);
  readonly isDeletingProduct = signal(false);
  readonly deleteError = signal('');

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
    const source = query
      ? this.apiSearchProducts() ?? []
      : this.productService.products();

    return source.filter(product => {
      if (cat !== 'All' && product.category !== cat) {
        return false;
      }

      if (query) {
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku?.toLowerCase().includes(query) ?? false;
        const matchesCat = product.category.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const apiProduct = product.apiProduct;
        const matchesBrand = apiProduct?.brand.toLowerCase().includes(query) ?? false;
        const matchesTag = apiProduct?.tags.some(tag => tag.toLowerCase().includes(query)) ?? false;
        return matchesName || matchesSku || matchesCat || matchesDesc || matchesBrand || matchesTag;
      }

      return true;
    });
  });

  readonly paginatedProducts = computed(() =>
    this.filteredProducts().slice(this.first(), this.first() + this.rows())
  );

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.searchInput$.pipe(
      switchMap(query => {
        if (!query) {
          return of({ query, products: null, total: 0, error: '' });
        }

        this.apiSearchProducts.set(null);
        this.apiSearchTotal.set(0);
        this.searchError.set('');
        this.isSearching.set(true);

        return timer(300).pipe(
          switchMap(() => this.productService.searchProducts(query)),
          map(response => ({
            query,
            products: this.productService.mapApiProducts(response.products),
            total: response.total,
            error: ''
          })),
          catchError((error: HttpErrorResponse) => of({
            query,
            products: null,
            total: 0,
            error: error.status
              ? `The product search API returned an error (${error.status}). Try again.`
              : 'Could not connect to product search. Check your connection and try again.'
          }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result.query !== this.searchQuery().trim()) {
        return;
      }
      this.apiSearchProducts.set(result.products);
      this.apiSearchTotal.set(result.total);
      this.searchError.set(result.error);
      this.isSearching.set(false);
    });

    if (this.productService.hasApiProducts()) {
      this.isLoadingProducts.set(false);
      return;
    }

    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoadingProducts.set(true);
    this.productsLoadError.set('');
    this.productService.getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.productService.setProductsFromApi(response.products);
          this.isLoadingProducts.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.productsLoadError.set(
            error.status
              ? `The product API returned an error (${error.status}). Check your connection and try again.`
              : 'Could not connect to the product API. Check your connection and try again.'
          );
          this.isLoadingProducts.set(false);
        }
      });
  }

  showProductDetails(product: Product): void {
    this.selectedProduct.set(product);
    this.isDetailsOpen.set(true);
  }

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
    this.searchInput$.next(query.trim());
  }

  retrySearch(): void {
    const query = this.searchQuery().trim();
    if (query) {
      this.searchInput$.next(query);
    }
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
    this.deleteError.set('');
    this.productToDelete.set(product);
    this.isDeleteModalOpen.set(true);
  }

  cancelDelete(): void {
    if (this.isDeletingProduct()) {
      return;
    }
    this.isDeleteModalOpen.set(false);
    this.productToDelete.set(null);
    this.deleteError.set('');
  }

  async executeDelete(): Promise<void> {
    const target = this.productToDelete();
    if (!target || !this.authService.hasPermission('products.delete') || this.isDeletingProduct()) {
      return;
    }

    this.isDeletingProduct.set(true);
    this.deleteError.set('');
    try {
      if (target.apiProduct) {
        await firstValueFrom(this.productService.deleteApiProduct(target.id));
      } else if (!this.productService.deleteProduct(target.id)) {
        throw new Error('This product is no longer available in the catalog.');
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Product Deleted',
        detail: `"${target.name}" was successfully removed.`,
        life: 3000
      });
      this.isDeletingProduct.set(false);
      this.cancelDelete();
    } catch (error) {
      this.deleteError.set(error instanceof HttpErrorResponse
        ? error.status
          ? `The product API returned an error (${error.status}). The product was not removed.`
          : 'Could not connect to the product API. The product was not removed.'
        : error instanceof Error
          ? error.message
          : 'Could not delete the product. Please try again.');
    } finally {
      this.isDeletingProduct.set(false);
    }
  }
}
