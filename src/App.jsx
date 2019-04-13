import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './Dashboard';
import Canvas from './Canvas';
import { Hello } from './Hello';

const mountNode = document.getElementById('app');
ReactDOM.render(
  <div>
    <Dashboard />
    <Canvas />
    <Hello />
  </div>,
  mountNode
);
