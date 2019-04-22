import { TimestampSet } from '../TimestampSet';
import { Timestamp } from '../Timestamp';

export enum OpKind {
  Insert = 1,
  Remove = 2
}

export abstract class Op {
  readonly kind: OpKind;

  constructor(kind: OpKind) {
    this.kind = kind;
  }
}

export class InsertOp<T> extends Op {
  readonly value: T;
  readonly timestamp: Timestamp;
  readonly happenedBefore: TimestampSet;
  readonly referenceTimestamp: Timestamp;

  constructor(
    value: T,
    newTimestamp: Timestamp,
    happenedBefore: TimestampSet,
    referenceTimestamp: Timestamp
  ) {
    super(OpKind.Insert);
    this.value = value;
    this.timestamp = newTimestamp;
    this.happenedBefore = happenedBefore;
    this.referenceTimestamp = referenceTimestamp;
  }
}

export class RemoveOp extends Op {
  readonly timestamp: Timestamp;

  constructor(timestampToRemove: Timestamp) {
    super(OpKind.Remove);
    this.timestamp = timestampToRemove;
  }
}
