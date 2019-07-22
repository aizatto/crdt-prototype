import { CRDTToken } from "./CRDTStructure";

export enum CRDTCommand {
  LOAD = 'load',
  REPLAY = 'replay',
  APPLY = 'apply',
}

export enum Operation {
  INSERT = 'insert',
  DELETE = 'delete'
}

interface CRDTLoadRequest {
  command: CRDTCommand.LOAD
  value: {
    id: string,
  },
};

interface CRDTLoadResponse {
  command: CRDTCommand.LOAD
  value: {
    tokens: CRDTToken[],
    text: string,
  },
};

interface CRDTReplayRequest {
  command: CRDTCommand.REPLAY,
  value: {
    offset: number,
  },
}

interface CRDTReplayResponse {
  command: CRDTCommand.REPLAY,
  value: {
    operation: Operation,
    crdtToken: CRDTToken,
  }[],
}

interface CRDTApplyRequest {
  command: CRDTCommand.APPLY,
  value: {
    operation: Operation,
    crdtToken: CRDTToken,
  }
}

interface CRDTApplyResponse extends CRDTApplyRequest { }

export type CRDTWebSocketRequest = CRDTLoadRequest | CRDTReplayRequest | CRDTApplyRequest;
export type CRDTWebSocketResponse = CRDTLoadResponse | CRDTReplayResponse | CRDTApplyResponse;