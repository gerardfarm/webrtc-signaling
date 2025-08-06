/**
 * PoopushController handles WebRTC signaling as the initiator using a WebSocket server.
 * It uses SimplePeer for peer connection and dispatches lifecycle events.
 */
export default class PoopushController extends EventTarget {

  static ID = 'poopush_controller';

  #signaling_server_url;
  #socket = null;
  #peer = null;

  /**
   * Creates a new PoopushController.
   * @param {string} signaling_server_url - URL of the WebSocket signaling server.
   */
  constructor(signaling_server_url) {

    super();
    this.#signaling_server_url = signaling_server_url;

  }

  /**
   * Initiates the connection: opens WebSocket and sets up the peer.
   * Dispatches `socket-connected` when the WebSocket is open.
   */
  connect() {

    this.#socket = new WebSocket(this.#signaling_server_url);
    this.#socket.addEventListener('open', this.#handle_socket_open.bind(this));
    this.#socket.addEventListener('message', this.#handle_socket_message.bind(this));

  }

  /**
   * Sends a binary command composed of a command ID and 3 uint8 parameters.
   *
   * @param {number} id Command ID (0-255)
   * @param {number} param0 First parameter (0-255)
   * @param {number} param1 Second parameter (0-255)
   * @param {number} param2 Third parameter (0-255)
   */
  send_command(id, param0, param1, param2) {

    if (!this.#peer || !this.#peer.connected) return;

    const buffer = new Uint8Array([id, param0, param1, param2]);
    this.#peer.send(buffer);
    
  }

  /**
   * Handles the WebSocket open event, sets up peer and sends hello message.
   */
  #handle_socket_open() {

    this.dispatchEvent(new Event('socket-connected'));

    this.#send_socket_message({
      type: 'hello',
      id: PoopushController.ID
    });

    this.#create_peer();

  }

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} event - The WebSocket message event.
   */
  #handle_socket_message(event) {

    const msg = JSON.parse(event.data);

    if (msg.type === 'signal' && msg.data) {
      if (msg.data.type === 'answer') {
        this.#peer.signal(msg.data);
        this.dispatchEvent(new CustomEvent('answer', { detail: msg.data }));
      } else if (msg.data.type === 'candidate') {
        this.#peer.signal(msg.data);
        this.dispatchEvent(new CustomEvent('ice-candidate', { detail: msg.data }));
      }
    }

  }

  /**
   * Creates the SimplePeer instance and attaches handlers for signaling and connection.
   * Dispatches `peer-connected` when the peer connection is established.
   */
  #create_peer() {

    this.#peer = new SimplePeer({ initiator: true, trickle: true });

    this.#peer.on('signal', (data) => {

      if (data.type === 'offer') {
        this.#on_offer_ready(data);
      } else if (data.type === 'candidate') {
        this.#on_ice_candidate_ready(data);
      }

    });

    this.#peer.on('connect', () => {

      this.dispatchEvent(new Event('peer-connected'));

    });

  }

  /**
   * Handles the local offer creation by sending it over the WebSocket.
   * Dispatches `offer-sent`.
   * @param {object} offer - The SDP offer object.
   */
  #on_offer_ready(offer) {

    this.#send_socket_message({
      type: 'signal',
      id: PoopushController.ID,
      to: 'poopush',
      data: offer
    });

    this.dispatchEvent(new Event('offer-sent'));

  }

  /**
   * Handles new ICE candidates and sends them via WebSocket.
   * Dispatches `ice-candidate-sent`.
   * @param {object} candidate - The ICE candidate object.
   */
  #on_ice_candidate_ready(candidate) {

    this.#send_socket_message({
      type: 'signal',
      id: PoopushController.ID,
      to: 'poopush',
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

}
