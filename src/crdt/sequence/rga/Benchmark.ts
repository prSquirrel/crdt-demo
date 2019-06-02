import { RGATreeSeq } from './RGATreeSeq';
import { Chance } from 'chance';
import { InsertOp, RemoveOp } from './op/Op';

export class MemoryBenchmark {
  private static readonly char = '+';
  private static readonly site = 'ASDWQQOJDASNXX@asdqa';
  private seq = new RGATreeSeq<string>(MemoryBenchmark.site);

  resetAndFill(size: number): void {
    this.reset();
    this.fill(size);
  }

  fill(size: number): void {
    for (let i = 0; i < size; i++) {
      this.seq.insert(MemoryBenchmark.char, i);
    }
  }

  reset(): void {
    this.seq = new RGATreeSeq<string>('ASDWQQOJDASNXX@asdqa');
  }
}

export class Benchmark {
  private chance = new Chance();
  private static readonly char = '+';
  private profileCpu = true;

  runUpstreamBenchmark(): void {
    //insert
    //  append
    this.upstreamInsertAppend(100);
    this.upstreamInsertAppend(1000);
    this.upstreamInsertAppend(10000);
    this.upstreamInsertAppend(100000);
    //  prepend
    this.upstreamInsertPrepend(100);
    this.upstreamInsertPrepend(1000);
    // TODO: fix these perf. problems
    // this.upstreamInsertPrepend(10000);
    // this.upstreamInsertPrepend(100000);

    //  random
    this.upstreamInsertRandom(100);
    this.upstreamInsertRandom(1000);
    this.upstreamInsertRandom(10000);
    this.upstreamInsertRandom(100000);

    //delete
    // first
    this.upstreamDeleteFirst(100);
    this.upstreamDeleteFirst(1000);
    this.upstreamDeleteFirst(10000);
    this.upstreamDeleteFirst(100000);
    // last
    this.upstreamDeleteLast(100);
    this.upstreamDeleteLast(1000);
    this.upstreamDeleteLast(10000);
    this.upstreamDeleteLast(100000);
    // random
    this.upstreamDeleteRandom(100);
    this.upstreamDeleteRandom(1000);
    this.upstreamDeleteRandom(10000);
    this.upstreamDeleteRandom(100000);
  }

  runDownstreamBenchmark(): void {
    //insert
    //  random
    this.downstreamInsertRandom(100);
    this.downstreamInsertRandom(1000);
    this.downstreamInsertRandom(10000);
    this.downstreamInsertRandom(100000);

    //delete
    // random
    this.downstreamDeleteRandom(100);
    this.downstreamDeleteRandom(1000);
    this.downstreamDeleteRandom(10000);
    this.downstreamDeleteRandom(100000);
  }

  private startProfile(name: string): void {
    console.log(`Starting profiling ${name}`);
    if (this.profileCpu) {
      console.timeStamp(name);
      (window as any).profile(name);
    }
  }

  private endProfile(): void {
    if (this.profileCpu) (window as any).profileEnd();
  }

  upstreamInsertAppend(size: number): void {
    this.startProfile(`upstream-insert-append-${size}`);
    const seq = this.createSeq();
    for (let i = 0; i < size; i++) {
      seq.insert(Benchmark.char, i);
    }
    this.endProfile();
  }

  upstreamInsertPrepend(size: number): void {
    this.startProfile(`upstream-insert-prepend-${size}`);
    const seq = this.createSeq();
    for (let i = 0; i < size; i++) {
      seq.insert(Benchmark.char, 0);
    }
    this.endProfile();
  }

  upstreamInsertRandom(size: number): void {
    this.startProfile(`upstream-insert-random-${size}`);
    const seq = this.createSeq();
    for (let maxIndex = 0; maxIndex < size; maxIndex++) {
      const index = this.chance.integer({ min: 0, max: maxIndex });
      seq.insert(Benchmark.char, index);
    }
    this.endProfile();
  }

  downstreamInsertRandom(size: number): void {
    //prepare
    const ops: InsertOp<string>[] = [];
    {
      const tempSeq = this.createSeq();
      for (let maxIndex = 0; maxIndex < size; maxIndex++) {
        const index = this.chance.integer({ min: 0, max: maxIndex });
        ops.push(tempSeq.insert(Benchmark.char, index));
      }
    }
    //execute
    this.startProfile(`downstream-insert-random-${size}`);
    const seq = this.createSeq();
    ops.forEach(op => {
      seq.apply(op);
    });
    this.endProfile();
  }

  upstreamDeleteFirst(size: number): void {
    //prepare
    const seq = this.createSeqAndFill(size);
    //execute
    this.startProfile(`upstream-delete-first-${size}`);
    for (let i = 0; i < size; i++) {
      seq.remove(0);
    }
    this.endProfile();
  }

  upstreamDeleteLast(size: number): void {
    //prepare
    const seq = this.createSeqAndFill(size);
    //execute
    this.startProfile(`upstream-delete-last-${size}`);
    for (let i = size - 1; i >= 0; i--) {
      seq.remove(i);
    }
    this.endProfile();
  }

  upstreamDeleteRandom(size: number): void {
    //prepare
    const seq = this.createSeqAndFill(size);
    //execute
    this.startProfile(`upstream-delete-random-${size}`);
    for (let maxIndex = size - 1; maxIndex >= 0; maxIndex--) {
      const index = this.chance.integer({ min: 0, max: maxIndex });
      seq.remove(index);
    }
    this.endProfile();
  }

  downstreamDeleteRandom(size: number): void {
    //prepare
    const insertOps: InsertOp<string>[] = [];
    const removeOps: RemoveOp<string>[] = [];
    {
      const tempSeq = this.createSeq();
      for (let maxIndex = 0; maxIndex < size; maxIndex++) {
        const index = this.chance.integer({ min: 0, max: maxIndex });
        insertOps.push(tempSeq.insert(Benchmark.char, index));
      }
      for (let maxIndex = size - 1; maxIndex >= 0; maxIndex--) {
        const index = this.chance.integer({ min: 0, max: maxIndex });
        removeOps.push(tempSeq.remove(index));
      }
    }
    const seq = this.createSeq();
    insertOps.forEach(op => {
      seq.apply(op);
    });

    //execute
    this.startProfile(`downstream-delete-random-${size}`);
    removeOps.forEach(op => {
      seq.apply(op);
    });
    this.endProfile();
  }

  private createSeqAndFill(size: number): RGATreeSeq<string> {
    const seq = this.createSeq();
    for (let i = 0; i < size; i++) {
      seq.insert(Benchmark.char, i);
    }
    return seq;
  }

  private createSeq(): RGATreeSeq<string> {
    const site = this.chance.string({ length: 20 });
    return new RGATreeSeq<string>(site);
  }
}
