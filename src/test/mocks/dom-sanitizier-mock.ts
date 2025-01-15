import { SecurityContext } from "@angular/core";
import { DomSanitizer, SafeHtml, SafeScript, SafeStyle, SafeUrl, SafeValue } from "@angular/platform-browser";

export class DomSanitizerMock extends DomSanitizer{
    override sanitize(context: SecurityContext, value: SafeValue | string | null): string | null {
        return value ? String(value.valueOf()) : null;
    }
    override bypassSecurityTrustHtml(value: string): SafeHtml {
        return value;
    }
    override bypassSecurityTrustStyle(value: string): SafeStyle {
        return value;
    }
    override bypassSecurityTrustScript(value: string): SafeScript {
        return value;
    }
    override bypassSecurityTrustUrl(value: string): SafeUrl {
        return value;
    }
    public bypassSecurityTrustResourceUrl(value: string){
        return value;
    }
}