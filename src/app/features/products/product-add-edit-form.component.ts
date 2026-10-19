import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { ProductService } from '../../service/product.service';
import { CategoryService } from '../../service/category.service';
import { ApiProduct, StockStatus } from '../../models/product.model';
import { firstValueFrom } from 'rxjs';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-product-add-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    LoaderComponent
  ],
  templateUrl: './product-add-edit-form.component.html',
  styleUrl: './product-add-edit-form.component.scss',
})
export class ProductAddEditFormComponent implements OnInit {
  private readonly maxImageSize = 2 * 1024 * 1024; // 2 MB
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isEditMode = false;
  productId: number | null = null;
  imageError = '';
  submitError = '';
  isSubmitting = false;

  readonly categories = this.categoryService.categories;

  productForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    sku: new FormControl('', { nonNullable: true }),
    category: new FormControl('Hydraulics', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    stockStatus: new FormControl<StockStatus>('In Stock', { nonNullable: true }),
    stockCount: new FormControl(10, { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    imageUrl: new FormControl('', { nonNullable: true })
  });

  get buttonLabel(): string {
    return this.isEditMode ? 'Update Product' : 'Add Product';
  }

  get imagePreview(): string {
    return this.productForm.controls.imageUrl.value;
  }

  get isApiProduct(): boolean {
    return this.productId !== null
      && this.productService.getProductById(this.productId)?.apiProduct !== undefined;
  }

  get currencyLabel(): string {
    return this.isApiProduct ? 'USD $' : 'GBP £';
  }

  get currencySymbol(): string {
    return this.isApiProduct ? '$' : '£';
  }

  onImageSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.length) {
      return;
    }

    const [file] = input.files;
    if (!file.type.startsWith('image/')) {
      this.imageError = 'Please select a valid image file (PNG, JPG, WebP).';
      input.value = '';
      return;
    }

    if (file.size > this.maxImageSize) {
      this.imageError = 'File size exceeds 2 MB. Please select a smaller image.';
      input.value = '';
      return;
    }

    this.imageError = '';
    this.submitError = '';

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.productForm.controls.imageUrl.setValue(reader.result);
        this.productForm.controls.imageUrl.markAsTouched();
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.productForm.controls.imageUrl.setValue('');
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      return;
    }

    const productId = Number(idParam);
    const product = Number.isInteger(productId) && productId > 0
      ? this.productService.getProductById(productId)
      : undefined;

    if (!product) {
      void this.router.navigate(['/products']);
      return;
    }

    this.isEditMode = true;
    this.productId = product.id;
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku || `UK-IND-${product.id}`,
      category: product.category,
      price: String(product.price),
      stockStatus: product.stockStatus || 'In Stock',
      stockCount: product.stockCount ?? 10,
      description: product.description,
      imageUrl: product.imageUrl || ''
    });
  }

  async onSubmit(): Promise<void> {
    this.submitError = '';
    if (this.isSubmitting) {
      return;
    }
    if (this.imageError) {
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const val = this.productForm.getRawValue();
    const productPayload = {
      name: val.name,
      sku: val.sku || `UK-IND-${Date.now().toString().slice(-4)}`,
      category: val.category,
      price: Number(val.price),
      stockStatus: val.stockStatus,
      stockCount: Number(val.stockCount) || 0,
      description: val.description,
      imageUrl: val.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
    };

    this.isSubmitting = true;
    try {
      if (this.isEditMode && this.productId !== null) {
        const existingProduct = this.productService.getProductById(this.productId);
        if (!existingProduct) {
          void this.router.navigate(['/products']);
          return;
        }

        if (existingProduct.apiProduct) {
          const apiChanges: Partial<ApiProduct> = {
            title: productPayload.name,
            description: productPayload.description,
            category: productPayload.category,
            price: productPayload.price,
            sku: productPayload.sku,
            thumbnail: productPayload.imageUrl,
            availabilityStatus: productPayload.stockStatus === 'Made to Order'
              ? existingProduct.apiProduct.availabilityStatus
              : productPayload.stockStatus
          };
          await firstValueFrom(this.productService.updateApiProduct(this.productId, apiChanges));
        } else if (!this.productService.updateProduct(this.productId, productPayload)) {
          void this.router.navigate(['/products']);
          return;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Product Updated',
          detail: `"${productPayload.name}" was updated successfully.`,
          life: 3500
        });
      } else {
        this.productService.addProduct(productPayload);
        this.messageService.add({
          severity: 'success',
          summary: 'Product Added',
          detail: `"${productPayload.name}" was added successfully.`,
          life: 3500
        });
      }
    } catch (error) {
      this.submitError = error instanceof HttpErrorResponse
        ? error.status
          ? `The product API returned an error (${error.status}). Your changes were not saved.`
          : 'Could not connect to the product API. Your changes were not saved.'
        : error instanceof Error
          ? error.message
          : 'Could not save product. Please try again.';
      return;
    } finally {
      this.isSubmitting = false;
    }

    void this.router.navigate(['/products']);
  }
}
