import { Settings } from "./settings";
import { SettingsService } from "./settings.service";

describe('SettingsService', () => {

    let settingsService:SettingsService;
  
    it('should be able to initialize settings from empty local storage', () => {
        spyOn(localStorage,'getItem')
            .and.returnValue(undefined as any);
        spyOn(window,'matchMedia')
            .and.returnValues(undefined as any, {matches:true} as any);            
        settingsService = new SettingsService();
        expect(settingsService.getSettings()).toEqual(new Settings(
            SettingsService.CURRENT_SETTINGS_VERSION,
            'light',
            '',
            SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
        ));
        settingsService = new SettingsService();
        expect(settingsService.getSettings()).toEqual(new Settings(
            SettingsService.CURRENT_SETTINGS_VERSION,
            'dark',
            '',
            SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
        ));
    });

    it('should be able to update settings from undefined version to version=2', () => {
        let settingsJson = JSON.stringify({
            theme:'dark',
            corsProxy:'https://www.some.bs'
        });
        spyOn(localStorage,'getItem')
            .and.returnValue(settingsJson);
        settingsService = new SettingsService();
        expect(settingsService.getSettings()).toEqual(new Settings(
            SettingsService.CURRENT_SETTINGS_VERSION,
            'dark',
            'https://www.some.bs',
            SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
        ));
    });

    it('should be able to fetch previously saved settings from local storage', () => {
        let settings = new Settings(
            SettingsService.CURRENT_SETTINGS_VERSION,
            'light',
            'https://www.some.bs',
            SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
        );
        spyOn(localStorage,'getItem')
            .and.returnValue(JSON.stringify(settings));
        settingsService = new SettingsService();
        expect(JSON.stringify(settingsService.getSettings())).toEqual(JSON.stringify(settings));
    });

    it('should be able to update settings', () => {
        let settings = new Settings(
            SettingsService.CURRENT_SETTINGS_VERSION,
            'light',
            'https://www.some.bs',
            SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
        );
        spyOn(localStorage,'getItem')
            .and.returnValue(undefined as any);
        spyOn(localStorage,'setItem');
        settingsService = new SettingsService();
        settingsService.updateSettings(settings);
        expect(localStorage.setItem).toHaveBeenCalledWith('dustSettings',JSON.stringify(settings));
    })
});