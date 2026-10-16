import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CategoryFormComponent } from './category-form.component';

describe('CategoryFormComponent', () => {
  let fixture: ComponentFixture<CategoryFormComponent>;

  beforeEach(async () => {
    localStorage.removeItem('ecommerce_categories');
    localStorage.removeItem('ecommerce_products');
    await TestBed.configureTestingModule({
      imports: [CategoryFormComponent],
      providers: [provideRouter([]), MessageService]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryFormComponent);
    fixture.detectChanges();
  });

  it('should create the category form', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#categoryName')).toBeTruthy();
  });
});
