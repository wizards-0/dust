import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from 'ace-common-components';
import { MatSnackBarMock } from './mat-snack-bar-mock';
import { ClipboardMock } from './clipboard-mock';
import { HttpClientMock } from './http-client-mock';
import { NodeProcessor } from '../../app/dependency-updater/processors/node-processor';
import { GradleProcessor } from '../../app/dependency-updater/processors/gradle-processor';
import { ApiService } from '../../app/api-service/api.service';
import { SettingsService } from '../../app/settings/settings.service';
import { DomSanitizerMock } from './dom-sanitizier-mock';

export class MockedObjects {

    public snackBar:MatSnackBar;
    public clipboard:Clipboard;
    public httpClient:HttpClient;
    public cdr:ChangeDetectorRef;
    public alertService:AlertService;
    public apiService:ApiService;
    public nodeProcessor:NodeProcessor;
    public gradleProcessor:GradleProcessor;
    public settingsService:SettingsService;
    public domSanitizer:DomSanitizerMock;

    constructor(){
        this.cdr = {
            markForCheck: () => {},
            detach: () => {},
            detectChanges: () => {},
            checkNoChanges: () => {},
            reattach: () => {}
        };
        this.snackBar = new MatSnackBarMock() as any;
        this.alertService = new AlertService(this.snackBar);
        this.clipboard = new ClipboardMock() as any;
        this.httpClient = new HttpClientMock() as any;
        this.settingsService = new SettingsService();
        this.apiService = new ApiService(this.httpClient,this.settingsService);
        this.nodeProcessor = new NodeProcessor(this.apiService,this.settingsService);
        this.gradleProcessor = new GradleProcessor(this.apiService,this.settingsService);
        this.domSanitizer = new DomSanitizerMock();
    }

}