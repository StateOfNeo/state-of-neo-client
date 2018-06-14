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
    setInterval(() => this.updateNodesData(), 5000);
  }

  get savedRpc() {
    return this.savedNodes.filter(x => x.type == 'RPC');
  }

  get rpcEnabled() {
    return this.savedNodes.filter(x => x.type == 'RPC' && x.rpcEnabled);
  }

  ngOnInit() {
    this._http.get('..\\assets\\json\\mainnet.nodes.json')
      .subscribe(x => {
        this.savedNodes = x.json().sites;
        this.getVersion(this.savedRpc);
        // this.getPeers(this.savedRpc);
        this.getRawMemPool(this.savedRpc);
        this.getBlockCount(this.savedRpc);
        this.getConnectionsCount(this.savedRpc);
      });

    this._http.get(`http://localhost:5000/api/block/getheight`)
      .subscribe(x => this.updateBestBlock(parseInt(x.json())));

      // window height - header - body padding top and bottom
    let height = $(window).height() - 50 - 20 - 20;
    $('#nodes-panel').css('height', height + 'px');
    $('#main-panel').css('height', height + 'px');
  }

  updateNodesData() {
    this.getVersion(this.rpcEnabled);
    // this.getPeers(this.rpcEnabled);
    this.getRawMemPool(this.rpcEnabled);
    this.getBlockCount(this.rpcEnabled);
    this.getConnectionsCount(this.rpcEnabled);
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

  nodeIsBehind(node: any) {
    return node.blockCount < this.latestBlock;
  }

  getClassForNodeBlocks(node: any) {
    let difference = this.latestBlock - node.blockCount;
    if (difference <= 500) {
      return '';
    }

    if (difference > 500 && difference < 10000) {
      return 'text-warning';
    }

    return 'text-danger';
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
      } else if (x.type == 'RPC' && y.type != 'RPC') {
        return -1;
      }

      if (!x.blockCount && y.blockCount) {
        return 1;
      } else if (x.blockCount && !y.blockCount) {
        return -1;
      } else if (x.blockCount != y.blockCount) {
        return y.blockCount - x.blockCount;
      }

      if (!x.connected && y.connected) {
        return 1;
      } else if (!y.connected && x.connected) {
        return -1;
      } else {
        return y.connected - x.connected;
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

        let marks = [];
        this.savedNodes.forEach(x => marks.push({
          name: this.getNodeDisplayText(x), 
          latLng: [this.getRandomCoordinate(), this.getRandomCoordinate()]
        }));

        $('#world-map').html('');
        $('#world-map').css('height', '442px');
        $('#world-map').vectorMap({
          map: 'world_mill_en',
          backgroundColor: 'transparent',
          markers: marks,

          hoverOpacity: 0.7,
          hoverColor: false,
          onMarkerSelected: (e: any, code: string, isSelected: boolean, selectedMarkers: any[]) => {
            console.log(e);
          },
          onMarkerClick: (e: any, code: string) => {

          },
          onMarkerLabelShow: (e: any, label: any, code: string) => {
            label.html('<h1>TEST TEST TEST</h1>');
          },
          markersSelectableOne: true
        });

        let map = $('#world-map').vectorMap('get', 'mapObject');

        $(window).resize(function () {
          $('#world-map').css('height', '442px');
        });
      }
    });
  }

  hoverOffNode(node: any) {
    let map = $('#world-map').vectorMap('get', 'mapObject');
    map.clearSelectedMarkers();
  }

  hoverNode(node: any) {
    let marker = this.getMarkerByName(this.getNodeDisplayText(node));
   // marker.element.isSelected = true;
    marker.element.isHovered = true;

    let index = marker.element.properties['data-index'];

    let map = $('#world-map').vectorMap('get', 'mapObject');
    map.setSelectedMarkers(index);

    console.log(marker);
  }

  getMarkerByName(name: string): any {
    let map = $('#world-map').vectorMap('get', 'mapObject');
    
    for(var propName in map.markers) {
      if (map.markers[propName].config.name == name) {
        return map.markers[propName];
      }
    }    
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
            this.sort();
          } else {
            console.log(res);
          }
        });
    });
  }

  private getConnectionsCount(nodes: any[]) {
    nodes.forEach(x => {
      let url = `${x.protocol}://${x.url ? x.url : x.ip}:${x.port}`;
      let requestStart = Date.now();
      this.nodeRpcService.callRpcMethod(url, 'getconnectioncount', 1)
        .subscribe(res => {
          x.lastResponseTime = Date.now();
          x.latency = x.lastResponseTime - requestStart;
          let json = res.json();
          if (json.result) {
            x.connected = parseInt(json.result);
            this.sort();
          } else {
            console.log(res);
          }
        });
    });
  }

  private getVersion(nodes: any[]) {
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
          this.sort();
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
          this.sort();
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
          this.sort();
        });
    });
  }

  private getRandomCoordinate() {
    return parseFloat((Math.random() * 90).toFixed(2));
  }
}
