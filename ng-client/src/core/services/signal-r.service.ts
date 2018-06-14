import { EventEmitter, Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';

@Injectable()
export class SignalRService {
    foodchanged = new EventEmitter();
    messageReceived = new EventEmitter<any>();
    newCpuValue = new EventEmitter<Number>();
    connectionEstablished = new EventEmitter<Boolean>();

    private connectionIsEstablished = false;
    private _hubConnection: HubConnection;

    public init(hubUrl: string): void {
        this.createConnection(hubUrl);
        this.registerOnServerEvents();
        this.startConnection();
    }

    private createConnection(connection: string) {
        this._hubConnection = new HubConnectionBuilder()
            .withUrl(connection)
            .build();
    }

    private startConnection(): void {
        this._hubConnection
            .start()
            .then(() => {
                this.connectionIsEstablished = true;
                console.log('Hub connection started');
                this.connectionEstablished.emit(true);
            })
            .catch(err => {
                console.log('Error while establishing connection, retrying...');
                setTimeout(this.startConnection(), 5000);
            });
    }

    private registerOnServerEvents(): void {
        // this._hubConnection.on('Receive', (message: any) => {
        //     this.messageReceived.emit(message);
        // });
    }
}
