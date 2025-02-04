import { jsonMatching } from '../../test/jasmine-matchers';
import { MockedObjects } from '../../test/mocks/mocked-objects';
import { Settings } from './settings';
import { SettingsComponent } from './settings.component';
import { SettingsService } from './settings.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let settingsService: SettingsService;
  beforeEach(() => {
    let settings = new Settings(SettingsService.CURRENT_SETTINGS_VERSION,'dark', 'https://www.some.bs',SettingsService.DEFAULT_BLACK_LISTED_VERSIONS);
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
    expect(component.versionBlackList.value).toEqual(SettingsService.DEFAULT_BLACK_LISTED_VERSIONS);
  });

  it('should subscribe to theme value changes on init', (done) => {
    spyOn(settingsService, 'updateSettings');
    spyOn(component,'selectTheme');
    component.ngOnInit();
    component.themeInput.valueChanges.subscribe(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledOnceWith(new Settings(
        SettingsService.CURRENT_SETTINGS_VERSION,
        'light',
        'https://www.some.bs',
        SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
      ));
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
      expect(settingsService.updateSettings).toHaveBeenCalledOnceWith(new Settings(
        SettingsService.CURRENT_SETTINGS_VERSION,
        'dark',
        'mid',
        SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
      ));
      done();
    });
    component.proxyUrlInput.setValue('mid');
  });

  it('should save settings to local storage on change', () => {
    spyOn(settingsService, 'updateSettings');
    component.ngOnInit();

    component.proxyUrlInput.setValue('url');    
    expect(settingsService.updateSettings).toHaveBeenCalledWith(new Settings(
      SettingsService.CURRENT_SETTINGS_VERSION,
      'dark',
      'url',
      SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    ));

    component.themeInput.setValue(undefined as any);    
    expect(settingsService.updateSettings).toHaveBeenCalledWith(new Settings(
      SettingsService.CURRENT_SETTINGS_VERSION,
      'light',
      'url',
      SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    ));

    component.proxyUrlInput.setValue(undefined as any);    
    expect(settingsService.updateSettings).toHaveBeenCalledWith(new Settings(
      SettingsService.CURRENT_SETTINGS_VERSION,
      'light',
      '',
      SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    ));
  });

  it('should unsubscribe to all value change on destroy', () => {
    spyOn(component.subs,'unsubscribe');
    component.ngOnDestroy();
    expect(component.subs.unsubscribe).toHaveBeenCalled();
  });

  it('should be able to do add & delete version filters', () => {
    spyOn(component.settingsService,'updateSettings');
    component.ngOnInit();


    component.versionFilterInput.setValue('');
    component.addVersionFilter();
    expect(component.settingsService.updateSettings).toHaveBeenCalledTimes(0);

    component.versionFilterInput.setValue('pre');
    component.addVersionFilter();
    expect(component.settingsService.updateSettings).toHaveBeenCalledWith(new Settings(
      SettingsService.CURRENT_SETTINGS_VERSION,
      'dark', 'https://www.some.bs',
      SettingsService.DEFAULT_BLACK_LISTED_VERSIONS.push('pre')
    ));

    component.versionBlackList.next(SettingsService.DEFAULT_BLACK_LISTED_VERSIONS.push('pre'));
    component.deleteVersionFilter(SettingsService.DEFAULT_BLACK_LISTED_VERSIONS.size);
    expect(component.settingsService.updateSettings).toHaveBeenCalledWith(jsonMatching(new Settings(
      SettingsService.CURRENT_SETTINGS_VERSION,
      'dark', 'https://www.some.bs',
      SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    )));
  });
});
