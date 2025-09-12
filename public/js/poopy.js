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
 * Poopy handles WebRTC signaling as the initiator using a WebSocket server.
 * It uses SimplePeer for peer connection and dispatches lifecycle events.
 */
class Poopy extends EventTarget {

  static STUN_SERVER_URL = 'stun:stun.l.google.com:19302';
  static COMMAND_SENDING_FREQUENCY = 20; // ms

  #id;
  #server_url;
  #socket = null;
  #peer = null;
  #intervals = new Map();

  /**
   * Creates a new PoopyController.
   * @param {string} id - Unique ID for this controller instance.
   * @param {string} server_url - URL of the signaling server.
   */
  constructor(id, server_url) {

    super();
    this.#id = id;
    this.#server_url = server_url;

    this.#init_web_socket();

  }

  /**
   * Returns the id of the controller.
   */
  get_id() {

    return this.#id;

  }

  /**
   * Returns the name of the controller.
   */
  get_name() {

    return this.#id === 'poopush_controller' ? 'poopush' : 'poopelle';

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
      'webrtc-answer-sent',
      'webrtc-offer',
      'webrtc-remote-candidate',
      'webrtc-local-candidate-sent',
      'peer-connected',
      'peer-disconnected',
      'peer-stream',
      'peer-error'
    ];

    events.forEach((event_name) => {
      this.addEventListener(event_name, (event) => {
        console.log(`${this.#id}: ${event.type}`);
      });
    });

  }

  /**
   * Creates the Websocket and attach handlers for `open` and `message` events.
   */
  #init_web_socket() {

    this.#socket = new WebSocket(this.#server_url);
    this.#socket.addEventListener('open', this.#handle_socket_open.bind(this));
    this.#socket.addEventListener('message', this.#handle_socket_message.bind(this));

  }

  /**
   * Sends a Uint8Array command periodically based on COMMAND_SENDING_FREQUENCY.
   * @param {number} command_id
   */
  #send_command_periodically(command_id) {

    if (this.#intervals.has(command_id)) return;

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

    for (const interval_id of Object.values(this.#intervals)) {
      clearInterval(interval_id);
    }

    this.#intervals = {};

  }

  /**
   * Sends a Uint8Array command via peer data channel.
   * @param {Uint8Array} buffer - Must be length 4.
   */
  #send_command(buffer) {

    if (!this.#peer || !this.#peer.connected) {
      return;  
    } 

    this.#peer.send(buffer);

  }

  /**
   * Handles the WebSocket open event, sends registration message and creates the peer.
   */
  #handle_socket_open() {

    this.dispatchEvent(new Event('web-socket-connected'));

    this.#send_ws_message({
      type: 'registration',
      id: this.#id
    });

  }

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} event
   */
  #handle_socket_message(event) {

    const msg = JSON.parse(event.data);

    switch (msg.type) {
      case 'offer':
        this.#create_peer();
        this.#peer.signal(msg);
        this.dispatchEvent(new CustomEvent('webrtc-offer', { detail: msg }));
        return;
      case 'candidate':
        this.#peer.signal(msg);
        this.dispatchEvent(new CustomEvent('webrtc-remote-candidate', { detail: msg }));
        return;
    }

    console.log('Invalid message type');

  }

  /**
   * Creates the SimplePeer instance and attaches handlers for signaling and connection.
   * Dispatches `peer-connected` when the peer connection is established.
   */
  #create_peer() {

    this.#peer = new SimplePeer({ 
      initiator: false, 
      trickle: true,
      config: {
        iceServers: [
          { urls: Poopy.STUN_SERVER_URL }
        ]
      }
    });

    this.#attach_peer_event_handlers();

  }

  /**
   * Destroys the SimplePeer instance and attached handlers.
   */
  #destroy_peer() {

    if (this.#peer) {
      this.#peer.removeAllListeners();
      this.#peer.destroy();
      this.#peer = null;
    }

    this.#clear_all_intervals();

  }

  /**
   * Attaches event handlers to the peer.
   */
  #attach_peer_event_handlers() {

    this.#peer.on('signal', (msg) => {
      switch (msg.type) {
        case 'answer':
          this.#send_ws_message(msg);
          this.dispatchEvent(new CustomEvent('webrtc-answer-sent', { detail: msg }));
          break;
        case 'candidate':
          this.#send_ws_message(msg);
          this.dispatchEvent(new CustomEvent('webrtc-local-candidate-sent', { detail: msg }));
          break;
      }
    });

    this.#peer.on('stream', (stream) => {
      this.dispatchEvent(new CustomEvent('peer-stream', { detail: stream }));
    });

    this.#peer.on('data', (data) => {
      this.#handle_data(data);
    });

    this.#peer.on('connect', () => {
      this.dispatchEvent(new Event('peer-connected'));
    });

    this.#peer.on('error', (err) => {
      this.dispatchEvent(new CustomEvent('peer-error', { detail: err }));
    });

    this.#peer.on('close', () => {
      this.#destroy_peer();
      this.dispatchEvent(new Event('peer-disconnected'));
    });

  }

  /**
   * Sends a JSON message through the WebSocket.
   * @param {object} msg
   */
  #send_ws_message(msg) {

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

export default Poopy;
