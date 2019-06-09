import { Identifiable } from '../../../util/Identifiable';
import { Comparable } from '../../../util/Comparable';

export class Timestamp implements Identifiable, Comparable {
  readonly site: string;
  readonly clock: number;

  constructor(site: string, clock: number) {
    this.site = site;
    this.clock = clock;
  }

  toIdString(): string {
    return this.site + this.clock;
  }

  compareTo(that: Timestamp): -1 | 0 | 1 {
    if (this.clock < that.clock) return -1;
    if (this.clock > that.clock) return 1;
    if (this.site < that.site) return -1;
    if (this.site > that.site) return 1;
    return 0;
  }

  equals(that: Timestamp): boolean {
    return this.compareTo(that) === 0;
  }
}
