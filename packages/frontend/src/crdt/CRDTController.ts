import {CRDTStructure, CRDTLocalInterface, InsertToken, CRDTToken} from 'shared/dist/CRDTStructure';
import { CRDTWebSocket, CRDTWebSocketInterface, WebSocketOnMessage } from './CRDTWebSocket';
import { Operation } from "shared/dist/enums";
import { CRDTCommand, CRDTWebSocketResponse } from 'shared/dist/enums';

export enum DocumentState {
  NOT_READY,
  READY,
}

/**
 * TODO:
 * - Handle delete buffer
 */
export class CRDTController implements CRDTLocalInterface, CRDTWebSocketInterface {
  public crdtStructure: CRDTStructure;
  private webSocket: CRDTWebSocket;
  private setText: (newString: string) => void;
  private setDocumentState: (newDocumentState: DocumentState) => void;

  constructor(
    setText: (newString: string) => void,
    setDocumentState: (newDocumentState: DocumentState) => void,
  ) {
    this.crdtStructure = new CRDTStructure();
    this.webSocket = new CRDTWebSocket(this);
    this.setText = setText;
    this.setDocumentState = setDocumentState;
  }

  handleLocalInsert(insertToken: InsertToken): CRDTToken {
    const crdtToken = this.crdtStructure.handleLocalInsert(insertToken);
    this.send(
      CRDTCommand.APPLY,
      {
        operation: Operation.INSERT,
        crdtToken,
      },
    );
    return crdtToken;
  }

  handleLocalDelete(
    absPosition: number,
    count: number,
  ): CRDTToken[] {
    const crdtTokens = this.crdtStructure.handleLocalDelete(absPosition, count);
    crdtTokens.forEach(crdtToken => 
      this.send(
        CRDTCommand.APPLY,
        {
          operation: Operation.DELETE,
          crdtToken,
        },
      )
    );
    return crdtTokens;
  }

  send(command: CRDTCommand, value: any) {
    this.webSocket.send({
      // entryID ?
      command,
      value,
    });
  }

  onmessage(event: MessageEvent): void {
    let message: CRDTWebSocketResponse;
    try {
      message = JSON.parse(event.data.toString());
    } catch (error) {
      console.error(`websocket: ${event.data.toString()}`);
      console.error(error);
      return;
    }

    let value;

    switch (message.command) {
      case CRDTCommand.LOAD:
        value = message.value;
        this.crdtStructure = new CRDTStructure(
          value.tokens,
          value.text,
        );
        // Concerned there can be a possible race condition here
        this.webSocket.bufferMessages = false;
        this.setText(value.text);
        this.setDocumentState(DocumentState.READY);
        return;

      case CRDTCommand.REPLAY:
        value = message.value;
        value.forEach((operation: any) => {
          this.applyOperation(operation);
        })
        this.setText(this.crdtStructure.text);
        return;

      case CRDTCommand.APPLY:
        value = message.value;
        this.applyOperation(value);
        this.setText(this.crdtStructure.text);
        return;
    }
  }

  applyOperation(value: any) {
    switch (value.operation) {
      case Operation.INSERT:
        this.crdtStructure.handleRemoteInsert(value.crdtToken);
        break;

      case Operation.DELETE:
        this.crdtStructure.handleRemoteDelete(value.crdtToken, '');
        break;
    }
  }
}