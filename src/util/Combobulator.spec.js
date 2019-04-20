const { diff, Insert, Remove } = require('./Combobulator');

test('insert single character at caret position (beginning of string)', () => {
  //| -> A|
  const ops = diff('', 'A', 0, 0);

  expect(ops).toEqual([new Insert('A', 0)]);
});

test('prepend single character at caret position', () => {
  //|A -> X|A
  const ops = diff('A', 'XA', 0, 0);

  expect(ops).toEqual([new Insert('X', 0)]);
});

test('insert single character at caret position (end of string)', () => {
  //AB| -> ABC|
  const ops = diff('AB', 'ABC', 2, 2);

  expect(ops).toEqual([new Insert('C', 2)]);
});

test('remove single character at caret position', () => {
  //ABC| -> AB|
  const ops = diff('ABC', 'AB', 3, 3);

  expect(ops).toEqual([new Remove(2)]);
});

test('remove multiple characters in selection', () => {
  //A[BC] -> A|
  const ops = diff('ABC', 'A', 1, 3);

  expect(ops).toEqual([new Remove(1), new Remove(1)]);
});

test('paste multiple characters at caret position', () => {
  //A| -> ABC|
  const ops = diff('A', 'ABC', 1, 1);

  expect(ops).toEqual([new Insert('B', 1), new Insert('C', 2)]);
});

test('remove multiple characters in the middle of a string', () => {
  //A[BC]D -> A|D
  const ops = diff('ABCD', 'AD', 1, 3);

  expect(ops).toEqual([new Remove(1), new Remove(1)]);
});

test('replace two characters with one', () => {
  //A[BC]D -> AX|D
  const ops = diff('ABCD', 'AXD', 1, 3);

  expect(ops).toEqual([new Remove(1), new Insert('X', 1), new Remove(2)]);
});

test('replace two characters with two (paste)', () => {
  //A[BC]D -> AXZ|D
  const ops = diff('ABCD', 'AXZD', 1, 3);

  expect(ops).toEqual([new Remove(1), new Insert('X', 1), new Remove(2), new Insert('Z', 2)]);
});

test('replace two characters with three (paste)', () => {
  //A[BC]D -> AXYZ|D
  const ops = diff('ABCD', 'AXYZD', 1, 3);

  expect(ops).toEqual([
    new Remove(1),
    new Insert('X', 1),
    new Remove(2),
    new Insert('Y', 2),
    new Insert('Z', 3)
  ]);
});

test('do nothing for same characters', () => {
  //A[BC]D -> ABC|D
  expect(diff('ABCD', 'ABCD', 1, 3)).toEqual([]);

  //A[BC]D -> ABX|D
  expect(diff('ABCD', 'ABXD', 1, 3)).toEqual([new Remove(2), new Insert('X', 2)]);
});
