/* eslint-disable no-use-before-define */

import io from 'socket.io-client';
// import Peer from 'simple-peer';
import SimpleSignalClient from 'simple-signal-client';
import EventEmitter from 'nanobus';
import VClock from './purescript/VClock.purs';
import Util from './purescript/Util.purs';
import Mailbox from './Mailbox';

export default class Client extends EventEmitter {
  constructor() {
    super();

    this.socket = io.connect(
      'https://localhost:8443',
      { 'connect timeout': 10000, 'force new connection': true }
    );

    this.socket.on('connect', () => {
      this.emit('id_assigned', this.id());
    });

    if (!this.socket) {
      throw new Error('io.connect failed');
    } else {
      console.debug('allocated socket ', this.socket);
    }

    this.signalClient = new SimpleSignalClient(this.socket); // Uses an existing socket.io-client instance

    this.clock = VClock.initial;

    const registerPeerHandlers = peer => {
      peer.on('data', payload => {
        const [msgClock, data] = JSON.parse(payload);
        const parsedMsgClock = Util.fromRight(VClock.fromJson(msgClock));
        //merging step should be done only after processing message
        this.mergeClock(parsedMsgClock);

        console.log(`RCVD clock ${msgClock}`);
        console.log(`RCVD data ${data}`);
        this.emit('data', data);
      });
      peer.on('close', () => {
        console.debug(`Closed channel`);
        this.emit('close');
      });
      peer.on('error', err => {
        console.log(`Channel error: ${err}`);
        this.emit('error', err);
      });
      peer.on('connect', () => {
        console.log('Connected');
        this.emit('connect');
      });
    };

    this.signalClient.on('discover', async allIds => {
      console.debug(`All ids: ${JSON.stringify(allIds)}`);

      const peerOptions = {};
      const nonLocalIds = allIds.filter(id => id !== this.id());
      const connections = nonLocalIds.map(id =>
        this.signalClient
          .connect(
            id,
            {},
            peerOptions
          )
          .then(({ peer, metadata }) => {
            registerPeerHandlers(peer);
          })
      );
      return Promise.all(connections); // (initiator side)
    });

    this.signalClient.on('request', async request => {
      const { peer } = await request.accept(); // Accept the incoming request
      console.log(`Accepted ${JSON.stringify(peer)}`);
      registerPeerHandlers(peer);
      return peer; // this is a fully-signaled simple-peer object (non-initiator side)
    });
  }

  connect() {
    this.signalClient.discover();
  }

  broadcastToConnectedPeers(data) {
    const peers = this.signalClient.peers();
    // console.log(JSON.stringify(peers));
    this.advanceClock();
    peers.forEach(peer => {
      this.sendMessage(peer, data);
    });
  }

  sendMessage(peer, data) {
    const serializedClock = VClock.asJson(this.clock);
    const payload = [serializedClock, data];
    console.log(`Broadcasting ${payload}`);
    peer.send(JSON.stringify(payload));
    // console.log(JSON.stringify(peer));
  }

  advanceClock() {
    const id = this.id();
    this.clock = VClock.increment(id)(this.clock);
  }

  mergeClock(otherClock) {
    this.clock = VClock.merge(this.clock)(otherClock);
  }

  id() {
    return this.socket.id;
  }
}
