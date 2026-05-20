import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-facture-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CardModule,
    TableModule
  ],
  templateUrl: './facture-edit.component.html',
  styleUrl: './facture-edit.component.scss'
})
export class FactureEditComponent {
  form!: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      client: ['', Validators.required],
      dateEmission: ['2024-01-15', Validators.required],
      dateEcheance: ['2024-02-14', Validators.required],
      modePaiement: ['VIREMENT', Validators.required],
      notes: [''],
      lignes: this.fb.array([
        this.createLigne(1, 5000, 19)
      ])
    });
  }

  createLigne(quantite: number, prix: number, tva: number): FormGroup {
    return this.fb.group({
      produit: ['1', Validators.required],
      quantite: [quantite, [Validators.required, Validators.min(1)]],
      prixUnitaire: [prix, [Validators.required, Validators.min(0)]],
      tva: [tva, Validators.required]
    });
  }

  get lignes(): FormArray {
    return this.form.get('lignes') as FormArray;
  }

  addLigne(): void {
    this.lignes.push(this.createLigne(1, 0, 19));
  }

  removeLigne(index: number): void {
    this.lignes.removeAt(index);
  }

  calculateTotal(): number {
    let total = 0;
    this.lignes.controls.forEach(control => {
      const q = control.get('quantite')?.value || 0;
      const p = control.get('prixUnitaire')?.value || 0;
      const t = control.get('tva')?.value || 0;
      const ht = q * p;
      total += ht * (1 + t / 100);
    });
    return Math.round(total * 100) / 100;
  }

  save(): void {
    if (this.form.valid && this.lignes.length > 0) {
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
}
