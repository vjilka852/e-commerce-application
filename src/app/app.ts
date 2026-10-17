import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { ThemeService } from './service/theme.service';
import { AuthService } from './service/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);

  toggleTheme(): void {
    this.themeService.setDarkMode(!this.themeService.isDark());
  }
}
