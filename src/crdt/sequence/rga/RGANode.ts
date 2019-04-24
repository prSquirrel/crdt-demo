import { Timestamp } from './Timestamp';
import { ValueSet } from '../../../util/ValueSet';
import { Comparable } from '../../../util/Comparable';

export abstract class RGANode<T> implements Comparable {
  readonly isParent: boolean;
  hidden: boolean;
  readonly timestamp: Timestamp;
  readonly happenedBefore: ValueSet<Timestamp>;
  element?: T;

  abstract readonly childrenAsc: RGANode<T>[];
  abstract compareTo(that: RGANode<T>): -1 | 0 | 1;

  constructor(
    isParent: boolean,
    hidden: boolean,
    timestamp: Timestamp,
    happenedBefore: ValueSet<Timestamp>,
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

  walkPreOrder(visit: (node: RGANode<T>) => void): void {
    const stack: RGANode<T>[] = [this];

    while (stack.length != 0) {
      const node = stack.pop();
      if (!node.hidden) {
        visit(node);
      }
      // since children are sorted by ascending timestamp
      // it will conveniently reverse them, resulting in correct order
      node.childrenAsc.forEach(sibling => {
        stack.push(sibling);
      });
    }
  }

  addSibling(newNode: RGANode<T>): void {
    const children = this.childrenAsc;

    if (this.isLeaf) {
      children.push(newNode);
    } else {
      // traverse in descending order
      for (let i = children.length; i-- > 0; ) {
        if (children[i].compareTo(newNode) < 0) {
          //current node precedes new node -> insert after current
          children.splice(i + 1, 0, newNode);
          break;
        }
      }
    }
  }

  hide(): void {
    this.hidden = true;
    this.element = undefined;
  }
}

export class RGABranchNode<T> extends RGANode<T> {
  readonly childrenAsc: RGABranchNode<T>[];

  constructor(element: T, timestamp: Timestamp, happenedBefore: ValueSet<Timestamp>) {
    super(false, false, timestamp, happenedBefore, element);
    this.childrenAsc = [];
  }

  compareTo(that: RGABranchNode<T>): -1 | 0 | 1 {
    if (that.happenedBefore.contains(this.timestamp)) {
      //this happened-before that
      return -1;
    } else if (this.happenedBefore.contains(that.timestamp)) {
      //that happened-before this
      return 1;
    }

    //otherwise concurrent
    return this.compareConcurrent(
      this.timestamp,
      this.happenedBefore,
      that.timestamp,
      that.happenedBefore
    );
  }

  // immutable
  // returns -1 if (timestamp1, history1) < (timestamp2, history2)
  // returns  1 if (timestamp2, history2) < (timestamp1, history1)
  // returns  0 otherwise (shouldn't happen in practice)
  private compareConcurrent(
    timestamp1: Timestamp,
    history1: ValueSet<Timestamp>,
    timestamp2: Timestamp,
    history2: ValueSet<Timestamp>
  ): -1 | 0 | 1 {
    const history1Copy = history1.clone();
    history1Copy.add(timestamp1);

    const history2Copy = history2.clone();
    history2Copy.add(timestamp2);

    const min1 = history1Copy.difference(history2).min();
    const min2 = history2Copy.difference(history1).min();

    return min1.compareTo(min2);
  }
}

export class RGAParentNode<T> extends RGANode<T> {
  readonly childrenAsc: RGABranchNode<T>[];

  constructor() {
    super(true, true, new Timestamp('', 0), new ValueSet());
    this.childrenAsc = [];
  }

  compareTo(that: RGABranchNode<T>): -1 {
    return -1;
  }
}
