export class Timestamp {
  readonly site: string;
  readonly clock: number;

  constructor(site: string, clock: number) {
    this.site = site;
    this.clock = clock;
  }

  get strId(): string {
    return this.clock + this.site;
  }
}
