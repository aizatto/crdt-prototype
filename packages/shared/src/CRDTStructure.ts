/**
 * https://app.logbook.my/entries/f4e77c84-cfcc-49f9-a4b0-88c468ceba45/
 * https://github.com/conclave-team/conclave/blob/master/lib/crdt.js
 * https://github.com/conclave-team/conclave/blob/master/lib/crdtLinear.js
 * https://conclave-team.github.io/conclave-site/
 * 
 * there are two types of positions:
 * 1. Absolute Position
 * 2. Fractional Index
 */
type FractionalIndex = {
  nonuniqueID: number
  creatorID: string // siteId: is this really creatorID or browser-tab-sessionID?
};

type FractionalIndices = FractionalIndex[];

export interface InsertToken {
  token: string
  absPosition: number
}

export interface CRDTToken {
  fiPosition: FractionalIndices
  counter: number
  token: string
}

function compareFractionalIndex(
  fi1: FractionalIndex,
  fi2: FractionalIndex,
): number {
  if (fi1.nonuniqueID < fi2.nonuniqueID) {
    return -1;
  } else if (fi1.nonuniqueID > fi2.nonuniqueID) {
    return 1;
  } else {
    if (fi1.creatorID < fi2.creatorID) {
      return -1;
    } else if (fi1.creatorID > fi2.creatorID) {
      return 1;
    } else {
      return 0;
    }
  }
}

function compareCRDTToken(
  token1: CRDTToken,
  token2: CRDTToken,
): number {
  let comp, id1, id2;
  const pos1 = token1.fiPosition;
  const pos2 = token2.fiPosition;

  for (let i = 0; i < Math.min(pos1.length, pos2.length); i++) {
    id1 = pos1[i];
    id2 = pos2[i];
    comp = compareFractionalIndex(id1, id2);

    if (comp !== 0) {
      return comp;
    }
  }

  if (pos1.length < pos2.length) {
    return -1;
  } else if (pos1.length > pos2.length) {
    return 1;
  } else {
    return 0;
  }
}

export interface CRDTLocalInterface {
  handleLocalInsert: (insertToken: InsertToken) => CRDTToken
  handleLocalDelete: (absPosition: number, count: number) => CRDTToken[]
}

export class CRDTStructure implements CRDTLocalInterface {
  base: number;
  boundary: number;
  creatorID: string;
  counter: number;
  mult: number;
  tokens: CRDTToken[];
  text: string;

  constructor(
    tokens: CRDTToken[] = [],
    text = '',
  ) {
    this.tokens = tokens;
    this.text = text;
    this.creatorID = 'aizat';
    this.base = 32;
    this.mult = 2;
    this.counter = 0;
    this.boundary = 10;
  }

  handleLocalInsert(insertToken: InsertToken): CRDTToken {
    this.counter++;
    const crdtToken = this.generateCRDTToken(insertToken);
    this.insertChar(insertToken, crdtToken);
    this.insertText(insertToken, crdtToken);
    return crdtToken;
  }

  handleRemoteInsert(crdtToken: CRDTToken): void {
    const index = this.findInsertIndex(crdtToken);
    const insertToken = {absPosition: index, token: crdtToken.token};

    this.insertChar(insertToken, crdtToken);
    this.insertText(insertToken, crdtToken);

    // this.controller.insertIntoEditor(char.value, index, char.siteId);
  }

  findInsertIndex(crdtToken: CRDTToken): number {
    let left = 0;
    let right = this.tokens.length - 1;
    let mid, compareNum;

    if (this.tokens.length === 0 || compareCRDTToken(crdtToken, this.tokens[left]) < 0) {
      return left;
    } else if (compareCRDTToken(crdtToken, this.tokens[right]) > 0) {
      return this.tokens.length;
    }

    while (left + 1 < right) {
      mid = Math.floor(left + (right - left) / 2);
      compareNum = compareCRDTToken(crdtToken, this.tokens[mid]);

      if (compareNum === 0) {
        return mid;
      } else if (compareNum > 0) {
        left = mid;
      } else {
        right = mid;
      }
    }

    return compareCRDTToken(crdtToken, this.tokens[left]) === 0 ? left : right;
  }

  insertChar(insertToken: InsertToken, crdtToken: CRDTToken): void {
    this.tokens.splice(insertToken.absPosition, 0, crdtToken);
  }

  insertText(insertToken: InsertToken, crdtToken: CRDTToken): void {
    this.text = this.text.slice(0, insertToken.absPosition) + insertToken.token + this.text.slice(insertToken.absPosition);
  }

  handleLocalDelete(absPosition: number, count: number): CRDTToken[] {
    this.counter++;

    const crdtTokens = this.tokens.splice(absPosition, count);
    this.deleteText(absPosition, count);

    // this.controller.broadcastDeletion(crdtToken);
    return crdtTokens;
  }

  handleRemoteDelete(crdtToken: CRDTToken, siteId: string): void {
    const index = this.findIndexByPosition(crdtToken);
    const count = crdtToken.token.length;
    this.tokens.splice(index, count);

    // this.controller.deleteFromEditor(crdtToken.value, index, siteId);
    this.deleteText(index, count);
  }

  findIndexByPosition(crdtToken: CRDTToken) {
    let left = 0;
    let right = this.tokens.length - 1;
    let mid, compareNum;

    if (this.tokens.length === 0) {
      throw new Error("Character does not exist in CRDT.");
    }

    while (left + 1 < right) {
      mid = Math.floor(left + (right - left) / 2);
      compareNum = compareCRDTToken(crdtToken, this.tokens[mid]);

      if (compareNum === 0) {
        return mid;
      } else if (compareNum > 0) {
        left = mid;
      } else {
        right = mid;
      }
    }

    if (compareCRDTToken(crdtToken, this.tokens[left]) === 0) {
      return left;
    } else if (compareCRDTToken(crdtToken, this.tokens[right]) === 0) {
      return right;
    } else {
      throw new Error("Character does not exist in CRDT.");
    }
  }

  deleteText(absPosition: number, count: number) {
    this.text = this.text.slice(0, absPosition) + this.text.slice(absPosition + count);
  }

  populateText() {
    this.text = this.tokens.map(char => char.token).join('');
  }

  generateCRDTToken(insertToken: InsertToken): CRDTToken {
    const position = insertToken.absPosition;
    const posBefore = (this.tokens[position - 1] && this.tokens[position - 1].fiPosition) || [];
    const posAfter = (this.tokens[position] && this.tokens[position].fiPosition) || [];
    const newPosition = this.generateFractionalIndexPositionBetween(posBefore, posAfter);

    return {
      token: insertToken.token,
      fiPosition: newPosition,
      counter: this.counter,
    }
  }

  generateFractionalIndexPositionBetween(
    fis1: FractionalIndices,
    fis2: FractionalIndices,
    newPos: FractionalIndices = [],
    level = 0,
  ): FractionalIndices {
    const base = Math.pow(this.mult, level) * this.base;
    const boundaryStrategy = Math.round(Math.random()) === 0 ? '+' : '-';

    const fi1: FractionalIndex = fis1 && fis1.length ? fis1[0] : {nonuniqueID: 0, creatorID: this.creatorID}; // siteId
    const fi2: FractionalIndex = fis2 && fis2.length ? fis2[0] : {nonuniqueID: base, creatorID: this.creatorID}; // siteId

    // let id1 = fi1[0] || new Identifier(0, this.siteId);
    // let id2 = fi2[0] || new Identifier(base, this.siteId);

    if (fi2.nonuniqueID - fi1.nonuniqueID > 1) {
      const nonuniqueID = this.generateNonuniqueIdBetween(
        fi1.nonuniqueID,
        fi2.nonuniqueID,
        boundaryStrategy,
      );
      newPos.push({
        nonuniqueID,
        creatorID: this.creatorID,
      });
      return newPos;
    } else if (fi2.nonuniqueID - fi1.nonuniqueID === 1) {
      newPos.push(fi1);
      return this.generateFractionalIndexPositionBetween(fis1.slice(1), [], newPos, level+1);
    } else if (fi1.nonuniqueID === fi2.nonuniqueID) {
      if (fi1.creatorID < fi2.creatorID) {
        newPos.push(fi1);
        return this.generateFractionalIndexPositionBetween(fis1.slice(1), [], newPos, level+1);
      } else if (fi1.creatorID === fi2.creatorID) {
        newPos.push(fi1);
        return this.generateFractionalIndexPositionBetween(fis1.slice(1), fis2.slice(1), newPos, level+1);
      } else {
        throw new Error("Fix Position Sorting");
      }
    }
    throw new Error("Fix Position Sorting");
  }

  generateNonuniqueIdBetween(
    min: number,
    max: number,
    boundaryStrategy = '',
  ): number {
    if ((max - min) < this.boundary) {
      min = min + 1;
    } else {
      if (boundaryStrategy === '-') {
        min = max - this.boundary;
      } else {
        min = min + 1;
        max = min + this.boundary;
      }
    }
    return Math.floor(Math.random() * (max - min)) + min;
  }
}