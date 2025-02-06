import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http';
import { ApiService, ApiUrl } from './api.service';
import { DateTime } from 'luxon';
import { Settings } from '../settings/settings';
import { catchError, reduce } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { List } from 'immutable';
import { MockResponse } from '../../test/mocks/http-client-mock';
import { MockedObjects } from '../../test/mocks/mocked-objects';

describe('API Service', () => {

  let apiService: ApiService;
  let mocks: MockedObjects;
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 29000;


  });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    apiService = TestBed.inject(ApiService);
    mocks = new MockedObjects();
  });

  it('should be able to call node download API', (done) => {
    apiService.getNodePackageDownloadInfo('typescript').subscribe((resp: any) => {
      expect(resp.hasOwnProperty('downloads')).toBeTrue();
      let downloadInfo = resp.downloads;
      for (let version in downloadInfo) {
        expect(typeof version).toBe('string');
        expect(typeof downloadInfo[version]).toBe('number');
      }
      done();
    });
  });

  it('should be able to call node package info API', (done) => {
    apiService.getNodePackageInfo('typescript').subscribe((resp: any) => {
      expect(resp.hasOwnProperty('dist-tags')).toBeTrue();
      let distTags = resp['dist-tags'];
      for (let tag in distTags) {
        expect(typeof tag).toBe('string');
        expect(typeof distTags[tag]).toBe('string');
      }
      expect(resp.hasOwnProperty('dist-tags')).toBeTrue();
      let publishInfo = resp['time'];
      for (let version in publishInfo) {
        expect(typeof version).toBe('string');
        expect(DateTime.fromISO(publishInfo[version]).isValid).toBeTrue();

      }
      done();
    });
  });

  it('should be able to call api to get maven dependency versions', (done) => {
    apiService.getMavenDependencyVersions('org.immutables', 'value').subscribe((resp: any) => {
      expect(resp.hasOwnProperty('components')).toBeTrue();
      let versions: any[] = resp.components;
      versions.forEach(ver => {
        expect(ver.hasOwnProperty('version')).toBeTrue();
        expect(typeof ver.version).toBe('string');
        expect(ver.hasOwnProperty('dependencyOfCount')).toBeTrue();
        expect(typeof ver.dependencyOfCount).toBe('number');
        expect(ver.hasOwnProperty('publishedEpochMillis')).toBeTrue();
        let publishDiffInYears = DateTime.now().diff(DateTime.fromMillis(ver.publishedEpochMillis)).as('years');
        expect(publishDiffInYears).toBeLessThan(20);
        let ossIndexInfo = ver.ossIndexInfo;
        expect(ossIndexInfo.hasOwnProperty('vulnerabilityCount')).toBeTrue();
      });
      done();
    });
  });

  it('should be able to call api for gradle plugin versions', (done) => {
    spyOn(apiService.settingsService, 'getSettings').and.returnValue(new Settings(
      SettingsService.CURRENT_SETTINGS_VERSION,
      'light',
      ApiUrl.Proxy,
      SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    ));
    apiService.getGradlePluginVersions('info.solidsoft.pitest').subscribe((resp: any) => {
      let versions: List<string> = resp.versions;
      expect(typeof versions).toBe('object');
      versions.forEach(ver => {
        expect(typeof ver).toBe('string');
      });
      let lastUpdateDiffInYears = DateTime.now().diff(DateTime.fromFormat(resp.lastUpdated + '', 'yyyyLLddHHmmss')).as('years');
      expect(lastUpdateDiffInYears).toBeLessThan(20);
      done();
    });
  });

  it('should return empty result for invalid gradle plugin API response', (done) => {
    apiService = new ApiService(mocks.httpClient,mocks.settingsService);
    spyOn(apiService.settingsService, 'getSettings').and.returnValue(new Settings(
      SettingsService.CURRENT_SETTINGS_VERSION,
      'light',
      ApiUrl.Proxy,
      SettingsService.DEFAULT_BLACK_LISTED_VERSIONS
    ));
    let pluginName = 'info.solidsoft.pitest';
    let pluginMetadataUrl = ApiUrl.GradlePlugin.replace('${pluginPath}', `${pluginName.replaceAll('.', '/')}/${pluginName}.gradle.plugin`);
    (mocks.httpClient as any).setMockResponses(List([
      new MockResponse(pluginMetadataUrl, '', {}),
    ]));    

    apiService.getGradlePluginVersions(pluginName).subscribe((resp: any) => {
      let versions: List<string> = resp.versions;
      let lastUpdateDiffInDays = DateTime.fromMillis(0).diff(DateTime.fromFormat(resp.lastUpdated + '', 'yyyyLLddHHmmss')).as('days');
      expect(lastUpdateDiffInDays).toBeLessThan(1);
      expect(versions.isEmpty()).toBeTrue();
      done();
    });
  });

  it('should throw error for gradle plugin versions if cors proxy is not set', (done) => {

    apiService.getGradlePluginVersions('info.solidsoft.pitest').pipe(catchError(err => err.message))
      .pipe(reduce((acc: any, value: any) => acc + value)).subscribe(errMsg => {
        let expectedMsg = 'Cors Proxy not set in settings, cannot fetch gradle plugin versions without it';
        expect(errMsg).toBe(expectedMsg);
        done();
      });
  });


  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  });
});