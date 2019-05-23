import io from 'socket.io-client';
import * as capnp from 'capnp-ts';
import SimpleSignalClient from 'simple-signal-client';
import EventEmitter from 'nanobus';
import { Buffer } from 'buffer/';
import { Client, ClientEvents, PeerSyncContext } from './Client';

class DefaultClient extends EventEmitter implements Client {
  private socket: SocketIOClient.Socket;
  private signalClient: SimpleSignalClient;

  constructor() {
    super();

    this.socket = io.connect(`https://${document.domain}:8443`, {
      timeout: 10000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      this.emit(ClientEvents.ID_ASSIGNED, this.id());
    });

    if (!this.socket) {
      throw new Error('io.connect failed');
    } else {
      console.debug('allocated socket ', this.socket);
    }

    this.signalClient = new SimpleSignalClient(this.socket); // Uses an existing socket.io-client instance

    const registerPeerHandlers = (peer: any) => {
      peer.on('data', (data: ArrayBuffer) => {
        const msg = new capnp.Message(data);
        // console.log(msg.dump());
        this.emit(ClientEvents.DATA, msg);
      });
      peer.on('close', () => {
        console.debug(`Closed channel`);
        this.emit(ClientEvents.CLOSE);
      });
      peer.on('error', (err: string) => {
        console.log(`Channel error: ${err}`);
        this.emit(ClientEvents.ERROR, err);
      });
      peer.on('connect', () => {
        console.log('Connected');
        this.emit(ClientEvents.CONNECT);
      });
    };

    this.signalClient.on('discover', async (allIds: string[]) => {
      console.debug(`All ids: ${JSON.stringify(allIds)}`);

      const peerOptions = {
        objectMode: false
      };
      const nonLocalIds = allIds.filter(id => id !== this.id());
      const peerIdToSyncWith = nonLocalIds[(Math.random() * nonLocalIds.length) | 0];
      const connections = nonLocalIds.map(id => {
        const metadata = {
          sync: id == peerIdToSyncWith
        };
        const connection = this.signalClient
          .connect(id, metadata, peerOptions)
          .then(({ peer, metadata }: any) => {
            registerPeerHandlers(peer);
          });
        return connection;
      });
      return Promise.all(connections); // (initiator side)
    });

    const emitSyncRequest = (peer: any) => {
      const sendMessage = (msg: capnp.Message) => this.sendMessage(peer, msg);
      const context = <PeerSyncContext>{
        sync(msg: capnp.Message): void {
          sendMessage(msg);
        }
      };
      this.emit(ClientEvents.SYNC_REQUESTED, context);
    };

    this.signalClient.on('request', async (request: any) => {
      const { peer, metadata } = await request.accept(); // Accept the incoming request
      console.log(`Accepted ${JSON.stringify(peer)}`);
      console.log(`Meta: ${JSON.stringify(metadata)}`);
      registerPeerHandlers(peer);
      if (metadata.sync) {
        emitSyncRequest(peer);
      }
      return peer; // this is a fully-signaled simple-peer object (non-initiator side)
    });
  }

  connect(): void {
    this.signalClient.discover({});
  }

  broadcastToConnectedPeers(data: capnp.Message): void {
    const peers = this.peers();
    peers.forEach((peer: any) => this.sendMessage(peer, data));
  }

  private sendMessage(peer: any, msg: capnp.Message) {
    const data: ArrayBuffer = msg.toPackedArrayBuffer();
    peer.write(Buffer.from(data));
  }

  id(): string {
    return this.socket.id;
  }

  private peers(): any[] {
    const peers = this.signalClient.peers();
    return peers;
  }
}

export const client = new DefaultClient();
