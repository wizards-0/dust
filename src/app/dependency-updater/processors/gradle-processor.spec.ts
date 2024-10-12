
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
    gradleProcessor = new GradleProcessor(mocks.apiService);
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

    /* dependencyUpdatedOn {
    }*/
    `.replaceAll('\'', '"').split('\n');

    result = gradleProcessor.getBuildFileParts(List(buildFileLines));
    expect(result).toEqual(new GradleFile(
      List(buildFileLines),
      new FileIndexRange(2, 4),
      new FileIndexRange(7, 17),
      new FileIndexRange(19, 20)
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
    let result = gradleProcessor.parseDependencyLines(dependencyLines, {});
    expect(result).toEqual(jsonMatching(List([
      Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').build()
    ])));

    let lastUpdated;
    lastUpdated = DateTime.now().minus({days: 29}).startOf('day').toMillis();
    result = gradleProcessor.parseDependencyLines(dependencyLines, {"com.google.guava:guava":lastUpdated});
    expect(result).toEqual(jsonMatching(List([
      Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').updateVersion('28.1-jre').isUpToDate(true).updatedOn(lastUpdated).build()
    ])));

    lastUpdated = DateTime.now().minus({days: 30}).startOf('day').toMillis();
    result = gradleProcessor.parseDependencyLines(dependencyLines, {"com.google.guava:guava":lastUpdated});
    expect(result).toEqual(jsonMatching(List([
      Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').updateVersion('28.1-jre').isUpToDate(true).updatedOn(lastUpdated).build()
    ])));

    lastUpdated = DateTime.now().minus({days: 31}).startOf('day').toMillis();
    result = gradleProcessor.parseDependencyLines(dependencyLines, {"com.google.guava:guava":lastUpdated});
    expect(result).toEqual(jsonMatching(List([
      Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').updatedOn(lastUpdated).build()
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
    let result = gradleProcessor.parsePluginLines(dependencyLines, {});
    expect(result).toEqual(jsonMatching(List([
      Dependency.builder().name('info.solidsoft.pitest').currentVersion('1.15.0').build(),
      Dependency.builder().name('org.sonarqube').currentVersion('5.1.0.4882').build()
    ])));
  });

  it('should be able to parse last dependency update from build file', () => {
    let lines = List(['']);
    let gradleFile = new GradleFile(lines, new FileIndexRange(-1, -1), new FileIndexRange(-1, -1), new FileIndexRange(-1, -1));
    let result = gradleFile.getDependencyUpdatedOn();
    expect(result).toEqual({});

    lines = List(`
      /*dependencyUpdatedOn {
      }*/
      `.split('\n'));
    gradleFile = gradleProcessor.getBuildFileParts(lines);
    result = gradleFile.getDependencyUpdatedOn();
    expect(result).toEqual({});

    lines = List(`
        /*dependencyUpdatedOn {
          "org.sonarqube":0
          "com.google.guava:guava":0
        }*/
        `.split('\n'));
    gradleFile = gradleProcessor.getBuildFileParts(lines);
    result = gradleFile.getDependencyUpdatedOn();
    expect(result).toEqual({
      "org.sonarqube":0,
      "com.google.guava:guava":0
    });
  });

  it('should be able to fetch maven dependency versions', (done) => {
    spyOn(mocks.apiService, 'getMavenDependencyVersions')
      .withArgs('com.google.guava', 'guava').and.returnValue(of({
        "components": [
          { "version": "v1", "dependencyOfCount": 21, "publishedEpochMillis": toMillis("2014-03-24"), "ossIndexInfo": { "vulnerabilityCount": 2 } },
          { "version": "v2", "dependencyOfCount": 11, "publishedEpochMillis": toMillis("2014-09-21"), "ossIndexInfo": { "vulnerabilityCount": null } },
          { "version": "v3", "dependencyOfCount": 5, "publishedEpochMillis": toMillis("2015-04-11"), "ossIndexInfo": {} },
        ]
      }));
    let deps = List([
      Dependency.builder().name('com.google.guava:guava').build()
    ]);
    gradleProcessor.fetchVersions(deps).pipe(take(1)).subscribe(deps => {
      expect(deps).toEqual(jsonMatching(List([
        Dependency.builder().name('com.google.guava:guava').versions(List([
          Version.builder().version('v1').downloads(21).relativeDownloads(100).publishDate(toMillis("2014-03-24")).vulnerabilityCount(2).build(),
          Version.builder().version('v2').downloads(11).relativeDownloads(52).publishDate(toMillis("2014-09-21")).vulnerabilityCount(0).build(),
          Version.builder().version('v3').downloads(5).relativeDownloads(24).publishDate(toMillis("2015-04-11")).vulnerabilityCount(0).build()
        ])).build()
      ])));
      done();
    });
  });

  it('should be able to fetch gradle plugin versions', (done) => {
    spyOn(mocks.apiService, 'getGradlePluginVersions')
      .withArgs('info.solidsoft.pitest').and.returnValue(of({
        metadata: {
          versioning: {
            versions: { version: ["v1", "v2", "v3"] },
            lastUpdated: 20140324154555
          }
        }
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
    tracker.pipe(skip(1)).subscribe(()=> {
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
    tracker.pipe(skip(1)).subscribe(()=> {
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
      metadata: {
        versioning: {
          versions: { version: ["v1"] },
          lastUpdated: 20140324154555
        }
      }
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

  it('should be able to generate updated build file with current version if update version is absent & add dependency updated on section if absent', () => {
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
    let expectedBuildFile = buildFile + 
`
/* dependencyUpdatedOn {
"com.google.guava:guava":0
"info.solidsoft.pitest":0
} */`
    expect(result).toEqual(expectedBuildFile);
  });

  it('should be able to generate updated build file with update version & replace dependency updated on section', () => {
    let buildFile = 
`

    plugins {

		id "jacoco"
		id "info.solidsoft.pitest" version "1.15.0"		

    }

    dependencies {

      implementation "org.springframework.boot:spring-boot-starter-web"
      implementation "com.google.guava:guava:28.1-jre"

    }

    /* dependencyUpdatedOn {
      "com.google.guava:guava":0
    } */
    `
    let gradleFile = gradleProcessor.getBuildFileParts(List(buildFile.split('\n')));
    gradleProcessor.gradleFile = gradleFile;
    let lastUpdated = DateTime.now().startOf('day').toMillis();
    let result = gradleProcessor.getUpdatedGradleFile(
      List([Dependency.builder().name('com.google.guava:guava').currentVersion('28.1-jre').updateVersion('29').updatedOn(lastUpdated).build()]),
      List([Dependency.builder().name('info.solidsoft.pitest').currentVersion('1.15.0').updateVersion('2.1').updatedOn(lastUpdated).build()])
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

    }

/* dependencyUpdatedOn {
"com.google.guava:guava":${lastUpdated}
"info.solidsoft.pitest":${lastUpdated}
} */`
    expect(result).toEqual(expectedBuildFile);
  });

});

