import { TimestampSet } from './TimestampSet';
import { Timestamp } from './Timestamp';

export abstract class RGANode<T> {
  readonly isParent: boolean;
  hidden: boolean;
  readonly timestamp: Timestamp;
  readonly happenedBefore: TimestampSet;
  element?: T;

  abstract readonly childrenAsc: RGANode<T>[];
  abstract compare(that: RGANode<T>): 1 | -1 | 0;

  constructor(
    isParent: boolean,
    hidden: boolean,
    timestamp: Timestamp,
    happenedBefore: TimestampSet,
    element?: T
  ) {
    this.isParent = isParent;
    this.hidden = hidden;
    this.timestamp = timestamp;
    this.happenedBefore = happenedBefore;
    this.element = element;
  }

  get isLeaf(): boolean {
    return this.childrenAsc.length == 0;
  }

  get childrenDesc(): RGANode<T>[] {
    const children = this.childrenAsc;

    const desc = [];
    for (let i = children.length; i-- > 0; ) {
      desc.push(children[i]);
    }
    return desc;
  }

  // not stack-safe
  walkPreOrder(fn: (node: RGANode<T>) => void): void {
    if (!this.hidden) {
      fn(this);
    }
    this.childrenDesc.forEach(sibling => sibling.walkPreOrder(fn));
  }

  addSibling(newNode: RGANode<T>): void {
    const children = this.childrenAsc;

    if (this.isLeaf) {
      children.push(newNode);
    } else {
      // traverse in descending order
      for (let i = children.length; i-- > 0; ) {
        if (children[i].compare(newNode) < 0) {
          //current node precedes new node -> insert after current
          children.splice(i + 1, 0, newNode);
          break;
        }
      }
    }
  }
}

export class RGABranchNode<T> extends RGANode<T> {
  readonly childrenAsc: RGABranchNode<T>[];

  constructor(element: T, timestamp: Timestamp, happenedBefore: TimestampSet) {
    super(false, false, timestamp, happenedBefore, element);
    this.childrenAsc = [];
  }

  compare(that: RGABranchNode<T>): 1 | -1 | 0 {
    if (that.happenedBefore.contains(this.timestamp)) {
      //this happened-before that
      return -1;
    } else if (this.happenedBefore.contains(that.timestamp)) {
      //that happened-before this
      return 1;
    }

    //otherwise concurrent
    return TimestampSet.compareConcurrent(
      this.timestamp,
      this.happenedBefore,
      that.timestamp,
      that.happenedBefore
    );
  }
}

export class RGAParentNode<T> extends RGANode<T> {
  readonly childrenAsc: RGABranchNode<T>[];

  constructor() {
    super(true, true, new Timestamp('', 0), TimestampSet.empty);
    this.childrenAsc = [];
  }

  compare(that: RGABranchNode<T>): -1 {
    return -1;
  }
}
