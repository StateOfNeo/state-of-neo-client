import { Component } from '@angular/core';
import { SignalRService } from "src/core/services/signal-r.service";
import { NodesSignalRService } from "src/core/services/nodes-signal-r.service";
import { BlocksSignalRService } from "src/core/services/blocks-signal-r.service";
import { Http, RequestOptions, Headers } from "@angular/http";

declare var jQuery;

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
  latestBlock: number;
  secondsSinceLastBlock: number = 0;

  constructor(
    private _blockService: BlocksSignalRService,
    private _nodeService: NodesSignalRService,
    private _http: Http
  ) {
    this._blockService.init(`http://localhost:5000/hubs/block`);
    this._nodeService.init(`http://localhost:5000/hubs/node`);
    this.subscribeToEvents();
    this.allMessages = [];

    setInterval(() => this.secondsSinceLastBlock++, 1000);
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
    this._blockService.connectionEstablished.subscribe(() => {
      this.canSendMessage = true;
    });

    this._blockService.messageReceived.subscribe((message: number) => {
      console.log(message);
      this.secondsSinceLastBlock = 0;
      this.latestBlock = message;
    });

    this._nodeService.connectionEstablished.subscribe(() => {
      this.canRefreshNodeList = true;
    });

    this._nodeService.messageReceived.subscribe((nodes: any[])=>{
      this.allNodes = nodes;

      let thereareNew = true;
      if (thereareNew) {        
        let markers = [];
        this.allNodes.forEach(x => {
          x.latency = 123;
          x.lat = this.getRandomCoordinate();
          x.long = this.getRandomCoordinate();
          x.peers = parseInt((Math.random() * 180).toFixed(0));

          markers.push({
            latLng: [x.lat, x.long], name: x.ip
          });
        });

        this.allNodes = this.allNodes.sort((x, y) => y.peers - x.peers);

        console.log(nodes);

        jQuery('#world-map').html('');
        jQuery('#world-map').css('height', '342px');
        jQuery('#world-map').vectorMap({
          map: 'world_mill_en',
          backgroundColor: 'transparent',
          markers: markers,

          hoverOpacity: 0.7,
          hoverColor: false
        });

        jQuery(window).resize(function () {
          jQuery('#world-map').css('height', '342px');
        });
      }
    });
  }

  private getRandomCoordinate() {
    return parseFloat((Math.random() * 90).toFixed(2));
  }
}
