import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from '../../models';

@Pipe({
  name: 'roleLabel',
  standalone: true
})
export class RoleLabelPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(role: UserRole | null | undefined): string {
    if (!role) return this.translate.instant('COMMON.NOT_DEFINED') || 'Inconnu';
    const key = `ROLES.${role}`;
    const localized = this.translate.instant(key);
    return localized === key ? role : localized;
  }
}
