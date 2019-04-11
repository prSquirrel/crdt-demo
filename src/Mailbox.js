import FastPriorityQueue from 'fastpriorityqueue';
import VClock from './purescript/VClock.purs';
import Util from './purescript/Util.purs';

export default class Mailbox {
  constructor(peerId) {
    this.peerId = peerId;
    this.clock = VClock.initial;
    this.queue = new FastPriorityQueue((msgA, msgB) => {
      const [msgClockA, payloadA] = msgA;
      const [msgClockB, payloadB] = msgB;
      return VClock.lessThanOrEqualPartial(msgClockA)(msgClockB);
    });
  }

  // Processes incoming message of format [senderId, clock, payload] in causal order.
  // If a message is out of order, it is queued.
  // Returns: an ordered array of message payloads ready to be processed.
  //          If a message is not yet ready, it will be returned in subsequent invocations.
  process(message) {
    const [senderId, jsonMsgClock, payload] = message;
    const msgClock = Util.fromRight(VClock.fromJson(jsonMsgClock));

    const jsonCurrentClock = VClock.asJson(this.clock);
    console.log(`Current clock ${jsonCurrentClock}, Message clock ${jsonMsgClock}`);

    if (VClock.precedes(this.clock)(msgClock)(senderId)) {
      this.mergeClockWith(msgClock);

      if (!this.queue.isEmpty()) {
        //todo: test that multiple messages are dequeued
        const [clock, queuedPayload] = this.queue.poll();
        return [payload, queuedPayload];
      } else {
        return [payload];
      }
    } else {
      this.queue.add([msgClock, payload]);
      return [];
    }
  }

  // Increments internal clock and broadcasts message of format [senderId=peerId, clock, payload] using provided onSend.
  broadcast(payload, onSend) {
    this.advanceClock();

    const jsonClock = VClock.asJson(this.clock);
    const message = [this.peerId, jsonClock, payload];
    onSend(message);
  }

  advanceClock() {
    this.clock = VClock.increment(this.peerId)(this.clock);
  }

  mergeClockWith(otherClock) {
    this.clock = VClock.merge(this.clock)(otherClock);
  }
}
