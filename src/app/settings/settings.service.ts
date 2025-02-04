import { Injectable } from "@angular/core";
import { Settings } from "./settings";
import { List } from "immutable";

@Injectable({
    providedIn: 'root',
})
export class SettingsService {

    public static readonly CURRENT_SETTINGS_VERSION = 2;

    public static readonly DEFAULT_BLACK_LISTED_VERSIONS = List([
        'modified',
        'alpha',
        'beta',
        'rc',
        'candidate',
        'insider',
        'next',
        'dev'
    ]);

    private settings:Settings;
    
    constructor(){
        let theme = window.matchMedia('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
        let settingsJson = localStorage.getItem('dustSettings');
        let settings:Settings;
        if(settingsJson) {
            let rawSettings = JSON.parse(settingsJson);
            settings = new Settings(rawSettings.settingsVersion,rawSettings.theme,rawSettings.corsProxy,List(rawSettings.versionBlackList));
        } else {
            settings = new Settings(SettingsService.CURRENT_SETTINGS_VERSION,theme,'',SettingsService.DEFAULT_BLACK_LISTED_VERSIONS)
        }
        if(SettingsService.CURRENT_SETTINGS_VERSION > (settings.settingsVersion ?? 0) ) {
            settings = new Settings(SettingsService.CURRENT_SETTINGS_VERSION,settings.theme,settings.corsProxy,SettingsService.DEFAULT_BLACK_LISTED_VERSIONS);
        }
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

    isVersionBlacklisted(version:string):boolean {
        return !!this.settings.versionBlackList.find(versionFilter => version.includes(versionFilter))
    }
}