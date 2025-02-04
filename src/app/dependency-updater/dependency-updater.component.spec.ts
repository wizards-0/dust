
import { List } from 'immutable';
import { MockedObjects } from '../../test/mocks/mocked-objects';

import { DependencyUpdaterComponent, getVersionPrefix, getVersionWithRelativeDownloads, matchVersion } from './dependency-updater.component';
import { Version } from './model/version';
import { Dependency } from './model/dependency';
import { AlertCategory } from 'ace-common-components';
import { of } from 'rxjs';
import { jsonMatching } from '../../test/jasmine-matchers';

describe('DependencyUpdaterComponent', () => {
  let component: DependencyUpdaterComponent;
  let mocks:MockedObjects;
  let setup = () => {
    mocks = new MockedObjects();
    component = new DependencyUpdaterComponent(mocks.clipboard, mocks.cdr, mocks.alertService, mocks.nodeProcessor, mocks.gradleProcessor);
  };

  beforeEach(setup)

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate node result', () => {
    let tests:any[] = [
      {packageJsonParsed:false,deps:List([]),devDeps:List([]),parseSucceeded:false},
      {packageJsonParsed:true,deps:List([]),devDeps:List([]),parseSucceeded:false},
      {packageJsonParsed:true,deps:List([1]),devDeps:List([]),parseSucceeded:true},
      {packageJsonParsed:true,deps:List([]),devDeps:List([1]),parseSucceeded:true},
      {packageJsonParsed:true,deps:List([1]),devDeps:List([1]),parseSucceeded:true},
    ]    

    tests.forEach(test => {
      setup();
      spyOn(mocks.cdr,'markForCheck');
      component.packageJsonParsed = test.packageJsonParsed;
      component.dependenciesDataSource.next(test.deps);
      component.devDependenciesDataSource.next(test.devDeps);

      component.validateNodeResultAndUpdateView();

      expect(component.parseSucceeded).toEqual(test.parseSucceeded);
      expect(mocks.cdr.markForCheck).toHaveBeenCalledTimes(test.parseSucceeded ? 1 : 0);
    })
  });

  it('should validate gradle result', () => {
    let tests:any[] = [
      {gradleFileParsed:false,deps:List([]),plugins:List([]),parseSucceeded:false},
      {gradleFileParsed:true,deps:List([]),plugins:List([]),parseSucceeded:false},
      {gradleFileParsed:true,deps:List([1]),plugins:List([]),parseSucceeded:true},
      {gradleFileParsed:true,deps:List([]),plugins:List([1]),parseSucceeded:true},
      {gradleFileParsed:true,deps:List([1]),plugins:List([1]),parseSucceeded:true},
    ]    

    tests.forEach(test => {
      setup();
      spyOn(mocks.cdr,'markForCheck');
      component.gradleFileParsed = test.gradleFileParsed;
      component.dependenciesDataSource.next(test.deps);
      component.pluginDependenciesDataSource.next(test.plugins);

      component.validateGradleResultAndUpdateView();

      expect(component.parseSucceeded).toEqual(test.parseSucceeded);
      expect(mocks.cdr.markForCheck).toHaveBeenCalledTimes(test.parseSucceeded ? 1 : 0);
    })
  });

  it('should provide relative downloads calculation', () => {
    let ver = Version.builder().downloads(5).build();
    let verWithRelativeDownloads = getVersionWithRelativeDownloads(ver,20);
    expect(verWithRelativeDownloads.relativeDownloads).toBe(25);
    expect(getVersionWithRelativeDownloads(ver,undefined).relativeDownloads).toBe(0);
  });

  it('should be able to copy package json with updated dependencies to clipboard', () => {
    let testJson = '{"result":"testJson"}'
    spyOn(mocks.nodeProcessor,'getUpdatedPackageJson').and.returnValue(testJson);
    spyOn(mocks.clipboard,'copy');
    spyOn(mocks.alertService,'show');
    let depsList = List([
      Dependency.builder().name('d1').currentVersion('1').build(),
      Dependency.builder().name('d2').currentVersion('2').build()
    ]);
    component.dependenciesDataSource.next(depsList);
    component.devDependenciesDataSource.next(depsList);

    component.copyPackageJson();
    expect(mocks.nodeProcessor.getUpdatedPackageJson).toHaveBeenCalledWith(depsList,depsList);
    expect(mocks.clipboard.copy).toHaveBeenCalledWith(testJson);
    expect(mocks.alertService.show).toHaveBeenCalledOnceWith(jasmine.any(String),AlertCategory.success,2000);
  });

  it('should be able to copy gradle build file with updated dependencies to clipboard', () => {
    let testFile = 'testFile{}'
    spyOn(mocks.gradleProcessor,'getUpdatedGradleFile').and.returnValue(testFile);
    spyOn(mocks.clipboard,'copy');
    spyOn(mocks.alertService,'show');
    let depsList = List([
      Dependency.builder().name('d1').currentVersion('1').build(),
      Dependency.builder().name('d2').currentVersion('2').build()
    ]);
    component.dependenciesDataSource.next(depsList);
    component.pluginDependenciesDataSource.next(depsList);

    component.copyGradleFile();
    expect(mocks.gradleProcessor.getUpdatedGradleFile).toHaveBeenCalledWith(depsList,depsList);
    expect(mocks.clipboard.copy).toHaveBeenCalledWith(testFile);
    expect(mocks.alertService.show).toHaveBeenCalledOnceWith(jasmine.any(String),AlertCategory.success,2000);
  });
  
  it('should produce error for invalid json and empty dep list', ()=> {
    spyOn(mocks.nodeProcessor,'processPackageJson').and.throwError(new Error('Invalid Json'));
    component.processPackageJson();
    expect(component.parseSucceeded).toBeFalse();
    expect(component.packageJsonParsed).toBeTrue();

    setup();
    spyOn(mocks.nodeProcessor,'processPackageJson').and.returnValue({
      dependencyList$: of(List([])),
      devDependencyList$: of(List([]))
    });
    component.processPackageJson();
    expect(component.packageJsonParsed).toBeTrue();
    expect(component.parseSucceeded).toBeFalse();
  });

  it('should process package json and produce dep list', ()=> {
    let depsList = List([
      Dependency.builder().name('d1').currentVersion('1').build(),
      Dependency.builder().name('d2').currentVersion('2').build()
    ]);
    spyOn(mocks.nodeProcessor,'processPackageJson').and.returnValue({
      dependencyList$: of(depsList),
      devDependencyList$: of(depsList)
    });
    component.processPackageJson();
    expect(component.packageJsonParsed).toBeTrue();
    expect(component.parseSucceeded).toBeTrue();
    expect(component.dependenciesDataSource.value).toEqual(depsList);
    expect(component.devDependenciesDataSource.value).toEqual(depsList);
  });

  it('should produce error gradle file with empty dep list', ()=> {    
    spyOn(mocks.gradleProcessor,'processBuildGradle').and.returnValue({
      dependencyList$: of(List([])),
      pluginDependencyList$: of(List([]))
    });
    component.processBuildGradle();
    expect(component.gradleFileParsed).toBeTrue();
    expect(component.parseSucceeded).toBeFalse();
  });

  it('should process gradle build file and produce dep list', ()=> {
    let depsList = List([
      Dependency.builder().name('d1').currentVersion('1').build(),
      Dependency.builder().name('d2').currentVersion('2').build()
    ]);
    spyOn(mocks.gradleProcessor,'processBuildGradle').and.returnValue({
      dependencyList$: of(depsList),
      pluginDependencyList$: of(depsList)
    });
    component.processBuildGradle();
    expect(component.gradleFileParsed).toBeTrue();
    expect(component.parseSucceeded).toBeTrue();
    expect(component.dependenciesDataSource.value).toEqual(depsList);
    expect(component.pluginDependenciesDataSource.value).toEqual(depsList);
  });

  it('should be able to select latest version for all dependencies', () => {
    spyOn(mocks.alertService,'show');

    let versions = List([
      Version.builder().version('5.1.2').downloads(31).build(),
      Version.builder().version('4.1.2').downloads(41).build(),
      Version.builder().version('4.0.2').downloads(21).build(),
      Version.builder().version('3.5.16').downloads(11).build()          
    ]);
    let depsList = List([
      Dependency.builder().name('d1').currentVersion('5.1.2').isSelected(true).isLatest(true).versions(versions).build(),
      Dependency.builder().name('d2').currentVersion('^5.1.2').isSelected(true).isLatest(true).versions(versions).build(),
      Dependency.builder().name('d3').currentVersion('~3.5.16').isSelected(true).versions(versions).build(),
      Dependency.builder().name('d4').currentVersion('1.0.0').isSelected(true).versions(versions).build()
    ]);
    component.dependenciesDataSource.next(depsList);

    component.updatedDependenciesVersion();
    expect(mocks.alertService.show).toHaveBeenCalledOnceWith(jasmine.any(String),AlertCategory.success,2000);

    expect(component.dependenciesDataSource.value).toEqual(jsonMatching(List([
      Dependency.builder().name('d1').currentVersion('5.1.2').isSelected(true).isLatest(true).versions(versions).build(),
      Dependency.builder().name('d2').currentVersion('^5.1.2').isSelected(true).isLatest(true).versions(versions).build(),
      Dependency.builder().name('d3').currentVersion('~3.5.16').isSelected(true).isLatest(true).updateVersion('~5.1.2').isUpdated(true).versions(versions).build(),
      Dependency.builder().name('d4').currentVersion('1.0.0').isSelected(true).isLatest(true).updateVersion('5.1.2').isUpdated(true).versions(versions).build()
    ])));

    let unselectedDeps = depsList.map(dep => dep.toBuilder().isSelected(false).build());
    component.latestOptionInput.setValue(undefined as any);
    component.dependenciesDataSource.next(unselectedDeps);
    component.updatedDependenciesVersion();
    expect(component.dependenciesDataSource.value).toEqual(unselectedDeps);
    expect(mocks.alertService.show).toHaveBeenCalledWith(jasmine.any(String),AlertCategory.info,2000);
  });

  it('should be able to identify if current or update version is present in list of available versions', ()=>{

    expect(matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').build(),
      Version.builder().version('1.1.0').build()
    )).toBeTrue();

    expect(matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build(),
      Version.builder().version('1.1.0').build()
    )).toBeFalse();

    expect(matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build(),
      Version.builder().version('^2.0.0').build()
    )).toBeFalse();

    expect(matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build(),
      Version.builder().version('2.0.0').build()
    )).toBeTrue();
  });

  it('should be able to identify simple prefix for node semver, return empty for others', () => {
    expect(getVersionPrefix('^1.0.0')).toBe('^');
    expect(getVersionPrefix('1.0.0')).toBe('');

    expect(getVersionPrefix('1.1-RELEASE')).toBe('');

    expect(getVersionPrefix('--')).toBe('');
  });
});