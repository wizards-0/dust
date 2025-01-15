
import { List } from 'immutable';
import { MockedObjects } from '../../test/mocks/mocked-objects';

import { DependencyUpdaterComponent, getVersionWithRelativeDownloads } from './dependency-updater.component';
import { Version } from './model/version';
import { Dependency } from './model/dependency';
import { DateTime } from 'luxon';
import { AlertCategory } from 'ace-common-components';
import { of } from 'rxjs';

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
});