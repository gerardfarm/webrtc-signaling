# Implementation Brief for WebRTC Signaling Server

## Overview

Implement a lightweight WebSocket signaling server in Node.js that supports WebRTC connections between two cars (`poopush`, `poopelle`) and their corresponding controllers (`poopush_controller`, `poopelle_controller`).

The server’s responsibility is to:

- Maintain a registry of connected peers keyed by their unique `id`.
- Accept JSON messages over WebSocket with fields: `type`, `id`, `to`, and `data`.
- On receiving a `hello` message, register the sender’s WebSocket under their `id`.
- On receiving a `signal` message, forward the signaling data (`data` field) to the intended recipient (`to` field), wrapping the message with the sender’s ID as `from`.
- Remove disconnected peers from the registry.
- Act only as a message relay; it should not interpret or modify the signaling payload.

## Requirements

- Use Node.js v14+.
- Use the `ws` package for WebSocket server functionality.
- Bind the WebSocket server port from environment variable `PORT` or default to 3000.
- Accept only JSON-formatted messages with the expected fields.
- Handle connection, message, and close events for WebSocket clients.
- Log registration and disconnection events with the peer’s `id`.

---

# WebRTC Signaling Protocol

This document defines the JSON-based signaling protocol used for establishing WebRTC connections between two cars and their respective controllers.

---

## 🎯 Participants

There are 4 unique peers/ids in the system:

- `poopush`
- `poopelle`
- `poopush_controller` — Controller for poopush
- `poopelle_controller` — Controller for poopelle

Each peer is uniquely identified by its `id`.

---

## 📦 Message Format

All signaling messages are JSON objects with the following fields:

| Field   | Type     | Required | Description                                       |
|---------|----------|----------|-------------------------------------------------|
| `type`  | string   | ✅        | The message type (`hello`, `signal`)            |
| `id`    | string   | ✅        | The sender's unique ID                           |
| `to`    | string   | ✅ for `signal` | The recipient's ID                          |
| `data`  | object   | ✅ for `signal` | The signaling payload (SDP, ICE, etc.)       |

---

## 🧾 Message Types

### 🔹 `hello`

Sent once after WebSocket connection to register the sender.

```json
{
  "type": "hello",
  "id": "poopelle_controller"
}
````

Registers the peer `poopelle_controller` on the signaling server.

---

### 🔹 `signal`

Used to transmit WebRTC SDP and ICE candidate data between two peers.

```json
{
  "type": "signal",
  "id": "poopelle_controller",
  "to": "poopelle",
  "data": {
    "type": "offer",
    "sdp": "v=0\r\no=..."
  }
}
```

The server forwards it to the peer identified by `"to"`, wrapping it like this:

```json
{
  "type": "signal",
  "from": "poopelle_controller",
  "data": { ... }
}
```

---

## 📡 Server Behavior

* On `hello`: stores the WebSocket under the provided `id`.
* On `signal`: looks up the recipient using the `to` field and forwards the `data`, wrapped with `from`.
* On WebSocket close: removes the peer from the registry.

---

## 🧠 Notes

* All peers must send a `hello` message upon connection.
* All peer `id`s must be unique and known ahead of time.
* The `data` field is defined by the WebRTC library (e.g., `simple-peer`) and may include:

  * SDP offers/answers
  * ICE candidates
* The signaling server acts only as a message relay and does not inspect or modify `data`.

---