import { AtomSeq } from './AtomSeq';
import { Atom } from './Atom';
import { AtomId } from './id/AtomId';

export class ArrayBackedAtomSeq<T> implements AtomSeq<T> {
  private atoms: Atom<T>[];

  constructor() {
    this.atoms = [];
  }

  //returns inserted index or -1 if already exists
  add(id: AtomId, value: T): number {
    const newIndex = this.bisectRight(id);
    const existing = this.get(newIndex - 1);
    const exists = existing && id.compare(existing.id) == 0;

    if (exists) {
      return -1;
    }

    const atom = new Atom<T>(id, value);
    this.atoms.splice(newIndex, 0, atom);
    return newIndex;
  }

  //returns removed index, or -1 if it doesn't exist
  remove(id: AtomId): number {
    const index = this.indexOf(id);

    if (index >= 0) {
      this.atoms.splice(index, 1);
    } else {
      return -1;
    }
  }

  indexOf(id: AtomId): number {
    const index = this.bisectLeft(id);
    const found = index !== this.atoms.length && this.atoms[index].id.compare(id) == 0;
    if (found) {
      return index;
    } else {
      return -1;
    }
  }

  private bisectRight(id: AtomId): number {
    let min = 0;
    let max = this.atoms.length;

    while (min < max) {
      const mid = (min + max) >> 1;
      if (id.compare(this.atoms[mid].id) < 0) {
        max = mid;
      } else {
        min = mid + 1;
      }
    }

    return min;
  }

  private bisectLeft(id: AtomId): number {
    let min = 0;
    let max = this.atoms.length;

    while (min < max) {
      const mid = (min + max) >> 1;
      if (this.atoms[mid].id.compare(id) < 0) {
        min = mid + 1;
      } else {
        max = mid;
      }
    }

    return min;
  }

  get(index: number): Atom<T> {
    return this.atoms[index];
  }

  values(): T[] {
    return this.atoms.map(atom => atom.value);
  }
}
