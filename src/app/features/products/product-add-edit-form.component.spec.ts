import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ProductAddEditFormComponent } from './product-add-edit-form.component';

describe('ProductAddEditFormComponent', () => {
  let component: ProductAddEditFormComponent;
  let fixture: ComponentFixture<ProductAddEditFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAddEditFormComponent],
      providers: [provideRouter([]), MessageService],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductAddEditFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads a selected image into the product image field', async () => {
    const input = fixture.nativeElement.querySelector('#imageUpload') as HTMLInputElement;
    const file = new File(['image data'], 'product.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });

    const imageLoaded = new Promise<string>((resolve) => {
      const subscription = component.productForm.controls.imageUrl.valueChanges.subscribe(value => {
        if (value.startsWith('data:image/png;base64,')) {
          subscription.unsubscribe();
          resolve(value);
        }
      });
    });

    input.dispatchEvent(new Event('change'));
    const imageData = await imageLoaded;

    expect(imageData).toContain('aW1hZ2UgZGF0YQ==');
    expect(component.imagePreview).toBe(imageData);
  });

  it('rejects non-image files', () => {
    const input = fixture.nativeElement.querySelector('#imageUpload') as HTMLInputElement;
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });

    input.dispatchEvent(new Event('change'));

    expect(component.imageError).toBe('Please select a valid image file (PNG, JPG, WebP).');
    expect(component.productForm.controls.imageUrl.value).toBe('');
  });
});
