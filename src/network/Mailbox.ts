import FastPriorityQueue from 'fastpriorityqueue';
import { VClock } from './VClock';
import { client, Client, ClientEvents, PeerSyncContext } from './Client';
import { Message, Operation, Operation_Timestamp } from './schema/schema';
import EventEmitter from 'nanobus';
import * as capnp from 'capnp-ts';
import { Op, OpKind, InsertOp, RemoveOp } from '../crdt/sequence/rga/op/Op';
import { Timestamp } from '../crdt/sequence/rga/Timestamp';
import { ValueSet } from '../util/ValueSet';

export enum MailboxEvents {
  OP_RECEIVED = 'operation_received',
  SYNC_RECEIVED = 'sync_received'
}

//TODO: flag of ready
class Mailbox extends EventEmitter {
  private client: Client;

  private site?: string;
  private clock?: VClock;
  private queue: FastPriorityQueue<VClock>;

  constructor(client: Client) {
    super();
    client.on(ClientEvents.ID_ASSIGNED, (id: string) => {
      this.site = id;
      this.clock = VClock.create(id);
    });
    client.on(ClientEvents.DATA, (msg: capnp.Message) => {
      this.handle(msg);
    });
    this.client = client;

    // this.queue = new FastPriorityQueue((msgA, msgB) => {
    //   const [msgClockA, payloadA] = msgA;
    //   const [msgClockB, payloadB] = msgB;
    //   return VClock.lessThanOrEqualPartial(msgClockA)(msgClockB);
    // });
  }

  broadcast(op: Op<string>): void {
    const capnpMsg = new capnp.Message();
    const msg = capnpMsg.initRoot(Message);

    const opMsg = msg.initOperation();
    opMsg.initVclock(); // TODO
    const opStruct = opMsg.getOperation();
    this.serializeOpToStruct(op, opStruct);

    this.client.broadcastToConnectedPeers(capnpMsg);
  }

  sync(context: PeerSyncContext, history: Op<string>[]): void {
    history.forEach(op => {
      const capnpMsg = new capnp.Message();
      const msg = capnpMsg.initRoot(Message);

      const opMsg = msg.initOperation();
      opMsg.initVclock(); // TODO
      const opStruct = opMsg.getOperation();
      this.serializeOpToStruct(op, opStruct);

      context.sync(capnpMsg);
    });

    // const capnpMsg = new capnp.Message();
    // const msg = capnpMsg.initRoot(Message);

    // const syncMsg = msg.initSync();
    // const operations = syncMsg.initOperations(history.length);
    // for (let i = 0; i < history.length; i++) {
    //   const operation = operations.get(i);
    //   this.serializeOpToStruct(history[i], operation);
    // }

    // context.sync(capnpMsg);
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
    switch (msg.which()) {
      case Message.OPERATION:
        const operationMsg = msg.getOperation();
        const operation = operationMsg.getOperation();
        const op = this.deserializeOp(operation);

        this.emitOp(op);
        break;

      case Message.SYNC:
        console.log(capnpMsg.dump());
        const syncMsg = msg.getSync();
        const operations = syncMsg.getOperations();

        const ops = operations.map(operation => this.deserializeOp(operation));
        this.emitSync(ops);
        break;

      case Message.UNKNOWN:
      default:
        throw new Error(`Unknown message`);
    }
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

  // Processes incoming message of format [senderId, clock, payload] in causal order.
  // If a message is out of order, it is queued.
  // Returns: an ordered array of message payloads ready to be processed.
  //          If a message is not yet ready, it will be returned in subsequent invocations.
  // process(message) {
  //   const [senderId, jsonMsgClock, payload] = message;
  //   const msgClock = Util.fromRight(VClock.fromJson(jsonMsgClock));

  //   const jsonCurrentClock = VClock.asJson(this.clock);
  //   console.log(`Current clock ${jsonCurrentClock}, Message clock ${jsonMsgClock}`);

  //   if (VClock.precedes(this.clock)(msgClock)(senderId)) {
  //     this.mergeClockWith(msgClock);

  //     if (!this.queue.isEmpty()) {
  //       //todo: test that multiple messages are dequeued
  //       const [clock, queuedPayload] = this.queue.poll();
  //       return [payload, queuedPayload];
  //     } else {
  //       return [payload];
  //     }
  //   } else {
  //     this.queue.add([msgClock, payload]);
  //     return [];
  //   }
  // }

  // Increments internal clock and broadcasts message of format [senderId=peerId, clock, payload] using provided onSend.
  // broadcast(payload, onSend) {
  //   this.advanceClock();

  //   const jsonClock = VClock.asJson(this.clock);
  //   const message = [this.peerId, jsonClock, payload];
  //   onSend(message);
  // }

  // advanceClock(): void {
  //   this.clock.increment();
  // }

  // mergeClockWith(otherClock: VClock): void {
  //   this.clock.merge(otherClock);
  // }
}

export const mailbox = new Mailbox(client);
