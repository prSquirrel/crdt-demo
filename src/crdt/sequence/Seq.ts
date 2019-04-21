import { InsertOp, RemoveOp, Op } from './op/Op';

export interface Seq<T> {
  insert(value: T, index: number): InsertOp<T>;
  remove(index: number): RemoveOp;
  apply(op: Op): void;
  get(index: number): T;
  toArray(): T[];
}
