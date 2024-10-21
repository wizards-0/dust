import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService } from './settings/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatCard, MatButtonModule, MatIconModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dust';
  constructor(settingsService:SettingsService){
    if(settingsService.getSettings().theme == 'dark'){
      document.body.classList.add('dark-theme');
    }
    console.info(`Update Cycle : ${settingsService.getSettings().updateCycle}`);
    if(settingsService.getSettings().corsProxy) {
      console.info(`Cors Proxy : ${settingsService.getSettings().corsProxy}`);
    } else {
      console.warn('Cors Proxy not set, will not be able to fetch gradle plugin versions');
    }
  }
}
