import * as React from 'react';
import { view, store } from 'react-easy-state';
import { RGASeq } from '../crdt/sequence/rga/RGASeq';
import { RGATreeSeq } from '../crdt/sequence/rga/RGATreeSeq';
import { diff, TextOp } from '../util/Combobulator';
import clientStore from '../network/clientStore';
import { Op } from '../crdt/sequence/rga/op/Op';

interface Props {}

class ReplicatedTextInput extends React.Component<Props, {}> {
  private textAreaRef: React.RefObject<HTMLTextAreaElement>;
  private textSeq?: RGASeq<string>;

  private textAreaStore = store({
    content: '',
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
      this.textSeq = new RGATreeSeq<string>(id);

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
      this.textAreaStore.content,
      newContent,
      this.textAreaStore.selection.start,
      this.textAreaStore.selection.end
    );

    console.log(JSON.stringify(ops));
    const opsToReplicate = this.applyOps(ops);
    this.updateContent();
    console.log(JSON.stringify(opsToReplicate));
  };

  private applyOps(ops: TextOp[]): Op[] {
    if (this.textSeq) {
      const opsToReplicate = ops.map(op => op.applyTo(this.textSeq));
      return opsToReplicate;
    } else {
      return [];
    }
  }

  private updateContent(): void {
    if (this.textSeq) {
      this.textAreaStore.content = this.textSeq.toArray().join('');
    }
  }

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
        value={this.textAreaStore.content}
        onSelect={this.onSelect}
        onChange={this.onChange}
        spellCheck={false}
      />
    );
  }
}

export default view(ReplicatedTextInput);
