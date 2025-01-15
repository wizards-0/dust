import { MockedObjects } from '../../test/mocks/mocked-objects';
import { Settings } from './settings';
import { SettingsComponent } from './settings.component';
import { SettingsService } from './settings.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let settingsService: SettingsService;
  beforeEach(() => {
    let settings = new Settings('dark', 'https://www.some.bs');
    spyOn(localStorage, 'getItem')
      .and.returnValue(JSON.stringify(settings));

    settingsService = new SettingsService();
    component = new SettingsComponent(settingsService);
  });


  it('should apply dark theme class to body on selection', () => {
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');
    spyOn(document.body.classList, 'contains').and.returnValues(true, false, true, false);

    component.selectTheme('light');
    expect(document.body.classList.remove).toHaveBeenCalledOnceWith('dark-theme');
    component.selectTheme('light');
    expect(document.body.classList.remove).toHaveBeenCalledOnceWith('dark-theme');

    component.selectTheme('dark');
    expect(document.body.classList.add).not.toHaveBeenCalled();
    component.selectTheme('dark');
    expect(document.body.classList.add).toHaveBeenCalledWith('dark-theme');
  });

  it('should get fetch settings from local storage on init', () => {
    component.ngOnInit();
    expect(component.themeInput.value).toBe('dark');
    expect(component.proxyUrlInput.value).toBe('https://www.some.bs');
  });

  it('should subscribe to theme value changes on init', (done) => {
    spyOn(settingsService, 'updateSettings');
    spyOn(component,'selectTheme');
    component.ngOnInit();
    component.themeInput.valueChanges.subscribe(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledOnceWith(new Settings('light', 'https://www.some.bs'));
      expect(component.selectTheme).toHaveBeenCalledOnceWith('light');
      done();
    });
    component.themeInput.setValue(undefined as any);
  });

  it('should subscribe to proxy url value changes on init', (done) => {
    spyOn(settingsService, 'updateSettings');
    spyOn(component,'selectTheme');
    component.ngOnInit();
    component.proxyUrlInput.valueChanges.subscribe(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledOnceWith(new Settings('dark',  'mid'));
      done();
    });
    component.proxyUrlInput.setValue('mid');
  });

  it('should get save settings to local storage on change', () => {
    spyOn(settingsService, 'updateSettings');
    component.themeInput.setValue('dark');
    component.proxyUrlInput.setValue('url')
    component.updateSettings();
    expect(settingsService.updateSettings).toHaveBeenCalledOnceWith(new Settings('dark', 'url'));
  });

  it('should unsubscribe to all value change on destroy', () => {
    spyOn(component.subs,'unsubscribe');
    component.ngOnDestroy();
    expect(component.subs.unsubscribe).toHaveBeenCalled();
  })
});
