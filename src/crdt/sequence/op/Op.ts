import { AtomId } from '../id/AtomId';

export enum OpKind {
  Insert = 1,
  Remove = 2
}

export abstract class Op {
  readonly kind: OpKind;

  //source site name
  readonly sourceSite: string;

  //atom id reference
  readonly id: AtomId;

  constructor(kind: OpKind, sourceSite: string, id: AtomId) {
    this.kind = kind;
    this.sourceSite = sourceSite;
    this.id = id;
  }
}

export class InsertOp<T> extends Op {
  readonly value: T;

  constructor(sourceSite: string, id: AtomId, value: T) {
    super(OpKind.Insert, sourceSite, id);
    this.value = value;
  }
}

export class RemoveOp extends Op {
  constructor(sourceSite: string, id: AtomId) {
    super(OpKind.Remove, sourceSite, id);
  }
}
