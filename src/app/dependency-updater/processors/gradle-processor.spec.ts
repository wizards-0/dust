
import { List } from 'immutable';
import { MockedObjects } from '../../../test/mocks/mocked-objects';

import { FileIndexRange, GradleFile, GradleProcessor } from './gradle-processor';
import { Dependency } from '../model/dependency';
import { jsonMatching } from '../../../test/jasmine-matchers';
import { of, skip, Subject, take, throwError } from 'rxjs';
import { DateTime } from 'luxon';
import { Version } from '../model/version';

describe('GradleProcessor', () => {
  let gradleProcessor: GradleProcessor;
  let mocks: MockedObjects;

  let toMillis = (date: string) => DateTime.fromISO(date).toMillis()

  beforeAll(() => {

  });

  beforeEach(() => {
    mocks = new MockedObjects();
    gradleProcessor = new GradleProcessor(mocks.apiService, mocks.settingsService);
  });

  it('should parse build file into relavant parts', () => {
    let buildFileLines = `

      dependencies {

	      implementation 'org.springframework.boot:spring-boot-starter-web'
        implementation 'com.google.guava:guava:28.1-jre'
	      testImplementation 'org.springframework.boot:spring-boot-starter-test'

      }

    `
      .replaceAll('\'', '"').split('\n');

    let result = gradleProcessor.getBuildFileParts(List(buildFileLines));
    expect(result.dependencyLineIndices).toEqual(new FileIndexRange(2, 8));

    buildFileLines = `
    pluginManagement {
      plugins {
        id "java-library"
      }
    }

    dependencyResolutionManagement {
      versionCatalogs {
        libs {
          library("immutables.value","org.immutables:value:2.10.1")
        }

        testLibs{
          library("junit.api","org.junit.jupiter:junit-jupiter-api:5.10.3")
        }
      }
    }

    `.replaceAll('\'', '"').split('\n');

    result = gradleProcessor.getBuildFileParts(List(buildFileLines));
    expect(result).toEqual(new GradleFile(
      List(buildFileLines),
      new FileIndexRange(2, 4),
      new FileIndexRange(7, 17)
    ));

    expect(result.getPluginLines()).toEqual(jsonMatching(List(['      plugins {', '        id "java-library"', '      }'])));
  });

  it('should be able to parse dependencies from build file', () => {
    let dependencyLines = List(`

    dependencies {

      implementation 'org.springframework.boot:spring-boot-starter-web'
      implementation 'com.google.guava:guava:28.1-jre'
      testImplementation 'org.springframework.boot:spring-boot-starter-test'

    }

  `
      .replaceAll('\'', '"').split('\n'));
    let result = gradleProcessor.parseDependencyLines(dependencyLines);
    expect(result).toEqual(jsonMatching(List([
      Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').build()
    ])));

  });

  it('should be able to parse plugins from build file', () => {
    let dependencyLines = List(`

    plugins {

		id "jacoco"
		id "info.solidsoft.pitest" version "1.15.0"
		id "org.sonarqube" version "5.1.0.4882"

    }

  `
      .replaceAll('\'', '"').split('\n'));
    let result = gradleProcessor.parsePluginLines(dependencyLines);
    expect(result).toEqual(jsonMatching(List([
      Dependency.builder().name('info.solidsoft.pitest').currentVersion('1.15.0').build(),
      Dependency.builder().name('org.sonarqube').currentVersion('5.1.0.4882').build()
    ])));
  });

  it('should be able to fetch maven dependency versions', (done) => {
    spyOn(mocks.apiService, 'getMavenDependencyVersions')
      .withArgs('com.google.guava', 'guava').and.returnValue(of({
        "components": [
          { "version": "v1", "dependencyOfCount": 21, "publishedEpochMillis": toMillis("2014-03-24"), "ossIndexInfo": { "vulnerabilityCount": 2 } },
          { "version": "v2", "dependencyOfCount": 11, "publishedEpochMillis": toMillis("2014-09-21"), "ossIndexInfo": { "vulnerabilityCount": null } },
          { "version": "v3", "dependencyOfCount": 5, "publishedEpochMillis": toMillis("2015-04-11"), "ossIndexInfo": {} },
          { "version": "v4-beta", "dependencyOfCount": 5, "publishedEpochMillis": toMillis("2015-04-11"), "ossIndexInfo": {} }
        ]
      }));
    let deps = List([
      Dependency.builder().name('com.google.guava:guava').build()
    ]);
    gradleProcessor.fetchVersions(deps).pipe(take(1)).subscribe(deps => {
      expect(deps).toEqual(jsonMatching(List([
        Dependency.builder().name('com.google.guava:guava').versions(List([
          Version.builder().version('v3').downloads(5).relativeDownloads(24).publishDate(toMillis("2015-04-11")).vulnerabilityCount(0).build(),
          Version.builder().version('v2').downloads(11).relativeDownloads(52).publishDate(toMillis("2014-09-21")).vulnerabilityCount(0).build(),
          Version.builder().version('v1').downloads(21).relativeDownloads(100).publishDate(toMillis("2014-03-24")).vulnerabilityCount(2).build()
        ])).build()
      ])));
      done();
    });
  });

  it('should be able to fetch gradle plugin versions', (done) => {
    spyOn(mocks.apiService, 'getGradlePluginVersions')
      .withArgs('info.solidsoft.pitest').and.returnValue(of({
        lastUpdated: '20140324154555',
        versions: List(["v1", "v2", "v3", "v4-dev"])
      }));

    gradleProcessor.fetchPluginVersions(List([Dependency.builder().name('info.solidsoft.pitest').build()])).subscribe(deps => {
      expect(deps).toEqual(jsonMatching(List([
        Dependency.builder().name('info.solidsoft.pitest').versions(List([
          Version.builder().version('v3').publishDate(DateTime.fromFormat(20140324154555 + '', 'yyyyLLddHHmmss').toMillis()).build(),
          Version.builder().version('v2').build(),
          Version.builder().version('v1').build()
        ])).build()
      ])));
      done();
    });
  });

  it('should be able return plugin dependency with no versions in case of http error', (done) => {
    spyOn(mocks.apiService, 'getGradlePluginVersions')
      .withArgs('info.solidsoft.pitest').and.returnValue(throwError(() => new Error('404')));
    gradleProcessor.fetchPluginVersions(List([Dependency.builder().name('info.solidsoft.pitest').build()])).subscribe(deps => {
      expect(deps).toEqual(jsonMatching(List([
        Dependency.builder().name('info.solidsoft.pitest').versions(List([])).build()
      ])));
      done();
    });
  });

  it('should return empty list for empty file', (done) => {
    let tracker = new Subject();
    tracker.pipe(skip(1)).subscribe(() => {
      done();
    });
    let result = gradleProcessor.processBuildGradle('');
    result.dependencyList$.subscribe(deps => {
      expect(deps.isEmpty()).toBeTrue();
      tracker.next(true);
    });
    result.pluginDependencyList$.subscribe(deps => {
      expect(deps.isEmpty()).toBeTrue();
      tracker.next(true);
    });
  });

  it('should return process valid build file', (done) => {
    let tracker = new Subject();
    tracker.pipe(skip(1)).subscribe(() => {
      done();
    });

    let buildFile = `

    plugins {

		id "jacoco"
		id "info.solidsoft.pitest" version "1.15.0"		

    }

    dependencies {

      implementation "org.springframework.boot:spring-boot-starter-web"
      implementation "com.google.guava:guava:28.1-jre"

    }

    `;

    spyOn(mocks.apiService, 'getMavenDependencyVersions')
      .withArgs('com.google.guava', 'guava').and.returnValue(of({
        "components": []
      }));

    spyOn(mocks.apiService, 'getGradlePluginVersions')
      .withArgs('info.solidsoft.pitest').and.returnValue(of({
        lastUpdated: '20140324154555',
        versions: List(["v1"])
      }));

    let result = gradleProcessor.processBuildGradle(buildFile);
    result.dependencyList$.subscribe(deps => {
      expect(deps).toEqual(jsonMatching(List([
        Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').versions(List([])).build()
      ])));
      tracker.next(true);
    });
    result.pluginDependencyList$.subscribe(deps => {
      expect(deps).toEqual(jsonMatching(List([
        Dependency.builder().name('info.solidsoft.pitest').currentVersion('1.15.0').versions(List([
          Version.builder().version('v1').publishDate(DateTime.fromFormat(20140324154555 + '', 'yyyyLLddHHmmss').toMillis()).build(),
        ])).build()
      ])));
      tracker.next(true);
    });
  });

  it('should be able to generate updated build file with current version if update version is absent', () => {
    let buildFile = `

    plugins {

		id "jacoco"
		id "info.solidsoft.pitest" version "1.15.0"		

    }

    dependencies {

      implementation "org.springframework.boot:spring-boot-starter-web"
      implementation "com.google.guava:guava:28.1-jre"

    }
    `
    let gradleFile = gradleProcessor.getBuildFileParts(List(buildFile.split('\n')));
    gradleProcessor.gradleFile = gradleFile;
    let result = gradleProcessor.getUpdatedGradleFile(
      List([Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').build()]),
      List([Dependency.builder().name('info.solidsoft.pitest').currentVersion('1.15.0').build()])
    );
    expect(result).toEqual(buildFile);
  });

  it('should be able to generate updated build file with update version', () => {
    let buildFile =
      `

    plugins {

		id "jacoco"
		id "info.solidsoft.pitest" version "1.15.0"		

    }

    dependencies {

      implementation "org.springframework.boot:spring-boot-starter-web"
      implementation "com.google.guava:guava:28.1-jre"

    }`
    let gradleFile = gradleProcessor.getBuildFileParts(List(buildFile.split('\n')));
    gradleProcessor.gradleFile = gradleFile;
    let result = gradleProcessor.getUpdatedGradleFile(
      List([Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').updateVersion('29').build()]),
      List([Dependency.builder().name('info.solidsoft.pitest').currentVersion('1.15.0').updateVersion('2.1').build()])
    );
    let expectedBuildFile =
      `

    plugins {

		id "jacoco"
		id "info.solidsoft.pitest" version "2.1"		

    }

    dependencies {

      implementation "org.springframework.boot:spring-boot-starter-web"
      implementation "com.google.guava:guava:29"

    }`
    expect(result).toEqual(expectedBuildFile);
  });

  it('should include latest dependency if missing in top 10 downloads', (done) => {
    let buildFile =
      `
    dependencies {

      implementation "org.springframework.boot:spring-boot-starter-web"
      implementation "com.google.guava:guava:28.1-jre"

    }`;

    spyOn(mocks.apiService, 'getMavenDependencyVersions')
      .withArgs('com.google.guava', 'guava').and.returnValue(of({
        components: [
          { version: "1", dependencyOfCount: 1000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2005-01-01").toMillis() },
          { version: "2", dependencyOfCount: 2000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2006-01-01").toMillis() },
          { version: "3", dependencyOfCount: 3000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2007-01-01").toMillis() },
          { version: "4", dependencyOfCount: 4000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2008-01-01").toMillis() },
          { version: "5", dependencyOfCount: 5000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2009-01-01").toMillis() },
          { version: "6", dependencyOfCount: 6000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2010-01-01").toMillis() },
          { version: "7", dependencyOfCount: 7000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2011-01-01").toMillis() },
          { version: "8", dependencyOfCount: 8000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2012-01-01").toMillis() },
          { version: "9", dependencyOfCount: 9000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2013-01-01").toMillis() },
          { version: "10", dependencyOfCount: 10000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2014-01-01").toMillis() },
          { version: "11", dependencyOfCount: 11000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2015-01-01").toMillis() },
          { version: "12", dependencyOfCount: 12000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2016-01-01").toMillis() },
          { version: "13", dependencyOfCount: 13000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2017-01-01").toMillis() },
          { version: "14", dependencyOfCount: 14000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2018-01-01").toMillis() },
          { version: "15", dependencyOfCount: 15000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2019-01-01").toMillis() },
          { version: "16", dependencyOfCount: 16000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2020-01-01").toMillis() },
          { version: "17", dependencyOfCount: 17000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2021-01-01").toMillis() },
          { version: "18", dependencyOfCount: 18000, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2022-01-01").toMillis() },
          { version: "19", dependencyOfCount: 17500, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2023-01-01").toMillis() },
          { version: "20", dependencyOfCount: 16500, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2024-01-01").toMillis() },
          { version: "21", dependencyOfCount: 6500, ossIndexInfo: { vulnerabilityCount: 0 }, publishedEpochMillis: DateTime.fromISO("2025-01-01").toMillis() }
        ]
      }));

    let result = gradleProcessor.processBuildGradle(buildFile);

    result.dependencyList$.subscribe(deps => {
      expect(deps.get(0)?.versions.get(0)?.version).toBe("21");
      done();
    });
  });

});