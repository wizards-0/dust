import { of, Observable } from "rxjs";

export class HttpClientMock{
    get(url: string): Observable<any> {
        //TODO: implement mock results
        return of(url);
    }
}