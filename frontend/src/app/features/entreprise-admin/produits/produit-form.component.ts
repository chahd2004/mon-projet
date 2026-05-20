import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-produit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CardModule
  ],
  templateUrl: './produit-form.component.html',
  styleUrl: './produit-form.component.scss'
})
export class ProduitFormComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;

  categorieOptions = [
    { label: 'Logiciels', value: 'LOGICIELS' },
    { label: 'Services', value: 'SERVICES' },
    { label: 'Cloud', value: 'CLOUD' },
    { label: 'Matériel', value: 'MATERIEL' },
    { label: 'Maintenance', value: 'MAINTENANCE' }
  ];

  tvaOptions = [
    { label: '0%', value: 0 },
    { label: '6%', value: 6 },
    { label: '13%', value: 13 },
    { label: '19%', value: 19 }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      libelle: ['', [Validators.required, Validators.minLength(3)]],
      categorie: ['', Validators.required],
      prix: ['', [Validators.required, Validators.min(0)]],
      tva: [19, Validators.required],
      quantiteStock: [0, Validators.required],
      description: ['']
    });
  }

  save(): void {
    if (this.form.valid) {
      this.isSubmitting = true;
      console.log('Form value:', this.form.value);
      setTimeout(() => {
        this.isSubmitting = false;
      }, 1000);
    }
  }

  cancel(): void {
    console.log('Cancel');
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} est requis`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} doit contenir au moins 3 caractères`;
    }
    if (control?.hasError('min')) {
      return `${fieldName} doit être supérieur à 0`;
    }
    return '';
  }

  getPrixTTC(): number {
    const prix = this.form.get('prix')?.value || 0;
    const tva = this.form.get('tva')?.value || 0;
    return Math.round(prix * (1 + tva / 100) * 100) / 100;
  }
}
