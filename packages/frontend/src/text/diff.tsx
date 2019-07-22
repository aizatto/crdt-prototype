import { Operation } from "shared/dist/enums";

/**
 * https://github.com/kpdecker/jsdiff/blob/master/src/diff/base.js
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 * http://xmailserver.org/diff2.pdf
 */

interface Options {
  comparator?: (a: string, b: string) => boolean,
  ignoreCase?: boolean,
}

function clonePath(path: DiffPath): DiffPath {
  return {
    position: path.position,
    tokenOperations: path.tokenOperations.slice(0),
  };
}

interface Common {
  newPos: number
  oldPos: number
  count: number
}

export interface TokenOperation {
  count: number
  value?: string
  token?: string
  operation?: Operation
}

interface DiffPath {
  position: number,
  tokenOperations: TokenOperation[]
}

export class Diff {
  options: Options;
  useLongestToken = false;

  constructor(options: Options = {}) {
    this.options = options;
  }

  diff(oldString: string, newString: string): TokenOperation[] {
    // Allow subclasses to massage the input prior to running
    const oldTokens = this.removeEmpty(this.tokenize(this.castInput(oldString)));
    const newTokens = this.removeEmpty(this.tokenize(this.castInput(newString)));

    const newLen = newTokens.length;
    const oldLen = oldTokens.length;
    let maxEditLength = newLen + oldLen;

    // Seed editLength = 0, i.e. the content starts with the same values
    const startingDiagonalPath = 0;
    const startingPath: DiffPath = {
      position: -1,
      tokenOperations: [],
    }

    const {newPos, oldPos, count} = this.walkDiagonally(startingPath, oldTokens, newTokens, startingDiagonalPath);
    if (newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return [{
        count: newTokens.length,
        value: this.join(newTokens),
        operation: Operation.INSERT,
      }];
    }
    if (count) {
      startingPath.tokenOperations.push({ count: count });
    }
    startingPath.position = newPos;

    let allPaths = new Map([[0, startingPath]]);

    // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.
    let editLength = 1;
    while (editLength <= maxEditLength) {
      const diffPath = this.execEditLength(editLength, allPaths, oldTokens, newTokens);
      if (diffPath) {
        return this.buildValues(diffPath.tokenOperations, oldTokens, newTokens, this.useLongestToken);
      }
      editLength++;
    }
    return [];
  }

  execEditLength(
    editLength: number,
    allPaths: Map<number, DiffPath>,
    oldTokens: string[],
    newTokens: string[],
  ): DiffPath | undefined {
    const newLen = newTokens.length;
    const oldLen = oldTokens.length;

    for (let diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
      let diffPath: DiffPath | null = null;
      const insertPath = allPaths.get(diagonalPath - 1);
      const deletePath = allPaths.get(diagonalPath + 1);
      const deletePosition = (deletePath ? deletePath.position : 0) - diagonalPath;
      if (insertPath) {
        // No one else is going to attempt to use this value, clear it
        allPaths.delete(diagonalPath - 1);
      }

      const canAdd = insertPath && insertPath.position + 1 < newLen;
      const canRemove = deletePath && 0 <= deletePosition && deletePosition < oldLen;
      if (!canAdd && !canRemove) {
        // If this path is a terminal then prune
        allPaths.delete(diagonalPath);
        continue;
      }

      // Select the diagonal that we want to branch from. We select the prior
      // path whose position in the new string is the farthest from the origin
      // and does not pass the bounds of the diff graph
      // @ts-ignore
      if (!canAdd || (canRemove && insertPath.position < deletePath.position)) {
        // @ts-ignore
        diffPath = clonePath(deletePath);
        this.pushTokenOperation(diffPath.tokenOperations, Operation.DELETE);
      } else {
        // @ts-ignore
        diffPath = insertPath; // No need to clone, we've pulled it from the list
        // @ts-ignore
        diffPath.position++;
        // @ts-ignore
        this.pushTokenOperation(diffPath.tokenOperations, Operation.INSERT);
      }

      if (!diffPath) {
        throw new Error("diffPath should be defined");
      }

      const {
        newPos,
        oldPos,
        count,
      } = this.walkDiagonally(diffPath, oldTokens, newTokens, diagonalPath);
      diffPath.position = newPos;
      if (count) {
        diffPath.tokenOperations.push({ count: count });
      }

      // If we have hit the end of both strings, then we are done
      if (diffPath.position + 1 >= newLen && oldPos + 1 >= oldLen) {
        return diffPath;
      } else {
        // Otherwise track this path as a potential candidate and continue.
        allPaths.set(diagonalPath, diffPath);
      }
    }
  }

  pushTokenOperation(
    tokenOperations: TokenOperation[],
    operation: Operation,
  ): void {
    let last = tokenOperations[tokenOperations.length - 1];
    // If the operation is the same as the previous one, we can just increment it
    if (last && operation === last.operation) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      tokenOperations[tokenOperations.length - 1] = {
        count: last.count + 1,
        operation
      };
    } else {
      tokenOperations.push({
        count: 1,
        operation
      });
    }
  }

  /*
   * Walks diagonaly down the grid, also known as "snake"
   */
  walkDiagonally(
    basePath: DiffPath,
    oldTokens: string[],
    newTokens: string[],
    diagonalPath: number,
  ): Common {
    const newLen = newTokens.length;
    const oldLen = oldTokens.length;
    let newPos = basePath.position;
    let oldPos = newPos - diagonalPath;

    let count = 0;
    while (newPos + 1 < newLen &&
           oldPos + 1 < oldLen &&
           this.equals(newTokens[newPos + 1], oldTokens[oldPos + 1])) {
      newPos++;
      oldPos++;
      count++;
    }

    return {
      count,
      newPos,
      oldPos, 
    };
  }

  equals(left: string, right: string): boolean {
    if (this.options.comparator) {
      return this.options.comparator(left, right);
    } else {
      return left === right ||
        (this.options.ignoreCase === true && left.toLowerCase() === right.toLowerCase());
    }
  }

  removeEmpty(array: string[]): string[] {
    let ret = [];
    for (let i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }

  castInput(value: string): string {
    return value;
  }

  tokenize(value: string): string[] {
    return value.split('');
  }

  join(chars: string[]) {
    return chars.join('');
  }

  buildValues(
    tokenOperations: TokenOperation[],
    oldTokens: string[],
    newTokens: string[],
    useLongestToken: boolean,
  ) {
    let componentPos = 0;
    let componentLen = tokenOperations.length;
    let newPos = 0;
    let oldPos = 0;

    for (; componentPos < componentLen; componentPos++) {
      let tokenOperation = tokenOperations[componentPos];
      if (tokenOperation.operation !== Operation.DELETE) {
        if (tokenOperation.operation !== Operation.INSERT && useLongestToken) {
          let value = newTokens.slice(newPos, newPos + tokenOperation.count);
          // eslint-disable-next-line
          value = value.map((value, i) => {
            let oldValue = oldTokens[oldPos + i];
            return oldValue.length > value.length ? oldValue : value;
          });

          tokenOperation.value = this.join(value);
        } else {
          tokenOperation.value = this.join(newTokens.slice(newPos, newPos + tokenOperation.count));
        }
        newPos += tokenOperation.count;

        // Common case
        if (tokenOperation.operation !== Operation.INSERT) {
          oldPos += tokenOperation.count;
        }
      } else {
        tokenOperation.value = this.join(oldTokens.slice(oldPos, oldPos + tokenOperation.count));
        oldPos += tokenOperation.count;

        // Reverse add and remove so removes are output first to match common convention
        // The diffing algorithm is tied to add then remove output and this is the simplest
        // route to get the desired output with minimal overhead.
        if (componentPos && tokenOperations[componentPos - 1].operation === Operation.INSERT) {
          let tmp = tokenOperations[componentPos - 1];
          tokenOperations[componentPos - 1] = tokenOperations[componentPos];
          tokenOperations[componentPos] = tmp;
        }
      }
    }

    // Special case handle for when one terminal is ignored (i.e. whitespace).
    // For this case we merge the terminal into the prior string and drop the change.
    // This is only available for string mode.
    let lastComponent = tokenOperations[componentLen - 1];
    if (componentLen > 1
        && typeof lastComponent.value === 'string'
        && lastComponent.operation
        && this.equals('', lastComponent.value)) {
      tokenOperations[componentLen - 2].value += lastComponent.value;
      tokenOperations.pop();
    }

    return tokenOperations;
  }

};