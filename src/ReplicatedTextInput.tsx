import * as React from 'react';
import { view, store } from 'react-easy-state';
import { Seq } from './crdt/sequence/Seq';
import { Op } from './crdt/sequence/op/Op';
import { diff, TextOp } from './Combobulator';

const textStore = store({
  selection: {
    start: 0,
    end: 0
  },
  seq: new Seq<string>('john'),
  get content(): string {
    return textStore.seq.toArray().join('');
  },
  applyOps(ops: TextOp[]): Op[] {
    const opsToReplicate = ops.map(op => op.applyTo(textStore.seq));
    return opsToReplicate;
  }
});

interface Props {}

class ReplicatedTextInput extends React.Component<Props, {}> {
  private textAreaRef: React.RefObject<HTMLTextAreaElement>;

  constructor(props: Props) {
    super(props);
    this.textAreaRef = React.createRef();
  }

  componentDidMount() {}

  componentWillUnmount() {}

  private onChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    const eventTarget = ev.target;
    const newContent = eventTarget.value;

    const ops = diff(
      textStore.content,
      newContent,
      textStore.selection.start,
      textStore.selection.end
    );

    const opsToReplicate = textStore.applyOps(ops);
    console.log(JSON.stringify(opsToReplicate));
  };

  private onSelect = (ev: any) => {
    const start = ev.target.selectionStart;
    const end = ev.target.selectionEnd;
    textStore.selection.start = start;
    textStore.selection.end = end;
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
