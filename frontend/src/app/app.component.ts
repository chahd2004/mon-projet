import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private translate = inject(TranslateService);

  ngOnInit(): void {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');

    let savedLang = 'fr';
    const savedPrefs = localStorage.getItem('app_preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.langue) {
          savedLang = parsed.langue;
        }
      } catch (e) {}
    }

    this.translate.use(savedLang).subscribe(() => {
      // Translations loaded
    });
  }
}
