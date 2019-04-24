import { InsertOp, RemoveOp, Op } from './op/Op';

export interface RGASeq<T> {
  insert(value: T, index: number): InsertOp<T>;
  remove(index: number): RemoveOp;
  apply(op: Op): void;
  toArray(): T[];
}
