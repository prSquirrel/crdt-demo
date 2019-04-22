import * as React from 'react';
import { view, store } from 'react-easy-state';
import { ArraySeq } from '../crdt/sequence/ArraySeq';
import { Op } from '../crdt/sequence/op/Op';
import { diff, TextOp } from '../util/Combobulator';
import clientStore from '../network/clientStore';

interface TextStore {
  seq: ArraySeq<string>;
  readonly ready: boolean;
  readonly content: string;
  init(id: string): void;
  applyOps(ops: TextOp[]): Op[];
}

const textStore: TextStore = store({
  seq: null,
  get ready(): boolean {
    return textStore.seq != null;
  },
  get content(): string {
    return textStore.ready ? textStore.seq.toArray().join('') : 'NOT READY';
  },
  init(id: string): void {
    if (!textStore.ready) {
      textStore.seq = new ArraySeq<string>(id);
    }
  },
  applyOps(ops: TextOp[]): Op[] {
    if (textStore.ready) {
      const opsToReplicate = ops.map(op => op.applyTo(textStore.seq));
      return opsToReplicate;
    } else {
      return [];
    }
  }
});

interface Props {}

class ReplicatedTextInput extends React.Component<Props, {}> {
  private textAreaRef: React.RefObject<HTMLTextAreaElement>;

  private textAreaStore = store({
    selection: {
      start: 0,
      end: 0
    }
  });

  constructor(props: Props) {
    super(props);
    this.textAreaRef = React.createRef();
  }

  componentDidMount() {
    clientStore.onIdAssigned(id => {
      textStore.init(id);

      // console.log(`Inserting 1000 characters @ ${new Date()}`);
      // Array.from({ length: 1000 }, (_, i) => textStore.seq.insert('X', i));
      // console.log(`Finished @ ${new Date()}`);
    });
  }

  componentWillUnmount() {}

  private onChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    const eventTarget = ev.target;
    const newContent = eventTarget.value;

    const ops = diff(
      textStore.content,
      newContent,
      this.textAreaStore.selection.start,
      this.textAreaStore.selection.end
    );

    const opsToReplicate = textStore.applyOps(ops);
    console.log(JSON.stringify(opsToReplicate));
  };

  private onSelect = (ev: any) => {
    const start = ev.target.selectionStart;
    const end = ev.target.selectionEnd;
    this.textAreaStore.selection.start = start;
    this.textAreaStore.selection.end = end;
  };

  render() {
    return (
      <textarea
        ref={this.textAreaRef}
        value={textStore.content}
        onSelect={this.onSelect}
        onChange={this.onChange}
      />
    );
  }
}

export default view(ReplicatedTextInput);
