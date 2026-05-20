import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CardModule
  ],
  templateUrl: './client-edit.component.html',
  styleUrl: './client-edit.component.scss'
})
export class ClientEditComponent {
  form!: FormGroup;
  isSubmitting = false;

  regionOptions = [
    { label: 'Tunis', value: 'TUNIS' },
    { label: 'Ariana', value: 'ARIANA' },
    { label: 'Ben Arous', value: 'BEN_AROUS' },
    { label: 'Manouba', value: 'MANOUBA' },
    { label: 'Sfax', value: 'SFAX' },
    { label: 'Sousse', value: 'SOUSSE' },
    { label: 'Kairouan', value: 'KAIROUAN' },
    { label: 'Kasserine', value: 'KASSERINE' },
    { label: 'Gafsa', value: 'GAFSA' },
    { label: 'Tozeur', value: 'TOZEUR' },
    { label: 'Kébili', value: 'KEBILI' },
    { label: 'Gabès', value: 'GABES' },
    { label: 'Médenine', value: 'MEDENINE' },
    { label: 'Tataouine', value: 'TATAOUINE' },
    { label: 'Sidi Bouzid', value: 'SIDI_BOUZID' },
    { label: 'Mahdia', value: 'MAHDIA' },
    { label: 'Monastir', value: 'MONASTIR' },
    { label: 'Nabeul', value: 'NABEUL' },
    { label: 'Zaghouan', value: 'ZAGHOUAN' },
    { label: 'Bizerte', value: 'BIZERTE' },
    { label: 'Jendouba', value: 'JENDOUBA' },
    { label: 'Kef', value: 'KEF' },
    { label: 'Siliana', value: 'SILIANA' }
  ];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      raisonSociale: ['Société ABC SARL', [Validators.required, Validators.minLength(3)]],
      email: ['contact@abc.tn', [Validators.required, Validators.email]],
      telephone: ['+216 71 123 456', Validators.required],
      adresse: ['Rue de la Paix, Tunis', Validators.required],
      region: ['TUNIS', Validators.required],
      codePostal: ['1000', Validators.required],
      contactPrincipal: ['Ahmed Ben Ali', Validators.required],
      notes: ['Client prioritaire']
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
}
