import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('ecommerce_users');
    localStorage.removeItem('ecommerce_session');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), MessageService],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show the sign-in page when no session exists', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#login-title')?.textContent).toContain('Sign in');
    expect(compiled.querySelector('.sidebar-container')).toBeNull();
  });
});
