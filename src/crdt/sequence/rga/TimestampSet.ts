import { Timestamp } from './Timestamp';

export class TimestampSet {
  private readonly timestamps: Set<string>;

  private constructor(ids: string[] = []) {
    this.timestamps = new Set(ids);
  }

  static of(ts: Timestamp[]): TimestampSet {
    const ids = ts.map(t => t.strId);
    return new TimestampSet(ids);
  }

  static get empty(): TimestampSet {
    return new TimestampSet();
  }

  // mutable
  add(timestamp: Timestamp): void {
    this.timestamps.add(timestamp.strId);
  }

  // immutable
  // diff = this - other
  difference(other: TimestampSet): TimestampSet {
    const difference = [...this.timestamps].filter(id => !other.timestamps.has(id));
    return new TimestampSet(difference);
  }

  contains(timestamp: Timestamp): boolean {
    return this.timestamps.has(timestamp.strId);
  }

  clone(): TimestampSet {
    return new TimestampSet([...this.timestamps.values()]);
  }

  // returns minimal element. Since timestamps form total order, minimal <=> minimum.
  // returns undefined for empty set.
  private minLexicographical(): string {
    const ids = [...this.timestamps.values()];
    return ids.reduce((min, id) => (id < min ? id : min), ids[0]);
  }

  // immutable
  // returns -1 if (timestamp1, history1) < (timestamp2, history2)
  // returns  1 if (timestamp2, history2) < (timestamp1, history1)
  // returns  0 otherwise (shouldn't happen in practice)
  static compareConcurrent(
    timestamp1: Timestamp,
    history1: TimestampSet,
    timestamp2: Timestamp,
    history2: TimestampSet
  ) {
    const history1Copy: TimestampSet = history1.clone();
    history1Copy.add(timestamp1);

    const history2Copy: TimestampSet = history2.clone();
    history2Copy.add(timestamp2);

    const min1: string = history1Copy.difference(history2).minLexicographical();
    const min2: string = history2Copy.difference(history1).minLexicographical();

    if (min1 < min2) {
      return -1;
    } else if (min2 < min1) {
      return 1;
    } else {
      return 0;
    }
  }
}
