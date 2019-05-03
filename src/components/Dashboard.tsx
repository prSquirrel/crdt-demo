import React, { Component } from 'react';
import { store, view } from 'react-easy-state';
import { client } from '../network/Client';

const dashboardStore = store({
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
        <div>
          Id:
          {dashboardStore.clientId}
        </div>
      </div>
    );
  }
}

export default view(Dashboard);
