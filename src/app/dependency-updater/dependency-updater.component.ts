import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { List } from 'immutable';
import { BehaviorSubject } from 'rxjs';
import { Version } from './model/version';
import { NodeProcessor } from './processors/node-processor';
import { GradleProcessor } from './processors/gradle-processor';
import { Dependency } from './model/dependency';
import { DateTime } from 'luxon';

import { MatCard } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent,AlertService, AlertCategory } from 'ace-common-components';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DependencyUpdateSelectorComponent } from './dependency-update-selector/dependency-update-selector.component';

@Component({
    selector: 'dependency-updater',
    templateUrl: './dependency-updater.component.html',
    host: { class: 'flex basis-full w-full h-full' },
    imports: [MatCard, MatInputModule, ButtonComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, DependencyUpdateSelectorComponent, ReactiveFormsModule],
    providers: [AlertService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DependencyUpdaterComponent {

  packageJson: any;
  packageJsonInput = new FormControl<string>('');
  gradleFileInput = new FormControl<string>('');

  buildFileReceived = false;
  packageJsonParsed = false;
  gradleFileParsed = false;
  parseSucceeded = false;
  dependenciesDataSource = new BehaviorSubject<List<Dependency>>(List([]));
  devDependenciesDataSource = new BehaviorSubject<List<Dependency>>(List([]));
  pluginDependenciesDataSource = new BehaviorSubject<List<Dependency>>(List([]));

  constructor(    
    private clipboard: Clipboard,
    private cdr: ChangeDetectorRef,
    private alertService:AlertService,
    private nodeProcessor:NodeProcessor,
    private gradleProcessor: GradleProcessor
  ) {
  }

  processPackageJson(): void {
    this.parseSucceeded = false;
    this.packageJsonParsed = false;
    this.gradleFileParsed = false;
    this.buildFileReceived = true;

    try{
      let response = this.nodeProcessor.processPackageJson(this.packageJsonInput.value as string);
      this.packageJsonInput.setValue('');

      let dependenciesFetched = false;
      let devDependenciesFetched = false;
  
      response.dependencyList$.subscribe(deps => {
        this.dependenciesDataSource.next(deps);
        dependenciesFetched = true;
        this.packageJsonParsed = dependenciesFetched && devDependenciesFetched;
        this.validateNodeResultAndUpdateView();
      });
      response.devDependencyList$.subscribe(deps => {
        this.devDependenciesDataSource.next(deps);
        devDependenciesFetched = true;
        this.packageJsonParsed = dependenciesFetched && devDependenciesFetched;
        this.validateNodeResultAndUpdateView();
      });
    } catch(err:any){
      this.packageJsonParsed = true;
      this.alertService.show(err.message,AlertCategory.error);
    }

  }

  copyPackageJson(): void {
    this.clipboard.copy(this.nodeProcessor.getUpdatedPackageJson(
      this.dependenciesDataSource.value,
      this.devDependenciesDataSource.value
    ));
    this.alertService.show('Updated package Json copied to clipboard',AlertCategory.success,2000);
  }

  processBuildGradle() {
    this.parseSucceeded = false;
    this.packageJsonParsed = false;
    this.gradleFileParsed = false;
    this.buildFileReceived = true;

    let dependenciesFetched = false;
    let pluginsFetched = false;

    let response = this.gradleProcessor.processBuildGradle(this.gradleFileInput.value as string);
    this.gradleFileInput.setValue('');

    response.dependencyList$.subscribe(deps => {
      this.dependenciesDataSource.next(deps);
      dependenciesFetched = true;
      this.gradleFileParsed = dependenciesFetched && pluginsFetched;
      this.validateGradleResultAndUpdateView();
    });
    response.pluginDependencyList$.subscribe(deps => {
      this.pluginDependenciesDataSource.next(deps);
      pluginsFetched = true;
      this.gradleFileParsed = dependenciesFetched && pluginsFetched;
      this.validateGradleResultAndUpdateView();
    });
  }

  copyGradleFile() {
    let gradleFile = this.gradleProcessor.getUpdatedGradleFile(this.dependenciesDataSource.value, this.pluginDependenciesDataSource.value);
    this.clipboard.copy(gradleFile);
    this.alertService.show('Updated gradle build file copied to clipboard',AlertCategory.success,2000);
  }

  validateNodeResultAndUpdateView() {
    if (this.packageJsonParsed) {
      if (this.dependenciesDataSource.value.isEmpty()
        && this.devDependenciesDataSource.value.isEmpty()) {
          this.alertService.show('No dependencies found. Invalid build file / Unsupported format.',AlertCategory.error);        
      } else {
        this.parseSucceeded = true;
        this.cdr.markForCheck();
      }
    }
  }

  validateGradleResultAndUpdateView() {
    if (this.gradleFileParsed) {
      if (this.dependenciesDataSource.value.isEmpty()
        && this.pluginDependenciesDataSource.value.isEmpty()) {
          this.alertService.show('No dependencies found. Invalid build file / Unsupported format.',AlertCategory.error);        
      } else {
        this.parseSucceeded = true;
        this.cdr.markForCheck();
      }
    }
  }

}

export function getVersionWithRelativeDownloads(ver: Version, maxDownloads: number | undefined): Version {
  return maxDownloads
  ? ver.toBuilder().relativeDownloads(Math.round(ver.downloads / maxDownloads * 100)).build()
  : ver.toBuilder().relativeDownloads(0).build();
}