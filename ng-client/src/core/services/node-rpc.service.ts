import { Injectable } from '@angular/core';
import { Http, RequestOptions, Headers } from "@angular/http";

@Injectable()
export class NodeRpcService {
    constructor(private http: Http) {

    }
    
    callRpcMethod(address: string, method: string, version: number, params: any[] = []) {
        let request = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": version
        };

        return this.http.post(address, JSON.stringify(request));
    }
}