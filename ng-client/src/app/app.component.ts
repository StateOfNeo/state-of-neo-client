import { Component } from '@angular/core';
import { SignalRService } from "src/core/services/signal-r.service";
import { Http, RequestOptions, Headers } from "@angular/http";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  allNodes: any[];
  canRefreshNodeList: boolean;
  allMessages: any[];
  canSendMessage: boolean;

  constructor(
    private _blockService: SignalRService,
    private _nodeService: SignalRService,
    private _http: Http
  ) {
    this._blockService.init(`http://localhost:5000/hubs/block`);
    this._nodeService.init(`http://localhost:5000/hubs/node`);
    this.subscribeToEvents();
    this.allMessages = [];
  }

  updateBlocks() {
    if (this.canSendMessage) {
      this._http.post(`http://localhost:5000/api/block`, null, this.getJsonHeaders())
        .subscribe();
    }
  }

  updateNodes() {
    if (this.canRefreshNodeList) {
      this._http.post(`http://localhost:5000/api/node`, null, this.getJsonHeaders())
        .subscribe();
    }
  }

  protected getJsonHeaders(): RequestOptions {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return new RequestOptions({ headers: headers });
  }

  private subscribeToEvents(): void {
    // this._blockService.connectionEstablished.subscribe(() => {
    //   this.canSendMessage = true;
    // });

    // this._blockService.messageReceived.subscribe((message: string) => {
    //   this.allMessages.unshift(message);
    //   if (this.allMessages.length >= 20){
    //     this.allMessages.pop();
    //   }
    // });

    this._nodeService.connectionEstablished.subscribe(() => {
      this.canRefreshNodeList = true;
    });

    this._nodeService.messageReceived.subscribe((messages: any[])=>{
      console.log(messages);
      this.allMessages = messages;
    });
  }
}
