import { state, style, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { DateTime } from 'luxon';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { Dependency } from '../model/dependency';
import { List } from 'immutable';
import { Version } from '../model/version';

import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import { ButtonComponent } from 'ace-common-components';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatRadioModule} from '@angular/material/radio';
import { AsyncPipe } from '@angular/common';

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
    imports: [MatInputModule, MatButtonModule, ButtonComponent, MatFormFieldModule, MatIconModule, MatTableModule, MatRadioModule, AsyncPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DependencyUpdateSelectorComponent implements OnInit {

    //@Output, will hold the same reference of behavior subject as parent on init. Any emits on this datasource will be received by parent
  depsArr$:Observable<Dependency[]> = of([]);
  id:string='';
  constructor(){
  }

  @Input()
  buildType:string = '';
  @Input()
  label:string = '';
  @Input()
  dataSource:BehaviorSubject<List<Dependency>> = new BehaviorSubject(List());
  
  ngOnInit(): void {
    if(this.buildType == 'node'){
      this.downloadColumnLabel = 'Downloads (7 days)';
      this.versionDetailColumns = ['select','version', 'downloads', 'tag', 'publishDate'];
    } else if(this.buildType == 'gradle') {
      this.downloadColumnLabel = 'Depended On';
      this.versionDetailColumns = ['select','version', 'downloads', 'vulnerabilityCount', 'publishDate'];
    } else {
      this.downloadColumnLabel = 'Downloads';
      this.versionDetailColumns = ['select','version', 'downloads', 'publishDate'];
    }
    this.depsArr$ = this.dataSource.pipe(map(deps => deps.toArray()));
    this.id=this.label.replaceAll(' ','');
  }

  updateVersionTemp = new BehaviorSubject('');
  downloadColumnLabel:string = ''
  displayedColumns: string[] = ['name', 'currentVersion', 'updateVersion', 'isUpToDate', 'details'];
  versionDetailColumns: string[] = [];
  
  currentDependency:Dependency | null = null;

  updateDependencyVersion(rowIndex:number) {
    let dependencies = this.dataSource.value;
    let dependencyToUpdate = dependencies.get(rowIndex,Dependency.empty())
    .with(dep => {
      dep.isUpToDate(true);
      dep.updateVersion(this.updateVersionTemp.value);
    });    
    this.dataSource.next(dependencies.set(rowIndex,dependencyToUpdate));
  }

  getVersionPrefix(version:string):string {
    const prefixMatch = /(\W*)(.+\..+\..+)/.exec(version);
    return prefixMatch ? prefixMatch[1] : '';
  }

  matchVersion(element:Dependency,versionElement:Version):boolean {
    let versionToMatch = element.updateVersion ? element.updateVersion : element.currentVersion;
    let prefix = this.getVersionPrefix(versionToMatch);
    return versionToMatch == (prefix+versionElement.version);
  }

  selectDependency(element:Dependency,$event:any):void {
    if(this.currentDependency === element){
      this.currentDependency = null;
      this.updateVersionTemp.next('');
    } else {
      this.currentDependency = element;
      this.updateVersionTemp.next(element.updateVersion ? element.updateVersion : element.currentVersion);
    }
    $event.stopPropagation();
  }

  getFormattedDate(versionElement:Version) : string {
    return versionElement.publishDate < 0 ? 'NA' : 
    DateTime.fromMillis(versionElement.publishDate).toFormat('dd LLL, yyyy');
  }

  getNAForNegativeValue(value:number) {
    return value < 0 ? 'NA' : value+'';
  }
}
