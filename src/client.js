/* eslint-disable no-use-before-define */
import easyrtc from 'easyrtc/api/easyrtc';
import io from 'socket.io-client';

let selfRtcId = '';
const peerConnections = {};

export function connect() {
  easyrtc.enableDebug(false);
  easyrtc.enableDataChannels(true);
  easyrtc.enableVideo(false);
  easyrtc.enableAudio(false);
  easyrtc.enableVideoReceive(false);
  easyrtc.enableAudioReceive(false);

  easyrtc.setDataChannelOpenListener(onDataChannelOpen);
  easyrtc.setDataChannelCloseListener(onDataChannelClose);

  easyrtc.setPeerListener(onMessageReceived);
  easyrtc.setRoomOccupantListener(onRoomOccupancyChange);

  const socket = io.connect(
    null,
    { 'connect timeout': 10000, 'force new connection': true }
  );

  if (!socket) {
    throw new Error('io.connect failed');
  } else {
    console.debug('allocated socket ', socket);
    easyrtc.useThisSocketConnection(socket);
  }

  easyrtc.connect(
    'easyrtc.reconnect',
    onRtcConnectSuccess,
    onRtcConnectFailure
  );
}

function onDataChannelOpen(peerId) {
  peerConnections[peerId] = true;
  console.debug(`Data channel opened to ${peerId}`);
  console.debug(`Other peers: ${JSON.stringify(connectedPeerIds())}`);
}

function onDataChannelClose(peerId) {
  peerConnections[peerId] = false;
  console.debug(`Data channel close to ${peerId}`);
  console.debug(`Other peers: ${JSON.stringify(connectedPeerIds())}`);
}

function onMessageReceived(senderId, type, payload) {
  console.debug(`senderId=${senderId} type=${type} payload=${payload}`);
}

//TODO: implement two different listening modes
function onRoomOccupancyChange(roomName, otherPeers) {
  // Unregister so that current peer initiates connections only once.
  unregisterRoomOccupancyListener();

  const otherPeerIds = Object.values(otherPeers).map(peer => peer.easyrtcid);

  otherPeerIds.forEach(peerId => {
    openDataChannelIfNotOpened(peerId);
  });
}

function unregisterRoomOccupancyListener() {
  easyrtc.setRoomOccupantListener(null);
}

function openDataChannelIfNotOpened(peerId) {
  if (easyrtc.getConnectStatus(peerId) === easyrtc.NOT_CONNECTED) {
    try {
      console.debug(`Opening data channel to ${peerId}`);
      openDataChannel(peerId);
    } catch (error) {
      console.log(`Failed to open data channel ${error}`);
    }
  } else {
    console.debug(`Already connected to ${peerId}`);
  }
}

function openDataChannel(peerId) {
  const onCallSuccess = (caller, mediaType) => {
    console.log(`${caller} -> ${mediaType}`);
    // if (mediaType === 'datachannel') {}
  };
  const onCallFailed = (errorCode, errorMsg) => {
    easyrtc.showError(errorCode, errorMsg);
  };
  const onCallAccepted = wasAccepted => {
    console.debug(`Was accepted ${peerId} -> ${wasAccepted}`);
  };

  easyrtc.call(peerId, onCallSuccess, onCallFailed, onCallAccepted);
}

function onRtcConnectSuccess(id) {
  selfRtcId = id;
  console.debug('I am ', id);
}

function onRtcConnectFailure(errorCode, msg) {
  easyrtc.showError(errorCode, msg);
}

export function broadcastToConnectedPeers() {
  broadcastToPeers(connectedPeerIds());
}

function broadcastToPeers(peerIds) {
  peerIds.forEach(id => {
    sendDataToPeer(id);
  });
}

function sendDataToPeer(peerId) {
  if (easyrtc.getConnectStatus(peerId) === easyrtc.IS_CONNECTED) {
    easyrtc.sendDataP2P(peerId, 'someMessageType', 'Hello P2P!!!!!!');
  } else {
    easyrtc.showError('NOT-CONNECTED', `Not connected to ${easyrtc.idToName(peerId)} yet.`);
  }
}

function connectedPeerIds() {
  return Object.keys(peerConnections).filter(peerId => peerConnections[peerId]);
}
