import WebSocket, { WebSocketServer } from 'ws';

//------------------------------------------------------------------------------
const TARGET_PEER_MAP = {
  poopush: 'poopush_controller',
  poopelle: 'poopelle_controller',
  poopush_controller: 'poopush',
  poopelle_controller: 'poopelle',
};

//------------------------------------------------------------------------------
class PoopyServer {

  #registry = new Map();
  #wss;

  //----------------------------------------------------------------------------
  constructor(port = process.env.PORT || 3000) {

    this.#wss = new WebSocketServer({ port });

  }

  //----------------------------------------------------------------------------
  start() {

    this.#wss.on('connection', (connection) => this.#handle_connection(connection));
    console.log(`PoopyServer listening on port ${this.#wss.options.port}`);

  }

  //----------------------------------------------------------------------------
  #handle_connection(connection) {

    connection.on('message', (raw) => this.#handle_message(connection, raw));
    connection.on('close', () => this.#handle_close(connection));

  }

  //----------------------------------------------------------------------------
  #handle_message(connection, raw) {

    let msg;
    
    try {
      msg = JSON.parse(raw);
    } catch {
      console.log('Failed to parse message');
      return;
    }

    if (msg.type === 'registration') {
      this.#register(msg.id, connection);
      return;
    }

    let events = ['offer', 'answer', 'candidate', 'offer_request'];

    if (events.includes(msg.type)) {
      this.#forward_message(TARGET_PEER_MAP[connection.peer_id], msg);
      return;
    }
      
    console.log('Invalid message type');

  }

  //----------------------------------------------------------------------------
  #register(peer_id, connection) {

    if (peer_id) {
      connection.peer_id = peer_id;
      this.#registry.set(peer_id, connection);
      console.log(`Registered peer: ${peer_id}`);
    } else {
      console.log('Registration failure: invalid ID.');
    }

  }
 
  //----------------------------------------------------------------------------
  #forward_message(peer_id, msg) {

    const target_peer = this.#registry.get(peer_id);
    
    if (!target_peer) {
      console.log('Failure to forward message: target peer not connected.')
      return;
    }

    target_peer.send(JSON.stringify(msg));

  }

  //----------------------------------------------------------------------------
  #handle_close(connection) {

    const peer_id = connection.peer_id;
    this.#registry.delete(peer_id);
    console.log(`Disconnected peer: ${peer_id}`);

  }

}

export default PoopyServer;
