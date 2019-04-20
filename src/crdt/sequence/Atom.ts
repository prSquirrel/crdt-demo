import { AtomId } from './id/AtomId';

export class Atom<T> {
  readonly id: AtomId;
  readonly value: T;

  constructor(id: AtomId, value: T) {
    this.id = id;
    this.value = value;
  }
}
