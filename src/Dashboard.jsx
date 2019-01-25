import React, { Component } from 'react';
import { view, store } from 'react-easy-state';
import PropTypes from 'prop-types';
import clientStore from './clientStore';

class Dashboard extends Component {
  static propTypes = {};

  constructor(props) {
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
