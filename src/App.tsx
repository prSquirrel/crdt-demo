import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './components/Dashboard';
// import Canvas from './Canvas';
import ReplicatedTextInput from './components/ReplicatedTextInput';
import * as capnp from 'capnp-ts';
import { Operation } from './network/schema/schema';
import { Timestamp } from './crdt/sequence/rga/Timestamp';
import { client } from './network/DefaultClient';
import { Benchmark, MemoryBenchmark } from './crdt/sequence/rga/Benchmark';

const benchmark = new Benchmark();
console.log(benchmark);

const memBenchmark = new MemoryBenchmark();
console.log(memBenchmark);

// const mountNode = document.getElementById('app');
// ReactDOM.render(
//   <div>
//     <Dashboard />
//     <ReplicatedTextInput />
//     {/* <Canvas /> */}
//   </div>,
//   mountNode
// );

// client.connect();
