import { Injectable } from "@angular/core";
import { Settings } from "./settings";

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    private settings:Settings;
    
    constructor(){
        let settingsJson = localStorage.getItem('dustSettings');
        let settings:Settings =  settingsJson ? JSON.parse(settingsJson) : new Settings();
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