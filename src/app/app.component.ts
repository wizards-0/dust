import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService } from './settings/settings.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'dust';

  constructor(private readonly settingsService:SettingsService){    
    if(settingsService.getSettings().theme == 'dark'){
      document.body.classList.add('dark-theme');
    }
    if(settingsService.getSettings().corsProxy) {
      console.info(`Cors Proxy : ${settingsService.getSettings().corsProxy}`);
    } else {
      console.warn('Cors Proxy not set, will not be able to fetch gradle plugin versions');
    }
  }

  getDocsUrl() {
    return document.baseURI+'docs/index.html?theme='+this.settingsService.getSettings().theme;
  }
}
