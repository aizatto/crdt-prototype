"use strict";
exports.__esModule = true;
function compareFractionalIndex(fi1, fi2) {
    if (fi1.nonuniqueID < fi2.nonuniqueID) {
        return -1;
    }
    else if (fi1.nonuniqueID > fi2.nonuniqueID) {
        return 1;
    }
    else {
        if (fi1.creatorID < fi2.creatorID) {
            return -1;
        }
        else if (fi1.creatorID > fi2.creatorID) {
            return 1;
        }
        else {
            return 0;
        }
    }
}
function compareCRDTToken(token1, token2) {
    var comp, id1, id2;
    var pos1 = token1.fiPosition;
    var pos2 = token2.fiPosition;
    for (var i = 0; i < Math.min(pos1.length, pos2.length); i++) {
        id1 = pos1[i];
        id2 = pos2[i];
        comp = compareFractionalIndex(id1, id2);
        if (comp !== 0) {
            return comp;
        }
    }
    if (pos1.length < pos2.length) {
        return -1;
    }
    else if (pos1.length > pos2.length) {
        return 1;
    }
    else {
        return 0;
    }
}
var CRDTStructure = /** @class */ (function () {
    function CRDTStructure(tokens, text) {
        if (tokens === void 0) { tokens = []; }
        if (text === void 0) { text = ''; }
        this.tokens = tokens;
        this.text = text;
        this.creatorID = 'aizat';
        this.base = 32;
        this.mult = 2;
        this.counter = 0;
        this.boundary = 10;
    }
    CRDTStructure.prototype.handleLocalInsert = function (insertToken) {
        this.counter++;
        var crdtToken = this.generateCRDTToken(insertToken);
        this.insertChar(insertToken, crdtToken);
        this.insertText(insertToken, crdtToken);
        return crdtToken;
    };
    CRDTStructure.prototype.handleRemoteInsert = function (crdtToken) {
        var index = this.findInsertIndex(crdtToken);
        var insertToken = { absPosition: index, token: crdtToken.token };
        this.insertChar(insertToken, crdtToken);
        this.insertText(insertToken, crdtToken);
        // this.controller.insertIntoEditor(char.value, index, char.siteId);
    };
    CRDTStructure.prototype.findInsertIndex = function (crdtToken) {
        var left = 0;
        var right = this.tokens.length - 1;
        var mid, compareNum;
        if (this.tokens.length === 0 || compareCRDTToken(crdtToken, this.tokens[left]) < 0) {
            return left;
        }
        else if (compareCRDTToken(crdtToken, this.tokens[right]) > 0) {
            return this.tokens.length;
        }
        while (left + 1 < right) {
            mid = Math.floor(left + (right - left) / 2);
            compareNum = compareCRDTToken(crdtToken, this.tokens[mid]);
            if (compareNum === 0) {
                return mid;
            }
            else if (compareNum > 0) {
                left = mid;
            }
            else {
                right = mid;
            }
        }
        return compareCRDTToken(crdtToken, this.tokens[left]) === 0 ? left : right;
    };
    CRDTStructure.prototype.insertChar = function (insertToken, crdtToken) {
        this.tokens.splice(insertToken.absPosition, 0, crdtToken);
    };
    CRDTStructure.prototype.insertText = function (insertToken, crdtToken) {
        this.text = this.text.slice(0, insertToken.absPosition) + insertToken.token + this.text.slice(insertToken.absPosition);
    };
    CRDTStructure.prototype.handleLocalDelete = function (absPosition, count) {
        this.counter++;
        var crdtTokens = this.tokens.splice(absPosition, count);
        this.deleteText(absPosition, count);
        // this.controller.broadcastDeletion(crdtToken);
        return crdtTokens;
    };
    CRDTStructure.prototype.handleRemoteDelete = function (crdtToken, siteId) {
        var index = this.findIndexByPosition(crdtToken);
        var count = crdtToken.token.length;
        this.tokens.splice(index, count);
        // this.controller.deleteFromEditor(crdtToken.value, index, siteId);
        this.deleteText(index, count);
    };
    CRDTStructure.prototype.findIndexByPosition = function (crdtToken) {
        var left = 0;
        var right = this.tokens.length - 1;
        var mid, compareNum;
        if (this.tokens.length === 0) {
            throw new Error("Character does not exist in CRDT.");
        }
        while (left + 1 < right) {
            mid = Math.floor(left + (right - left) / 2);
            compareNum = compareCRDTToken(crdtToken, this.tokens[mid]);
            if (compareNum === 0) {
                return mid;
            }
            else if (compareNum > 0) {
                left = mid;
            }
            else {
                right = mid;
            }
        }
        if (compareCRDTToken(crdtToken, this.tokens[left]) === 0) {
            return left;
        }
        else if (compareCRDTToken(crdtToken, this.tokens[right]) === 0) {
            return right;
        }
        else {
            throw new Error("Character does not exist in CRDT.");
        }
    };
    CRDTStructure.prototype.deleteText = function (absPosition, count) {
        this.text = this.text.slice(0, absPosition) + this.text.slice(absPosition + count);
    };
    CRDTStructure.prototype.populateText = function () {
        this.text = this.tokens.map(function (char) { return char.token; }).join('');
    };
    CRDTStructure.prototype.generateCRDTToken = function (insertToken) {
        var position = insertToken.absPosition;
        var posBefore = (this.tokens[position - 1] && this.tokens[position - 1].fiPosition) || [];
        var posAfter = (this.tokens[position] && this.tokens[position].fiPosition) || [];
        var newPosition = this.generateFractionalIndexPositionBetween(posBefore, posAfter);
        return {
            token: insertToken.token,
            fiPosition: newPosition,
            counter: this.counter
        };
    };
    CRDTStructure.prototype.generateFractionalIndexPositionBetween = function (fis1, fis2, newPos, level) {
        if (newPos === void 0) { newPos = []; }
        if (level === void 0) { level = 0; }
        var base = Math.pow(this.mult, level) * this.base;
        var boundaryStrategy = Math.round(Math.random()) === 0 ? '+' : '-';
        var fi1 = fis1 && fis1.length ? fis1[0] : { nonuniqueID: 0, creatorID: this.creatorID }; // siteId
        var fi2 = fis2 && fis2.length ? fis2[0] : { nonuniqueID: base, creatorID: this.creatorID }; // siteId
        // let id1 = fi1[0] || new Identifier(0, this.siteId);
        // let id2 = fi2[0] || new Identifier(base, this.siteId);
        if (fi2.nonuniqueID - fi1.nonuniqueID > 1) {
            var nonuniqueID = this.generateNonuniqueIdBetween(fi1.nonuniqueID, fi2.nonuniqueID, boundaryStrategy);
            newPos.push({
                nonuniqueID: nonuniqueID,
                creatorID: this.creatorID
            });
            return newPos;
        }
        else if (fi2.nonuniqueID - fi1.nonuniqueID === 1) {
            newPos.push(fi1);
            return this.generateFractionalIndexPositionBetween(fis1.slice(1), [], newPos, level + 1);
        }
        else if (fi1.nonuniqueID === fi2.nonuniqueID) {
            if (fi1.creatorID < fi2.creatorID) {
                newPos.push(fi1);
                return this.generateFractionalIndexPositionBetween(fis1.slice(1), [], newPos, level + 1);
            }
            else if (fi1.creatorID === fi2.creatorID) {
                newPos.push(fi1);
                return this.generateFractionalIndexPositionBetween(fis1.slice(1), fis2.slice(1), newPos, level + 1);
            }
            else {
                throw new Error("Fix Position Sorting");
            }
        }
        throw new Error("Fix Position Sorting");
    };
    CRDTStructure.prototype.generateNonuniqueIdBetween = function (min, max, boundaryStrategy) {
        if (boundaryStrategy === void 0) { boundaryStrategy = ''; }
        if ((max - min) < this.boundary) {
            min = min + 1;
        }
        else {
            if (boundaryStrategy === '-') {
                min = max - this.boundary;
            }
            else {
                min = min + 1;
                max = min + this.boundary;
            }
        }
        return Math.floor(Math.random() * (max - min)) + min;
    };
    return CRDTStructure;
}());
exports.CRDTStructure = CRDTStructure;
