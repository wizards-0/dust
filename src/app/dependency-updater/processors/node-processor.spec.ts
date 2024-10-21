
import { List, Map } from 'immutable';
import { MockedObjects } from '../../../test/mocks/mocked-objects';

import { NodeProcessor } from './node-processor';
import { Version } from '../model/version';
import { DateTime, Duration } from 'luxon';
import { equals } from 'ace-common-util';
import { customMatchers, jsonMatching } from '../../../test/jasmine-matchers';
import { Dependency } from '../model/dependency';
import { BehaviorSubject, of, skip, Subject, take } from 'rxjs';
import { ApiUrl } from '../../api-service/api.service';
import { MockResponse } from '../../../test/mocks/http-client-mock';

describe('NodeProcessor', () => {

  let toMillis = (date: string) => DateTime.fromISO(date).toMillis()

  let nodeProcessor: NodeProcessor;
  let mocks: MockedObjects;

  beforeAll(() => {

  });

  beforeEach(() => {
    mocks = new MockedObjects();
    nodeProcessor = new NodeProcessor(mocks.apiService,mocks.settingsService);
  });

  it('should be able to map tags to version', () => {
    let distTags: any = {
      "latest": "4.0.2",
      "release-4-lts": "4.0.2",
      "release-3-lts": "3.5.16"
    };
    let result = nodeProcessor.mapTagsToVersion(distTags);

    expect(result).toEqual(Map({
      "4.0.2": "latest, release-4-lts",
      "3.5.16": "release-3-lts"
    }));
  });

  it('should be able to add latest tag if missing', () => {
    let top10Downloads = List([
      Version.builder().version('3.5.16').downloads(11).build()
    ]);
    let downloadInfo = List([
      Version.builder().version('3.5.16').downloads(11).build(),
      Version.builder().version('4.0.2').downloads(21).build()
    ]);

    let result = nodeProcessor.withLatestVersion(top10Downloads, '4.0.2', downloadInfo);

    expect(result).toEqual(jsonMatching(List([
      Version.builder().version('3.5.16').downloads(11).build(),
      Version.builder().version('4.0.2').downloads(21).build()
    ])));

    result = nodeProcessor.withLatestVersion(top10Downloads, undefined as any, downloadInfo);

    expect(result).toEqual(jsonMatching(List([
      Version.builder().version('3.5.16').downloads(11).build()
    ])));

    top10Downloads = List([
      Version.builder().version('3.5.16').downloads(11).build(),
      Version.builder().version('4.0.2').downloads(21).build()
    ]);
    result = nodeProcessor.withLatestVersion(top10Downloads, '4.0.2', downloadInfo);

    expect(result).toEqual(List([
      Version.builder().version('3.5.16').downloads(11).build(),
      Version.builder().version('4.0.2').downloads(21).build()
    ]));

    top10Downloads = List([
      Version.builder().version('3.5.16').downloads(11).build(),
      Version.builder().version('4.0.2').downloads(21).build()
    ]);
    result = nodeProcessor.withLatestVersion(top10Downloads, '4.1.2', downloadInfo);

    expect(result).toEqual(jsonMatching(List([
      Version.builder().version('3.5.16').downloads(11).build(),
      Version.builder().version('4.0.2').downloads(21).build(),
      Version.builder().version('4.1.2').build()
    ])));
  });

  it('should be able to fetch detailed info for versions', (done) => {
    let dep = Dependency.builder()
      .name('typescript')
      .versions(List([
        Version.builder().version('2.2.26').downloads(5).build(),
        Version.builder().version('3.5.16').downloads(11).build(),
        Version.builder().version('4.0.2').downloads(21).build()
      ]))
      .build();
    let packageInfoUrl = 'https://registry.npmjs.org/typescript';
    spyOn(mocks.httpClient, 'get').and.returnValue(of({
      "dist-tags": {
        "latest": "4.0.2",
        "release-4-lts": "4.0.2",
        "release-3-lts": "3.5.16"
      },
      "time": {
        "3.5.16": "2012-12-25",
        "4.0.2": "2014-03-24"
      }
    }));
    let result = nodeProcessor.fetchVersionDetails(dep);

    expect(mocks.httpClient.get).toHaveBeenCalledWith(packageInfoUrl);
    result.subscribe(dep => {

      expect(dep.versions).toEqual(List([
        Version.builder().version('4.0.2').downloads(21).relativeDownloads(100).tag('latest, release-4-lts').publishDate(toMillis('2014-03-24')).build(),
        Version.builder().version('3.5.16').downloads(11).relativeDownloads(52).tag('release-3-lts').publishDate(toMillis('2012-12-25')).build(),
        Version.builder().version('2.2.26').downloads(5).relativeDownloads(24).build()
      ]));
      expect(dep.name).toBe('typescript');
      expect(dep.versions.get(0)?.version).toBe('4.0.2');
      done();
    })
  });

  it('should be able to fetch download details for versions', (done) => {
    let dep = Dependency.builder()
      .name('typescript')
      .build();
    let downloadInfoUrl = 'https://api.npmjs.org/versions/typescript/last-week';
    spyOn(mocks.httpClient, 'get').and.returnValue(of({
      "downloads": {
        "2.2.26": 5,
        "3.5.16": 11,
        "4.0.2": 21
      }
    }));
    let result = nodeProcessor.fetchDownloadDetails(dep);
    expect(mocks.httpClient.get).toHaveBeenCalledWith(downloadInfoUrl);
    result.subscribe(dep => {
      expect(dep).toEqual(Dependency.builder()
        .name('typescript')
        .versions(List([
          Version.builder().version('2.2.26').downloads(5).build(),
          Version.builder().version('3.5.16').downloads(11).build(),
          Version.builder().version('4.0.2').downloads(21).build()
        ]))
        .build())
      done();
    });
  });

  it('should parse dependencies from package json', () => {
    let rawDeps = Map({
      "immmutable": "4.3.6",
      "rxjs": "5.4.2",
      "typescript": "4.0.2",
      "zone.js": "7.8.5"
    });
    let depUpdatedOn = Map({
      "immmutable": DateTime.now().startOf('day').minus({ days: 29 }).toMillis(),
      "rxjs": DateTime.now().startOf('day').minus({ days: 30 }).toMillis(),
      "typescript": DateTime.now().startOf('day').minus({ days: 31 }).toMillis()
    });
    let result = nodeProcessor.parseDependencies(rawDeps, depUpdatedOn);
    
    let expectedDeps = List([
     Dependency.fromRaw({ "name": "immmutable", "currentVersion": "4.3.6", "updateVersion": "4.3.6", "isUpToDate": true, "updatedOn": DateTime.now().startOf('day').minus({ days: 29 }).toMillis(), "versions": [] }),
     Dependency.fromRaw({ "name": "rxjs", "currentVersion": "5.4.2", "updateVersion": "5.4.2", "isUpToDate": true, "updatedOn": DateTime.now().startOf('day').minus({ days: 30 }).toMillis(), "versions": [] }),
     Dependency.fromRaw({ "name": "typescript", "currentVersion": "4.0.2", "updateVersion": "", "isUpToDate": false, "updatedOn": DateTime.now().startOf('day').minus({ days: 31 }).toMillis(), "versions": [] }),
     Dependency.fromRaw({ "name": "zone.js", "currentVersion": "7.8.5", "updateVersion": "", "isUpToDate": false, "updatedOn": 0, "versions": [] })
    ]);
    expect(result).toEqual(expectedDeps);    
  });

  it('should throw error for processing invalid json', () =>{
    expect(() => nodeProcessor.processPackageJson('-__-')).toThrowError();
  });

  it('should be able to process valid package json', (done) => {
    let packageJson = {
      name:"my-app",
      version:"1.0.0",
      dependencies:{
        "immutable": "4.3.6",
        "rxjs": "5.4.2",        
        "zone.js": "7.8.5"
      },
      devDependencies:{
        "typescript": "4.0.2",
        "webpack":"11.4.3"
      }
    };
    let downloadInfo = {
      "downloads":{
        "4.3.6":21,
        "5.4.2":11,
        "4.0.2":5
      }
    };
    let packageInfo = {
      "dist-tags": {
        "latest": "4.0.2",
        "release-4-lts": "4.0.2",
        "release-3-lts": "3.5.16"
      },
      "time": {
        "3.5.16": "2012-12-25",
        "4.0.2": "2014-03-24",
        "5.4.2": "2014-03-21"
      }
    };
    let getDownloadInfoUrl = (depName:string) => ApiUrl.NodeDownload.replace('${packageName}', encodeURIComponent(depName));
    let getPackageInfoUrl = (depName:string) => ApiUrl.NodePackage.replace('${packageName}', encodeURIComponent(depName));
    (mocks.httpClient as any).setMockResponses(List([
      new MockResponse(getDownloadInfoUrl('immutable'),'',downloadInfo),
      new MockResponse(getDownloadInfoUrl('rxjs'),'',downloadInfo),
      new MockResponse(getDownloadInfoUrl('zone.js'),'',downloadInfo),
      new MockResponse(getDownloadInfoUrl('typescript'),'',downloadInfo),
      new MockResponse(getDownloadInfoUrl('webpack'),'',{}),
      new MockResponse(getPackageInfoUrl('immutable'),'',packageInfo),
      new MockResponse(getPackageInfoUrl('rxjs'),'',packageInfo),
      new MockResponse(getPackageInfoUrl('zone.js'),'',packageInfo),
      new MockResponse(getPackageInfoUrl('typescript'),'',packageInfo)
    ]));
    let result = nodeProcessor.processPackageJson(JSON.stringify(packageJson));
    let tracker = new Subject();
    tracker.pipe(skip(1)).subscribe(()=> {
      done();
    });

    let expectedVersions = List([
      Version.builder().version('4.0.2').downloads(5).relativeDownloads(24).publishDate(toMillis('2014-03-24')).tag('latest, release-4-lts').build(),
      Version.builder().version('5.4.2').downloads(11).relativeDownloads(52).publishDate(toMillis('2014-03-21')).tag('').build(),
      Version.builder().version('4.3.6').downloads(21).relativeDownloads(100).publishDate(-1).tag('').build()
    ]);
    result.dependencyList$.pipe(take(1)).subscribe(deps => {
      expect(deps).toEqual(List([
        Dependency.builder().name('immutable').currentVersion('4.3.6').versions(expectedVersions).build(),
        Dependency.builder().name('rxjs').currentVersion('5.4.2').versions(expectedVersions).build(),
        Dependency.builder().name('zone.js').currentVersion('7.8.5').versions(expectedVersions).build()
      ]));
      tracker.next(true);
    });

    result.devDependencyList$.pipe(take(1)).subscribe(deps => {      
      expect(deps).toEqual(List([
        Dependency.builder().name('typescript').currentVersion('4.0.2').versions(expectedVersions).build(),
        Dependency.builder().name('webpack').currentVersion('11.4.3').versions(List([])).build()
      ]));
      tracker.next(true);  
    });
  });

  it('should consider last updated date for dependency', (done) => {
    let packageJson = {
      name:"my-app",
      version:"1.0.0",
      dependencies:{
        "immutable": "4.3.6",
      },
      dependencyUpdatedOn:{
        "immutable":DateTime.now().startOf('day').minus({ days: 29 }).toMillis()
      }
    };
    let downloadInfo = {
      "downloads":{
        "4.3.6":21
      }
    };
    let packageInfo = {
      "dist-tags": {
      },
      "time": {
      }
    };
    let getDownloadInfoUrl = (depName:string) => ApiUrl.NodeDownload.replace('${packageName}', encodeURIComponent(depName));
    let getPackageInfoUrl = (depName:string) => ApiUrl.NodePackage.replace('${packageName}', encodeURIComponent(depName));
    (mocks.httpClient as any).setMockResponses(List([
      new MockResponse(getDownloadInfoUrl('immutable'),'',downloadInfo),
      new MockResponse(getPackageInfoUrl('immutable'),'',packageInfo),
    ]));
    let result = nodeProcessor.processPackageJson(JSON.stringify(packageJson));
    let tracker = new Subject();
    tracker.pipe(skip(1)).subscribe(()=> {
      done();
    });

    let expectedVersions = List([
      Version.builder().version('4.3.6').downloads(21).relativeDownloads(100).publishDate(-1).tag('').build()
    ]);
    result.dependencyList$.pipe(take(1)).subscribe(deps => {
      expect(deps).toEqual(List([
        Dependency.builder().name('immutable').currentVersion('4.3.6').updateVersion('4.3.6').isUpToDate(true).updatedOn(DateTime.now().startOf('day').minus({ days: 29 }).toMillis()).versions(expectedVersions).build(),
      ]));
      tracker.next(true);
    });

    result.devDependencyList$.pipe(take(1)).subscribe(deps => {      
      expect(deps.isEmpty()).toBeTrue();
      tracker.next(true);  
    });
  });

  it('should be able to generate updated package json', () => {
    let packageJson = {
      name:"my-app",
      version:"1.0.0",
      dependencies:{
        "immutable": "4.3.6",
        "rxjs": "5.4.2",        
        "zone.js": "7.8.5"
      },
      devDependencies:{
        "typescript": "4.0.2",
        "webpack":"11.4.3"
      }
    };
    nodeProcessor.packageJson = packageJson;
    let result = nodeProcessor.getUpdatedPackageJson(List([]),List([]));
    let expectedPackageJson = {
      name:"my-app",
      version:"1.0.0",
      "dependencies":{},
      "devDependencies":{},
      "dependencyUpdatedOn":{}
    };
    expect(result).toEqual(JSON.stringify(expectedPackageJson));


    let versions = List([
      Version.builder().version('4.0.2').downloads(5).relativeDownloads(24).publishDate(toMillis('2014-03-24')).tag('latest, release-4-lts').build(),
      Version.builder().version('5.4.2').downloads(11).relativeDownloads(52).publishDate(toMillis('2014-03-21')).tag('').build(),
      Version.builder().version('4.3.6').downloads(21).relativeDownloads(100).publishDate(-1).tag('').build()
    ]);
    let deps = List([
      Dependency.builder().name('immutable').currentVersion('4.3.6').updateVersion('4.5.7').isUpToDate(true).updatedOn(DateTime.now().startOf('day').toMillis()).versions(versions).build(),
      Dependency.builder().name('rxjs').currentVersion('5.4.2').updateVersion('5.4.2').isUpToDate(true).updatedOn(DateTime.now().startOf('day').minus({ days: 29 }).toMillis()).versions(versions).build(),
      Dependency.builder().name('zone.js').currentVersion('7.8.5').versions(versions).build()
    ]);
    let devDeps = List([
      Dependency.builder().name('typescript').currentVersion('4.0.2').updateVersion('4.0.2').isUpToDate(true).updatedOn(DateTime.now().startOf('day').minus({ days: 29 }).toMillis()).versions(versions).build(),
      Dependency.builder().name('webpack').currentVersion('11.4.3').versions(List([])).build()
    ]);

    result = nodeProcessor.getUpdatedPackageJson(deps,devDeps);
    expectedPackageJson = {
      name:"my-app",
      version:"1.0.0",
      "dependencies":{
        "immutable":"4.5.7",
        "rxjs":"5.4.2",
        "zone.js":"7.8.5"
      },
      "devDependencies":{
        "typescript":"4.0.2",
        "webpack":"11.4.3"
      },
      "dependencyUpdatedOn":{
        "immutable":DateTime.now().startOf('day').toMillis(),
        "rxjs":DateTime.now().startOf('day').minus({ days: 29 }).toMillis(),
        "zone.js":0,
        "typescript":DateTime.now().startOf('day').minus({ days: 29 }).toMillis(),
        "webpack":0
      }
    };
    expect(result).toEqual(JSON.stringify(expectedPackageJson));
  });
});