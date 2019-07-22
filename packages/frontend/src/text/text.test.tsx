/**
 * Concerns:
 * - How does JavaScript handle Unicode?
 */
/*
add: {"from":{"line":0,"ch":0,"sticky":null},"to":{"line":0,"ch":0,"sticky":null},"text":["t"],"removed":[""],"origin":"+input"}
remove: {"from":{"line":0,"ch":1,"sticky":"after"},"to":{"line":0,"ch":2,"sticky":"before"},"text":[""],"removed":["e"],"origin":"+delete"}
*/

import { Diff } from './diff';
import { Operation } from "shared/dist/Operation";

const diff = new Diff();

it('diffs correctly', () => {
  expect(diff.diff("ac", "abc")).toEqual([
    {
      count: 1,
      value: 'a',
    },
    {
      count: 1,
      value: 'b',
      operation: Operation.INSERT,
    },
    {
      count: 1,
      value: 'c',
    },
  ]);

  expect(diff.diff("", "new line")).toEqual([
    {
      count: 8,
      value: 'new line',
      operation: Operation.INSERT,
    },
  ]);

  diff.diff("what would you do different", "what are you doing differently")
});
