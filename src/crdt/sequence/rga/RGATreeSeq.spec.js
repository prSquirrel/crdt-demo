import { RGATreeSeq } from './RGATreeSeq';

const user1 = new RGATreeSeq('a');
const user2 = new RGATreeSeq('b');

const asStr = tree => tree.toArray().join('');
const applyOps = (user, ops) => ops.forEach(op => user.apply(op));

test('groups characters from same session together after concurrent editing', () => {
  // Both users start from 'Hello!'
  const hello = [...'Hello!'].map((c, idx) => user1.insert(c, idx));
  applyOps(user2, hello);
  expect(asStr(user1)).toEqual('Hello!');
  expect(asStr(user2)).toEqual('Hello!');

  // User 1: insert ' reader' between 'Hello' and '!'
  const reader = [...' reader'].map((c, idx) => user1.insert(c, idx + 5));
  expect(asStr(user1)).toEqual('Hello reader!');

  // User 2: insert ' Alice' between 'Hello' and '!'
  const alice = [...' Alice'].map((c, idx) => user2.insert(c, idx + 5));
  expect(asStr(user2)).toEqual('Hello Alice!');

  // Sync user 1 to user 2
  applyOps(user2, reader);
  expect(asStr(user2)).toEqual('Hello reader Alice!');

  // User 1: insert ' dear' between 'Hello' and ' reader!'
  const dear = [...' dear'].map((c, idx) => user1.insert(c, idx + 5));
  expect(asStr(user1)).toEqual('Hello dear reader!');

  // Sync user 1 to user 2 again
  applyOps(user2, dear);
  expect(asStr(user2)).toEqual('Hello dear reader Alice!');

  // Sync user 2 to user 1
  applyOps(user1, alice);
  expect(asStr(user1)).toEqual('Hello dear reader Alice!');
});
