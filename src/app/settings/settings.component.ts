import { Component,ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ButtonComponent } from 'ace-common-components';
import { SettingsService } from './settings.service';
import { Settings } from './settings';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ButtonComponent,ReactiveFormsModule,MatTooltipModule,MatFormFieldModule,MatIconModule,MatButtonModule,MatRadioModule,MatInputModule],
  templateUrl: './settings.component.html',
  host: {class: 'flex basis-full w-full h-full'},
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit,OnDestroy {

  themeInput = new FormControl<string>('');
  updateCycleInput = new FormControl<number>(30);
  proxyUrlInput = new FormControl<string>('');
  subs = new Subscription();

  constructor(private settingsService:SettingsService) {
    
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit(): void {
    this.themeInput.setValue(this.settingsService.getSettings().theme);
    this.updateCycleInput.setValue(this.settingsService.getSettings().updateCycle);
    this.proxyUrlInput.setValue(this.settingsService.getSettings().corsProxy);
    this.subs.add(this.themeInput.valueChanges.subscribe(() => {
      this.selectTheme(this.themeInput.value ?? 'light');
      this.updateSettings();
    }));
    this.subs.add(this.updateCycleInput.valueChanges.subscribe(() => {
      this.updateSettings();
    }));
    this.subs.add(this.proxyUrlInput.valueChanges.subscribe(() => {
      this.updateSettings();
    }));
  }

  selectTheme(theme:string){
    if(theme == 'dark' && !document.body.classList.contains('dark-theme')){
      document.body.classList.add('dark-theme');
    } else if(theme != 'dark' && document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
    }
  }

  updateSettings(){
    this.settingsService.updateSettings(
      new Settings(
        this.themeInput.value,
        this.updateCycleInput.value,
        this.proxyUrlInput.value
      ));
  }
}
