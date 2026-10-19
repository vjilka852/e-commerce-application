import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CategoryService } from '../../service/category.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, InputTextModule, TextareaModule, ToggleSwitchModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  categoryId: number | null = null;
  submitError = '';

  readonly categoryForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(240)] }),
    active: new FormControl(true, { nonNullable: true })
  });

  get isEditMode(): boolean {
    return this.categoryId !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      return;
    }

    const id = Number(idParam);
    const category = Number.isInteger(id) && id > 0 ? this.categoryService.getCategoryById(id) : undefined;
    if (!category || category.source === 'api') {
      void this.router.navigate(['/categories']);
      return;
    }

    this.categoryId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      active: category.active
    });
  }

  onSubmit(): void {
    this.submitError = '';
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const category = this.categoryForm.getRawValue();
    if (this.categoryService.hasDuplicate(category, this.categoryId ?? undefined)) {
      this.submitError = 'A category with this name already exists.';
      return;
    }

    const saved = this.categoryId === null
      ? this.categoryService.addCategory(category) !== undefined
      : this.categoryService.updateCategory(this.categoryId, category);

    if (!saved) {
      this.submitError = 'The category could not be saved. Please try again.';
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: this.isEditMode ? 'Category updated' : 'Category added',
      detail: `"${category.name.trim()}" was saved successfully.`,
      life: 3000
    });
    void this.router.navigate(['/categories']);
  }
}
