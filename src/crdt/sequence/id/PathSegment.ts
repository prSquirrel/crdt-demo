export class PathSegment {
  readonly value: number;
  readonly site: string;

  constructor(value: number, site: string) {
    this.value = value;
    this.site = site;
  }
}
