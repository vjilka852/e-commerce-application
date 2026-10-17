import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Permission, RoleInput } from '../../../models/auth.model';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss'
})
export class RoleFormComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  roleId: string | null = null;
  submitError = '';

  readonly roleForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(240)] }),
    permissions: new FormControl<Permission[]>([], { nonNullable: true })
  });

  get isEditMode(): boolean {
    return this.roleId !== null;
  }

  get permissionGroups(): string[] {
    return [...new Set(this.authService.permissionOptions.map(permission => permission.module))];
  }

  ngOnInit(): void {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (roleId === null) {
      return;
    }

    const role = this.authService.roles().find(candidate => candidate.id === roleId);
    if (!role || role.protected) {
      void this.router.navigateByUrl('/admin/roles');
      return;
    }

    this.roleId = role.id;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
  }

  permissionsFor(module: string): typeof this.authService.permissionOptions {
    return this.authService.permissionOptions.filter(permission => permission.module === module);
  }

  hasPermission(permission: Permission): boolean {
    return this.roleForm.controls.permissions.value.includes(permission);
  }

  togglePermission(permission: Permission, checked: boolean): void {
    const current = this.roleForm.controls.permissions.value;
    const updated = checked
      ? [...current, permission]
      : current.filter(value => value !== permission);
    this.roleForm.controls.permissions.setValue([...new Set(updated)]);
  }

  onPermissionChange(event: Event, permission: Permission): void {
    if (event.target instanceof HTMLInputElement) {
      this.togglePermission(permission, event.target.checked);
    }
  }

  onSubmit(): void {
    this.submitError = '';
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const input: RoleInput = this.roleForm.getRawValue();
    const saved = this.roleId === null
      ? this.authService.createRole(input) !== undefined
      : this.authService.updateRole(this.roleId, input);
    if (!saved) {
      this.submitError = 'The role could not be saved. Check that the name is unique and valid.';
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: this.isEditMode ? 'Role updated' : 'Role added',
      detail: 'Role permissions were saved.',
      life: 3000
    });
    void this.router.navigateByUrl('/admin/roles');
  }
}
