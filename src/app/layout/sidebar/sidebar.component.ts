import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../service/auth.service';
import { ProductService } from '../../service/product.service';
import { CategoryService } from '../../service/category.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly productService = inject(ProductService);
  readonly categoryService = inject(CategoryService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  logout(): void {
    if (!this.authService.logout()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Session not cleared',
        detail: 'Browser storage prevented removal of the saved session.',
        life: 4000
      });
    }
    void this.router.navigateByUrl('/login');
  }
}
