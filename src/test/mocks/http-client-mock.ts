import { List, Map } from 'immutable';
import { of, Observable } from "rxjs";

export class HttpClientMock{

    private mockResponseMap:Map<string,any> = Map();
    setMockResponses(mockResponses:List<MockResponse>):void {
        let bodyString = (body:any) => body? JSON.stringify(body) : '';
        this.mockResponseMap = Map(mockResponses.map(resp => [resp.url+bodyString(resp.body),resp.response]));
    }

    get(url: string): Observable<any> {
        let response = this.mockResponseMap.get(url,url);
        return of(response);
    }
}

export class MockResponse {
    public readonly url:string;
    public readonly body:any;
    public readonly response:any
    constructor(url:string,body:any,response:any){
        this.url = url;
        this.body = body;
        this.response = response;
    }
}