import { InsertOp, RemoveOp, Op } from './op/Op';

export interface RGASeq<T> {
  insert(value: T, index: number): InsertOp<T>;
  remove(index: number): RemoveOp<T>;
  apply(op: Op<T>): void;
  toArray(): T[];
  getHistory(): Op<T>[];
}
