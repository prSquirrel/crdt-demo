import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';
// import Canvas from './Canvas';
import ReplicatedTextInput from './ReplicatedTextInput';

const mountNode = document.getElementById('app');
ReactDOM.render(
  <div>
    <Dashboard />
    <ReplicatedTextInput />
    {/* <Canvas /> */}
  </div>,
  mountNode
);
