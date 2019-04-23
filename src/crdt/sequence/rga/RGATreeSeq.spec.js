import { RGATreeSeq } from './RGATreeSeq';

const user0 = new RGATreeSeq('user0');
const user1 = new RGATreeSeq('b');
const user2 = new RGATreeSeq('a');

const treeToString = tree => tree.toArray().join('');

const printTree = tree => {
  console.log('Tree:');
  console.log(tree);
  console.log('Pre-order traversal:');
  console.log(tree.toPreOrderArray());
  console.log('Array of elements:');
  console.log(tree.toArray());
  console.log('String:');
  console.log(treeToString(tree));
};

test('integration test', () => {
  //both start from 'Hello!' inserted by
  const hello = [...'Hello!'].map((c, idx) => user0.insert(c, idx));
  hello.forEach(op => user1.apply(op));
  printTree(user1);
  hello.forEach(op => user2.apply(op));
  printTree(user2);

  //USER 1: insert ' reader' between 'Hello' and '!'
  const reader = [...' reader'].map((c, idx) => user1.insert(c, idx + 5));
  printTree(user1);

  //USER 2: insert ' Alice' between 'Hello' and '!'
  const alice = [...' Alice'].map((c, idx) => user2.insert(c, idx + 5));
  printTree(user2);

  //sync USER 1 to USER 2
  reader.forEach(op => user2.apply(op));
  printTree(user2);

  //USER 1: insert ' dear' between 'Hello' and ' reader!'
  const dear = [...' dear'].map((c, idx) => user1.insert(c, idx + 5));
  printTree(user1);

  //sync USER 1 to USER 2 again
  dear.forEach(op => user2.apply(op));
  printTree(user2);

  //sync USER 2 to USER 1
  alice.forEach(op => user1.apply(op));
  printTree(user1);
});
