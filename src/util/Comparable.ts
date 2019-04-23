export interface Comparable {
  compareTo(that: Comparable): -1 | 0 | 1;
}
