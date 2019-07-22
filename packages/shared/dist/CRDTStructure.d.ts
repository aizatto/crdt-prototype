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
declare type FractionalIndex = {
    nonuniqueID: number;
    creatorID: string;
};
declare type FractionalIndices = FractionalIndex[];
export interface InsertToken {
    token: string;
    absPosition: number;
}
export interface CRDTToken {
    fiPosition: FractionalIndices;
    counter: number;
    token: string;
}
export interface CRDTLocalInterface {
    handleLocalInsert: (insertToken: InsertToken) => CRDTToken;
    handleLocalDelete: (absPosition: number, count: number) => CRDTToken[];
}
export declare class CRDTStructure implements CRDTLocalInterface {
    base: number;
    boundary: number;
    creatorID: string;
    counter: number;
    mult: number;
    tokens: CRDTToken[];
    text: string;
    constructor(tokens?: CRDTToken[], text?: string);
    handleLocalInsert(insertToken: InsertToken): CRDTToken;
    handleRemoteInsert(crdtToken: CRDTToken): void;
    findInsertIndex(crdtToken: CRDTToken): number;
    insertChar(insertToken: InsertToken, crdtToken: CRDTToken): void;
    insertText(insertToken: InsertToken, crdtToken: CRDTToken): void;
    handleLocalDelete(absPosition: number, count: number): CRDTToken[];
    handleRemoteDelete(crdtToken: CRDTToken, siteId: string): void;
    findIndexByPosition(crdtToken: CRDTToken): any;
    deleteText(absPosition: number, count: number): void;
    populateText(): void;
    generateCRDTToken(insertToken: InsertToken): CRDTToken;
    generateFractionalIndexPositionBetween(fis1: FractionalIndices, fis2: FractionalIndices, newPos?: FractionalIndices, level?: number): FractionalIndices;
    generateNonuniqueIdBetween(min: number, max: number, boundaryStrategy?: string): number;
}
export {};
//# sourceMappingURL=CRDTStructure.d.ts.map