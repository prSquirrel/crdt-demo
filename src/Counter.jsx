import React, { Component } from 'react';
import { view, store } from 'react-easy-state';
import Client from './client';

const counter = store({
  clicks: 0,
  increment: () => counter.clicks++
});

const client = new Client();

class Counter extends Component {
  componentDidMount() {
    client.connect();
    client.on('data', data => {
      console.log(`Received data: ${data}`);
      counter.clicks = parseInt(data, 10);
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
    client.broadcastToConnectedPeers(counter.clicks);
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
