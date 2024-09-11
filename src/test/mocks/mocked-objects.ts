import { Clipboard } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from 'ace-common-components';
import { MatSnackBarMock } from './mat-snack-bar-mock';
import { ClipboardMock } from './clipboard-mock';
import { HttpClientMock } from './http-client-mock';

export class MockedObjects {
    public snackBar:MatSnackBar;
    public clipboard:Clipboard;
    public httpClient:HttpClient;
    public cdr:ChangeDetectorRef;
    public alertService:AlertService;

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
    }
}