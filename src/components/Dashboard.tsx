import React, { Component } from 'react';
import { store, view } from 'react-easy-state';
import { client } from '../network/DefaultClient';
import Toggle from 'react-toggle';
import toggleStyles from './Toggle.css';

export const dashboardStore = store({
  clientId: '...',
  online: true
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

  private onToggleChange = (ev: any) => {
    const checked: boolean = ev.target.checked;
    dashboardStore.online = checked;
  };

  render() {
    return (
      <div>
        <div>
          <label>
            <Toggle
              className={toggleStyles['react-toggle']}
              defaultChecked={dashboardStore.online}
              onChange={this.onToggleChange}
            />
            Id:
            {dashboardStore.clientId}
          </label>
        </div>
      </div>
    );
  }
}

export default view(Dashboard);
