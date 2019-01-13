const https = require('https');
const fs = require('fs');
const express = require('express');
const io = require('socket.io');

// process.title = 'node-easyrtc';

const httpApp = express();
httpApp.use(express.static(`${__dirname}/static/`));

const certsDir = `${__dirname}/certs`;
const webServer = https.createServer(
  {
    key: fs.readFileSync(`${certsDir}/localhost.key`),
    cert: fs.readFileSync(`${certsDir}/localhost.crt`)
  },
  httpApp
);

const socketServer = io.listen(webServer, { 'log level': 1 });
const signalServer = require('simple-signal-server')(socketServer);

const allIDs = new Set();

signalServer.on('discover', request => {
  const clientID = request.socket.id; // you can use any kind of identity, here we use socket.id
  allIDs.add(clientID); // keep track of all connected peers
  request.discover(clientID, Array.from(allIDs)); // respond with id and list of other peers
});

signalServer.on('disconnect', socket => {
  const clientId = socket.id;
  allIDs.delete(clientId);
});

signalServer.on('request', request => {
  request.forward(); // forward all requests to connect
});

webServer.listen(8443, () => {
  console.log(`Listening on https://localhost:${webServer.address().port}`);
});
