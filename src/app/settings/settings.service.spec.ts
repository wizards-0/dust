import { MockedObjects } from "../../test/mocks/mocked-objects";
import { Settings } from "./settings";
import { SettingsService } from "./settings.service";

describe('SettingsService', () => {

    let settingsService:SettingsService;
  
    it('should be able to initialize settings from empty local storage', () => {
        spyOn(localStorage,'getItem')
            .and.returnValue(undefined as any);
        settingsService = new SettingsService();
        expect(settingsService.getSettings()).toEqual(new Settings());
    });

    it('should be able to fetch previously saved settings from local storage', () => {
        let settings = new Settings('light',30,'https://www.some.bs');
        spyOn(localStorage,'getItem')
            .and.returnValue(JSON.stringify(settings));
        settingsService = new SettingsService();
        expect(JSON.stringify(settingsService.getSettings())).toEqual(JSON.stringify(settings));
    });

    it('should be able to update settings', () => {
        let settings = new Settings('light',30,'https://www.some.bs');
        spyOn(localStorage,'getItem')
            .and.returnValue(undefined as any);
        spyOn(localStorage,'setItem');
        settingsService = new SettingsService();
        settingsService.updateSettings(settings);
        expect(localStorage.setItem).toHaveBeenCalledWith('dustSettings',JSON.stringify(settings));
    })
});