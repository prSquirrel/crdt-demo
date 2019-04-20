import { AtomId } from './AtomId';

export interface AtomIdAllocator {
  readonly site: string;

  allocate(clock: number, before: AtomId, after: AtomId): AtomId;
}
