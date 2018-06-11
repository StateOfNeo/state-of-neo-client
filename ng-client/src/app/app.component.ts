import { Component } from '@angular/core';
import { SignalRService } from "src/core/services/signal-r.service";
import { Http, RequestOptions, Headers } from "@angular/http";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  allMessages: string[];
  canSendMessage: boolean;

  constructor(
    private _signalRService: SignalRService,
    private _http: Http
  ) {
    this.subscribeToEvents();
    this.allMessages = [];
  }

  sendMessage() {
    if (this.canSendMessage) {
      this._http.post(`http://localhost:5000/api/block`, null, this.getJsonHeaders())
        .subscribe();
    }
  }

  protected getJsonHeaders(): RequestOptions {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    return new RequestOptions({ headers: headers });
  }

  private subscribeToEvents(): void {
    this._signalRService.connectionEstablished.subscribe(() => {
      this.canSendMessage = true;
    });

    this._signalRService.messageReceived.subscribe((message: string) => {
      this.allMessages.unshift(message);
      if (this.allMessages.length >= 20){
        this.allMessages.pop();
      }
    });
  }
}
