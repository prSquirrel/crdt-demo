import { Timestamp } from '../Timestamp';
import { ValueSet } from '../../../../util/ValueSet';

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
  readonly happenedBefore: ValueSet<Timestamp>;
  readonly referenceTimestamp: Timestamp;

  constructor(
    value: T,
    newTimestamp: Timestamp,
    happenedBefore: ValueSet<Timestamp>,
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