import { Component,ChangeDetectionStrategy } from '@angular/core';
import { SettingsService } from '../settings/settings.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-docs-link',
  standalone: true,
  imports: [],
  templateUrl: './docs-link.component.html',
  host: {class: 'flex basis-full w-full h-full'},
  styleUrl: './docs-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsLinkComponent {
  docsUrl: SafeUrl;

  constructor(settingsService:SettingsService,sanitizer: DomSanitizer){
    this.docsUrl = sanitizer.bypassSecurityTrustResourceUrl('/docs/index.html?theme='+settingsService.getSettings().theme);

  }
}
