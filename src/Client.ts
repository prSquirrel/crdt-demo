/* eslint-disable no-use-before-define */

import io from 'socket.io-client';
// import Peer from 'simple-peer';
import SimpleSignalClient from 'simple-signal-client';
import EventEmitter from 'nanobus';

class Client extends EventEmitter {
  private socket: SocketIOClient.Socket;
  private signalClient: SimpleSignalClient;

  constructor() {
    super();

    this.socket = io.connect('https://localhost:8443', {
      timeout: 10000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      this.emit('id_assigned', this.id());
    });

    if (!this.socket) {
      throw new Error('io.connect failed');
    } else {
      console.debug('allocated socket ', this.socket);
    }

    this.signalClient = new SimpleSignalClient(this.socket); // Uses an existing socket.io-client instance

    const registerPeerHandlers = (peer: any) => {
      peer.on('data', (payload: string) => {
        const data = JSON.parse(payload);
        console.log(`RCVD data ${data}`);
        this.emit('data', data);
      });
      peer.on('close', () => {
        console.debug(`Closed channel`);
        this.emit('close');
      });
      peer.on('error', (err: string) => {
        console.log(`Channel error: ${err}`);
        this.emit('error', err);
      });
      peer.on('connect', () => {
        console.log('Connected');
        this.emit('connect');
      });
    };

    this.signalClient.on('discover', async (allIds: string[]) => {
      console.debug(`All ids: ${JSON.stringify(allIds)}`);

      const peerOptions = {};
      const nonLocalIds = allIds.filter(id => id !== this.id());
      const connections = nonLocalIds.map(id =>
        this.signalClient.connect(id, {}, peerOptions).then(({ peer, metadata }: any) => {
          registerPeerHandlers(peer);
        })
      );
      return Promise.all(connections); // (initiator side)
    });

    this.signalClient.on('request', async (request: any) => {
      const { peer } = await request.accept(); // Accept the incoming request
      console.log(`Accepted ${JSON.stringify(peer)}`);
      registerPeerHandlers(peer);
      return peer; // this is a fully-signaled simple-peer object (non-initiator side)
    });
  }

  connect() {
    this.signalClient.discover({});
  }

  broadcastToConnectedPeers(data: any) {
    const peers = this.signalClient.peers();
    // console.log(JSON.stringify(peers));
    peers.forEach((peer: any) => {
      this.sendMessage(peer, data);
    });
  }

  private sendMessage(peer: any, data: any) {
    const payload = data;
    console.log(`Broadcasting ${payload}`);
    peer.send(JSON.stringify(payload));
  }

  id() {
    return this.socket.id;
  }
}

export const client = new Client();
