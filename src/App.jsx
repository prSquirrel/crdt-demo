import React from 'react';
import ReactDOM from 'react-dom';
import Counter from './Counter';
import Dashboard from './Dashboard';

const mountNode = document.getElementById('app');
ReactDOM.render(
  <div>
    <Dashboard />
    <Counter />
  </div>,
  mountNode
);
