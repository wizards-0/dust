import { TestBed } from '@angular/core/testing'
import { MockedObjects } from '../../test/mocks/mocked-objects';
import { provideHttpClient } from '@angular/common/http';
import { ApiService, ApiUrl } from './api.service';
import { DateTime } from 'luxon';
import { Settings } from '../settings/settings';
import { catchError, reduce } from 'rxjs';
import express, { Request, Response } from 'express';
import http from 'node:http';

describe('API Service', () => {

  let mocks: MockedObjects;
  let apiService: ApiService;
  let cp;
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 29000;
    
    
  });

  beforeEach(() => {
    mocks = new MockedObjects();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    apiService = TestBed.inject(ApiService);
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
    spyOn(apiService.settingsService, 'getSettings').and.returnValue(new Settings('light', 30, ApiUrl.Proxy));
    apiService.getGradlePluginVersions('info.solidsoft.pitest').subscribe((resp: any) => {
      let verArr: any[] = resp.metadata.versioning.versions.version;
      expect(typeof verArr).toBe('object');
      verArr.forEach(ver => {
        expect(typeof ver).toBe('string');
      });
      let lastUpdateDiffInYears = DateTime.now().diff(DateTime.fromFormat(resp.metadata.versioning.lastUpdated + '', 'yyyyLLddHHmmss')).as('years');
      expect(lastUpdateDiffInYears).toBeLessThan(20);
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