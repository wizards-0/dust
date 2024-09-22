import { BehaviorSubject, take } from 'rxjs';
import { MockedObjects } from '../../../test/mocks/mocked-objects';

import { DependencyUpdateSelectorComponent } from './dependency-update-selector.component';
import { List } from 'immutable';
import { Dependency } from '../model/dependency';
import { DateTime } from 'luxon';
import { Version } from '../model/version';

describe('DependencyUpdateSelectorComponent', () => {
  let component: DependencyUpdateSelectorComponent;
  let mocks:MockedObjects;

  beforeAll(() => {
  });

  beforeEach(() => {
    mocks = new MockedObjects();
    component = new DependencyUpdateSelectorComponent();
  });

  it('should assign columns based on build type', () => {
    component.buildType = 'node';
    expect(component.downloadColumnLabel).toBe( 'Downloads (7 days)' );
    expect(component.versionDetailColumns).toEqual( ['select','version', 'downloads', 'tag', 'publishDate'] );

    component.buildType = 'gradle';
    expect(component.downloadColumnLabel).toBe( 'Depended On' );
    expect(component.versionDetailColumns).toEqual( ['select','version', 'downloads', 'vulnerabilityCount', 'publishDate'] );

    component.buildType = 'someRandomInvalidString';
    expect(component.downloadColumnLabel).toBe( 'Downloads' );
    expect(component.versionDetailColumns).toEqual( ['select','version', 'downloads', 'publishDate'] );
  });

  it('should convert immutable list to array for rendering on UI', (done) => {
    let deps = [
      Dependency.builder().name('d1').build(),
      Dependency.builder().name('d2').build()
    ];
    component.dataSource = new BehaviorSubject(List(deps));
    component.depsArr$.pipe(take(1)).subscribe(depsArr => {
      expect(depsArr).toEqual(deps);
      done();
    });    
  });

  it('should emit updated list on selecting an update version for any dependency', () => {
    let deps = [
      Dependency.builder().name('d1').currentVersion('v1').build(),
      Dependency.builder().name('d2').currentVersion('v1').build()
    ];
    component.dataSource = new BehaviorSubject(List(deps));
    component.updateVersionTemp.next('v2');
    component.updateDependencyVersion(0);
    let dep = component._dataSource.value.get(0,Dependency.empty());
    expect(dep.updateVersion).toBe('v2');
    expect(dep.isUpToDate).toBeTrue();
    expect(DateTime.now().toMillis() - dep.updatedOn).toBeLessThan(1000);

    expect(component._dataSource.value.get(1)?.updateVersion).toBeFalsy();
  });

  it('should be able to identify simple prefix for node semver, return empty for others', () => {
    expect(component.getVersionPrefix('^1.0.0')).toBe('^');
    expect(component.getVersionPrefix('1.0.0')).toBe('');

    expect(component.getVersionPrefix('1.1-RELEASE')).toBe('');
  });

  it('should be able to identify if current or update version is present in list of available versions', ()=>{

    expect(component.matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').build(),
      Version.builder().version('1.1.0').build()
    )).toBeTrue();

    expect(component.matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build(),
      Version.builder().version('1.1.0').build()
    )).toBeFalse();

    expect(component.matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build(),
      Version.builder().version('^2.0.0').build()
    )).toBeFalse();

    expect(component.matchVersion(
      Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build(),
      Version.builder().version('2.0.0').build()
    )).toBeTrue();
  });

  it('should set temp version, dep on selection', () => {
    let event:any = {stopPropagation:()=>{}};
    spyOn(event,'stopPropagation');
    let dep = Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build()
    component.selectDependency(dep,event);

    expect(component.currentDependency).toEqual(dep);
    expect(component.updateVersionTemp.value).toBe('2.0.0');
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);

    dep = Dependency.builder().name('d2').currentVersion('^1.1.0').build()
    component.selectDependency(dep,event);
    expect(component.updateVersionTemp.value).toBe('^1.1.0');
  });

  it('should clear temp variables, on collapse', () => {
    let event:any = {stopPropagation:()=>{}};
    spyOn(event,'stopPropagation');
    let dep = Dependency.builder().name('d1').currentVersion('^1.1.0').updateVersion('2.0.0').build()
    component.currentDependency = dep;
    component.selectDependency(dep,event);

    expect(component.currentDependency).toBeFalsy();
    expect(component.updateVersionTemp.value).toBeFalsy();
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('should format date from epoch millis', () => {
    expect(component.getFormattedDate(Version.builder().publishDate(1726998112641).build())).toBe('22 Sep, 2024');
    expect(component.getFormattedDate(Version.builder().publishDate(-1).build())).toBe('NA');
  });

  it('should treat negative downloads as NA', () => {
    expect(component.getNAForNegativeValue(100)).toBe('100');
    expect(component.getNAForNegativeValue(0)).toBe('0');
    expect(component.getNAForNegativeValue(-1)).toBe('NA');
  });
});