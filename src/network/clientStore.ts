import { store } from 'react-easy-state';
import { client } from './Client';

const clientStore = store({
  connected: false,
  client: client,
  id: '...',
  connect() {
    clientStore.client.connect();
  },
  onIdAssigned(cb: (id: string) => void) {
    clientStore.client.on('id_assigned', cb);
  }
});

clientStore.client.on('id_assigned', id => {
  clientStore.id = id;
  clientStore.connected = true;
});

export default clientStore;
