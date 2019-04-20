import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';
// import Canvas from './Canvas';
import ReplicatedTextInput from './ReplicatedTextInput';
import clientStore from './clientStore';

const mountNode = document.getElementById('app');
ReactDOM.render(
  <div>
    <Dashboard />
    <ReplicatedTextInput />
    {/* <Canvas /> */}
  </div>,
  mountNode
);

clientStore.connect();
