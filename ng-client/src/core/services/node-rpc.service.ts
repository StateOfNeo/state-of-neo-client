import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from "@angular/http";

@Injectable()
export class NodeRpcService {
    constructor(private http: Http) {

    }
    
    callRpcMethod(method: string, address: string) {
        
    }
}