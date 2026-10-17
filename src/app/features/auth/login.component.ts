import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  errorMessage = '';
  isSubmitting = false;

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      const { email, password } = this.loginForm.getRawValue();
      const user = await this.authService.login(email, password);
      if (!user) {
        this.errorMessage = 'Email or password is incorrect.';
        return;
      }

      const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const destination = this.isSafeInternalUrl(requestedUrl)
        ? requestedUrl
        : this.authService.hasPermission('products.read')
          ? '/products'
          : user.roleId === 'client' ? '/customer-access' : '/access-denied';
      await this.router.navigateByUrl(destination);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Sign in could not be completed. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private isSafeInternalUrl(url: string | null): url is string {
    return url !== null && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login');
  }
}
