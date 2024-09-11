import { ComponentType } from '@angular/cdk/portal';
import { MatSnackBarRef, MatSnackBarConfig, TextOnlySnackBar } from '@angular/material/snack-bar';

export class MatSnackBarMock{
    open(message: string, action?: string, config?: MatSnackBarConfig): MatSnackBarRef<TextOnlySnackBar>{
        return undefined as any;
    }

    openFromComponent<T>(component: ComponentType<T>, config?: MatSnackBarConfig): MatSnackBarRef<T>{
        return undefined as any;
    }
}