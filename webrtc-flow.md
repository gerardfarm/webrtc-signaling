# 🔁 WebRTC Signaling Flow via WebSocket

This document outlines the precise event and message flow of a WebRTC connection using a WebSocket signaling server, based on the roles of the peers:

- **Initiator Peer** → `poopush_controller`
- **Non-Initiator Peer** → `poopush`

---

## 📦 Message Format

All signaling messages are JSON objects with the following fields:

| Field   | Type     | Required | Description                                       |
|---------|----------|----------|--------------------------------------------------|
| `type`  | string   | ✅        | The message type (`hello`, `signal`)             |
| `id`    | string   | ✅        | The sender's unique ID                           |
| `to`    | string   | ✅ for `signal` | The recipient's ID                         |
| `data`  | object   | ✅ for `signal` | The signaling payload (SDP, ICE, etc.)      |


---

## 🚀 Initiator Peer (`poopush_controller`) Flow

1. **WebSocket Connection Opened**  
   → `socket.onopen` triggers  
   → Send registration message:
   ~~~json
   { "type": "hello", "id": "poopush_controller" }
   ~~~

2. **User Clicks "Initiate"**  
   → Create `SimplePeer({ initiator: true })`

3. **Offer Generated**  
   → `peer.on('signal')` fires with offer:
   ~~~json
   { "type": "offer", "sdp": "..." }
   ~~~
   → Send offer to `poopush` via signaling server

4. **ICE Candidates Generated**  
   → `peer.on('signal')` fires with candidate:
   ~~~json
   { "type": "candidate", "candidate": "...", ... }
   ~~~
   → Send to `poopush` via signaling server

5. **Receive Answer**  
   → `socket.onmessage` receives:
   ~~~json
   {
     "type": "signal",
     "id": "poopush",
     "to": "poopush_controller",
     "data": { "type": "answer", "sdp": "..." }
   }
   ~~~
   → Call `peer.signal(answer)`

6. **Connection Established**  
   → `peer.on('connect')` fires

---

## 🎯 Non-Initiator Peer (`poopush`) Flow

1. **WebSocket Connection Opened**  
   → `socket.onopen` triggers  
   → Send registration message:
   ~~~json
   { "type": "hello", "id": "poopush" }
   ~~~

2. **User Clicks "Initiate"**  
   → Create `SimplePeer({ initiator: false })`

3. **Receive Offer**  
   → `socket.onmessage` receives:
   ~~~json
   {
     "type": "signal",
     "id": "poopush_controller",
     "to": "poopush",
     "data": { "type": "offer", "sdp": "..." }
   }
   ~~~
   → Call `peer.signal(offer)`

4. **Answer Generated**  
   → `peer.on('signal')` fires with answer:
   ~~~json
   { "type": "answer", "sdp": "..." }
   ~~~
   → Send answer to `poopush_controller` via signaling server

5. **ICE Candidates Generated**  
   → `peer.on('signal')` fires with candidate:
   ~~~json
   { "type": "candidate", "candidate": "...", ... }
   ~~~
   → Send to `poopush_controller` via signaling server

6. **Connection Established**  
   → `peer.on('connect')` fires
