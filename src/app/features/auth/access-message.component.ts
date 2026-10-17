import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-access-message',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './access-message.component.html',
  styleUrl: './access-message.component.scss'
})
export class AccessMessageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly title = this.route.snapshot.data['title'] as string;
  readonly message = this.route.snapshot.data['message'] as string;

  signOut(): void {
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
