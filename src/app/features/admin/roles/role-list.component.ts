import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './role-list.component.html',
  styleUrl: './role-list.component.scss'
})
export class RoleListComponent {
  readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  readonly roleToDelete = signal<string | null>(null);

  assignedUserCount(roleId: string): number {
    return this.authService.users().filter(user => user.roleId === roleId).length;
  }

  confirmDelete(roleId: string): void {
    this.roleToDelete.set(roleId);
  }

  cancelDelete(): void {
    this.roleToDelete.set(null);
  }

  deleteRole(): void {
    const roleId = this.roleToDelete();
    if (!roleId || !this.authService.deleteRole(roleId)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Role not deleted',
        detail: 'Protected roles and roles assigned to users cannot be deleted.',
        life: 4000
      });
      this.cancelDelete();
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Role deleted',
      detail: 'The role was removed successfully.',
      life: 3000
    });
    this.cancelDelete();
  }
}
