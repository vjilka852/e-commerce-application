import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../service/auth.service';
import { UserInput } from '../../../models/auth.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  userId: string | null = null;
  submitError = '';
  isSubmitting = false;

  readonly userForm = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8)] }),
    roleId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    active: new FormControl(true, { nonNullable: true })
  });

  get isEditMode(): boolean {
    return this.userId !== null;
  }

  get isEditingSelf(): boolean {
    return this.userId !== null && this.userId === this.authService.currentUser()?.id;
  }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId === null) {
      const firstRole = this.authService.roles()[0];
      if (firstRole) {
        this.userForm.controls.roleId.setValue(firstRole.id);
      }
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

  async onSubmit(): Promise<void> {
    this.submitError = '';
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
        detail: 'The local account was saved.',
        life: 3000
      });
      await this.router.navigateByUrl('/admin/users');
    } catch (error) {
      this.submitError = error instanceof Error ? error.message : 'The user could not be saved.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
