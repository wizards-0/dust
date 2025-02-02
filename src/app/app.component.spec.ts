import { AppComponent } from './app.component';
import { Settings } from './settings/settings';
import { SettingsService } from './settings/settings.service';

describe('AppComponent', () => {

  it('should print warning if cors proxy not set', () => {
    spyOn(localStorage,'getItem')
      .and.returnValue(JSON.stringify({}));
      
    spyOn(console,'info');
    spyOn(console,'warn');
    new AppComponent(new SettingsService());
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should print settings info if no issues', () => {
    spyOn(localStorage,'getItem')
      .and.returnValue(JSON.stringify(new Settings(
        SettingsService.CURRENT_SETTINGS_VERSION,
        'light',
        'https://www.some.bs',
        SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    )));
    spyOn(document.body.classList,'add');
    spyOn(console,'info');
    spyOn(console,'warn');
    new AppComponent(new SettingsService());
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
    expect(document.body.classList.add).not.toHaveBeenCalled();
  });

  it('should add dark theme class to body if applicable', () => {
    spyOn(localStorage,'getItem')
      .and.returnValue(JSON.stringify(new Settings(
        SettingsService.CURRENT_SETTINGS_VERSION,
        'dark',
        'https://www.some.bs',
        SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    )));
    spyOn(document.body.classList,'add');

    new AppComponent(new SettingsService());
    
    expect(document.body.classList.add).toHaveBeenCalledOnceWith('dark-theme');
  });

  it('should apply theme to docs url', () => {
    spyOn(localStorage,'getItem')
      .and.returnValue(JSON.stringify(new Settings(
        SettingsService.CURRENT_SETTINGS_VERSION,
        'dark',
        'https://www.some.bs',
        SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    )));

    let appComp = new AppComponent(new SettingsService());

    expect(appComp.getDocsUrl()).toBe(document.baseURI+'docs/index.html?theme=dark');
  })
});
