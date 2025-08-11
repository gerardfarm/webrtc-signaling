// poopy_signaling_server.js

import WebSocket, { WebSocketServer } from 'ws';

const OPPOSITE_PEER_MAP = {
  'poopush': 'poopush_controller',
  'poopelle': 'poopelle_controller',
  'poopush_controller': 'poopush',
  'poopell_controller': 'poopelle',
};

class PoopySignalingServer {

  #registry = new Map();
  #wss;

  constructor(port = process.env.PORT || 3000) {

    this.#wss = new WebSocketServer({ port });

  }

  start() {

    this.#wss.on('connection', (socket) => this.#handle_connection(socket));
    console.log(`PoopySignalingServer listening on port ${this.#wss.options.port}`);

  }

  #handle_connection(socket) {

    socket.on('message', (raw) => this.#handle_message(socket, raw));
    socket.on('close', () => this.#handle_close(socket));

  }

  #handle_message(socket, raw) {

    let message;
    
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    const { type, id, to, data } = message;

    if (type === 'hello' && id) {
      
      this.#registry.set(id, socket);
      socket._poopy_id = id;

      let opposite_peer = this.#registry.get(OPPOSITE_PEER_MAP[id]);
      
      if (opposite_peer) {
        socket.send(JSON.stringify({
          type: 'remote-peer-online'
        }));
        opposite_peer.send(JSON.stringify({
          type: 'remote-peer-online'
        })); 
      } else {
        socket.send(JSON.stringify({
          type: 'remote-peer-offline'
        }));
      }

      this.#log_registration(id);

    } else if (type === 'signal' && id && to && data) {

      this.#forward_signal(to, id, data);

    }

  }

  #forward_signal(to, from, data) {

    const target = this.#registry.get(to);
    if (!target) return;

    const msg = JSON.stringify({
      type: 'signal',
      from,
      data,
    });

    target.send(msg);

  }

  #handle_close(socket) {

    const id = socket._poopy_id;
    
    if (id) {
      let opposite_peer = this.#registry.get(OPPOSITE_PEER_MAP[id]);
      if (opposite_peer) {
        opposite_peer.send(JSON.stringify({
          type: 'remote-peer-offline'
        }));
      }
      this.#registry.delete(id);
      this.#log_disconnection(id);
    }

  }

  #log_registration(id) {
    console.log(`Registered peer: ${id}`);
  }

  #log_disconnection(id) {
    console.log(`Disconnected peer: ${id}`);
  }

}

export default PoopySignalingServer;
