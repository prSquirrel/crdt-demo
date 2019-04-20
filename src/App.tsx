import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
// import Canvas from './Canvas';
import ReplicatedTextInput from './components/ReplicatedTextInput';
import clientStore from './network/clientStore';

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
