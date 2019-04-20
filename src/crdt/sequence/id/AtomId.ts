import { PathSegment } from './PathSegment';

export class AtomId {
  private readonly clock: number;
  private readonly path: PathSegment[];

  constructor(clock: number, path: PathSegment[]) {
    this.clock = clock;
    this.path = path;
  }

  getPathSegment(depth: number): PathSegment {
    return this.path[depth];
  }

  //returns -1 if this id is lesser, 1 if greater, 0 if equal
  compare(other: AtomId): number {
    const maxDepth = Math.max(this.path.length, other.path.length);
    for (let i = 0; i < maxDepth; i++) {
      const my = this.getPathSegment(i);
      const their = other.getPathSegment(i);
      if (my === undefined && their !== undefined) return -1;
      if (my !== undefined && their === undefined) return 1;
      if (my.value < their.value) return -1;
      if (my.value > their.value) return 1;
      if (my.site < their.site) return -1;
      if (my.site > their.site) return 1;
    }
    if (this.clock < other.clock) return -1;
    if (this.clock > other.clock) return 1;
    return 0;
  }

  //todo: put under encoder
  asString(): string {
    let prevSite: string = undefined;
    let path = this.path.map(segment => {
      const site = segment.site;
      const value = segment.value;

      if (site == prevSite) {
        return `${value}`;
      } else {
        prevSite = site;
        return `${value}:${site}`;
      }
    });
    return `${this.clock}#${path.join('.')}`;
  }
}
