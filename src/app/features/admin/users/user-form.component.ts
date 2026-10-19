import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../service/auth.service';
import { UserInput } from '../../../models/auth.model';
import { DummyJsonUser, DummyJsonUserInput, DummyJsonUserRole } from '../../../models/dummyjson-user.model';
import { DummyJsonUserService } from '../../../service/dummyjson-user.service';
import { LoaderComponent } from '../../../shared/loader/loader.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly apiUserService = inject(DummyJsonUserService);

  userId: string | null = null;
  apiUserId: number | null = null;
  apiUser: DummyJsonUser | null = null;
  private apiMode = false;
  submitError = '';
  loadError = '';
  isSubmitting = false;

  readonly userForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8)] }),
    roleId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    active: new FormControl(true, { nonNullable: true })
  });

  readonly apiUserForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(30)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8)] }),
    role: new FormControl<DummyJsonUserRole>('user', { nonNullable: true, validators: [Validators.required] })
  });

  get isEditMode(): boolean {
    return this.userId !== null || this.apiUserId !== null;
  }

  get isApiUser(): boolean {
    return this.apiMode;
  }

  get isEditingSelf(): boolean {
    return this.userId !== null && this.userId === this.authService.currentUser()?.id;
  }

  ngOnInit(): void {
    this.apiMode = this.route.snapshot.data['apiUser'] === true;
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId === null) {
      if (this.apiMode) {
        this.apiUserForm.controls.password.addValidators(Validators.required);
        this.apiUserForm.controls.password.updateValueAndValidity();
      }
      const firstRole = this.authService.roles()[0];
      if (firstRole) {
        this.userForm.controls.roleId.setValue(firstRole.id);
      }
      return;
    }

    if (userId.startsWith('dummyjson:')) {
      this.apiMode = true;
      const id = Number(userId.slice('dummyjson:'.length));
      if (!Number.isInteger(id) || id <= 0) {
        void this.router.navigateByUrl('/admin/users');
        return;
      }
      this.apiUserId = id;
      void this.loadApiUser(id);
      return;
    }

    const user = this.authService.users().find(candidate => candidate.id === userId);
    if (!user) {
      void this.router.navigateByUrl('/admin/users');
      return;
    }

    this.userId = user.id;
    this.userForm.patchValue({
      displayName: user.displayName,
      email: user.email,
      roleId: user.roleId,
      active: user.active
    });
    if (this.isEditingSelf) {
      this.userForm.controls.roleId.disable();
      this.userForm.controls.active.disable();
    }
  }

  private async loadApiUser(id: number): Promise<void> {
    this.isSubmitting = true;
    try {
      const user = await this.apiUserService.getUser(id);
      this.apiUser = user;
      this.apiUserForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'User details could not be loaded.';
    } finally {
      this.isSubmitting = false;
    }
  }

  retryLoadApiUser(): void {
    if (this.apiUserId !== null) {
      void this.loadApiUser(this.apiUserId);
    }
  }

  async onSubmit(): Promise<void> {
    this.submitError = '';
    if (this.isApiUser) {
      await this.saveApiUser();
      return;
    }

    if (this.userForm.invalid || (!this.isEditMode && !this.userForm.controls.password.value)) {
      this.userForm.markAllAsTouched();
      if (!this.isEditMode && !this.userForm.controls.password.value) {
        this.userForm.controls.password.setErrors({ required: true });
      }
      return;
    }

    if (this.isEditingSelf) {
      const currentUser = this.authService.currentUser();
      if (currentUser && (
        this.userForm.controls.roleId.value !== currentUser.roleId
        || !this.userForm.controls.active.value
      )) {
        this.submitError = 'You cannot change your own role or deactivate your current account.';
        return;
      }
    }

    this.isSubmitting = true;
    try {
      const input: UserInput = this.userForm.getRawValue();
      const saved = this.userId === null
        ? await this.authService.createUser(input)
        : await this.authService.updateUser(this.userId, input);
      if (!saved) {
        this.submitError = 'The user could not be saved. Check that the email is unique and the assigned role still exists.';
        return;
      }

      this.messageService.add({
        severity: 'success',
        summary: this.isEditMode ? 'User updated' : 'User added',
        detail: 'The local account was saved in this browser.',
        life: 3000
      });
      await this.router.navigateByUrl('/admin/users');
    } catch (error) {
      this.submitError = error instanceof Error ? error.message : 'The user could not be saved.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private async saveApiUser(): Promise<void> {
    if (this.apiUserForm.invalid) {
      this.apiUserForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    try {
      const values = this.apiUserForm.getRawValue();
      const input: DummyJsonUserInput = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        username: values.username.trim(),
        role: values.role,
        ...(!this.isEditMode ? { password: values.password } : {})
      };
      if (this.apiUserId === null) {
        await this.apiUserService.createUser(input);
      } else {
        await this.apiUserService.updateUser(this.apiUserId, input);
      }

      this.messageService.add({
        severity: 'success',
        summary: this.isEditMode ? 'API user updated' : 'API user added',
        detail: 'DummyJSON accepted the change. Its sample data may reset after refresh.',
        life: 4000
      });
      await this.router.navigateByUrl('/admin/users');
    } catch (error) {
      this.submitError = error instanceof Error ? error.message : 'The API user could not be saved.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
