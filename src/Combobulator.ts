import { Seq } from './crdt/sequence/Seq';
import { Op, InsertOp, RemoveOp } from './crdt/sequence/op/Op';

export interface TextOp {
  applyTo(textSeq: Seq<string>): Op;
}

export class Insert implements TextOp {
  readonly value: string;
  readonly position: number;

  constructor(value: string, position: number) {
    this.value = value;
    this.position = position;
  }

  applyTo(textSeq: Seq<string>): InsertOp<string> {
    return textSeq.insert(this.value, this.position);
  }
}

export class Remove implements TextOp {
  readonly position: number;

  constructor(position: number) {
    this.position = position;
  }

  applyTo(textSeq: Seq<string>): RemoveOp {
    return textSeq.remove(this.position);
  }
}

export function diff(
  textBefore: string,
  textAfter: string,
  selectionStart: number,
  selectionEnd: number
): TextOp[] {
  // transform caret into backwards selection of unit width
  if (selectionStart == selectionEnd && selectionStart > 0) {
    selectionStart--;
  }

  const selectionLength = selectionEnd - selectionStart;
  const textLengthChange = textAfter.length - textBefore.length;

  const textAfterSelectionStart = selectionStart;
  const textAfterSelectionEnd = textAfterSelectionStart + selectionLength + textLengthChange;

  // Isolate changed parts
  const textBeforeChangedSegment = textBefore.slice(selectionStart, selectionEnd);
  const textAfterChangedSegment = textAfter.slice(textAfterSelectionStart, textAfterSelectionEnd);

  const maxBoundary = Math.max(textBeforeChangedSegment.length, textAfterChangedSegment.length);

  const operations: TextOp[] = [];
  let offsetDueToPreviousUnbalancedOperation = 0;
  for (let index = 0; index < maxBoundary; index++) {
    const beforeChar = textBeforeChangedSegment[index];
    const afterChar = textAfterChangedSegment[index];

    const absoluteIndex = selectionStart + index;
    if (beforeChar != null) {
      if (afterChar != null) {
        if (beforeChar == afterChar) {
          //do nothing
        } else {
          //remove and insert (overwrite)
          operations.push(new Remove(absoluteIndex), new Insert(afterChar, absoluteIndex));
        }
      } else {
        //remove
        operations.push(new Remove(absoluteIndex + offsetDueToPreviousUnbalancedOperation));
        offsetDueToPreviousUnbalancedOperation -= 1;
      }
    } else {
      if (afterChar != null) {
        //insert
        operations.push(new Insert(afterChar, absoluteIndex));
        offsetDueToPreviousUnbalancedOperation += 1;
      } else {
        //do nothing
      }
    }
  }

  return operations;
}
