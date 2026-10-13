/**
 * GestureFlow — Node.js WebSocket Synchronization Server
 * Manages dual-device rooms, authoritative message relay, and LAN IP discovery.
 */

import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';

/**
 * Discovers non-internal IPv4 LAN addresses of the host machine
 */
export function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          iface: name,
          ip: net.address
        });
      }
    }
  }

  return addresses.length > 0 ? addresses : [{ iface: 'Localhost', ip: '127.0.0.1' }];
}

/**
 * Setup WebSocket server message routing and room management
 */
export function setupSyncServer(wss) {
  // Map of roomCode -> { controller: ws|null, displays: Set<ws> }
  const rooms = new Map();

  function getOrCreateRoom(roomCode) {
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        controller: null,
        displays: new Set(),
        lastSnapshot: null
      });
    }
    return rooms.get(roomCode);
  }

  function cleanClientFromRooms(ws) {
    for (const [roomCode, room] of rooms.entries()) {
      if (room.controller === ws) {
        room.controller = null;
        // Notify displays in this room
        const leaveMsg = JSON.stringify({
          type: 'PEER_LEFT',
          role: 'control',
          room: roomCode,
          ts: Date.now()
        });
        room.displays.forEach(d => {
          if (d.readyState === WebSocket.OPEN) d.send(leaveMsg);
        });
      }

      if (room.displays.has(ws)) {
        room.displays.delete(ws);
        // Notify controller
        if (room.controller && room.controller.readyState === WebSocket.OPEN) {
          room.controller.send(JSON.stringify({
            type: 'PEER_LEFT',
            role: 'display',
            room: roomCode,
            displaysCount: room.displays.size,
            ts: Date.now()
          }));
        }
      }

      // Clean up empty rooms
      if (!room.controller && room.displays.size === 0) {
        rooms.delete(roomCode);
      }
    }
  }

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.roomCode = null;
    ws.role = null;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const { type, room: roomCode = 'DEFAULT', sender, payload } = msg;

        // 1. Initial Handshake
        if (type === 'HELLO') {
          ws.role = sender;
          ws.roomCode = roomCode;
          const room = getOrCreateRoom(roomCode);

          if (sender === 'control') {
            room.controller = ws;
            // Notify controller of any existing displays
            ws.send(JSON.stringify({
              type: 'HELLO_ACK',
              role: 'control',
              room: roomCode,
              displaysConnected: room.displays.size,
              ts: Date.now()
            }));
          } else {
            // Display joining
            room.displays.add(ws);
            ws.send(JSON.stringify({
              type: 'HELLO_ACK',
              role: 'display',
              room: roomCode,
              hasController: !!room.controller,
              ts: Date.now()
            }));

            // Notify controller
            if (room.controller && room.controller.readyState === WebSocket.OPEN) {
              room.controller.send(JSON.stringify({
                type: 'PEER_JOINED',
                role: 'display',
                room: roomCode,
                displaysCount: room.displays.size,
                ts: Date.now()
              }));
            }

            // If we have a cached snapshot, send it immediately
            if (room.lastSnapshot) {
              ws.send(JSON.stringify(room.lastSnapshot));
            }
          }
          return;
        }

        const room = rooms.get(ws.roomCode);
        if (!room) return;

        // 2. Controller Authoritative Broadcasts -> Forward to Displays
        if (ws.role === 'control') {
          // Cache snapshot for newly arriving displays
          if (type === 'SNAPSHOT') {
            room.lastSnapshot = msg;
          }

          // Forward to all connected displays in this room
          const raw = JSON.stringify(msg);
          for (const displayWs of room.displays) {
            if (displayWs.readyState === WebSocket.OPEN) {
              displayWs.send(raw);
            }
          }
        }

        // 3. Display Requests -> Forward to Controller
        else if (ws.role === 'display') {
          if (type === 'REQUEST_SNAPSHOT' && room.controller && room.controller.readyState === WebSocket.OPEN) {
            room.controller.send(JSON.stringify(msg));
          }
        }

        // 4. Ping/Pong Heartbeat
        if (type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', ts: Date.now(), echo: msg.ts }));
        }

      } catch (err) {
        console.warn('Sync server message parse error:', err.message);
      }
    });

    ws.on('close', () => {
      cleanClientFromRooms(ws);
    });

    ws.on('error', () => {
      cleanClientFromRooms(ws);
    });
  });

  // Keepalive interval
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        cleanClientFromRooms(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 10000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  return {
    getRooms: () => rooms,
    cleanClientFromRooms
  };
}
