import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent {
  readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  readonly userToDelete = signal<string | null>(null);

  confirmDelete(userId: string): void {
    if (userId === this.authService.currentUser()?.id) {
      return;
    }
    this.userToDelete.set(userId);
  }

  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  deleteUser(): void {
    const userId = this.userToDelete();
    if (!userId || !this.authService.deleteUser(userId)) {
      this.messageService.add({
        severity: 'error',
        summary: 'User not deleted',
        detail: 'The active session and the last active Admin account cannot be deleted.',
        life: 4000
      });
      this.cancelDelete();
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'User deleted',
      detail: 'The account was removed from this browser.',
      life: 3000
    });
    this.cancelDelete();
  }
}
