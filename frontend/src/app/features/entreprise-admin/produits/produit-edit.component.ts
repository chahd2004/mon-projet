import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-produit-edit',
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
  templateUrl: './produit-edit.component.html',
  styleUrl: './produit-edit.component.scss'
})
export class ProduitEditComponent {
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

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      code: ['SOFT-001', [Validators.required, Validators.minLength(3)]],
      libelle: ['Logiciel Comptabilité', [Validators.required, Validators.minLength(3)]],
      categorie: ['LOGICIELS', Validators.required],
      prix: [500, [Validators.required, Validators.min(0)]],
      tva: [19, Validators.required],
      quantiteStock: [100, Validators.required],
      description: ['Description du produit...']
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

  getPrixTTC(): number {
    const prix = this.form.get('prix')?.value || 0;
    const tva = this.form.get('tva')?.value || 0;
    return Math.round(prix * (1 + tva / 100) * 100) / 100;
  }
}
