// ...existing code...
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-devise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devise.component.html',
  styleUrls: ['./devise.component.scss']
})
export class DeviseComponent {
  code: string = '';
  libelle: string = '';
  symbole: string = '';
  pays: string = '';
  taux: number | null = null;
  precision: number | null = null;
  utilisable: string = '';
  message: string = '';
  devises: any[] = [];
  editIndex: number | null = null;

  currencyData: { [key: string]: { libelle: string, symbole: string, pays: string } } = {
    'USD': { libelle: 'Dollar américain', symbole: '$', pays: 'États-Unis' },
    'EUR': { libelle: 'Euro', symbole: '€', pays: 'Union européenne' },
    'GBP': { libelle: 'Livre sterling', symbole: '£', pays: 'Royaume-Uni' },
    'JPY': { libelle: 'Yen japonais', symbole: '¥', pays: 'Japon' },
    'CAD': { libelle: 'Dollar canadien', symbole: '$', pays: 'Canada' },
    'AUD': { libelle: 'Dollar australien', symbole: '$', pays: 'Australie' },
    'CHF': { libelle: 'Franc suisse', symbole: 'CHF', pays: 'Suisse' },
    'MAD': { libelle: 'Dirham marocain', symbole: 'MAD', pays: 'Maroc' },
    'TND': { libelle: 'Dinar tunisien', symbole: 'TND', pays: 'Tunisie' },
    'DZD': { libelle: 'Dinar algérien', symbole: 'DZD', pays: 'Algérie' }
  };

  ngOnInit(): void {
    this.loadDevises();
  }

  onCodeChange(): void {
    if (this.code && this.currencyData[this.code]) {
      const data = this.currencyData[this.code];
      this.libelle = data.libelle;
      this.symbole = data.symbole;
      this.pays = data.pays;
    }
  }

  // Duplicate ngOnInit removed

  loadDevises(): void {
    const devisesStr = localStorage.getItem('devises');
    this.devises = devisesStr ? JSON.parse(devisesStr) : [];
  }

  editDevise(index: number): void {
    const d = this.devises[index];
    this.code = d.code;
    this.libelle = d.libelle;
    this.symbole = d.symbole;
    this.pays = d.pays;
    this.taux = d.taux;
    this.precision = d.precision;
    this.utilisable = d.utilisable ? 'true' : 'false';
    this.editIndex = index;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.code || !this.libelle || !this.symbole || !this.pays || this.taux === null || this.precision === null || !this.utilisable) {
      this.message = 'Veuillez remplir tous les champs.';
      return;
    }
    const devise = {
      code: this.code,
      libelle: this.libelle,
      symbole: this.symbole,
      pays: this.pays,
      taux: this.taux,
      precision: this.precision,
      utilisable: this.utilisable === 'true'
    };
    if (this.editIndex !== null) {
      this.devises[this.editIndex] = devise;
      this.editIndex = null;
      this.message = 'Devise modifiée !';
    } else {
      this.devises.push(devise);
      this.message = 'Devise enregistrée !';
    }
    localStorage.setItem('devises', JSON.stringify(this.devises));
    this.code = '';
    this.libelle = '';
    this.symbole = '';
    this.pays = '';
    this.taux = null;
    this.precision = null;
    this.utilisable = '';
  }

  supprimerDevise(index: number): void {
    this.devises.splice(index, 1);
    localStorage.setItem('devises', JSON.stringify(this.devises));
  }
}
