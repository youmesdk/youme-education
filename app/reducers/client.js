
import Client from '../utils/client';

const client = Client.getInstance();

const initialState = {
  $client: client, // SDK 工具
};

export default (state = initialState, action) => {
  return state;
}
