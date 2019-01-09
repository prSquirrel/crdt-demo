const https = require('https');
const fs = require('fs');
const express = require('express');
const io = require('socket.io');
const easyrtc = require('easyrtc');

process.title = 'node-easyrtc';

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

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on('easyrtcAuth', (socket, easyrtcid, msg, socketCallback, callback) => {
  easyrtc.events.defaultListeners.easyrtcAuth(
    socket,
    easyrtcid,
    msg,
    socketCallback,
    (err, connectionObj) => {
      if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
        callback(err, connectionObj);
        return;
      }

      connectionObj.setField('credential', msg.msgData.credential, { isShared: false });

      console.log(
        `[${easyrtcid}] Credential saved!`,
        connectionObj.getFieldValueSync('credential')
      );

      callback(err, connectionObj);
    }
  );
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on('roomJoin', (connectionObj, roomName, roomParameter, callback) => {
  console.log(
    `[${connectionObj.getEasyrtcid()}] Credential retrieved!`,
    connectionObj.getFieldValueSync('credential')
  );
  easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

easyrtc.listen(httpApp, socketServer, null, (err, rtcRef) => {
  console.log('Initiated');

  rtcRef.events.on(
    'roomCreate',
    (appObj, creatorConnectionObj, roomName, roomOptions, callback) => {
      console.log(`roomCreate fired! Trying to create: ${roomName}`);

      appObj.events.defaultListeners.roomCreate(
        appObj,
        creatorConnectionObj,
        roomName,
        roomOptions,
        callback
      );
    }
  );
});

webServer.listen(8443, () => {
  console.log(`Listening on https://localhost:${webServer.address().port}`);
});
