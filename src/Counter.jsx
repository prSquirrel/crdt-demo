import React, { Component } from 'react';
import { view, store } from 'react-easy-state';
import PropTypes from 'prop-types';

import GCounter from './purescript/GCounter.purs';
import Util from './purescript/Util.purs';
import clientStore from './clientStore';

const counter = store({
  gCounter: GCounter.initial,
  get clicks() {
    return GCounter.value(counter.gCounter);
  },
  increment: replicaId => {
    counter.gCounter = GCounter.increment(replicaId)(counter.gCounter);
  },
  merge: other => {
    counter.gCounter = GCounter.merge(counter.gCounter)(other);
  }
});

class Counter extends Component {
  static propTypes = {};

  counterStyle = {
    fontSize: '30px'
  };

  incrementButtonStyle = {
    border: 'none',
    height: '50px',
    backgroundColor: '#5f63e8'
  };

  replicateButtonStyle = {
    border: 'none',
    height: '50px',
    backgroundColor: '#e8be5e'
  };

  constructor(props) {
    super(props);

    clientStore.client.on('data', data => {
      const parsed = Util.fromRight(GCounter.fromJson(data));
      counter.merge(parsed);
    });
  }

  componentDidMount() {}

  handleIncrement = () => {
    const replicaId = clientStore.id;
    counter.increment(replicaId);
  };

  handleReplicate = () => {
    const serialized = GCounter.asJson(counter.gCounter);
    clientStore.client.broadcastToConnectedPeers(serialized);
  };

  render() {
    return (
      <div>
        <div style={this.counterStyle}>
          Clicks:
          {counter.clicks}
        </div>
        <button type="button" onClick={this.handleIncrement} style={this.incrementButtonStyle}>
          Increment
        </button>

        <button type="button" onClick={this.handleReplicate} style={this.replicateButtonStyle}>
          Replicate
        </button>
      </div>
    );
  }
}

export default view(Counter);
