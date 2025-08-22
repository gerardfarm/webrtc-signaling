/**
 * Enum-like object representing RemoteCommand CommandId values.
 */
const CommandId = Object.freeze({
  MoveForward: 0x01,
  MoveBackward: 0x02,
  TurnLeft: 0x03,
  TurnRight: 0x04,
  LiftShovelArm: 0x05,
  LowerShovelArm: 0x06,
  LiftShovelMouth: 0x07,
  LowerShovelMouth: 0x08,
  StopMotor: 0x09,
  StopShovelArm: 0x0A,
  StopShovelMouth: 0x0B,
  StartVideo: 0x0C,
  StopVideo: 0x0D,
});


/**
 * PoopyController handles WebRTC signaling as the initiator using a WebSocket server.
 * It uses SimplePeer for peer connection and dispatches lifecycle events.
 */
class PoopyController extends EventTarget {

  static SIGNALING_SERVER_URL = 'wss://webrtc-signaling-production-43f3.up.railway.app';
  static COMMAND_SENDING_FREQUENCY = 20; // ms

  #id;
  #socket = null;
  #peer = null;
  #intervals = new Map();

  /**
   * Creates a new PoopyController.
   * @param {string} id - Unique ID for this controller instance.
   */
  constructor(id) {

    super();
    this.#id = id;
    // this.#intervals = new Map(); // Ensure this is present and correct

  }

  /**
   * Initiates the connection: opens WebSocket.
   * Dispatches `socket-connected` when the WebSocket is open.
   */
  connect() {

    this.#socket = new WebSocket(PoopyController.SIGNALING_SERVER_URL);
    this.#socket.addEventListener('open', this.#handle_socket_open.bind(this));
    this.#socket.addEventListener('message', this.#handle_socket_message.bind(this));

  }

  /**
   * Starts sending MoveForward command periodically.
   */
  start_move_forward() {

    this.#send_command_periodically(CommandId.MoveForward);

  }

  /**
   * Stops sending MoveForward command and sends StopMotor.
   */
  stop_move_forward() {

    this.#clear_command_interval(CommandId.MoveForward);
    this.#send_command(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

  }

  /**
   * Starts sending MoveBackward command periodically.
   */
  start_move_backward() {

    this.#send_command_periodically(CommandId.MoveBackward);

  }

  /**
   * Stops sending MoveBackward command and sends StopMotor.
   */
  stop_move_backward() {

    this.#clear_command_interval(CommandId.MoveBackward);
    this.#send_command(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

  }

  /**
   * Starts sending TurnLeft command periodically.
   */
  start_turn_left() {

    this.#send_command_periodically(CommandId.TurnLeft);

  }

  /**
   * Stops sending TurnLeft command and sends StopMotor.
   */
  stop_turn_left() {

    this.#clear_command_interval(CommandId.TurnLeft);
    this.#send_command(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

  }

  /**
   * Starts sending TurnRight command periodically.
   */
  start_turn_right() {

    this.#send_command_periodically(CommandId.TurnRight);

  }

  /**
   * Stops sending TurnRight command and sends StopMotor.
   */
  stop_turn_right() {

    this.#clear_command_interval(CommandId.TurnRight);
    this.#send_command(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

  }

  /**
   * Starts sending LiftShovelArm command periodically.
   */
  start_lift_shovel_arm() {

    this.#send_command_periodically(CommandId.LiftShovelArm);

  }

  /**
   * Stops sending LiftShovelArm command and sends StopShovelArm.
   */
  stop_lift_shovel_arm() {

    this.#clear_command_interval(CommandId.LiftShovelArm);
    this.#send_command(new Uint8Array([CommandId.StopShovelArm, 0, 0, 0]));

  }

  /**
   * Starts sending LowerShovelArm command periodically.
   */
  start_lower_shovel_arm() {

    this.#send_command_periodically(CommandId.LowerShovelArm);

  }

  /**
   * Stops sending LowerShovelArm command and sends StopShovelArm.
   */
  stop_lower_shovel_arm() {

    this.#clear_command_interval(CommandId.LowerShovelArm);
    this.#send_command(new Uint8Array([CommandId.StopShovelArm, 0, 0, 0]));

  }

  /**
   * Starts sending LiftShovelMouth command periodically.
   */
  start_lift_shovel_mouth() {

    this.#send_command_periodically(CommandId.LiftShovelMouth);

  }

  /**
   * Stops sending LiftShovelMouth command and sends StopShovelMouth.
   */
  stop_lift_shovel_mouth() {

    this.#clear_command_interval(CommandId.LiftShovelMouth);
    this.#send_command(new Uint8Array([CommandId.StopShovelMouth, 0, 0, 0]));

  }

  /**
   * Starts sending LowerShovelMouth command periodically.
   */
  start_lower_shovel_mouth() {

    this.#send_command_periodically(CommandId.LowerShovelMouth);

  }

  /**
   * Stops sending LowerShovelMouth command and sends StopShovelMouth.
   */
  stop_lower_shovel_mouth() {

    this.#clear_command_interval(CommandId.LowerShovelMouth);
    this.#send_command(new Uint8Array([CommandId.StopShovelMouth, 0, 0, 0]));

  }

  /**
   * Sends StartVideo command.
   */
  start_video() {

    this.#send_command(new Uint8Array([CommandId.StartVideo, 0, 0, 0]));

  }

  /**
   * Sends StopVideo command.
   */
  stop_video() {

    this.#send_command(new Uint8Array([CommandId.StopVideo, 0, 0, 0]));

  }

  /**
   * Logs all dispatched events from this controller.
   */
  log_events() {

    const events = [
      'web-socket-connected',
      'remote-peer-online',
      'remote-peer-offline',
      'webrtc-offer-sent',
      'webrtc-answer',
      'webrtc-ice-candidate',
      'webrtc-ice-candidate-sent',
      'peer-connected',
      'peer-disconnected',
      'peer-stream',
      'peer-error'
    ];

    events.forEach((event_name) => {
      this.addEventListener(event_name, (event) => {
        console.log(`${this.#id} event: ${event.type}`);
      });
    });

  }

  /**
   * Sends a Uint8Array command periodically based on COMMAND_SENDING_FREQUENCY.
   * @param {number} command_id
   */
  #send_command_periodically(command_id) {

    if (this.#intervals.has && this.#intervals.has(command_id)) { // Add safety check
     console.warn("[Debug] Interval already exists for command_id:", command_id);
     return;
  }

    const send_fn = () => {
      this.#send_command(new Uint8Array([command_id, 0, 0, 0]));
    };

    send_fn();

    const interval_id = setInterval(send_fn, PoopyController.COMMAND_SENDING_FREQUENCY);

    this.#intervals.set(command_id, interval_id);

  }

  /**
   * Clears periodic command sending interval for given command_id.
   * @param {number} command_id
   */
  #clear_command_interval(command_id) {

    if (!this.#intervals.has(command_id)) return;

    clearInterval(this.#intervals.get(command_id));
    this.#intervals.delete(command_id);

  }

  /**
   * Clears all command sending intervals.
   */
  #clear_all_intervals() {
    // console.log("[Debug] #clear_all_intervals called");
    for (const interval_id of Object.values(this.#intervals)) {
      clearInterval(interval_id);
    }

    this.#intervals = {};
    // this.#intervals = new Map();
    // console.log("[PoopyController] Command intervals cleared and Map reset."); // Optional debug log
  }

  /**
   * Sends a Uint8Array command via peer data channel.
   * @param {Uint8Array} buffer - Must be length 4.
   */
  #send_command(buffer) {

    if (!this.#peer || !this.#peer.connected) return;

    this.#peer.send(buffer);

  }

  /**
   * Handles the WebSocket open event, sets up peer and sends hello message.
   */
  #handle_socket_open() {

    this.dispatchEvent(new Event('web-socket-connected'));

    this.#send_socket_message({
      type: 'hello',
      id: this.#id
    });

  }

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} event
   */
  #handle_socket_message(event) {

    const msg = JSON.parse(event.data);

    if (msg.type === 'signal' && msg.data) {
      if (msg.data.type === 'answer') {
        this.#peer.signal(msg.data);
        this.dispatchEvent(new CustomEvent('webrtc-answer', { detail: msg.data }));
      } else if (msg.data.type === 'candidate') {
        this.#peer.signal(msg.data);
        this.dispatchEvent(new CustomEvent('webrtc-ice-candidate', { detail: msg.data }));
      }
    }

    if (msg.type === 'remote-peer-online') {
      this.#create_peer();
      this.dispatchEvent(new Event('remote-peer-online'));
      return;
    }

    if (msg.type === 'remote-peer-offline') {
      this.dispatchEvent(new Event('remote-peer-offline'));
    }

  }

  /**
   * Creates the SimplePeer instance and attaches handlers for signaling and connection.
   * Dispatches `peer-connected` when the peer connection is established.
   */
  #create_peer() {

    this.#peer = new SimplePeer({ 
      initiator: true, 
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    });

    this.#peer.on('signal', (data) => {
      if (data.type === 'offer') {
        this.#on_offer_ready(data);
      } else if (data.type === 'candidate') {
        this.#on_ice_candidate_ready(data);
      }
    });

    this.#peer.on('stream', (stream) => {
      this.dispatchEvent(new CustomEvent('peer-stream', { detail: stream }));
    });

    this.#peer.on('connect', () => {
      this.dispatchEvent(new Event('peer-connected'));
    });

    this.#peer.on('error', (err) => {
      this.dispatchEvent(new CustomEvent('peer-error', { detail: err }));
    });

    this.#peer.on('close', () => {
      console.log("[Debug] SimplePeer 'close' event fired");
      if (this.#peer) {
        this.#peer.removeAllListeners();
        this.#peer.destroy();
        this.#peer = null;
      }
      this.#clear_all_intervals();
      this.dispatchEvent(new Event('peer-disconnected'));
    });

  }

  /**
   * Handles the local offer creation by sending it over the WebSocket.
   * Dispatches `offer-sent`.
   * @param {object} offer
   */
  #on_offer_ready(offer) {

    this.#send_socket_message({
      type: 'signal',
      id: this.#id,
      to: this.#get_controlled_peer_id(),
      data: offer
    });

    this.dispatchEvent(new Event('webrtc-offer-sent'));

  }

  /**
   * Handles new ICE candidates and sends them via WebSocket.
   * Dispatches `ice-candidate-sent`.
   * @param {object} candidate
   */
  #on_ice_candidate_ready(candidate) {

    this.#send_socket_message({
      type: 'signal',
      id: this.#id,
      to: this.#get_controlled_peer_id(),
      data: candidate
    });

    this.dispatchEvent(new Event('webrtc-ice-candidate-sent'));

  }

  /**
   * Sends a JSON message through the WebSocket.
   * @param {object} msg
   */
  #send_socket_message(msg) {

    if (this.#socket.readyState === WebSocket.OPEN) {
      this.#socket.send(JSON.stringify(msg));
    } else {
      console.error('WebSocket not open. Cannot send:', msg);
    }

  }

  /**
   * Returns the peer ID controlled by this controller.
   * @returns {string} The ID of the controlled peer.
   */
  #get_controlled_peer_id() {

    return this.#id === 'poopush_controller' ? 'poopush' : 'poopush_controller';

  }

}

/**
 * Poopy class encapsulates two PoopyController instances (poopush and poopelle)
 * and exposes a method to switch the current controller.
 */
class Poopy {

  poopush;
  poopelle;
  controller;
  
  /**
   * Creates the Poopy instance and initializes both controllers.
   */
  constructor() {

    this.poopush = new PoopyController('poopush_controller');
    this.poopelle = new PoopyController('poopelle_controller');
    this.controller = this.poopush;

  }

  /**
   * Switches the current controller to the other one.
   */
  switch_controller() {

    if (this.controller === this.poopelle) {
      this.controller = this.poopush;
    } else {
      this.controller = this.poopelle;
    }

  }

}

// Create a single Poopy instance and export it
const poopy = new Poopy();
export default poopy;
