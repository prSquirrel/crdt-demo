/* eslint-disable no-use-before-define */

import io from 'socket.io-client';
// import Peer from 'simple-peer';
import SimpleSignalClient from 'simple-signal-client';
import EventEmitter from 'nanobus';

export default class Client extends EventEmitter {
  constructor() {
    super();

    this.socket = io.connect(
      'https://localhost:8443',
      { 'connect timeout': 10000, 'force new connection': true }
    );

    if (!this.socket) {
      throw new Error('io.connect failed');
    } else {
      console.debug('allocated socket ', this.socket);
    }

    this.signalClient = new SimpleSignalClient(this.socket); // Uses an existing socket.io-client instance

    const registerPeerHandlers = peer => {
      peer.on('data', data => {
        this.emit('data', data);
      });
      peer.on('close', () => {
        this.emit('close');
      });
      peer.on('error', err => {
        this.emit('error', err);
      });
    };

    this.signalClient.on('discover', async allIds => {
      console.debug(`All ids: ${JSON.stringify(allIds)}`);

      const peerOptions = {};
      const connections = allIds
        .filter(id => id !== this.id())
        .map(id =>
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

    peers.forEach(peer => {
      console.log(`Broadcasting ${JSON.stringify(data)}`);
      peer.send(data);
      // console.log(JSON.stringify(peer));
    });
    // broadcastToPeers(connectedPeerIds());
  }

  id() {
    return this.socket.id;
  }
}
