import { AtomSeq } from './AtomSeq';
import { AtomCemetery } from './AtomCemetery';
import { AtomIdAllocator } from './id/AtomIdAllocator';
import { ArrayBackedAtomSeq } from './ArrayBackedAtomSeq';
import { LSEQAtomIdAllocator } from './id/LSEQAtomIdAllocator';
import { OpKind, Op, InsertOp, RemoveOp } from './op/Op';

export class Seq<T> {
  private readonly site: string;
  private clock: number;
  private atoms: AtomSeq<T>;
  private cemetery: AtomCemetery;
  private idAllocator: AtomIdAllocator;

  constructor(site: string) {
    this.site = site;
    this.clock = 0;
    this.atoms = new ArrayBackedAtomSeq<T>();
    this.cemetery = new AtomCemetery();
    this.idAllocator = new LSEQAtomIdAllocator(this.site);
  }

  insert(value: T, index: number): InsertOp<T> {
    if (index < 0) throw new RangeError(`Index ${index} must not be negative.`);

    const before = this.atoms.get(index - 1);
    const after = this.atoms.get(index);

    const idBefore = before && before.id;
    const idAfter = after && after.id;
    const idBetween = this.idAllocator.allocate(++this.clock, idBefore, idAfter);

    const op = new InsertOp(this.site, idBetween, value);
    this.apply(op);
    return op;
  }

  remove(index: number): RemoveOp {
    if (index < 0) throw new RangeError(`Index ${index} must not be negative.`);

    const atom = this.atoms.get(index);
    if (atom) {
      const op = new RemoveOp(this.site, atom.id);
      this.apply(op);
      return op;
    } else {
      return null;
    }
  }

  apply(op: Op): void {
    switch (op.kind) {
      case OpKind.Insert:
        this.applyInsert(<InsertOp<T>>op);
        break;

      case OpKind.Remove:
        this.applyRemove(<RemoveOp>op);
        break;

      default:
        throw new Error(`Unknown operation ${op.kind}`);
    }
  }

  private applyInsert(insert: InsertOp<T>): void {
    const id = insert.id;
    if (!this.cemetery.contains(id)) {
      this.atoms.add(id, insert.value);
    }
  }

  private applyRemove(remove: RemoveOp): void {
    const id = remove.id;
    if (!this.cemetery.contains(id)) {
      this.cemetery.add(id);
      this.atoms.remove(id);
    }
  }

  get(index: number): T {
    const atom = this.atoms.get(index);
    return atom ? atom.value : undefined;
  }

  toArray(): T[] {
    return this.atoms.values();
  }
}
