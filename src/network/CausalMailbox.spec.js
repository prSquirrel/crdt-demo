// import Mailbox from './Mailbox';

test('', () => {});
// test('empty mailbox processes messages immediately', done => {
//   const sender = new Mailbox('sender');
//   const receiver = new Mailbox('receiver');
//   const payload = { key: 'value' };

//   sender.broadcast(payload, msg => {
//     const payloads = receiver.process(msg);
//     expect(payloads).toEqual([payload]);
//     done();
//   });
// });

// //todo: split these tests into two
// test('mailbox not yet ready to process message queues it', done => {
//   const sender = new Mailbox('sender');
//   const receiver = new Mailbox('receiver');
//   const firstPayload = { key: 'value1' };
//   const secondPayload = { key: 'value2' };

//   sender.broadcast(firstPayload, firstMsg => {
//     sender.broadcast(secondPayload, secondMsg => {
//       expect(receiver.process(secondMsg)).toEqual([]);
//     });
//     expect(receiver.process(firstMsg)).toEqual([firstPayload, secondPayload]);
//     done();
//   });
// });
