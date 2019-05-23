import * as React from 'react';
import { view, store } from 'react-easy-state';
import { RGASeq } from '../crdt/sequence/rga/RGASeq';
import { RGATreeSeq } from '../crdt/sequence/rga/RGATreeSeq';
import { diff, TextOp } from '../util/Diff';
import { ClientEvents, PeerSyncContext } from '../network/Client';
import { client } from '../network/DefaultClient';
import { Mailbox, MailboxEvents } from '../network/Mailbox';
import { Op } from '../crdt/sequence/rga/op/Op';

interface Props {}

class ReplicatedTextInput extends React.Component<Props, {}> {
  private textAreaRef: React.RefObject<HTMLTextAreaElement>;
  private textSeq?: RGASeq<string>;
  private mailbox?: Mailbox;

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
    client.on(ClientEvents.ID_ASSIGNED, id => {
      this.textSeq = new RGATreeSeq<string>(id);
      this.mailbox = new Mailbox(id, client);
      this.mailbox.on(MailboxEvents.OP_RECEIVED, (op: Op<string>) => {
        console.log(op);
        this.applyRemoteOp(op);
        this.updateContent();
      });
      this.mailbox.on(MailboxEvents.SYNC_RECEIVED, (ops: Op<string>[]) => {
        console.log(`SYNC_RECEIVED`);
        ops.forEach(op => this.applyRemoteOp(op));
        this.updateContent();
      });

      // console.log(`Inserting 1000 characters @ ${new Date()}`);
      // Array.from({ length: 1000 }, (_, i) => textStore.seq.insert('X', i));
      // console.log(`Finished @ ${new Date()}`);
    });

    client.on(ClientEvents.SYNC_REQUESTED, (ctx: PeerSyncContext) => {
      const history = this.textSeq.getHistory();
      console.log(`SYNC_REQUESTED`);
      this.mailbox.sync(ctx, history);
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

    // console.log(JSON.stringify(ops));
    const opsToReplicate = this.applyTextOps(ops);
    this.updateContent();
    // console.log(JSON.stringify(opsToReplicate));
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
        rows={40}
        cols={150}
      />
    );
  }
}

export default view(ReplicatedTextInput);
