import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
// import Canvas from './Canvas';
import ReplicatedTextInput from './components/ReplicatedTextInput';
import * as capnp from 'capnp-ts';
import { Operation } from './network/schema/schema';
import { Timestamp } from './crdt/sequence/rga/Timestamp';
import { client } from './network/Client';
import { mailbox, MailboxEvents } from './network/Mailbox';

const mountNode = document.getElementById('app');
ReactDOM.render(
  <div>
    <Dashboard />
    <ReplicatedTextInput />
    {/* <Canvas /> */}
  </div>,
  mountNode
);

client.connect();
