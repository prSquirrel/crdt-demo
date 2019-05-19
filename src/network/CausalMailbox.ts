import FastPriorityQueue from 'fastpriorityqueue';
import EventEmitter from 'nanobus';
import { Mailbox } from './Mailbox';
import { Client, ClientEvents } from './Client';
import { VClock } from './VClock';

export enum CausalMailboxEvents {}

export class CausalMailbox extends EventEmitter {
  private site?: string;
  private clock?: VClock;
  private queue: FastPriorityQueue<VClock>;

  constructor(client: Client, mailbox: Mailbox) {
    super();

    client.on(ClientEvents.ID_ASSIGNED, (id: string) => {
      this.site = id;
      this.clock = VClock.create(id);
    });

    // this.queue = new FastPriorityQueue((msgA, msgB) => {
    //   const [msgClockA, payloadA] = msgA;
    //   const [msgClockB, payloadB] = msgB;
    //   return VClock.lessThanOrEqualPartial(msgClockA)(msgClockB);
    // });
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
