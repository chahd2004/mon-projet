import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent, SidebarComponent } from '../../../shared';
import { ChatWidgetComponent } from '../../../shared/components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-entreprise-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, ChatWidgetComponent],
  templateUrl: './entreprise-layout.component.html',
  styleUrl: './entreprise-layout.component.scss'
})
export class EntrepriseLayoutComponent {}
