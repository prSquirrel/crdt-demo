// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>
export = index;

declare namespace index {
  export class SplayList<T> {
    constructor();

    first(): Loc<T>;
    last(): Loc<T>;
    nth(index: number): Loc<T>;
    get(index: number): T;
    index(loc: Loc<T>): number;
    readonly length: number;
    pop(): T;
    push(...values: T[]): number;
    removeAt(loc: Loc<T>): void;
    removeRange(loc: Loc<T>, limit: number): void;
    set(index: number, value: T): void;
    shift(): T;
    insertAfter(loc: Loc<T>, value: T): Loc<T>;
    insertBefore(loc: Loc<T>, value: T): Loc<T>;
    slice(): T[];
    slice(from: number, until: number): T[];

    toString(): string;
  }

  export interface Loc<T> {
    val(): T;
    next(): Loc<T>;
    prev(): Loc<T>;
    skip(count: number, key: string): Loc<T>;
    toString(): string;
  }
}
