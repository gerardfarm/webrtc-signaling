/**
 * Poopush handles WebRTC signaling as the receiving peer using a WebSocket server.
 * It uses SimplePeer for peer connection and dispatches lifecycle events.
 */
export default class Poopush extends EventTarget {

  static ID = 'poopush';

  #signaling_server_url;
  #socket = null;
  #peer = null;

  /**
   * Creates a new Poopush instance.
   * @param {string} signaling_server_url - URL of the WebSocket signaling server.
   */
  constructor(signaling_server_url) {

    super();
    this.#signaling_server_url = signaling_server_url;

  }

  /**
   * Initiates the connection: opens WebSocket and sets up message handling.
   * Dispatches `socket-connected` when the WebSocket is open.
   */
  connect() {

    this.#socket = new WebSocket(this.#signaling_server_url);
    this.#socket.addEventListener('open', this.#handle_socket_open.bind(this));
    this.#socket.addEventListener('message', this.#handle_socket_message.bind(this));

  }

  /**
   * Handles the WebSocket open event and sends hello message.
   */
  #handle_socket_open() {

    this.dispatchEvent(new Event('socket-connected'));

    this.#send_socket_message({
      type: 'hello',
      id: Poopush.ID
    });

  }

  /**
   * Handles incoming WebSocket messages.
   * Listens for offers and ICE candidates to signal the peer.
   * @param {MessageEvent} event - The WebSocket message event.
   */
  #handle_socket_message(event) {

    const msg = JSON.parse(event.data);

    if (msg.type === 'signal' && msg.data) {
      if (msg.data.type === 'offer') {
        if (!this.#peer) {
          this.#create_peer();
        }
        this.#peer.signal(msg.data);
        this.dispatchEvent(new CustomEvent('offer', { detail: msg.data }));
      } else if (msg.data.type === 'candidate') {
        if (this.#peer) {
          this.#peer.signal(msg.data);
          this.dispatchEvent(new CustomEvent('ice-candidate', { detail: msg.data }));
        }
      }
    }

  }

  /**
   * Creates the SimplePeer instance and attaches handlers for signaling and connection.
   * Dispatches `answer-sent` after sending answer.
   * Dispatches `peer-connected` when connection established.
   */
  #create_peer() {

    this.#peer = new SimplePeer({ 
      initiator: false, 
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    });

    this.#peer.on('signal', (data) => {
      if (data.type === 'answer') {
        this.#on_answer_ready(data);
      } else if (data.type === 'candidate') {
        this.#on_ice_candidate_ready(data);
      }
    });

    this.#peer.on('connect', () => {
      this.dispatchEvent(new Event('peer-connected'));
    });

    this.#peer.on('data', (data) => {
      this.#handle_data(data);
    });

  }

  /**
   * Handles the local answer creation by sending it over the WebSocket.
   * Dispatches `answer-sent`.
   * @param {object} answer - The SDP answer object.
   */
  #on_answer_ready(answer) {

    this.#send_socket_message({
      type: 'signal',
      id: Poopush.ID,
      to: 'poopush_controller',
      data: answer
    });

    this.dispatchEvent(new Event('answer-sent'));

  }

  /**
   * Handles new ICE candidates and sends them via WebSocket.
   * Dispatches `ice-candidate-sent`.
   * @param {object} candidate - The ICE candidate object.
   */
  #on_ice_candidate_ready(candidate) {

    this.#send_socket_message({
      type: 'signal',
      id: Poopush.ID,
      to: 'poopush_controller',
      data: candidate
    });

    this.dispatchEvent(new Event('ice-candidate-sent'));

  }

  /**
   * Sends a JSON message through the WebSocket.
   * @param {object} msg - The JSON message to send.
   */
  #send_socket_message(msg) {

    if (this.#socket.readyState === WebSocket.OPEN) {
      this.#socket.send(JSON.stringify(msg));
    } else {
      console.error('WebSocket not open. Cannot send:', msg);
    }

  }

  /**
   * Handles incoming data.
   * @param {Uint8Array} data
   */
  #handle_data(data) {

    if (data instanceof Uint8Array && data.length === 4) {
      const event = new CustomEvent('command', { detail: data });
      this.dispatchEvent(event);
    }

  }

}
