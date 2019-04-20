import React, { Component } from 'react';
import { view } from 'react-easy-state';
import clientStore from './clientStore';

class Dashboard extends Component {
  static propTypes = {};

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {}

  render() {
    return (
      <div>
        <div>
          Id:
          {clientStore.id}
        </div>
      </div>
    );
  }
}

export default view(Dashboard);
