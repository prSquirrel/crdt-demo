import { Op, OpKind, InsertOp, RemoveOp } from './op/Op';
import { RGAParentNode, RGABranchNode, RGANode } from './RGANode';
import { Timestamp } from './Timestamp';
import { ValueSet } from '../../../util/ValueSet';
import { RGASeq } from './RGASeq';

export class RGATreeSeq<T> implements RGASeq<T> {
  private readonly site: string;
  private clock: number;

  private readonly root: RGAParentNode<T>;
  // since timestamps are uniquely ordered, Timestamp -> Node lookups can be cached
  private readonly cache: Map<string, RGANode<T>>;

  constructor(site: string) {
    this.site = site;
    this.clock = 0;

    this.root = new RGAParentNode();
    this.cache = new Map();
    this.cache.set(this.root.timestamp.toIdString(), this.root);
  }

  insert(value: T, position: number): InsertOp<T> {
    //TODO: bounds check

    const referenceNode: RGANode<T> = position == 0 ? this.root : this.get(position - 1);
    const newTimestamp = new Timestamp(this.site, ++this.clock);

    // all observed siblings of reference node at the moment of insertion
    const happenedBefore = ValueSet.of(referenceNode.childrenAsc.map(sibling => sibling.timestamp));
    const op = new InsertOp<T>(value, newTimestamp, happenedBefore, referenceNode.timestamp);
    this.applyInsert(op);
    return op;
  }

  remove(position: number): RemoveOp<T> {
    //TODO: bounds check
    const nodeToRemove = this.get(position);

    const op = new RemoveOp(nodeToRemove.timestamp);
    this.applyRemove(op);
    return op;
  }

  // TODO: this is O(N) now, use weight-balanced tree later
  // returns undefined if tree is empty
  private get(position: number): RGANode<T> {
    const preOrderArray = this.toPreOrderArray();
    return preOrderArray[position];
  }

  toPreOrderArray(): RGANode<T>[] {
    const elements: RGANode<T>[] = [];
    if (this.root) {
      this.root.walkPreOrder(node => {
        if (!node.hidden) elements.push(node);
      });
    }
    return elements;
  }

  toArray(): T[] {
    return this.toPreOrderArray().map(node => node.element);
  }

  //TODO: this could use special tombstone operation. Tombstone = Insert+Remove
  getHistory(): Op<T>[] {
    const insertHistory: InsertOp<T>[] = [];
    const removeHistory: RemoveOp<T>[] = [];

    if (this.root) {
      this.root.walkBreadthFirst(node => {
        const insert = new InsertOp<T>(
          node.element,
          node.timestamp,
          node.happenedBefore,
          node.parent.timestamp
        );
        insertHistory.push(insert);
        if (node.hidden) {
          const remove = new RemoveOp<T>(node.timestamp);
          removeHistory.push(remove);
        }
      });
    }
    return [...insertHistory, ...removeHistory];
  }

  apply(op: Op<T>): void {
    switch (op.kind) {
      case OpKind.Insert:
        this.applyInsert(<InsertOp<T>>op);
        break;

      case OpKind.Remove:
        this.applyRemove(<RemoveOp<T>>op);
        break;

      default:
        throw new Error(`Unknown operation ${op.kind}`);
    }
  }

  private applyInsert(insert: InsertOp<T>): void {
    const referenceNode = this.cache.get(insert.referenceTimestamp.toIdString());
    const newNode = new RGABranchNode<T>(
      insert.value,
      insert.timestamp,
      insert.happenedBefore,
      referenceNode
    );
    referenceNode.addSibling(newNode);
    this.cache.set(newNode.timestamp.toIdString(), newNode);
  }

  private applyRemove(remove: RemoveOp<T>): void {
    const idStr = remove.timestampToRemove.toIdString();
    const nodeToRemove = this.cache.get(idStr);
    nodeToRemove.hide();
    // TODO: Is it worth deleting hidden nodes from cache, and performing expensive search
    //       in an event somebody inserts a character
    //       after the node was removed from cache?
    // this.cache.delete(idStr);
  }
}
