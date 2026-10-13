/**
 * GestureFlow — Dual-Device Holographic Projection Protocol
 * Versioned, low-overhead binary/JSON message protocol for LAN synchronization
 * between Control Station (laptop) and Projection Display (external screen).
 */

export const PROTOCOL_VERSION = 1;

export const ROLES = {
  CONTROL: 'control',
  DISPLAY: 'display'
};

export const MSG_TYPES = {
  // Handshake & Pairing
  HELLO: 'HELLO',
  HELLO_ACK: 'HELLO_ACK',
  PEER_JOINED: 'PEER_JOINED',
  PEER_LEFT: 'PEER_LEFT',
  PING: 'PING',
  PONG: 'PONG',

  // Authoritative State Sync
  STATE_CHANGE: 'STATE_CHANGE',         // INTRO, TRANSITIONING, WORKSPACE
  TRANSFORMS: 'TRANSFORMS',             // Throttled active mesh transforms
  TARGET_SELECT: 'TARGET_SELECT',       // Target shape selection
  ACTION_TRIGGER: 'ACTION_TRIGGER',     // BURST, FREEZE, UNFREEZE, GRAB, RELEASE

  // Inventory & Entity Management
  SPAWN_ENTITY: 'SPAWN_ENTITY',
  DELETE_ENTITY: 'DELETE_ENTITY',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  RESET_SCENE: 'RESET_SCENE',

  // Interactive Tools & Effects
  TOOL_EVENT: 'TOOL_EVENT',             // Web shooter, energy blaster, etc.

  // Snapshot Lifecycle
  REQUEST_SNAPSHOT: 'REQUEST_SNAPSHOT', // Display requesting full state
  SNAPSHOT: 'SNAPSHOT'                  // Controller delivering full state
};

/**
 * Creates a versioned protocol packet
 */
export function createPacket(type, payload = {}, options = {}) {
  return {
    v: PROTOCOL_VERSION,
    type,
    sender: options.role || ROLES.CONTROL,
    room: options.room || 'DEFAULT',
    seq: options.seq || 0,
    ts: Date.now(),
    payload
  };
}

/**
 * Generates a random 4-digit alphanumeric room pairing code
 */
export function generateRoomCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
