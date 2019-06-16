# Demo
https://enigmatic-beach-42935.herokuapp.com/

(currently no STUN/TURN servers are configured, so it only works with local peers)

# About
[BSc thesis](thesis.pdf)

A collaborative text editor demo based on Causal Tree CRDT (variant of RGA). 

Uses WebSockets for signaling and WebRTC Data Channels for p2p communication. 
Data is serialized using Cap'n Proto. 

Should work in any modern browser.

An excellent Splay tree implementation from https://github.com/davidbau/splaylist is included as static dependency.

(tested in Unix environment) 

# Requirements
* Node 10.15

# Building
* Checkout the repo
* `npm install`
* `npm run build` to build peer app

# Running
* `node server.js`to run signaling & static file server
* Open `localhost:8443` in browser
