import React, { Component } from 'react';
import { view, store } from 'react-easy-state';
import Client from './client';

import GCounter from './purescript/GCounter';
import Util from './purescript/Util';

const client = new Client();

const counter = store({
  gCounter: GCounter.initial,
  get clicks() {
    return GCounter.value(counter.gCounter);
  },
  increment: () => {
    const replicaId = client.id();
    counter.gCounter = GCounter.increment(replicaId)(counter.gCounter);
  },
  merge: other => {
    counter.gCounter = GCounter.merge(counter.gCounter)(other);
  }
});

class Counter extends Component {
  componentDidMount() {
    client.connect();
    client.on('data', data => {
      console.log(`Received data: ${data}`);
      const parsed = Util.fromRight(GCounter.fromJson(data));
      counter.merge(parsed);
    });
    client.on('close', () => {
      console.log('Closed channel');
    });
    client.on('error', err => {
      console.log(`Channel error: ${err}`);
    });
  }

  handleIncrement = () => {
    counter.increment();
  };

  handleReplicate = () => {
    const serialized = GCounter.asJson(counter.gCounter);
    client.broadcastToConnectedPeers(serialized);
  };

  render() {
    return (
      <div>
        <div>
          Clicks:
          {counter.clicks}
        </div>
        <button type="button" onClick={this.handleIncrement}>
          Increment
        </button>
        <button type="button" onClick={this.handleReplicate}>
          Replicate
        </button>
      </div>
    );
  }
}

export default view(Counter);
