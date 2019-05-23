const capnp = require('capnp-ts');
const { Message } = require('./schema/schema');
const { Mailbox, MailboxEvents } = require('./Mailbox');
const { ClientEvents } = require('./Client');
const nanobus = require('nanobus');

const removeOpMsg = (clock, sourceSite, vclockEntries) => {
  const capnpMsg = new capnp.Message();
  const msg = capnpMsg.initRoot(Message);

  const opMsg = msg.initOperation();
  const vclock = opMsg.initVclock();

  vclock.setSite(sourceSite);

  const clockMap = vclock.initClockMap();
  const entries = clockMap.initEntries(Object.keys(vclockEntries).length);
  var idx = 0;
  for (const vclockSite in vclockEntries) {
    const vclockValue = vclockEntries[vclockSite];
    const entry = entries.get(idx);
    entry.setSite(vclockSite);
    entry.setClock(vclockValue);
    idx++;
  }

  const opStruct = opMsg.getOperation();
  opStruct.initRemove();
  const removeStruct = opStruct.getRemove();
  const ts = removeStruct.getTimestamp();
  ts.setSite('some-site');
  ts.setClock(clock);

  return capnpMsg;
};

test('mailbox processes ordered messages in the same order', done => {
  const client = nanobus();
  const b = new Mailbox('B', client);

  b.once(MailboxEvents.OP_RECEIVED, op => {
    expect(op.timestampToRemove.clock).toEqual(123);

    b.once(MailboxEvents.OP_RECEIVED, op => {
      expect(op.timestampToRemove.clock).toEqual(456);
      done();
    });
  });

  client.emit(ClientEvents.DATA, removeOpMsg(123, 'A', { A: 1, B: 0 }));
  client.emit(ClientEvents.DATA, removeOpMsg(456, 'A', { A: 2, B: 0 }));
});

test('mailbox restores order of messages from a single actor on out-of-order receipt', done => {
  const client = nanobus();
  const b = new Mailbox('B', client);

  b.once(MailboxEvents.OP_RECEIVED, op => {
    expect(op.timestampToRemove.clock).toEqual(1);

    b.once(MailboxEvents.OP_RECEIVED, op => {
      expect(op.timestampToRemove.clock).toEqual(2);
      done();
    });
  });

  client.emit(ClientEvents.DATA, removeOpMsg(2, 'A', { A: 2, B: 0 }));
  client.emit(ClientEvents.DATA, removeOpMsg(1, 'A', { A: 1, B: 0 }));
});

test('mailbox restores order of messages from different actors on out-of-order receipt', done => {
  const client = nanobus();
  const a = new Mailbox('A', client);

  a.once(MailboxEvents.OP_RECEIVED, op => {
    expect(op.timestampToRemove.clock).toEqual(1);

    a.once(MailboxEvents.OP_RECEIVED, op => {
      expect(op.timestampToRemove.clock).toEqual(2);
      done();
    });
  });

  client.emit(ClientEvents.DATA, removeOpMsg(2, 'B', { A: 0, B: 1, C: 1 }));
  client.emit(ClientEvents.DATA, removeOpMsg(1, 'C', { A: 0, B: 0, C: 1 }));
});

describe('mailbox orders concurrent messages by site id', () => {
  test('preserving order of dependent messages (site A received first)', done => {
    const client = nanobus();
    const b = new Mailbox('B', client);

    b.once(MailboxEvents.OP_RECEIVED, op => {
      expect(op.timestampToRemove.clock).toEqual(1);

      b.once(MailboxEvents.OP_RECEIVED, op => {
        expect(op.timestampToRemove.clock).toEqual(3);

        b.once(MailboxEvents.OP_RECEIVED, op => {
          expect(op.timestampToRemove.clock).toEqual(2);
          done();
        });
      });
    });

    client.emit(ClientEvents.DATA, removeOpMsg(3, 'A', { A: 2, B: 0, C: 0 }));
    client.emit(ClientEvents.DATA, removeOpMsg(2, 'C', { A: 0, B: 0, C: 1 }));
    client.emit(ClientEvents.DATA, removeOpMsg(1, 'A', { A: 1, B: 0, C: 0 }));
  });

  test('preserving order of dependent messages (site C received first)', done => {
    const client = nanobus();
    const b = new Mailbox('B', client);

    b.once(MailboxEvents.OP_RECEIVED, op => {
      expect(op.timestampToRemove.clock).toEqual(2);

      b.once(MailboxEvents.OP_RECEIVED, op => {
        expect(op.timestampToRemove.clock).toEqual(1);

        b.once(MailboxEvents.OP_RECEIVED, op => {
          expect(op.timestampToRemove.clock).toEqual(3);
          done();
        });
      });
    });

    client.emit(ClientEvents.DATA, removeOpMsg(3, 'C', { A: 0, B: 0, C: 2 }));
    client.emit(ClientEvents.DATA, removeOpMsg(2, 'A', { A: 1, B: 0, C: 0 }));
    client.emit(ClientEvents.DATA, removeOpMsg(1, 'C', { A: 0, B: 0, C: 1 }));
  });
});
