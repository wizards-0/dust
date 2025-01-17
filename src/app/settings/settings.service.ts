import { Injectable } from "@angular/core";
import { Settings } from "./settings";

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    private settings:Settings;
    
    constructor(){
        let theme = window.matchMedia('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
        let settingsJson = localStorage.getItem('dustSettings');
        let settings:Settings =  settingsJson ? JSON.parse(settingsJson) : new Settings(theme,undefined);
        this.settings = settings;
    }

    updateSettings(settings:Settings) {
        this.settings = settings;
        let settingsJSON = JSON.stringify(this.settings);
        localStorage.setItem('dustSettings',settingsJSON);
    }

    getSettings() {
        return this.settings;
    }
}