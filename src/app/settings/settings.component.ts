import { Component,ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SettingsService } from './settings.service';
import { Settings } from './settings';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { List } from 'immutable';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-settings',
    imports: [ReactiveFormsModule, MatTooltipModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatRadioModule, MatInputModule,AsyncPipe],
    templateUrl: './settings.component.html',
    host: { class: 'flex basis-full w-full h-full' },
    styleUrl: './settings.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit,OnDestroy {

  themeInput = new FormControl<string>('');
  proxyUrlInput = new FormControl<string>('');
  versionFilterInput = new FormControl<string>('');
  versionBlackList:BehaviorSubject<List<string>> = new BehaviorSubject(List());
  subs = new Subscription();

  constructor(public readonly settingsService:SettingsService) {
    
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit(): void {
    this.themeInput.setValue(this.settingsService.getSettings().theme);
    this.proxyUrlInput.setValue(this.settingsService.getSettings().corsProxy);
    this.versionBlackList.next(this.settingsService.getSettings().versionBlackList);
    this.subs.add(this.themeInput.valueChanges.subscribe(() => {
      this.selectTheme(this.themeInput.value ?? 'light');
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
        SettingsService.CURRENT_SETTINGS_VERSION,
        this.themeInput.value ?? 'light',
        this.proxyUrlInput.value ?? '',
        this.versionBlackList.getValue()
      ));
  }

  addVersionFilter() {
    if(this.versionFilterInput.value) {
      let updatedFilterList = this.versionBlackList.getValue().push(this.versionFilterInput.value);      
      this.versionBlackList.next(updatedFilterList);
      this.updateSettings();
    }
  }
  deleteVersionFilter(versionFilterIndex:number) {
    let updatedFilterList = this.versionBlackList.getValue().delete(versionFilterIndex);
    this.versionBlackList.next(updatedFilterList);
    this.updateSettings();
  }

}
