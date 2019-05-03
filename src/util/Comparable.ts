export enum Compare {
  LT = -1,
  EQ = 0,
  GT = 1
}

export interface Comparable {
  compareTo(that: Comparable): Compare.LT | Compare.EQ | Compare.GT;
}
