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

  static STUN_SERVER_URL = 'stun:stun.l.google.com:19302';
  static COMMAND_SENDING_FREQUENCY = 20; // ms

  peer = null;
  data_channel = null;
  track = null;

  #id;
  #ws_server_url;
  #ws = null;
  #intervals = new Map();

  /**
   * Creates a new PoopyController.
   * @param {string} id - Unique ID for this controller instance.
   * @param {string} ws_server_url - URL of the signaling server.
   */
  constructor(id, ws_server_url) {

    super();
    this.#id = id;
    this.#ws_server_url = ws_server_url;

    this.#init_ws();

  }

  /**
   * Creates the SimplePeer object that starts immediately the WebRTC handshake 
   * to connect to remote peer.
   */
  connect() {

    this.#send_ws_message({ type: "offer_request" });

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
    this.#send_peer_data(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

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
    this.#send_peer_data(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

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
    this.#send_peer_data(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

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
    this.#send_peer_data(new Uint8Array([CommandId.StopMotor, 0, 0, 0]));

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
    this.#send_peer_data(new Uint8Array([CommandId.StopShovelArm, 0, 0, 0]));

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
    this.#send_peer_data(new Uint8Array([CommandId.StopShovelArm, 0, 0, 0]));

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
    this.#send_peer_data(new Uint8Array([CommandId.StopShovelMouth, 0, 0, 0]));

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
    this.#send_peer_data(new Uint8Array([CommandId.StopShovelMouth, 0, 0, 0]));

  }

  /**
   * Sends StartVideo command.
   */
  start_video() {

    this.#send_peer_data(new Uint8Array([CommandId.StartVideo, 0, 0, 0]));

  }

  /**
   * Sends StopVideo command.
   */
  stop_video() {

    this.#send_peer_data(new Uint8Array([CommandId.StopVideo, 0, 0, 0]));

  }

  /**
   * Logs all dispatched events from this controller.
   */
  log_events() {

    const events = [
      'ws-connected',
      'webrtc-offer-sent',
      'webrtc-answer',
      'webrtc-remote-candidate',
      'webrtc-local-candidate-sent',
      'peer-connected',
      'peer-disconnected',
      'peer-track',
      'peer-error',
      'peer-data-channel-open'
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
  #init_ws() {

    this.#ws = new WebSocket(this.#ws_server_url);
    this.#ws.addEventListener('open', this.#handle_ws_open.bind(this));
    this.#ws.addEventListener('message', this.#handle_ws_message.bind(this));

  }

  /**
   * Sends a Uint8Array command periodically based on COMMAND_SENDING_FREQUENCY.
   * @param {number} command_id
   */
  #send_command_periodically(command_id) {

    if (this.#intervals.has(command_id)) return;

    const send_fn = () => {
      this.#send_peer_data(new Uint8Array([command_id, 0, 0, 0]));
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
   * Handles the WebSocket open event, sends registration message and creates the peer.
   */
  #handle_ws_open() {

    this.dispatchEvent(new Event('ws-connected'));

    this.#send_ws_message({
      type: 'registration',
      id: this.#id
    });

  }

  /**
   * Handles incoming WebSocket messages.
   * @param {MessageEvent} event
   */
  #handle_ws_message(event) {

    let msg;

    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      console.error('Failed to parse WebSocket message');
    }

    switch (msg.type) {
      case 'offer':
        this.dispatchEvent(new CustomEvent('offer-received', { detail: msg }));
        this.#handle_offer(msg);
        return;
      case 'candidate':
        this.dispatchEvent(new CustomEvent('candidate-received', { detail: msg }));
        this.peer.addIceCandidate(msg.candidate);
        return;
    }

    console.error('Invalid WebSocket message type');

  }


  /**
   * Handles incoming SDP offer.
   * @param {JSON} offer
   */
  async #handle_offer(offer) {

    this.#create_peer();
    await this.peer.setRemoteDescription(offer);
    this.#send_answer();

  }

  /**
   * Sends the SDP answer to the remote peer.
   */
  async #send_answer() {

    await this.peer.setLocalDescription(await this.peer.createAnswer());
    
    let answer = this.peer.localDescription.toJSON();
    
    this.#send_ws_message(answer);
    this.dispatchEvent(new CustomEvent('answer-sent', { detail: answer }));

  }

  /**
   * Complete ICE gathering.
   */
  // async complete_gathering() {

  //   let peer = this.#peer;

  //   return new Promise((resolve) => {
  //     if (peer.iceGatheringState === 'complete') {
  //       resolve();
  //     } else {
  //       peer.addEventListener('icegatheringstatechange', () => {
  //         if (peer.iceGatheringState === 'complete') {
  //           resolve();
  //         }
  //       });
  //     }
  //   });

  // }

  /**
   * Creates the peer instance and attaches handlers for signaling and connection.
   * Dispatches `peer-connected` when the peer connection is established.
   */
  #create_peer() {

    let that = this;

    this.peer = new RTCPeerConnection({ 
      bundlePolicy: 'max-bundle',
      iceServers: [
        { urls: PoopyController.STUN_SERVER_URL }
      ]
    });

    this.peer.addEventListener('icecandidate', (e) => {
      if (e.candidate && e.candidate.candidate) {
        let candidate = { 
          type: 'candidate',
          candidate: e.candidate.toJSON()
        };
        that.#send_ws_message(candidate);
        that.dispatchEvent(new CustomEvent('candidate-sent', { detail: candidate}));
      }
    });

    this.peer.addEventListener('datachannel', (e) => {
      that.data_channel = e.channel;
      that.dispatchEvent(new Event('data-channel-ready'));
    });

    this.peer.addEventListener('track', (track) => {
      that.track = track;
      that.dispatchEvent(new Event('track-ready'));
    });
    
    this.dispatchEvent(new Event('peer-ready'));

  }

  /**
   * Destroys the SimplePeer instance and attached handlers.
   */
  #destroy_peer() {

    if (this.peer) {
      this.peer.removeAllListeners();
      this.peer.destroy();
      this.peer = null;
    }

    this.#clear_all_intervals();

  }

  /**
   * Sends a JSON message through the WebSocket.
   * @param {object} msg
   */
  #send_ws_message(msg) {

    if (this.#ws.readyState != WebSocket.OPEN) {
      console.error('WebSocket not open. Cannot send:', msg);
      return;
    }

    this.#ws.send(JSON.stringify(msg));

  }

  /**
   * Sends binary data through the peer's data channel.
   * @param {object} data
   */
  #send_peer_data(data) {

    if (!this.data_channel) {
      console.error('Data channel not open. Cannot send data.');
      return;
    }

    this.data_channel.send(data);

  }

}

export default PoopyController;
