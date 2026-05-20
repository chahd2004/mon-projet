import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../models';

/**
 * Directive pour afficher/cacher un élément selon le rôle de l'utilisateur
 * Usage: <div *appHasRole="'SUPER_ADMIN'">Réservé aux admins</div>
 * Usage: <div *appHasRole="['CLIENT', 'EMETTEUR']">Pour clients et emetteurs</div>
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private roles: UserRole[] = [];

  @Input()
  set appHasRole(role: UserRole | UserRole[]) {
    this.roles = Array.isArray(role) ? role : [role];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    if (this.authService.hasAnyRole(this.roles)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
