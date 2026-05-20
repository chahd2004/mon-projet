import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Client } from '../../../models/client.model';
import { ClientService } from '../../../core/services/client.service';

@Component({
  selector: 'app-clients-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clients-view.component.html',
  styleUrls: ['./clients-view.component.scss']
})
export class ClientsViewComponent implements OnInit {

  clients: Client[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    this.error = '';
    this.clientService.getClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des clients';
        console.error(err);
        this.loading = false;
      }
    });
  }

}
