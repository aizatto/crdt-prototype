import React, { useState } from 'react';
import { Container, Input } from 'reactstrap';

import './bootstrap.min.css';
import Navbar from './components/Navbar';

import { Diff, TokenOperation } from './text/diff';
import { Operation } from "shared/dist/enums";
import { CRDTLocalInterface } from 'shared/dist/CRDTStructure';
import { CRDTController, DocumentState } from './crdt/CRDTController';

function diffTokenOperationsToCRDTToken(
  crdtStructure: CRDTLocalInterface,
  tokenOperations: TokenOperation[],
): void {
  let absPosition = 0;

  let tokenOperation: TokenOperation | undefined;
  // eslint-disable-next-line
  while (tokenOperation = tokenOperations.shift()) {
    switch (tokenOperation.operation) {
      case Operation.INSERT:
        crdtStructure.handleLocalInsert({
          token: tokenOperation.value || '',
          absPosition,
        });
        break;

      case Operation.DELETE:
        crdtStructure.handleLocalDelete(absPosition, tokenOperation.count);
        break;
    }
    absPosition += tokenOperation.count;
  }
}

const diff = new Diff();

const App: React.FC = () => {
  const [documentState, setDocumentState] = useState(DocumentState.NOT_READY);
  const [value, setValue] = useState('');
  const [crdtController] = useState(() => new CRDTController(
    (newString: string) => setValue(newString),
    (newDocumentState: DocumentState) => setDocumentState(newDocumentState),
  ));
  const [editPaths, setEditPaths] = useState<string[]>([]);

  const onChange = (newValue: string) => {
    const editPath = diff.diff(value, newValue);
    const json = JSON.stringify(editPath, null, 2);

    const newEditPaths = editPaths.slice();
    newEditPaths.unshift(json);
    setEditPaths(newEditPaths);

    diffTokenOperationsToCRDTToken(crdtController, editPath);
    setValue(newValue);
  }

  return (
    <div className="App">
      <Navbar />
      <Container className="pt-3 pb-5">
        Text Area:
        <Input
          type="textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={value.split("\n").length + 2}
          disabled={documentState === DocumentState.NOT_READY}
        />
        <h2>CRDT Content</h2>
        <pre>{crdtController.crdtStructure.text}</pre>
        <h2>Edit Paths</h2>
        <pre>{editPaths.join("\n")}</pre>
      </Container>
    </div>
  );
}

export default App;
