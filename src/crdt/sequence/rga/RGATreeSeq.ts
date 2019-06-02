import { Op, OpKind, InsertOp, RemoveOp } from './op/Op';
import { RGAParentNode, RGABranchNode, RGANode } from './RGANode';
import { Timestamp } from './Timestamp';
import { ValueSet } from '../../../util/ValueSet';
import { RGASeq } from './RGASeq';
import { SplayList, Loc } from './splaylist';

export class RGATreeSeq<T> implements RGASeq<T> {
  private readonly site: string;
  private clock: number;

  private readonly root: RGAParentNode<T>;
  private readonly identifiers: SplayList<RGANode<T>>;
  // since timestamps are unique, Timestamp -> Node lookups can be cached
  private readonly cache: Map<string, Loc<RGANode<T>>>;

  constructor(site: string) {
    this.site = site;
    this.clock = 0;

    const root = new RGAParentNode<T>();
    this.root = root;

    const identifiers = new SplayList<RGANode<T>>();
    identifiers.push(root);
    this.identifiers = identifiers;

    this.cache = new Map();
    this.cache.set(root.timestamp.toIdString(), identifiers.first());
  }

  insert(value: T, position: number): InsertOp<T> {
    //TODO: bounds check

    const referenceNode: RGANode<T> = this.get(position);
    const newTimestamp = new Timestamp(this.site, ++this.clock);

    // all observed siblings of reference node at the moment of insertion
    const happenedBefore = ValueSet.of(referenceNode.childrenAsc.map(sibling => sibling.timestamp));
    const op = new InsertOp<T>(value, newTimestamp, happenedBefore, referenceNode.timestamp);
    this.applyInsert(op);
    return op;
  }

  remove(position: number): RemoveOp<T> {
    //TODO: bounds check

    // + 1 since there always exists a root node, and we do not want to remove that
    const nodeToRemove = this.get(position + 1);

    const op = new RemoveOp(nodeToRemove.timestamp);
    this.applyRemove(op);
    return op;
  }

  private get(position: number): RGANode<T> {
    return this.identifiers.get(position);
  }

  toArray(): T[] {
    return this.identifiers.slice(1).map(node => node.element);
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
    const referenceNodeLoc = this.cache.get(insert.referenceTimestamp.toIdString());
    const referenceNode = referenceNodeLoc.val();
    const newNode = new RGABranchNode<T>(
      insert.value,
      insert.timestamp,
      insert.happenedBefore,
      referenceNode
    );
    referenceNode.addSibling(newNode);
    const newNodeLoc = this.insertIdentifier(referenceNode, newNode);
    this.cache.set(newNode.timestamp.toIdString(), newNodeLoc);
  }

  private insertIdentifier(reference: RGANode<T>, newNode: RGANode<T>): Loc<RGANode<T>> {
    const commonParent = reference.findCommonVisibleParent();

    let anchor: RGANode<T>;
    commonParent.walkPreOrder(node => {
      if (!node.hidden && node != newNode) {
        anchor = node;
      }
      return node != newNode;
    });

    if (anchor) {
      const anchorLoc = this.cache.get(anchor.timestamp.toIdString());
      return this.identifiers.insertAfter(anchorLoc, newNode);
    } else {
      return this.identifiers.insertAfter(this.identifiers.first(), newNode);
    }
  }

  private applyRemove(remove: RemoveOp<T>): void {
    const idStr = remove.timestampToRemove.toIdString();
    const nodeToRemoveLoc = this.cache.get(idStr);
    this.removeIdentifier(nodeToRemoveLoc);
    const nodeToRemove = nodeToRemoveLoc.val();
    nodeToRemove.hide();
    // TODO: Is it worth deleting hidden nodes from cache, and performing expensive search
    //       in an event somebody inserts a character
    //       after the node was removed from cache?
    // this.cache.delete(idStr);
  }

  private removeIdentifier(reference: Loc<RGANode<T>>): void {
    if (!reference.val().hidden) {
      // if it is not hidden, it must exist in identifier structure
      this.identifiers.removeAt(reference);
    }
  }
}
