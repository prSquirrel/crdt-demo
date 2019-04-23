import { Identifiable } from './Identifiable';
import { Comparable } from './Comparable';

type Value = Identifiable & Comparable;

export class ValueSet<V extends Value> implements Iterable<V> {
  private readonly map: Map<string, V>;

  constructor(kvs: Iterable<readonly [string, V]> = []) {
    this.map = new Map(kvs);
  }

  static of<V extends Value>(values: V[]): ValueSet<V> {
    const kvs: [string, V][] = values.map(v => [v.toIdString(), v]);
    return new ValueSet(kvs);
  }

  [Symbol.iterator](): IterableIterator<V> {
    return this.values();
  }

  add(item: V): this {
    this.map.set(item.toIdString(), item);
    return this;
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  delete(item: V): boolean {
    return this.map.delete(item.toIdString());
  }

  contains(item: V): boolean {
    return this.map.has(item.toIdString());
  }

  // shallow
  clone(): ValueSet<V> {
    return new ValueSet(this.map);
  }

  // immutable
  // diff = this - other
  difference(other: ValueSet<V>): ValueSet<V> {
    const difference = [...this.values()].filter(id => !other.contains(id));
    return ValueSet.of(difference);
  }

  // returns minimal element.
  // undefined for empty set.
  min(): V {
    const elements = [...this.values()];
    const minReducer = (min: V, current: V) => (current.compareTo(min) < 0 ? current : min);
    return elements.reduce((min, current) => minReducer(min, current), elements[0]);
  }
}
