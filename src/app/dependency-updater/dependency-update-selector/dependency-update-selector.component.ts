import { state, style, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { DateTime } from 'luxon';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { Dependency } from '../model/dependency';
import { List } from 'immutable';
import { Version } from '../model/version';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ButtonComponent } from 'ace-common-components';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { AsyncPipe } from '@angular/common';
import { getVersionPrefix, matchVersion } from '../dependency-updater.component';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'dependency-update-selector',
  templateUrl: './dependency-update-selector.component.html',
  styleUrl: './dependency-update-selector.component.scss',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0', minHeight: '0' })),
      state('expanded', style({ height: '*' }))
    ]),
  ],
  imports: [MatInputModule, MatButtonModule, MatCheckboxModule, ButtonComponent, MatFormFieldModule, MatIconModule, MatTableModule, MatRadioModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DependencyUpdateSelectorComponent implements OnInit {

  //@Output, will hold the same reference of behavior subject as parent on init. Any emits on this datasource will be received by parent
  depsArr$: Observable<Dependency[]> = of([]);
  id: string = '';
  selection = new SelectionModel<Dependency>(true, []);
  areAllSelected = false;
  selectionCount = 0;
  constructor(public cdr:ChangeDetectorRef) {
  }

  @Input()
  buildType: string = '';
  @Input()
  label: string = '';
  @Input()
  dataSource: BehaviorSubject<List<Dependency>> = new BehaviorSubject(List());

  ngOnInit(): void {
    if (this.buildType == 'node') {
      this.downloadColumnLabel = 'Downloads (7 days)';
      this.versionDetailColumns = ['select', 'version', 'downloads', 'tag', 'publishDate'];
    } else if (this.buildType == 'gradle') {
      this.downloadColumnLabel = 'Depended On';
      this.versionDetailColumns = ['select', 'version', 'downloads', 'vulnerabilityCount', 'publishDate'];
    } else {
      this.downloadColumnLabel = 'Downloads';
      this.versionDetailColumns = ['select', 'version', 'downloads', 'publishDate'];
    }
    this.depsArr$ = this.dataSource.pipe(map(deps => deps.toArray()));
    this.id = this.label.replaceAll(' ', '');
  }

  updateVersionTemp = new BehaviorSubject('');
  downloadColumnLabel: string = ''
  displayedColumns: string[] = ['isSelected', 'name', 'currentVersion', 'updateVersion', 'isUpdated', 'isLatest', 'details'];
  versionDetailColumns: string[] = [];

  currentDependency: Dependency | null = null;

  updateDependencyVersion(rowIndex: number) {
    let dependencies = this.dataSource.value;
    let dependencyToUpdate = dependencies.get(rowIndex, Dependency.empty())
      .with(dep => {
        dep.isUpdated(true);
        dep.isLatest(matchVersion(Dependency.builder().updateVersion(this.updateVersionTemp.value).build(),dependencyToUpdate.versions.get(0,Version.empty())))
        dep.updateVersion(this.updateVersionTemp.value);
      });
    this.dataSource.next(dependencies.set(rowIndex, dependencyToUpdate));
  }

  getVersionPrefix(version: string): string {
    return getVersionPrefix(version);
  }

  matchVersion(element: Dependency, versionElement: Version): boolean {
    return matchVersion(element, versionElement);
  }

  toggleDependencyDetails(element: Dependency, $event: any): void {
    if (this.currentDependency === element) {
      this.currentDependency = null;
      this.updateVersionTemp.next('');
    } else {
      this.currentDependency = element;
      this.updateVersionTemp.next(element.updateVersion ? element.updateVersion : element.currentVersion);
    }
    $event.stopPropagation();
  }

  getFormattedDate(versionElement: Version): string {
    return versionElement.publishDate < 0 ? 'NA' :
      DateTime.fromMillis(versionElement.publishDate).toFormat('dd LLL, yyyy');
  }

  getNAForNegativeValue(value: number) {
    return value < 0 ? 'NA' : value + '';
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.value.size;
    return numSelected == numRows;
  }

  toggleSelection(dependencyIndex:number) {
    let dependencies = this.dataSource.value;
    let dependencyToUpdate = dependencies.get(dependencyIndex, Dependency.empty())      
    this.dataSource.next(dependencies.set(dependencyIndex, dependencyToUpdate.with(dep => {
      dep.isSelected(!dependencyToUpdate.isSelected);
    })));
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if(this.areAllSelected){      
      this.areAllSelected = false;
      this.dataSource.next(this.dataSource.value.map(dep => dep.with(depMut => depMut.isSelected(false))));
      this.cdr.detectChanges();
    } else {
      this.areAllSelected = true;
      this.dataSource.next(this.dataSource.value.map(dep => dep.with(depMut => depMut.isSelected(true))));
    }
  }
 
}
