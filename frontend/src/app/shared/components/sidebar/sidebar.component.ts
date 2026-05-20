import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../models';
import { TranslateModule } from '@ngx-translate/core';

interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  roles: UserRole[];
  badge?: number;
  action?: 'logout';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, MenuModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isCollapsed = false;
  sidebarItems = computed<SidebarMenuItem[]>(() => {
    const userRole = this.authService.currentUser()?.role;

    const allItems: SidebarMenuItem[] = [
      {
        label: 'SIDEBAR.DASHBOARD',
        icon: 'pi pi-home',
        route: userRole === 'SUPER_ADMIN' ? '/super-admin/statistiques' : '/dashboard',
        roles: ['SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.CLIENTS',
        icon: 'pi pi-users',
        route: '/clients',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.PRODUITS',
        icon: 'pi pi-shopping-bag',
        route: '/produits',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.FACTURES',
        icon: 'pi pi-file',
        route: '/factures',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.DEVIS',
        icon: 'pi pi-file-edit',
        route: '/devis',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.AVOIRS',
        icon: 'pi pi-file-excel',
        route: '/avoirs',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.COMMANDES',
        icon: 'pi pi-shopping-cart',
        route: '/commandes',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.BON_COMMANDES',
        icon: 'pi pi-list',
        route: '/bons-commandes',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.BON_LIVRAISON',
        icon: 'pi pi-truck',
        route: '/bons-livraison',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.DEMANDES',
        icon: 'pi pi-inbox',
        route: userRole === 'SUPER_ADMIN' ? '/super-admin/demandes' : '/demandes',
        roles: ['SUPER_ADMIN', 'ENTREPRISE_ADMIN']
      },
      {
        label: 'SIDEBAR.UTILISATEURS',
        icon: 'pi pi-id-card',
        route: '/super-admin/users',
        roles: ['SUPER_ADMIN']
      },
      {
        label: 'SIDEBAR.COLLABORATEURS',
        icon: 'pi pi-users-alt',
        route: '/collaborateurs',
        roles: ['ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.PARAMETRES',
        icon: 'pi pi-cog',
        route: this.getParametresRoute(userRole),
        roles: ['SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'EMETTEUR']
      },
      {
        label: 'SIDEBAR.LOGOUT',
        icon: 'pi pi-sign-out',
        roles: ['SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_VIEWER', 'EMETTEUR'],
        action: 'logout'
      }
    ];

    return allItems.filter(item =>
      !!userRole && item.roles.includes(userRole)
    );
  });

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  onItemClick(event: Event, item: SidebarMenuItem): void {
    if (item.action === 'logout') {
      event.preventDefault();
      this.logout();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private getParametresRoute(userRole: UserRole | undefined | null): string {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return '/super-admin/parametres';
      case 'EMETTEUR':
        return '/emetteur/profil';
      default:
        return '/parametres';
    }
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return this.authService.hasAnyRole(roles);
  }
}
