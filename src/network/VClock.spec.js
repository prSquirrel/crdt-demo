const { VClock } = require('./VClock');

describe('getClock', () => {
  test('returns 0 for non-existing site', () => {
    const vclock = VClock.create('site');
    const clock = vclock.getClock('some-other-site');
    expect(clock).toBe(0);
  });
});

describe('increment', () => {
  test('increases clock of current site by 1', () => {
    const vclock = VClock.create('site');
    expect(vclock.getClock('site')).toBe(0);
    vclock.increment();
    expect(vclock.getClock('site')).toBe(1);
  });
});

describe('merge', () => {
  test('combines second clock into first', () => {
    const a = VClock.create('a');
    a.increment();
    const b = VClock.create('b');
    b.increment();

    a.merge(b);

    expect(a.site).toBe('a');
    expect(a.getClock('a')).toBe(1);
    expect(a.getClock('b')).toBe(1);
  });

  test('(1) when merging same site clocks takes highest of the two', () => {
    const a1 = VClock.create('a');
    a1.increment();
    a1.increment();
    const a2 = VClock.create('a');
    a2.increment();

    a1.merge(a2);

    expect(a1.getClock('a')).toBe(2);
  });

  test('(2) when merging same site clocks takes highest of the two', () => {
    const a1 = VClock.create('a');
    a1.increment();
    a1.increment();
    const a2 = VClock.create('a');
    a2.increment();

    a2.merge(a1);

    expect(a2.getClock('a')).toBe(2);
  });
});

const parseTableEntry = pairs => {
  return pairs.split(',').map(x => {
    const [site, strClock] = x.split(':');
    const clock = parseInt(strClock);
    return site ? [site, clock] : [];
  });
};

describe('happenedBefore', () => {
  test.each`
    a            | b            | expected
    ${'a:1'}     | ${'a:1,b:1'} | ${true}
    ${'a:1'}     | ${'a:1,b:2'} | ${true}
    ${'a:1'}     | ${'a:2,b:1'} | ${true}
    ${'a:1'}     | ${'a:2,b:2'} | ${true}
    ${'a:1,b:1'} | ${'a:2,b:1'} | ${true}
    ${'a:1,b:1'} | ${'a:2,b:2'} | ${true}
    ${'a:1'}     | ${'b:1'}     | ${false}
    ${'a:2'}     | ${'a:1,b:1'} | ${false}
  `('returns $expected when $a is compared to $b for causality', ({ a, b, expected }) => {
    const clockA = new VClock('a', new Map(parseTableEntry(a)));
    const clockB = new VClock('b', new Map(parseTableEntry(b)));
    expect(clockA.happenedBefore(clockB)).toBe(expected);
  });

  test('same clocks are not comparable', () => {
    const a1 = VClock.create('a');
    const a2 = VClock.create('a');
    expect(a1.happenedBefore(a2)).toBe(false);
    a1.increment();
    a2.increment();
    expect(a1.happenedBefore(a2)).toBe(false);
  });

  test('concurrent clocks are not comparable', () => {
    const a = VClock.create('a');
    const b = VClock.create('b');
    a.increment();
    b.increment();
    expect(a.happenedBefore(b)).toBe(false);
  });
});

describe('concurrent', () => {
  test.each`
    a            | b            | expected
    ${'a:1'}     | ${'b:1'}     | ${true}
    ${'a:1,b:1'} | ${'b:1,c:1'} | ${true}
    ${'a:1,b:1'} | ${'a:1'}     | ${false}
  `('returns $expected when $a is compared to $b for concurrency', ({ a, b, expected }) => {
    const clockA = new VClock('a', new Map(parseTableEntry(a)));
    const clockB = new VClock('b', new Map(parseTableEntry(b)));
    expect(clockA.concurrent(clockB)).toBe(expected);
  });
});

describe('compareTo', () => {
  test.each`
    a            | b            | expected
    ${'a:1'}     | ${'a:1,b:1'} | ${-1}
    ${'a:1,b:1'} | ${'a:1'}     | ${1}
  `('returns $expected when $a is compared to $b', ({ a, b, expected }) => {
    const clockA = new VClock('a', new Map(parseTableEntry(a)));
    const clockB = new VClock('b', new Map(parseTableEntry(b)));
    expect(clockA.compareTo(clockB)).toBe(expected);
  });

  test('concurrent clocks are compared by site identifier', () => {
    const a = VClock.create('a');
    const b = VClock.create('b');
    a.increment();
    b.increment();

    expect(a.compareTo(b)).toBe(-1);
    expect(b.compareTo(a)).toBe(1);
  });

  test('concurrent clocks with same site identifier are equal', () => {
    const a1 = VClock.create('a');
    const a2 = VClock.create('a');
    a1.increment();
    a2.increment();

    expect(a1.compareTo(a2)).toBe(0);
  });
});
