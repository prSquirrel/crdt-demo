import React, { Component } from 'react';
import { store, view } from 'react-easy-state';
import { client } from '../network/DefaultClient';

export const dashboardStore = store({
  clientId: '...'
});

class Dashboard extends Component {
  static propTypes = {};

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    client.on('id_assigned', id => {
      dashboardStore.clientId = id;
    });
  }

  render() {
    return (
      <div>
        Id:
        {dashboardStore.clientId}
      </div>
    );
  }
}

export default view(Dashboard);
