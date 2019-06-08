const https = require('https');
const fs = require('fs');
const express = require('express');
const io = require('socket.io');
const path = require('path');

const isProd = process.env.NODE_ENV == 'production';

const expressApp = express().use(express.static(path.join(__dirname, 'static')));
const localCertsDir = path.join(__dirname, 'certs');
const httpApp = isProd
  ? expressApp
  : https.createServer(
      {
        key: fs.readFileSync(`${localCertsDir}/localhost.key`),
        cert: fs.readFileSync(`${localCertsDir}/localhost.crt`)
      },
      expressApp
    );

const port = process.env.PORT || 8443;
const webServer = httpApp.listen(port, () => {
  console.log(`[prod=${isProd}] Listening on port ${webServer.address().port}`);
});

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
