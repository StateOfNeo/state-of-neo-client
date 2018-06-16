import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from "@angular/http";

import { AppComponent } from './app.component';
import { IconComponent } from './icon.component';
import { SignalRService } from "src/core/services/signal-r.service";
import { NodesSignalRService } from "src/core/services/nodes-signal-r.service";
import { BlocksSignalRService } from "src/core/services/blocks-signal-r.service";
import { NodeRpcService } from "src/core/services/node-rpc.service";
import { TransCountSignalRService } from "src/core/services/trans-count-signal-r.service";
import { TransAvgCountSignalRService } from "src/core/services/trans-avg-count-signal-r.service";

@NgModule({
  declarations: [
    AppComponent,
    IconComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule
  ],
  providers: [
    SignalRService, NodesSignalRService, BlocksSignalRService, TransCountSignalRService, TransAvgCountSignalRService,
    NodeRpcService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
