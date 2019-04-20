import { AtomId } from './id/AtomId';

export class AtomCemetery {
  private readonly atomIds: Set<string>;

  constructor() {
    this.atomIds = new Set();
  }

  add(id: AtomId): void {
    this.atomIds.add(id.asString());
  }

  contains(id: AtomId): boolean {
    return this.atomIds.has(id.asString());
  }
}
