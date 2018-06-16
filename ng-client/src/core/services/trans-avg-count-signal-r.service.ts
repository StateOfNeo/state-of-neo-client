import { EventEmitter, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { SignalRService } from './signal-r.service';

@Injectable()
export class TransAvgCountSignalRService extends SignalRService {
}