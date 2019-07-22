import { Data } from "ws";
import * as uuidv4 from 'uuid/v4';
import { CRDTCommand, CRDTWebSocketRequest, CRDTWebSocketResponse } from 'shared/dist/enums';

const BUFFER_TIMEOUT = 1000;

// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export interface WebSocketOnMessage {
  data: Data
  type: string
  target: WebSocket
}

export interface CRDTWebSocketInterface {
  onmessage: (event: MessageEvent) => void;
}

/**
 * https://app.logbook.my/entries/8f0fd157-e187-4406-8e68-88ef20bd9a23/
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/onmessage
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
 * https://stackoverflow.com/questions/22431751/websocket-how-to-automatically-reconnect-after-it-dies/23176223
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/ws/index.d.ts
 * 
 * TODO:
 * - Handle reconnects
 */
export class CRDTWebSocket {
  private id: string;
  public bufferMessages = true;
  private webSocket: WebSocket;
  private sendBuffer: string[] = [];
  private messageBuffer: MessageEvent[] = [];
  private controller: CRDTWebSocketInterface;

  constructor(controller: CRDTWebSocketInterface) {
    this.id = uuidv4();
    this.controller = controller;
    this.webSocket = this.instatiateFirstWebSocket();
  }

  private instatiateFirstWebSocket(): WebSocket {
    const ws = this.instantiateWebSocket();
    ws.onopen = () => {
      this.send({
        command: CRDTCommand.LOAD,
        value: {
          id: this.id,
        }
      });
    }
    return ws;
  }

  private instantiateReconnectingWebSocket(delayInMS = 1000): WebSocket {
    const ws = this.instantiateWebSocket();
    ws.onopen = () => {
      this.bufferMessages = false;
      this.flushMessageBuffer();
      this.flushSendBuffer();
    }
    return ws;
  }

  private instantiateWebSocket(delayInMS = 1000): WebSocket {
    const url = 'ws://localhost:8080';
    const ws = new WebSocket(url);
    ws.onmessage = (message: MessageEvent) => {
      if (this.bufferMessages) {
        this.controller.onmessage(message);
      } else {
        this.messageBuffer.push(message);
      }
    };
    ws.onclose = (error) => {
      this.bufferMessages = true;
      console.error(error);
      console.log(`reconnecting WebSocket`);
      const maxDelay = process.env.NODE_ENV === 'production'
        ? Math.min(delayInMS, 16000)
        : 1000;
      setTimeout(() => {
        this.webSocket = this.instantiateReconnectingWebSocket(maxDelay ** 2);
      }, maxDelay)
    };
    ws.onerror = (error) => {
      console.error(error);
    };
    return ws;
  }

  public flushMessageBuffer(): void {
    let message;
    while (message = this.messageBuffer.shift()) {
      this.controller.onmessage(message);
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
  send(message: CRDTWebSocketRequest): void {
    const json = JSON.stringify(message);
    if (this.webSocket.readyState !== WebSocketReadyState.OPEN) {
      this.sendBuffer.push(json);
      return;
    }
    this.webSocket.send(json);
  }

  flushSendBuffer(): void {
    setTimeout(() => {
      // I wonder if there is a possibility of reaching maximum stack
      if (this.webSocket.readyState !== WebSocketReadyState.OPEN) {
        this.flushSendBuffer();
        return;
      }

      let string: string | undefined = '';
      try {
        // eslint-disable-next-line no-cond-assign 
        while (string = this.sendBuffer.shift()) {
          this.webSocket.send(string);
        };
      } catch (error) {
        // TODO: how do we properly handle errors
      }
    }, BUFFER_TIMEOUT);
  }

  close(): void {
    this.webSocket.close();
  }
}