import { AtomId } from './id/AtomId';
import { Atom } from './Atom';

export interface AtomSeq<T> {
  add(id: AtomId, value: T): number;

  remove(id: AtomId): number;

  get(index: number): Atom<T>;

  values(): T[];
}
