import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Cart } from '../../../models/cart.model';
import { CartService } from '../../../service/cart.service';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/types/paginator';
import { LoaderComponent } from '../../../shared/loader/loader.component';

@Component({
  selector: 'app-cart-list',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, PaginatorModule, LoaderComponent],
  templateUrl: './cart-list.component.html',
  styleUrl: './cart-list.component.scss'
})
export class CartListComponent implements OnInit {
  private readonly cartService = inject(CartService);
  readonly carts = signal<Cart[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');
  readonly searchQuery = signal('');
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly rowsPerPageOptions = [5, 10, 20];
  readonly expandedCartId = signal<number | null>(null);

  readonly filteredCarts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.carts();
    }

    return this.carts().filter(cart =>
      String(cart.id).includes(query) || String(cart.userId).includes(query)
    );
  });

  readonly paginatedCarts = computed(() => {
    return this.filteredCarts().slice(this.first(), this.first() + this.rows());
  });

  readonly totalItems = computed(() => this.carts().length);
  readonly totalProducts = computed(() => this.carts().reduce((sum, cart) => sum + cart.totalProducts, 0));
  readonly totalQuantity = computed(() => this.carts().reduce((sum, cart) => sum + cart.totalQuantity, 0));
  readonly totalRevenue = computed(() => this.carts().reduce((sum, cart) => sum + cart.discountedTotal, 0));

  ngOnInit(): void {
    this.loadCarts();
  }

  loadCarts(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.cartService.getCarts().subscribe({
      next: response => {
        this.carts.set(response.carts);
        this.first.set(0);
        this.isLoading.set(false);
      },
      error: error => {
        const message = error instanceof HttpErrorResponse || error instanceof Error
          ? error.message
          : 'The cart service returned an unexpected error.';
        this.loadError.set(message);
        this.isLoading.set(false);
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

  toggleCartDetails(cartId: number): void {
    this.expandedCartId.update(currentId => currentId === cartId ? null : cartId);
  }
}
