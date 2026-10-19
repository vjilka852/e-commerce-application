import { Component, computed, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../service/category.service';
import { ProductService } from '../../service/product.service';
import { AuthService } from '../../service/auth.service';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/types/paginator';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [FormsModule, RouterLink, PaginatorModule, LoaderComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly searchQuery = signal('');
  readonly isLoadingCategories = signal(false);
  readonly categoriesLoadError = signal('');
  readonly categoryToDelete = signal<Category | null>(null);
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly rowsPerPageOptions = [5, 10, 20];

  readonly filteredCategories = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return this.categoryService.categories().filter(category =>
      !query ||
      category.name.toLocaleLowerCase().includes(query) ||
      category.description.toLocaleLowerCase().includes(query)
    );
  });

  readonly paginatedCategories = computed(() =>
    this.filteredCategories().slice(this.first(), this.first() + this.rows())
  );

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCategories();
    }
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoriesLoadError.set('');
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.isLoadingCategories.set(false),
        error: (error: HttpErrorResponse) => {
          this.categoriesLoadError.set(error.status
            ? `The category API returned an error (${error.status}). Your saved categories are still available.`
            : 'Could not connect to the category API. Your saved categories are still available.');
          this.isLoadingCategories.set(false);
        }
      });
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.first.set(0);
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  getProductCount(categoryName: string): number {
    return this.productService.countProductsInCategory(categoryName);
  }

  promptDelete(category: Category): void {
    if (!this.authService.hasPermission('categories.delete')) {
      return;
    }
    this.categoryToDelete.set(category);
  }

  cancelDelete(): void {
    this.categoryToDelete.set(null);
  }

  executeDelete(): void {
    const category = this.categoryToDelete();
    if (!category || !this.authService.hasPermission('categories.delete')) {
      return;
    }

    if (!this.categoryService.deleteCategory(category.id)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Category not deleted',
        detail: 'Remove or reassign its products before deleting this category.',
        life: 4000
      });
      this.cancelDelete();
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Category deleted',
      detail: `"${category.name}" was removed successfully.`,
      life: 3000
    });
    this.cancelDelete();
  }
}
