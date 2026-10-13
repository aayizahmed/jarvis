/**
 * GestureFlow — Dual-Device WebSocket Client
 * Resilient real-time synchronization client with exponential backoff,
 * monotonic sequence validation, ping/pong latency measurement, and event dispatching.
 */

import { PROTOCOL_VERSION, ROLES, MSG_TYPES, createPacket } from './syncProtocol.js';

export class SyncClient {
  constructor(options = {}) {
    this.role = options.role || ROLES.CONTROL;
    this.roomCode = (options.roomCode || 'DEFAULT').toUpperCase();
    this.wsUrl = options.wsUrl || this._getDefaultWsUrl();

    this.ws = null;
    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectDelayMs = 8000;
    this.reconnectTimer = null;

    // Packet Sequencing & Timing
    this.outboundSeq = 0;
    this.lastReceivedSeq = -1;
    this.latencyMs = 0;
    this.pingTimer = null;
    this.peerCount = 0;

    // Event listener map
    this.listeners = new Map();

    // Cache latest network info from server
    this.networkInfo = null;
  }

  /**
   * Determine WebSocket URL based on current browser window location
   */
  _getDefaultWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:5173';
    return `${protocol}//${host}/ws-sync`;
  }

  /**
   * Fetch local network configuration from backend
   */
  async fetchNetworkInfo() {
    try {
      const res = await fetch('/api/network-info');
      if (res.ok) {
        this.networkInfo = await res.json();
        return this.networkInfo;
      }
    } catch (e) {
      console.warn('Network info fetch failed (offline or standalone mode):', e);
    }
    return null;
  }

  /**
   * Register an event listener
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
  }

  emit(event, ...args) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        try {
          handler(...args);
        } catch (err) {
          console.error(`SyncClient listener error on [${event}]:`, err);
        }
      }
    }
  }

  /**
   * Open WebSocket connection to synchronization server
   */
  connect(wsUrlOverride = null) {
    if (wsUrlOverride) {
      this.wsUrl = wsUrlOverride;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this._notifyStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.wsUrl);
    } catch (err) {
      console.warn('WebSocket connection instantiation error:', err);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.lastReceivedSeq = -1;

      // 1. Send HELLO handshake
      this._sendRaw({
        v: PROTOCOL_VERSION,
        type: MSG_TYPES.HELLO,
        sender: this.role,
        room: this.roomCode,
        ts: Date.now()
      });

      this._notifyStatus('CONNECTED');
      this._startPingInterval();

      // If Display client, request fresh state snapshot upon connecting
      if (this.role === ROLES.DISPLAY) {
        this.requestSnapshot();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch (e) {
        console.warn('SyncClient received non-JSON payload:', event.data);
      }
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      this._stopPingInterval();
      this._notifyStatus('DISCONNECTED');
      this._scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.warn('SyncClient WebSocket error:', err);
      if (this.ws) {
        try { this.ws.close(); } catch (_) {}
      }
    };
  }

  /**
   * Disconnect manually
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._stopPingInterval();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
    this._notifyStatus('DISCONNECTED');
  }

  /**
   * Set room pairing code and re-handshake if connected
   */
  setRoomCode(newRoom) {
    if (!newRoom) return;
    this.roomCode = newRoom.trim().toUpperCase();
    if (this.isConnected) {
      this._sendRaw({
        v: PROTOCOL_VERSION,
        type: MSG_TYPES.HELLO,
        sender: this.role,
        room: this.roomCode,
        ts: Date.now()
      });
    }
  }

  // =========================================================================
  // MESSAGE SENDERS (NON-BLOCKING, ZERO-AWAIT)
  // =========================================================================

  /**
   * Send throttled batch of mesh transforms from Controller
   */
  sendTransforms(transformsList, reticle = null) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    this.outboundSeq++;
    const packet = createPacket(MSG_TYPES.TRANSFORMS, {
      items: transformsList,
      reticle
    }, {
      role: this.role,
      room: this.roomCode,
      seq: this.outboundSeq
    });

    this._sendRaw(packet);
  }

  /**
   * Send discrete action trigger (BURST, FREEZE, GRAB, RELEASE, etc.)
   */
  sendAction(actionName, data = {}) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    this.outboundSeq++;
    const packet = createPacket(MSG_TYPES.ACTION_TRIGGER, {
      action: actionName,
      data
    }, {
      role: this.role,
      room: this.roomCode,
      seq: this.outboundSeq
    });

    this._sendRaw(packet);
  }

  /**
   * Send target object selection change
   */
  sendTargetSelect(objectName) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    const packet = createPacket(MSG_TYPES.TARGET_SELECT, {
      name: objectName
    }, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  /**
   * Send global application state change (INTRO, TRANSITIONING, WORKSPACE)
   */
  sendStateChange(stateName) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    const packet = createPacket(MSG_TYPES.STATE_CHANGE, {
      state: stateName
    }, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  /**
   * Send entity spawn command
   */
  sendSpawnEntity(assetId, entityData = {}) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    const packet = createPacket(MSG_TYPES.SPAWN_ENTITY, {
      assetId,
      entity: entityData
    }, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  /**
   * Send entity deletion command
   */
  sendDeleteEntity(uuidOrName) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    const packet = createPacket(MSG_TYPES.DELETE_ENTITY, {
      id: uuidOrName
    }, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  /**
   * Send full scene reset command
   */
  sendResetScene() {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    const packet = createPacket(MSG_TYPES.RESET_SCENE, {}, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  /**
   * Send tool effect event (Web shoot, projectile, etc.)
   */
  sendToolEvent(toolType, payload = {}) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    const packet = createPacket(MSG_TYPES.TOOL_EVENT, {
      tool: toolType,
      payload
    }, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  /**
   * Send authoritative full scene snapshot to Displays
   */
  sendSnapshot(snapshotData) {
    if (!this.isConnected || this.role !== ROLES.CONTROL) return;

    const packet = createPacket(MSG_TYPES.SNAPSHOT, snapshotData, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  /**
   * Display client requests fresh snapshot from Controller
   */
  requestSnapshot() {
    if (!this.isConnected || this.role !== ROLES.DISPLAY) return;

    const packet = createPacket(MSG_TYPES.REQUEST_SNAPSHOT, {}, {
      role: this.role,
      room: this.roomCode
    });

    this._sendRaw(packet);
  }

  // =========================================================================
  // MESSAGE PROCESSING
  // =========================================================================

  _handleMessage(msg) {
    const { type, seq, payload } = msg;

    // Drop stale or out-of-order packets if sequence number is older
    if (seq !== undefined && seq !== 0) {
      if (seq < this.lastReceivedSeq) {
        return; // Discard older packet
      }
      this.lastReceivedSeq = seq;
    }

    switch (type) {
      case MSG_TYPES.HELLO_ACK:
        this.peerCount = msg.displaysConnected || (msg.hasController ? 1 : 0);
        this._notifyStatus('CONNECTED');
        this.emit('handshake', msg);
        break;

      case MSG_TYPES.PEER_JOINED:
        this.peerCount = msg.displaysCount !== undefined ? msg.displaysCount : this.peerCount + 1;
        this._notifyStatus('CONNECTED');
        this.emit('peer_joined', msg);
        break;

      case MSG_TYPES.PEER_LEFT:
        this.peerCount = msg.displaysCount !== undefined ? msg.displaysCount : Math.max(0, this.peerCount - 1);
        this._notifyStatus('CONNECTED');
        this.emit('peer_left', msg);
        break;

      case MSG_TYPES.TRANSFORMS:
        this.emit('transforms', payload.items || [], payload.reticle || null);
        break;

      case MSG_TYPES.ACTION_TRIGGER:
        this.emit('action', payload.action, payload.data || {});
        break;

      case MSG_TYPES.TARGET_SELECT:
        this.emit('target_select', payload.name);
        break;

      case MSG_TYPES.STATE_CHANGE:
        this.emit('state_change', payload.state);
        break;

      case MSG_TYPES.SPAWN_ENTITY:
        this.emit('spawn_entity', payload.assetId, payload.entity);
        break;

      case MSG_TYPES.DELETE_ENTITY:
        this.emit('delete_entity', payload.id);
        break;

      case MSG_TYPES.RESET_SCENE:
        this.emit('reset_scene');
        break;

      case MSG_TYPES.TOOL_EVENT:
        this.emit('tool_event', payload.tool, payload.payload);
        break;

      case MSG_TYPES.REQUEST_SNAPSHOT:
        this.emit('request_snapshot');
        break;

      case MSG_TYPES.SNAPSHOT:
        this.emit('snapshot', payload);
        break;

      case MSG_TYPES.PONG:
        if (msg.echo) {
          this.latencyMs = Math.max(0, Math.round(Date.now() - msg.echo));
          this.emit('latency', this.latencyMs);
        }
        break;

      default:
        this.emit('custom', msg);
    }
  }

  _sendRaw(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(obj));
    } catch (e) {
      console.warn('SyncClient send error:', e);
    }
  }

  _notifyStatus(status) {
    this.emit('status', {
      status,
      isConnected: this.isConnected,
      role: this.role,
      roomCode: this.roomCode,
      peerCount: this.peerCount,
      latencyMs: this.latencyMs
    });
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Exponential backoff with jitter (1s, 2s, 4s, up to 8s)
    const delay = Math.min(
      this.maxReconnectDelayMs,
      Math.pow(2, this.reconnectAttempts - 1) * 1000 + Math.random() * 500
    );

    this._notifyStatus('RECONNECTING');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  _startPingInterval() {
    this._stopPingInterval();
    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this._sendRaw({
          type: MSG_TYPES.PING,
          ts: Date.now()
        });
      }
    }, 4000);
  }

  _stopPingInterval() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
