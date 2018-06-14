import { Component, OnInit } from '@angular/core';
import { SignalRService } from "src/core/services/signal-r.service";
import { NodesSignalRService } from "src/core/services/nodes-signal-r.service";
import { BlocksSignalRService } from "src/core/services/blocks-signal-r.service";
import { Http, RequestOptions, Headers } from "@angular/http";
import { NodeRpcService } from 'src/core/services/node-rpc.service';
import { DYNAMIC_TYPE } from '@angular/compiler/src/output/output_ast';

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
  savedNodes: any[] = [];

  constructor(
    private _blockService: BlocksSignalRService,
    private _nodeService: NodesSignalRService,
    private _http: Http,
    private nodeRpcService: NodeRpcService
  ) {
    this._blockService.init(`http://localhost:5000/hubs/block`);
    this._nodeService.init(`http://localhost:5000/hubs/node`);
    this.subscribeToEvents();
    this.allMessages = [];

    setInterval(() => this.secondsSinceLastBlock++, 1000);
    setInterval(() => this.sort(), 5000);
  }

  get savedRpc() {
    return this.savedNodes.filter(x => x.type == 'RPC');
  }

  get rpcEnabled() {
    return this.savedNodes.filter(x => x.rpcEnabled);
  }

  ngOnInit() {
    this._http.get('..\\assets\\json\\mainnet.nodes.json')
      .subscribe(x => {
        this.savedNodes = x.json().sites;
        this.getVersion(this.savedRpc);
        this.getPeers(this.savedRpc);
        this.getRawMemPool(this.savedRpc);
        this.getBlockCount(this.savedRpc);
      });

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

  private sort() {
    this.savedNodes = this.savedNodes.sort((x, y) => {
      if (!x.rpcEnabled && y.rpcEnabled) {
        return 1;
      } else if (x.rpcEnabled && !y.rpcEnabled) {
        return -1;
      }

      if (x.type != 'RPC' && y.type == 'RPC') {
        return 1;
      } else if (x.type == 'RPC' && y.type != ' RPC') {
        return -1;
      }

      if (!x.peers) {
        return 1;
      } else if (!y.peers) {
        return -1;
      } else {
        return y.peers - x.peers;
      }
    });
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
      console.log(nodes);
      console.log(this.savedNodes);
      let thereareNew = true;
      if (thereareNew) {        
        let markers = [];
        this.allNodes.forEach(x => {
          x.latency = 123;
          x.lat = this.getRandomCoordinate();
          x.long = this.getRandomCoordinate();
          x.peers = parseInt((Math.random() * 180).toFixed(0));
          x.type = 'RPC';
          let saved = this.savedNodes.find(z => z.address == x.ip);
          if (saved) {
            console.log('found' + saved.url);
          }
          x.url = saved ? saved.url : '';
          x.protocol = (saved && saved.protocol) ? saved.protocol : 'http';
          x.port = (saved && saved.port) ? saved.port : '10331';

          markers.push({
            latLng: [x.lat, x.long], name: x.ip
          });
        });

        this.allNodes = this.allNodes.sort((x, y) => y.peers - x.peers);

        this.getVersion(this.allNodes);

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

  getNodeDisplayText(node: any) {
    return node.url ? node.url : node.ip;
  }

  private getPeers(nodes: any[]) {
    nodes.forEach(x => {
      let url = `${x.protocol}://${x.url ? x.url : x.ip}:${x.port}`;
      let requestStart = Date.now();
      this.nodeRpcService.callRpcMethod(url, 'getpeers', 1)
        .subscribe(res => {
          x.lastResponseTime = Date.now();
          x.latency = x.lastResponseTime - requestStart;
          let json = res.json();
          if (json.result) {
            x.peers = parseInt(json.result.connected.length);
          } else {
            console.log(res);
          }
        });
    });
  }

  private getVersion(nodes: any[]) {
    console.log(nodes);
    nodes.filter(x => x.url).forEach(x => {
      let url = `${x.protocol}://${x.url ? x.url : x.ip}:${x.port}`;
      let requestStart = Date.now();
      this.nodeRpcService.callRpcMethod(url, 'getversion', 3)
        .subscribe(res => {
          x.lastResponseTime = Date.now();
          x.latency = x.lastResponseTime - requestStart;
          let response = res.json();
          x.version = response.result.useragent;
          x.rpcEnabled = true;
        }, err => {
          x.rpcEnabled = false;
          x.latency = 0;
        });
    });
  }

  private getBlockCount(nodes: any[]) {
    nodes.forEach(x => {
      let url = `${x.protocol}://${x.url ? x.url : x.ip}:${x.port}`;
      let requestStart = Date.now();
      this.nodeRpcService.callRpcMethod(url, 'getblockcount', 3)
        .subscribe(res => {
          x.lastResponseTime = Date.now();
          x.latency = x.lastResponseTime - requestStart;
          let response = res.json();
          x.blockCount = response.result;
          console.log(response);
        }, err => {
          x.rpcEnabled = false;
          x.latency = 0;
        });
    })
  }

  private getRawMemPool(nodes: any[]) {
    nodes.forEach(x => {
      let url = `${x.protocol}://${x.url ? x.url : x.ip}:${x.port}`;
      let requestStart = Date.now();
      this.nodeRpcService.callRpcMethod(url, 'getrawmempool', 1)
        .subscribe(res => {
          x.lastResponseTime = Date.now();
          x.latency = x.lastResponseTime - requestStart;
          let response = res.json();
          x.pendingTransactions = response.result.length;
          console.log(response);
        });
    });
  }

  private getRandomCoordinate() {
    return parseFloat((Math.random() * 90).toFixed(2));
  }
}
