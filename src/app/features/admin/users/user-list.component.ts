import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { PaginatorState } from 'primeng/types/paginator';
import { Subject, catchError, debounceTime, from, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { AuthService } from '../../../service/auth.service';
import { DummyJsonUserService } from '../../../service/dummyjson-user.service';
import { DummyJsonUser, ManagedUserRow } from '../../../models/dummyjson-user.model';
import { LoaderComponent } from '../../../shared/loader/loader.component';

interface UserSearchRequest {
  query: string;
  field: string;
}

interface UserSearchResult {
  request: UserSearchRequest;
  users?: DummyJsonUser[];
  error?: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule, RouterLink, PaginatorModule, DialogModule, LoaderComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly apiUserService = inject(DummyJsonUserService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchRequests = new Subject<UserSearchRequest>();
  readonly userToDelete = signal<{ id: string; source: 'local' | 'api'; name: string } | null>(null);
  readonly isLoading = signal(false);
  readonly loadError = signal('');
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly rowsPerPageOptions = [5, 10, 20];
  readonly searchQuery = signal('');
  readonly selectedSearchField = signal('');
  readonly isSearching = signal(false);
  readonly searchError = signal('');
  readonly apiSearchUsers = signal<DummyJsonUser[] | null>(null);
  readonly searchFields = [
    { label: 'All fields', key: '' },
    { label: 'First name', key: 'firstName' },
    { label: 'Last name', key: 'lastName' },
    { label: 'Email', key: 'email' },
    { label: 'Username', key: 'username' },
    { label: 'Phone', key: 'phone' },
    { label: 'Role', key: 'role' },
    { label: 'Hair color', key: 'hair.color' },
    { label: 'Hair type', key: 'hair.type' },
    { label: 'City', key: 'address.city' },
    { label: 'Country', key: 'address.country' },
    { label: 'Company', key: 'company.name' },
    { label: 'Department', key: 'company.department' },
    { label: 'University', key: 'university' }
  ];
  readonly selectedApiUser = signal<DummyJsonUser | null>(null);
  readonly selectedLocalUser = signal<ManagedUserRow | null>(null);
  readonly selectedDetailsTarget = signal<ManagedUserRow | null>(null);
  readonly isDetailsOpen = signal(false);
  readonly isDetailsLoading = signal(false);
  readonly detailsError = signal('');

  readonly allUsers = computed(() => [
    ...this.authService.users().map(user => ({
      id: user.id,
      displayName: user.displayName,
      username: '—',
      email: user.email,
      roleName: this.authService.roleLabel(user.roleId),
      active: user.active,
      source: 'local' as const
    })),
    ...this.apiUserService.users().map(user => ({
      id: `dummyjson:${user.id}`,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      username: user.username,
      email: user.email,
      roleName: `DummyJSON ${user.role}`,
      active: true,
      source: 'api' as const
    }))
  ]);

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const field = this.selectedSearchField();
    const apiUsers = this.apiSearchUsers() ?? this.apiUserService.users();
    const localUsers = this.authService.users()
      .map(user => ({
        id: user.id,
        displayName: user.displayName,
        username: '—',
        email: user.email,
        roleName: this.authService.roleLabel(user.roleId),
        active: user.active,
        source: 'local' as const
      }))
      .filter(user => this.matchesLocalUser(user, query, field));

    const mappedApiUsers = apiUsers.map(user => ({
      id: `dummyjson:${user.id}`,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      username: user.username,
      email: user.email,
      roleName: `DummyJSON ${user.role}`,
      active: true,
      source: 'api' as const
    }));

    return [...localUsers, ...mappedApiUsers];
  });

  readonly paginatedUsers = computed(() =>
    this.filteredUsers().slice(this.first(), this.first() + this.rows())
  );

  ngOnInit(): void {
    this.searchRequests.pipe(
      debounceTime(300),
      switchMap(request => request.query
        ? from(this.apiUserService.searchUsers(request.query, request.field)).pipe(
          map(users => ({ request, users, error: undefined } satisfies UserSearchResult)),
          catchError((error: unknown) => of({
            request,
            users: undefined,
            error: error instanceof Error ? error.message : 'Users could not be searched.'
          } satisfies UserSearchResult))
        )
        : of({ request, users: undefined, error: undefined } satisfies UserSearchResult)
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result.request.query !== this.searchQuery().trim()
        || result.request.field !== this.selectedSearchField()) {
        return;
      }
      if (result.error) {
        this.searchError.set(result.error);
        this.apiSearchUsers.set([]);
      } else if (!result.request.query) {
        this.searchError.set('');
        this.apiSearchUsers.set(null);
      } else {
        this.searchError.set('');
        this.apiSearchUsers.set(result.users ?? []);
      }
      this.isSearching.set(false);
      this.first.set(0);
    });
    void this.loadUsers();
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.scheduleSearch();
  }

  updateSearchField(field: string): void {
    this.selectedSearchField.set(field);
    this.scheduleSearch();
  }

  private scheduleSearch(): void {
    const query = this.searchQuery().trim();
    this.searchError.set('');
    this.first.set(0);
    if (!query) {
      this.apiSearchUsers.set(null);
      this.isSearching.set(false);
      this.searchRequests.next({ query, field: this.selectedSearchField() });
      return;
    }
    this.isSearching.set(true);
    this.apiSearchUsers.set([]);
    this.searchRequests.next({ query, field: this.selectedSearchField() });
  }

  private matchesLocalUser(
    user: ManagedUserRow & { username: string },
    query: string,
    field: string
  ): boolean {
    if (!query) {
      return true;
    }
    const values: Record<string, string> = {
      firstName: user.displayName,
      lastName: user.displayName,
      email: user.email,
      username: user.username,
      phone: '',
      role: user.roleName,
      'hair.color': '',
      'hair.type': '',
      'address.city': '',
      'address.country': '',
      'company.name': '',
      'company.department': '',
      university: ''
    };
    return field ? (values[field] ?? '').toLocaleLowerCase().includes(query)
      : Object.values(user).some(value => String(value).toLocaleLowerCase().includes(query));
  }

  async loadUsers(force = false): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');
    try {
      await this.apiUserService.loadUsers(force);
      this.first.set(0);
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Users could not be loaded.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
  }

  async viewUser(user: ManagedUserRow): Promise<void> {
    this.selectedDetailsTarget.set(user);
    this.selectedApiUser.set(null);
    this.selectedLocalUser.set(null);
    this.detailsError.set('');
    this.isDetailsOpen.set(true);

    if (user.source === 'local') {
      this.selectedLocalUser.set(user);
      return;
    }

    this.isDetailsLoading.set(true);
    try {
      const id = Number(user.id.slice('dummyjson:'.length));
      this.selectedApiUser.set(await this.apiUserService.getUser(id));
    } catch (error) {
      this.detailsError.set(error instanceof Error ? error.message : 'User details could not be loaded.');
    } finally {
      this.isDetailsLoading.set(false);
    }
  }

  confirmDelete(user: { id: string; source: 'local' | 'api'; displayName: string }): void {
    if (user.id === this.authService.currentUser()?.id) {
      return;
    }
    this.userToDelete.set({ id: user.id, source: user.source, name: user.displayName });
  }

  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  async deleteUser(): Promise<void> {
    const user = this.userToDelete();
    if (!user) {
      return;
    }

    if (user.source === 'local') {
      if (!this.authService.deleteUser(user.id)) {
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
        summary: 'Local user deleted',
        detail: 'The account was removed from this browser.',
        life: 3000
      });
      this.adjustPageAfterDelete();
      this.cancelDelete();
      return;
    }

    try {
      await this.apiUserService.deleteUser(Number(user.id.slice('dummyjson:'.length)));
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'User not deleted',
        detail: error instanceof Error ? error.message : 'The API user could not be deleted.',
        life: 4000
      });
      this.cancelDelete();
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'API user deleted',
      detail: 'DummyJSON confirmed the deletion. Its API may restore sample records after refresh.',
      life: 3000
    });
    this.adjustPageAfterDelete();
    this.cancelDelete();
  }

  private adjustPageAfterDelete(): void {
    const lastPageFirst = Math.floor(Math.max(0, this.filteredUsers().length - 1) / this.rows()) * this.rows();
    this.first.set(Math.min(this.first(), lastPageFirst));
  }
}
