import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../service/category.service';
import { ProductService } from '../../service/product.service';
import { AuthService } from '../../service/auth.service';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/types/paginator';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [FormsModule, RouterLink, PaginatorModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent {
  readonly categoryService = inject(CategoryService);
  readonly authService = inject(AuthService);
  private readonly productService = inject(ProductService);
  private readonly messageService = inject(MessageService);

  readonly searchQuery = signal('');
  readonly categoryToDelete = signal<Category | null>(null);
  readonly first = signal(0);
  readonly rows = signal(5);
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
