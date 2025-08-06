// js/poopy.js
const SIGNALING_SERVER_URL = "wss://webrtc-signaling-production-43f3.up.railway.app";

function create_signaling_socket(peer_id, on_signal, on_offer) {
  const socket = new WebSocket(SIGNALING_SERVER_URL);

  socket.onopen = () => {
    console.log(`[${peer_id}] WebSocket connected`);
    socket.send(JSON.stringify({ 
      type: "hello", 
      id: peer_id 
    }));
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('received message');
    console.log(message);
    if (message.type === "signal" && message.id && message.data) {
      console.log(`[${peer_id}] Received signal from ${message.id}:`, message.data);
      if (on_offer) on_offer(message.data, message.from);
    }
  };

  function send_signal(target_id, message) {
    const signal = {
      type: "signal",
      to: target_id,
      id: peer_id,
      data: message
    };

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(signal));
    } else {
      console.warn("WebSocket not ready, waiting...");

      socket.addEventListener("open", () => {
        console.log('sending offer');
        console.log(signal);
        socket.send(JSON.stringify(signal));
      }, { once: true });
    }
  }


  return { send_signal };
}

function create_peer({ initiator, peer_id, target_peer_id, on_connected }) {
  const { send_signal } = create_signaling_socket(
    peer_id,
    null,
    (signal, from) => {
      if (peer) peer.signal(signal);
    }
  );

  const peer = new SimplePeer({ initiator });

  peer.on("signal", (data) => {
    console.log(`[${peer_id}] Signal generated:`, data);
    send_signal(target_peer_id, data);
  });

  peer.on("connect", () => {
    console.log(`[${peer_id}] Peer connection established`);
    if (on_connected) on_connected(peer);
  });

  return peer;
}
