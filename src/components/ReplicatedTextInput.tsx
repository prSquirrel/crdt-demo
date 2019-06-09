import * as React from 'react';
import { view, store } from 'react-easy-state';
import { RGASeq } from '../crdt/sequence/rga/RGASeq';
import { RGATreeSeq } from '../crdt/sequence/rga/RGATreeSeq';
import { diff, TextOp } from '../util/Diff';
import { ClientEvents, PeerSyncContext } from '../network/Client';
import { client } from '../network/DefaultClient';
import { Mailbox, MailboxEvents } from '../network/Mailbox';
import { Op, OpKind, RemoveOp, InsertOp } from '../crdt/sequence/rga/op/Op';
import { RGAParentNode } from '../crdt/sequence/rga/RGANode';
import { Timestamp } from '../crdt/sequence/rga/Timestamp';

interface Props {}

interface ISelection {
  start: number;
  end: number;
  startAnchor: Timestamp;
  endAnchor: Timestamp;
}

interface ITextAreaStore {
  content: string;
  selection: ISelection;
  selectionBuffer: ISelection;
}

class ReplicatedTextInput extends React.Component<Props, {}> {
  private textAreaRef: React.RefObject<HTMLTextAreaElement>;
  private textSeq?: RGASeq<string>;
  private mailbox?: Mailbox;

  private textAreaStore: ITextAreaStore = store({
    content: '',
    selection: {
      start: 0,
      end: 0,
      startAnchor: RGAParentNode.timestamp,
      endAnchor: RGAParentNode.timestamp
    },
    selectionBuffer: {
      start: 0,
      end: 0,
      startAnchor: RGAParentNode.timestamp,
      endAnchor: RGAParentNode.timestamp
    }
  });

  constructor(props: Props) {
    super(props);
    this.textAreaRef = React.createRef();
  }

  componentDidMount() {
    client.on(ClientEvents.ID_ASSIGNED, id => {
      this.textSeq = new RGATreeSeq<string>(id);
      this.mailbox = new Mailbox(id, client);
      this.mailbox.on(MailboxEvents.OP_RECEIVED, (op: Op<string>) => this.handleRemoteOp(op));
      this.mailbox.on(MailboxEvents.SYNC_RECEIVED, (ops: Op<string>[]) => {
        console.log(`SYNC_RECEIVED`);
        ops.forEach(op => this.applyRemoteOp(op));
        this.updateContent();
      });
    });

    client.on(ClientEvents.SYNC_REQUESTED, (ctx: PeerSyncContext) => {
      const history = this.textSeq.getHistory();
      console.log(`SYNC_REQUESTED`);
      this.mailbox.sync(ctx, history);
    });
  }

  componentWillUnmount() {}

  private handleRemoteOp(op: Op<string>): void {
    this.applyRemoteOp(op);
    this.bufferSelection(op);
    this.updateContent();
    this.swapSelectionBuffers();
    this.updateSelection();
  }

  private bufferSelection(op: Op<string>): void {
    const selectionBuffer = this.textAreaStore.selection;

    switch (op.kind) {
      case OpKind.Insert: {
        const opTimestamp = (op as InsertOp<string>).referenceTimestamp;
        if (selectionBuffer.startAnchor.equals(opTimestamp)) {
          const newStart = selectionBuffer.start + 1;
          selectionBuffer.startAnchor = this.textSeq.get(newStart).timestamp;
        }
        break;
      }

      case OpKind.Remove: {
        const opTimestamp = (op as RemoveOp<string>).timestampToRemove;
        if (selectionBuffer.startAnchor.equals(opTimestamp)) {
          const newStart = selectionBuffer.start > 0 ? selectionBuffer.start - 1 : 0;
          selectionBuffer.startAnchor = this.textSeq.get(newStart).timestamp;
        }
        if (selectionBuffer.endAnchor.equals(opTimestamp)) {
          const newEnd = selectionBuffer.end > 0 ? selectionBuffer.end - 1 : 0;
          selectionBuffer.endAnchor = this.textSeq.get(newEnd).timestamp;
        }
        break;
      }
    }
    selectionBuffer.start = this.textSeq.getIndex(selectionBuffer.startAnchor);
    selectionBuffer.end = this.textSeq.getIndex(selectionBuffer.endAnchor);

    this.textAreaStore.selectionBuffer = selectionBuffer;
  }

  private swapSelectionBuffers(): void {
    const temp = this.textAreaStore.selection;
    this.textAreaStore.selection = this.textAreaStore.selectionBuffer;
    this.textAreaStore.selectionBuffer = temp;
  }

  private updateSelection(): void {
    const buffer = this.textAreaStore.selection;
    const ref = this.textAreaRef.current;

    ref.selectionStart = buffer.start;
    ref.selectionEnd = buffer.end;
  }

  private onChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    const eventTarget = ev.target;
    const newContent = eventTarget.value;

    const ops = diff(
      this.textAreaStore.content,
      newContent,
      this.textAreaStore.selection.start,
      this.textAreaStore.selection.end
    );

    const opsToReplicate = this.applyTextOps(ops);
    this.updateContent();
    opsToReplicate.forEach(op => {
      this.mailbox.broadcast(op);
    });
  };

  private applyTextOps(textOps: TextOp[]): Op<string>[] {
    if (this.textSeq) {
      const opsToReplicate = textOps.map(op => op.applyTo(this.textSeq));
      return opsToReplicate;
    } else {
      return [];
    }
  }

  private applyRemoteOp(op: Op<string>): void {
    if (this.textSeq) {
      this.textSeq.apply(op);
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
    this.textAreaStore.selection = {
      start: start,
      end: end,
      startAnchor: this.textSeq ? this.textSeq.get(start).timestamp : RGAParentNode.timestamp,
      endAnchor: this.textSeq ? this.textSeq.get(end).timestamp : RGAParentNode.timestamp
    };
  };

  render() {
    return (
      <textarea
        ref={this.textAreaRef}
        value={this.textAreaStore.content}
        onSelect={this.onSelect}
        onChange={this.onChange}
        spellCheck={false}
        rows={40}
        cols={150}
      />
    );
  }
}

export default view(ReplicatedTextInput);
