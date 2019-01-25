import { store } from 'react-easy-state';
import Client from './client';

const client = new Client();

const clientStore = store({
  client: client,
  id: '...'
});

client.on('id_assigned', id => {
  clientStore.id = id;
});

client.connect();

export default clientStore;
