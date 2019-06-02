import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
import ReplicatedTextInput from './components/ReplicatedTextInput';
import { client } from './network/DefaultClient';
import { Benchmark, MemoryBenchmark } from './crdt/sequence/rga/Benchmark';

const benchmark = new Benchmark();
console.log(benchmark);

const memBenchmark = new MemoryBenchmark();
console.log(memBenchmark);

const mountNode = document.getElementById('app');
ReactDOM.render(
  <div>
    <Dashboard />
    <ReplicatedTextInput />
  </div>,
  mountNode
);

client.connect();
