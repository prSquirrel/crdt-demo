import { AtomIdAllocator } from './AtomIdAllocator';
import { AtomId } from './AtomId';
import { PathSegment } from './PathSegment';

export class LSEQAtomIdAllocator implements AtomIdAllocator {
  readonly site: string;

  private readonly baseWidth: number;
  private readonly maxDistance: number;
  private strategies: LSEQStrategy[];
  private first: AtomId;
  private last: AtomId;

  constructor(site: string, baseWidth: number = 4, maxDistance: number = 10) {
    this.site = site;
    this.baseWidth = baseWidth;
    this.maxDistance = maxDistance;
    this.strategies = [];
  }

  allocate(clock: number, before: AtomId, after: AtomId): AtomId {
    if (!before) before = this.allocateFirst();
    if (!after) after = this.allocateLast();

    let distance = 0;
    let depth = -1;
    let min = 0;
    let max = 0;

    while (distance < 1) {
      depth++;

      const left = before.getPathSegment(depth);
      const right = after.getPathSegment(depth);
      min = left ? left.value : 0;
      max = right ? right.value : this.getWidthAtDepth(depth);
      distance = max - min - 1;
    }

    let path = [];
    for (let i = 0; i < depth; i++) {
      path.push(before.getPathSegment(i) || new PathSegment(0, this.site));
    }

    const strategy = this.getStrategyAtDepth(depth);
    const boundary = Math.min(distance, this.maxDistance);
    const delta = Math.floor(Math.random() * boundary) + 1;
    if (strategy == LSEQStrategy.AddFromLeft) {
      path.push(new PathSegment(min + delta, this.site));
    } else if (strategy == LSEQStrategy.SubtractFromRight) {
      path.push(new PathSegment(max - delta, this.site));
    }

    return new AtomId(clock, path);
  }

  private allocateFirst(): AtomId {
    if (!this.first) {
      const segment = new PathSegment(0, this.site);
      this.first = new AtomId(0, [segment]);
    }
    return this.first;
  }

  private allocateLast(): AtomId {
    if (!this.last) {
      const maxValue = this.getWidthAtDepth(0);
      const segment = new PathSegment(maxValue, this.site);
      this.last = new AtomId(0, [segment]);
    }
    return this.last;
  }

  //assuming base-2 tree
  private getWidthAtDepth(depth: number): number {
    const power = Math.min(53, depth + this.baseWidth);
    return 2 ** power - 1;
  }

  private getStrategyAtDepth(depth: number): LSEQStrategy {
    const existingStrategy = this.strategies[depth];
    if (!existingStrategy) {
      const random = ((Math.random() * 2) | 0) + 1;
      const randomStrategy = <LSEQStrategy>random;
      return randomStrategy;
    } else {
      return existingStrategy;
    }
  }
}

enum LSEQStrategy {
  AddFromLeft = 1,
  SubtractFromRight = 2
}
