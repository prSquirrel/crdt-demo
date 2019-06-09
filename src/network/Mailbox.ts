import FastPriorityQueue from 'fastpriorityqueue';
import { Client, ClientEvents, PeerSyncContext } from './Client';
import {
  Message,
  Operation,
  Operation_Timestamp,
  SyncMessage,
  OperationMessage,
  Message_VectorClock
} from './schema/schema';
import EventEmitter from 'nanobus';
import * as capnp from 'capnp-ts';
import { Op, OpKind, InsertOp, RemoveOp } from '../crdt/sequence/rga/op/Op';
import { Timestamp } from '../crdt/sequence/rga/Timestamp';
import { ValueSet } from '../util/ValueSet';
import { VClock } from './VClock';
import { Compare } from '../util/Comparable';

export enum MailboxEvents {
  OP_RECEIVED = 'operation_received',
  SYNC_RECEIVED = 'sync_received'
}

interface RemoteOp {
  vclock: VClock;
  op: Op<string>;
}

//TODO: flag of ready
export class Mailbox extends EventEmitter {
  private client: Client;

  private readonly site: string;
  private vclock: VClock;
  private queue: FastPriorityQueue<RemoteOp>;

  constructor(site: string, client: Client) {
    super();
    client.on(ClientEvents.DATA, (msg: capnp.Message) => {
      this.handle(msg);
    });
    this.client = client;
    this.site = site;
    this.vclock = VClock.create(site);
    this.queue = new FastPriorityQueue((a, b) => {
      const compare = a.vclock.compareTo(b.vclock);
      return compare === Compare.LT;
    });
  }

  broadcast(op: Op<string>): void {
    const capnpMsg = new capnp.Message();
    const msg = capnpMsg.initRoot(Message);

    this.vclock.increment();
    this.serializeVClockToStruct(this.vclock, msg.initVclock());

    const opMsg = msg.initOperation();
    const opStruct = opMsg.getOperation();
    this.serializeOpToStruct(op, opStruct);

    this.client.broadcastToConnectedPeers(capnpMsg);
  }

  sync(context: PeerSyncContext, history: Op<string>[]): void {
    const BATCH_SIZE = 1000;
    const totalItems = history.length;
    const remainingBatchSize = totalItems % BATCH_SIZE;
    const totalFullBatches = (totalItems - remainingBatchSize) / BATCH_SIZE;
    const lastBatchNumber = remainingBatchSize == 0 ? totalFullBatches - 1 : totalFullBatches;

    let batchNumber = 0;
    for (let start = 0; start < totalItems; start += BATCH_SIZE, batchNumber++) {
      const batch = history.slice(start, start + BATCH_SIZE);
      this.syncBatch(context, batch, batchNumber, lastBatchNumber);
    }
  }

  private syncBatch(
    context: PeerSyncContext,
    batch: Op<string>[],
    batchNumber: number,
    lastBatchNumber: number
  ): void {
    console.log(`Sending batch ${batchNumber}. Last batch is ${lastBatchNumber}`);

    const capnpMsg = new capnp.Message();
    const msg = capnpMsg.initRoot(Message);

    this.serializeVClockToStruct(this.vclock, msg.initVclock());

    const syncMsg = msg.initSync();
    this.serializeBatchToStruct(batch, batchNumber, lastBatchNumber, syncMsg);

    context.sync(capnpMsg);
  }

  private serializeBatchToStruct(
    batch: Op<string>[],
    batchNumber: number,
    lastBatchNumber: number,
    syncMsg: SyncMessage
  ): void {
    syncMsg.setBatchNumber(batchNumber);
    syncMsg.setLastBatchNumber(lastBatchNumber);
    const operations = syncMsg.initOperations(batch.length);
    for (let i = 0; i < batch.length; i++) {
      const operation = operations.get(i);
      this.serializeOpToStruct(batch[i], operation);
    }
  }

  private serializeVClockToStruct(vclock: VClock, vclockStruct: Message_VectorClock): void {
    vclockStruct.setSite(vclock.site);

    const clockMap = vclockStruct.initClockMap();
    const entries = clockMap.initEntries(this.vclock.size);
    var idx = 0;
    for (const kv of this.vclock.entries.entries()) {
      const [site, clock] = kv;
      const entry = entries.get(idx);
      entry.setSite(site);
      entry.setClock(clock);
      idx++;
    }
  }

  private serializeOpToStruct(op: Op<string>, opStruct: Operation): void {
    switch (op.kind) {
      case OpKind.Insert:
        opStruct.initInsert();
        const insertStruct = opStruct.getInsert();
        const insertOp = <InsertOp<string>>op;

        insertStruct.setValue(insertOp.value);
        this.serializeTimestampToStruct(insertOp.timestamp, insertStruct.getTimestamp());

        const happenedBefore = [...insertOp.happenedBefore];
        const happenedBeforeStruct = insertStruct.initHappenedBefore(happenedBefore.length);
        for (let i = 0; i < happenedBefore.length; i++) {
          this.serializeTimestampToStruct(happenedBefore[i], happenedBeforeStruct.get(i));
        }

        this.serializeTimestampToStruct(
          insertOp.referenceTimestamp,
          insertStruct.getReferenceTimestamp()
        );
        break;

      case OpKind.Remove:
        opStruct.initRemove();
        const removeStruct = opStruct.getRemove();
        const removeOp = <RemoveOp<string>>op;

        this.serializeTimestampToStruct(removeOp.timestampToRemove, removeStruct.getTimestamp());
        break;

      default:
        throw new Error(`Unknown operation ${op.kind}`);
    }
  }

  private serializeTimestampToStruct(ts: Timestamp, struct: Operation_Timestamp): void {
    struct.setSite(ts.site);
    struct.setClock(ts.clock);
  }

  private handle(capnpMsg: capnp.Message): void {
    const msg = capnpMsg.getRoot(Message);
    const remoteVclock = this.deserializeVclock(msg.getVclock());
    switch (msg.which()) {
      case Message.OPERATION:
        this.enqueueOp(remoteVclock, msg.getOperation());
        this.deliverReadyOps();
        console.log(`Message queue size: ${this.queue.size}`);
        break;

      case Message.SYNC:
        const syncMsg = msg.getSync();
        if (syncMsg.getBatchNumber() === syncMsg.getLastBatchNumber()) {
          this.vclock.merge(remoteVclock);
        }
        console.log(`Syncing batch ${syncMsg.getBatchNumber()}/${syncMsg.getLastBatchNumber()}`);
        const operations = syncMsg.getOperations();

        const ops = operations.map(operation => this.deserializeOp(operation));
        this.emitSync(ops);
        break;

      case Message.UNKNOWN:
      default:
        throw new Error(`Unknown message`);
    }
  }

  private enqueueOp(remoteVclock: VClock, message: OperationMessage): void {
    const operation = message.getOperation();
    const op = this.deserializeOp(operation);

    const remoteOp = <RemoteOp>{
      vclock: remoteVclock,
      op: op
    };
    this.queue.add(remoteOp);
  }

  private deliverReadyOps(): void {
    const q = this.queue;

    while (!q.isEmpty() && this.canBeDelivered(q.peek())) {
      const remoteOp = q.poll();
      this.deliverOp(remoteOp);
    }
  }

  private deliverOp(remoteOp: RemoteOp): void {
    this.emitOp(remoteOp.op);
    this.vclock.merge(remoteOp.vclock);
  }

  private canBeDelivered(remoteOp: RemoteOp): boolean {
    const remoteVclock = remoteOp.vclock;
    const remoteSite = remoteVclock.site;
    const first =
      this.vclock.getClock(remoteSite) === Math.max(remoteVclock.getClock(remoteSite) - 1, 0);
    const second = remoteVclock.allLessThanOrEqualExcept(remoteSite, this.vclock);
    return first && second;
  }

  private deserializeVclock(struct: Message_VectorClock): VClock {
    const remoteSite = struct.getSite();
    const clockMap = new Map<string, number>();
    const entries = struct.getClockMap().getEntries();
    entries.forEach(entry => {
      clockMap.set(entry.getSite(), entry.getClock());
    });

    return new VClock(remoteSite, clockMap);
  }

  private deserializeOp(operation: Operation): Op<string> {
    switch (operation.which()) {
      case Operation.INSERT:
        const insertStruct = operation.getInsert();
        const value = insertStruct.getValue();
        const timestamp = insertStruct.getTimestamp();
        const happenedBefore = insertStruct.getHappenedBefore();
        const referenceTimestamp = insertStruct.getReferenceTimestamp();

        return new InsertOp<string>(
          value,
          this.deserializeTimestamp(timestamp),
          ValueSet.of(happenedBefore.map(t => this.deserializeTimestamp(t))),
          this.deserializeTimestamp(referenceTimestamp)
        );

      case Operation.REMOVE:
        const removeStruct = operation.getRemove();
        const timestampToRemove = removeStruct.getTimestamp();

        return new RemoveOp(this.deserializeTimestamp(timestampToRemove));

      case Operation.UNKNOWN:
      default:
        throw new Error(`Unknown operation`);
    }
  }

  private deserializeTimestamp(struct: Operation_Timestamp): Timestamp {
    const site = struct.getSite();
    const clock = struct.getClock();
    return new Timestamp(site, clock);
  }

  private emitOp(op: Op<string>): void {
    this.emit(MailboxEvents.OP_RECEIVED, op);
  }

  private emitSync(ops: Op<string>[]): void {
    this.emit(MailboxEvents.SYNC_RECEIVED, ops);
  }
}
