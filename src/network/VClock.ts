import { Comparable, Compare } from '../util/Comparable';

export interface IVClock extends Comparable {
  increment(site: string): void;
  merge(other: IVClock): void;
  getClock(site: string): number;
}

export class VClock implements IVClock {
  readonly site: string;
  private siteClock: Map<string, number>;

  constructor(site: string, siteClock: Map<string, number>) {
    this.site = site;
    this.siteClock = siteClock;
  }

  static create(site: string): VClock {
    return new VClock(site, new Map([[site, 0]]));
  }

  increment(): void {
    const clock = this.getClockOrZero(this.site);
    this.siteClock.set(this.site, clock + 1);
  }

  merge(other: VClock): void {
    const newSiteClock = new Map<string, number>();

    const siteSet = new Set<string>([...this.siteClock.keys(), ...other.siteClock.keys()]);
    siteSet.forEach(site => {
      const thisClock = this.getClockOrZero(site);
      const otherClock = other.getClockOrZero(site);
      const maxClock = Math.max(thisClock, otherClock);
      newSiteClock.set(site, maxClock);
    });

    this.siteClock = newSiteClock;
  }

  getClock(site: string): number {
    return this.getClockOrZero(site);
  }

  private getClockOrZero(site: string): number {
    const maybeClock = this.siteClock.get(site);
    return maybeClock || 0;
  }

  // By definition, vector clocks form partial order.
  // Here it is extended to total order using site identifier to break the ties.
  compareTo(that: VClock): Compare.LT | Compare.EQ | Compare.GT {
    const thisHappenedBefore = this.happenedBefore(that);
    const thatHappenedBefore = that.happenedBefore(this);
    if (thisHappenedBefore && !thatHappenedBefore) {
      return Compare.LT;
    } else if (thatHappenedBefore && !thisHappenedBefore) {
      return Compare.GT;
    } else if (!thisHappenedBefore && !thatHappenedBefore) {
      if (this.site < that.site) {
        return Compare.LT;
      } else if (that.site < this.site) {
        return Compare.GT;
      }
    }
    return Compare.EQ;
  }

  happenedBefore(that: VClock): boolean {
    let allLessThanOrEqual = true;
    let lessThanExists = false;

    const siteSet = VClock.keySet(this.siteClock, that.siteClock);
    siteSet.forEach(site => {
      const thisClock = this.getClockOrZero(site);
      const thatClock = that.getClockOrZero(site);
      if (thisClock < thatClock) {
        lessThanExists = true;
      }
      if (thisClock > thatClock) {
        allLessThanOrEqual = false;
      }
    });

    return allLessThanOrEqual && lessThanExists;
  }

  allLessThanOrEqualExcept(exceptSite: string, that: VClock): boolean {
    let allLessThanOrEqual = true;

    const siteSet = VClock.keySet(this.siteClock, that.siteClock);
    for (const site of siteSet) {
      if (site !== exceptSite) {
        const thisClock = this.getClockOrZero(site);
        const thatClock = that.getClockOrZero(site);
        if (thisClock > thatClock) {
          allLessThanOrEqual = false;
          break;
        }
      }
    }
    return allLessThanOrEqual;
  }

  static keySet<K, V>(thisMap: Map<K, V>, thatMap: Map<K, V>): Set<K> {
    return new Set<K>([...thisMap.keys(), ...thatMap.keys()]);
  }

  concurrent(that: VClock): boolean {
    return !this.happenedBefore(that) && !that.happenedBefore(this);
  }

  get size(): number {
    return this.siteClock.size;
  }

  get entries(): ReadonlyMap<string, number> {
    return this.siteClock;
  }
}
