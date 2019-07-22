Purpose:

- Prototype to test implementing CRDT into Logbook

# Open Source Examples

- Y.js
  - http://y-js.org/
- Conclave
  - https://github.com/conclave-team/conclave
  - https://www.conclave.tech/

## Y.js

- http://y-js.org/
- https://github.com/y-js/
- https://github.com/aizatto/yjs-prototype

Notes:

- Hard to deconstruct

## Conclave

https://conclave-team.github.io/conclave-site/

> Conclave is a peer-to-peer, real-time, collaborative text editor built from scratch in JavaScript. Intrigued by collaborative text editors such as Google Docs, we set out to build our own. This case study walks you through our journey from the initial idea to our research of current academic literature and finally to our design and implementation of the final product.

Notes:

- No longer maintained

# Algorithms

- CRDT
- Diff

## CRDT

Also known as:

- Conflict-free replicated data type
- Commutative replicated data type
- Convergent replicated data type

See `packages/shared/src/CRDTStructure.ts`

Properties:

- Every character/token has some metadata:
  - token
  - franctional index position
  - non unique id
  - window

Links:

- https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type
- Paper: A comprehensive study of Convergent and Commutative Replicated Data Types
  - http://hal.upmc.fr/inria-00555588/document
  - 51 pages; published in 2011
- Xi Editor:
  - https://xi-editor.io/docs/crdt.html
  - https://xi-editor.io/docs/crdt-details.html

## Diff

- npm package: diff
  - https://github.com/kpdecker/jsdiff/
  - https://github.com/kpdecker/jsdiff/blob/master/src/diff/base.js
  - https://www.npmjs.com/package/diff 
- Paper: An O(ND) Difference Algorithm and Its Variations
  - http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
  - http://xmailserver.org/diff2.pdf

Problems with `diff` package:

- Uses different keywords than the paper
- Uses let when it should use const
- Has "callback" support
- Has large inline functions execEditLength
- The while loop can be easily forgotten
- function extractCommon modifies the state of an argument
- Uses an array as a map
- Makes it hard to understand the paper that it is based on
- Assign multiple variables on the same line
- Uses similar worded variables, bestPath and basePath
- Undefined variable: useLongestToken