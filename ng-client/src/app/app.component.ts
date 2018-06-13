import { Component, OnInit } from '@angular/core';
import { SignalRService } from "src/core/services/signal-r.service";
import { NodesSignalRService } from "src/core/services/nodes-signal-r.service";
import { BlocksSignalRService } from "src/core/services/blocks-signal-r.service";
import { Http, RequestOptions, Headers } from "@angular/http";

declare var $;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  allNodes: any[];
  canRefreshNodeList: boolean;
  allMessages: any[];
  canSendMessage: boolean;
  latestBlock: number;
  secondsSinceLastBlock: number = 0;
  savedNodes: any[];
  foundNodeIps: any[] = [];

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

  ngOnInit() {
    this._http.get('..\\assets\\json\\testnet.nodes.json')
      .subscribe(x => this.savedNodes = x.json().sites);

    this._http.get(`http://localhost:5000/api/block/getheight`)
      .subscribe(x => this.updateBestBlock(parseInt(x.json())));
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

  private updateBestBlock(height: number): void {
    this.secondsSinceLastBlock = 0;
    this.latestBlock = height;
    $('#last-block-icon').addClass('fa-spin');
    $('#last-block-icon').css('animation-play-state', 'running');
    setTimeout(() => $('#last-block-icon').css('animation-play-state', 'paused'), 2080);
  }

  private subscribeToEvents(): void {
    this._blockService.connectionEstablished.subscribe(() => {
      this.canSendMessage = true;
    });

    this._blockService.messageReceived.subscribe((message: number) => {
      this.updateBestBlock(message);
    });

    this._nodeService.connectionEstablished.subscribe(() => {
      this.canRefreshNodeList = true;
      this.updateNodes();
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
          // x.ip = x.ip.substr(x.ip.lastIndexOf(':') + 1);
          x.type = 'RPC';

          let saved = this.savedNodes.find(z => z.address == x.ip);
          x.url = saved ? saved.url : '';
          if (this.foundNodeIps.indexOf(x.ip) == -1) {
            this.foundNodeIps.push(x.ip);
            console.log(x.ip);
          }

          markers.push({
            latLng: [x.lat, x.long], name: x.ip
          });
        });

        this.allNodes = this.allNodes.sort((x, y) => y.peers - x.peers);

       // console.log(nodes);

        $('#world-map').html('');
        $('#world-map').css('height', '342px');
        $('#world-map').vectorMap({
          map: 'world_mill_en',
          backgroundColor: 'transparent',
          markers: markers,

          hoverOpacity: 0.7,
          hoverColor: false
        });

        $(window).resize(function () {
          $('#world-map').css('height', '342px');
        });
      }
    });
  }

  private getPeers() {
    this.allNodes.forEach(x => {
      
    });
  }

  private getRandomCoordinate() {
    return parseFloat((Math.random() * 90).toFixed(2)) * ((Math.random() * 10) % 2 == 0 ? 1 : -1);
  }
}
