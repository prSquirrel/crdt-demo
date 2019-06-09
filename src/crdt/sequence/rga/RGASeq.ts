import { InsertOp, RemoveOp, Op } from './op/Op';
import { RGANode } from './RGANode';
import { Timestamp } from './Timestamp';

export interface RGASeq<T> {
  insert(value: T, index: number): InsertOp<T>;
  remove(index: number): RemoveOp<T>;
  apply(op: Op<T>): void;
  toArray(): T[];
  getHistory(): Op<T>[];
  get(index: number): RGANode<T>;
  getIndex(timestamp: Timestamp): number;
}
