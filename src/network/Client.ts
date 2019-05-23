/* eslint-disable no-use-before-define */

import EventEmitter from 'nanobus';
import * as capnp from 'capnp-ts';

export enum ClientEvents {
  ID_ASSIGNED = 'id_assigned',
  DATA = 'data',
  CLOSE = 'close',
  ERROR = 'error',
  CONNECT = 'connect',
  SYNC_REQUESTED = 'sync_requested'
}

export interface Client extends EventEmitter {
  connect(): void;
  broadcastToConnectedPeers(data: capnp.Message): void;
  id(): string;
}

export interface PeerSyncContext {
  sync(msg: capnp.Message): void;
}
