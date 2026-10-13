/**
 * GestureFlow — Projection Display Coordinator
 * Manages full-screen cinematic 3D display mode for external projectors/monitors.
 * - ZERO camera access or MediaPipe inference (100% lightweight client)
 * - Decoupled 60+ FPS Three.js rendering loop with exponential slerp/lerp transform smoothing
 * - Dynamic asset spawning matching Controller state
 * - Automatic reconnection recovery with freeze-frame preservation
 */

import * as THREE from 'three';
import { SceneManager, APP_STATES } from './sceneManager.js';
import { InventoryManager } from './inventoryManager.js';
import { SyncClient } from './syncClient.js';
import { ROLES } from './syncProtocol.js';

export class DisplayCoordinator {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('threeCanvasContainer');
    this.roomCode = options.roomCode || 'DEFAULT';

    // 1. Core Scene Subsystems
    this.sceneManager = new SceneManager(this.container);
    this.inventoryManager = new InventoryManager(this.sceneManager);

    // 2. Real-Time Network Sync Client
    this.sync = new SyncClient({
      role: ROLES.DISPLAY,
      roomCode: this.roomCode
    });

    // 3. Transform Interpolation Buffer (Object UUID/Name -> Target State)
    this.targetTransforms = new Map();
    this.reticleTarget = {
      pos: new THREE.Vector3(),
      visible: false,
      mode: 'TRACKING'
    };

    // 4. UI Overlay Elements
    this.dom = {
      displayHud: document.getElementById('displayHudOverlay'),
      hudBeacon: document.getElementById('displayHudBeacon'),
      hudStatusText: document.getElementById('displayHudStatusText'),
      hudRoomText: document.getElementById('displayHudRoomText'),
      hudLatencyText: document.getElementById('displayHudLatencyText'),
      fullscreenBtn: document.getElementById('displayFullscreenBtn'),
      reconnectOverlay: document.getElementById('displayReconnectOverlay'),
      reconnectMsg: document.getElementById('displayReconnectMsg')
    };

    // 5. Lifecycle & Animation Loop
    this.animationFrameId = null;
    this.lastRenderTime = performance.now();
    this.isHudFaded = false;
    this.hudFadeTimer = null;

    this._init();
  }

  _init() {
    // Make sure controller-specific UI is hidden on projection display
    this._cleanControllerUI();

    // Bind sync events
    this._bindSyncEvents();

    // Bind display controls (fullscreen, auto-hiding HUD)
    this._bindDisplayControls();

    // Start 60+ FPS render loop with smooth transform interpolation
    this._startRenderLoop();

    // Connect to WebSocket sync server
    this.sync.connect();
  }

  /**
   * Hide laptop-specific elements on display screen
   */
  _cleanControllerUI() {
    document.body.classList.add('projection-display-mode');

    // Hide intro screen landing modal on display (display jumps straight into scene)
    const introScreen = document.getElementById('cinematicIntroScreen');
    if (introScreen) introScreen.style.display = 'none';

    // Hide PiP webcam, header controls, diagnostics, etc.
    const pip = document.getElementById('pipWebcamCard');
    if (pip) pip.style.display = 'none';

    const header = document.querySelector('.jarvis-header');
    if (header) header.style.display = 'none';

    const diagnostics = document.getElementById('diagnosticsPanel');
    if (diagnostics) diagnostics.style.display = 'none';

    const reticle2D = document.getElementById('screenVirtualCursor');
    if (reticle2D) reticle2D.style.display = 'none';

    // Show display-specific minimal HUD overlay
    if (this.dom.displayHud) {
      this.dom.displayHud.classList.remove('hidden');
    }
  }

  _bindDisplayControls() {
    // Fullscreen toggle
    if (this.dom.fullscreenBtn) {
      this.dom.fullscreenBtn.addEventListener('click', () => {
        this.sceneManager.toggleFullscreen(document.documentElement);
      });
    }

    // Auto-fade HUD on inactivity
    const resetHudFade = () => {
      if (this.dom.displayHud) {
        this.dom.displayHud.classList.remove('faded');
      }
      if (this.hudFadeTimer) clearTimeout(this.hudFadeTimer);
      this.hudFadeTimer = setTimeout(() => {
        if (this.dom.displayHud) {
          this.dom.displayHud.classList.add('faded');
        }
      }, 4000);
    };

    window.addEventListener('mousemove', resetHudFade);
    window.addEventListener('touchstart', resetHudFade);
    resetHudFade();

    // Press 'F' for Fullscreen, 'H' to toggle HUD
    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        this.sceneManager.toggleFullscreen(document.documentElement);
      }
      if (e.key === 'h' || e.key === 'H') {
        if (this.dom.displayHud) {
          this.dom.displayHud.classList.toggle('force-hidden');
        }
      }
    });
  }

  // =========================================================================
  // NETWORK SYNC EVENT DISPATCHING
  // =========================================================================

  _bindSyncEvents() {
    // 1. Connection Status Changes
    this.sync.on('status', ({ status, isConnected, roomCode, latencyMs }) => {
      if (this.dom.hudRoomText) {
        this.dom.hudRoomText.textContent = `ROOM: ${roomCode}`;
      }

      if (isConnected) {
        if (this.dom.hudBeacon) {
          this.dom.hudBeacon.className = 'display-beacon-dot online';
        }
        if (this.dom.hudStatusText) {
          this.dom.hudStatusText.textContent = 'PAIRED // LIVE';
        }
        if (this.dom.reconnectOverlay) {
          this.dom.reconnectOverlay.classList.add('hidden');
        }
      } else {
        if (this.dom.hudBeacon) {
          this.dom.hudBeacon.className = 'display-beacon-dot offline';
        }
        if (this.dom.hudStatusText) {
          this.dom.hudStatusText.textContent = status === 'CONNECTING' ? 'CONNECTING...' : 'DISCONNECTED';
        }
        if (this.dom.reconnectOverlay) {
          this.dom.reconnectOverlay.classList.remove('hidden');
          if (this.dom.reconnectMsg) {
            this.dom.reconnectMsg.textContent = status === 'RECONNECTING'
              ? 'FEED INTERRUPTED — RECONNECTING TO CONTROLLER...'
              : 'WAITING FOR CONTROLLER STATION...';
          }
        }
      }
    });

    // Latency update
    this.sync.on('latency', (lat) => {
      if (this.dom.hudLatencyText) {
        this.dom.hudLatencyText.textContent = `${lat} ms`;
      }
    });

    // 2. Remote Transforms from Controller (30-40 Hz)
    this.sync.on('transforms', (items, reticle) => {
      for (const item of items) {
        const obj = this._findObjectByIdOrName(item.id || item.name);
        if (obj) {
          let tData = this.targetTransforms.get(obj.uuid);
          if (!tData) {
            tData = {
              targetPos: new THREE.Vector3(),
              targetQuat: new THREE.Quaternion(),
              targetScale: new THREE.Vector3(),
              isHeld: false
            };
            this.targetTransforms.set(obj.uuid, tData);
          }

          if (item.pos) tData.targetPos.set(item.pos[0], item.pos[1], item.pos[2]);
          if (item.rot) tData.targetQuat.set(item.rot[0], item.rot[1], item.rot[2], item.rot[3]);
          if (item.scale) tData.targetScale.set(item.scale[0], item.scale[1], item.scale[2]);
          tData.isHeld = !!item.isHeld;

          // If mesh was invisible, make visible
          if (!obj.visible && this.sceneManager.appState === APP_STATES.WORKSPACE) {
            obj.visible = true;
          }
        }
      }

      // Update 3D reticle
      if (reticle) {
        this.reticleTarget.visible = reticle.visible;
        if (reticle.pos) {
          this.reticleTarget.pos.set(reticle.pos[0], reticle.pos[1], reticle.pos[2]);
        }
        this.reticleTarget.mode = reticle.mode || 'TRACKING';
      } else {
        this.reticleTarget.visible = false;
      }
    });

    // 3. Discrete Actions
    this.sync.on('action', (action, data) => {
      if (action === 'BURST') {
        if (this.sceneManager.introCore) {
          this.sceneManager.introCore.triggerPulse();
        }
      } else if (action === 'FREEZE') {
        if (this.sceneManager.introCore) {
          this.sceneManager.introCore.freeze();
        }
      } else if (action === 'UNFREEZE') {
        if (this.sceneManager.introCore) {
          this.sceneManager.introCore.unfreeze();
        }
      } else if (action === 'GRAB') {
        const obj = this._findObjectByIdOrName(data.name || data.id);
        if (obj) {
          this.sceneManager.setSelectedObject(obj, true);
        }
      } else if (action === 'RELEASE') {
        const obj = this._findObjectByIdOrName(data.name || data.id);
        if (obj) {
          this.sceneManager.setSelectedObject(obj, false);
        }
      }
    });

    // 4. Target Selection
    this.sync.on('target_select', (targetName) => {
      const obj = this._findObjectByIdOrName(targetName);
      if (obj) {
        this.sceneManager.setSelectedObject(obj, false);
      }
    });

    // 5. Global State Transition (Intro vs Workspace)
    this.sync.on('state_change', (state) => {
      if (state === APP_STATES.WORKSPACE && this.sceneManager.appState !== APP_STATES.WORKSPACE) {
        this.sceneManager.startWorkspaceTransition();
      } else if (state === APP_STATES.INTRO && this.sceneManager.appState !== APP_STATES.INTRO) {
        this.sceneManager.returnToIntro();
      }
    });

    // 6. Entity Spawning & Lifecycle
    this.sync.on('spawn_entity', (assetId, entityData) => {
      const entity = this.inventoryManager.spawnEntity(assetId, entityData?.pos ? new THREE.Vector3(...entityData.pos) : null);
      if (entity && entityData) {
        if (entityData.id) entity.uuid = entityData.id;
        if (entityData.name) entity.name = entityData.name;
      }
    });

    this.sync.on('delete_entity', (id) => {
      const obj = this._findObjectByIdOrName(id);
      if (obj) {
        this.inventoryManager.deleteEntity(obj);
      }
    });

    this.sync.on('reset_scene', () => {
      this.sceneManager.resetScene();
      this.targetTransforms.clear();
    });

    // 7. Full Scene Snapshot
    this.sync.on('snapshot', (snapshot) => {
      this._applySnapshot(snapshot);
    });
  }

  /**
   * Find object by Name, UUID, or matching tag
   */
  _findObjectByIdOrName(idOrName) {
    if (!idOrName) return null;
    return this.sceneManager.interactiveObjects.find(
      obj => obj.uuid === idOrName || obj.name === idOrName || obj.userData?.type === idOrName
    ) || null;
  }

  /**
   * Restores complete scene state from controller snapshot
   */
  _applySnapshot(snapshot) {
    if (!snapshot) return;

    // 1. App State
    if (snapshot.state === APP_STATES.WORKSPACE && this.sceneManager.appState !== APP_STATES.WORKSPACE) {
      this.sceneManager.startWorkspaceTransition();
    } else if (snapshot.state === APP_STATES.INTRO && this.sceneManager.appState !== APP_STATES.INTRO) {
      this.sceneManager.returnToIntro();
    }

    // 2. Restore/Spawn missing inventory entities
    if (Array.isArray(snapshot.entities)) {
      snapshot.entities.forEach(ent => {
        let existing = this._findObjectByIdOrName(ent.id || ent.name);
        if (!existing && ent.assetId) {
          existing = this.inventoryManager.spawnEntity(ent.assetId, ent.pos ? new THREE.Vector3(...ent.pos) : null);
          if (existing) {
            if (ent.id) existing.uuid = ent.id;
            if (ent.name) existing.name = ent.name;
          }
        }
      });
    }

    // 3. Apply Transforms
    if (Array.isArray(snapshot.transforms)) {
      snapshot.transforms.forEach(item => {
        const obj = this._findObjectByIdOrName(item.id || item.name);
        if (obj) {
          if (item.pos) obj.position.set(item.pos[0], item.pos[1], item.pos[2]);
          if (item.rot) obj.quaternion.set(item.rot[0], item.rot[1], item.rot[2], item.rot[3]);
          if (item.scale) obj.scale.set(item.scale[0], item.scale[1], item.scale[2]);
        }
      });
    }

    // 4. Selected target
    if (snapshot.selectedTarget) {
      const sel = this._findObjectByIdOrName(snapshot.selectedTarget);
      if (sel) {
        this.sceneManager.setSelectedObject(sel, false);
      }
    }
  }

  // =========================================================================
  // DECOUPLED THREE.JS RENDER LOOP WITH EXPONENTIAL SLERP INTERPOLATION
  // =========================================================================

  _startRenderLoop() {
    const loop = (currentTime) => {
      this.animationFrameId = requestAnimationFrame(loop);

      const delta = (currentTime - this.lastRenderTime) / 1000;
      this.lastRenderTime = currentTime;
      const clampedDt = Math.max(0.001, Math.min(0.05, delta));

      // 1. Exponential smoothing towards remote target transforms
      // Smooth lerp factor guarantees zero stutter or jitter
      const posLerp = 1.0 - Math.exp(-22.0 * clampedDt);
      const slerpFactor = 1.0 - Math.exp(-20.0 * clampedDt);
      const scaleLerp = 1.0 - Math.exp(-18.0 * clampedDt);

      for (const [uuid, tData] of this.targetTransforms.entries()) {
        const obj = this.sceneManager.interactiveObjects.find(o => o.uuid === uuid);
        if (obj && tData) {
          obj.position.lerp(tData.targetPos, posLerp);
          obj.quaternion.slerp(tData.targetQuat, slerpFactor);
          obj.scale.lerp(tData.targetScale, scaleLerp);
        }
      }

      // 2. Interpolate 3D reticle
      if (this.reticleTarget && this.sceneManager.virtualCursor3D) {
        if (this.reticleTarget.visible) {
          this.sceneManager.virtualCursor3D.visible = true;
          this.sceneManager.virtualCursor3D.position.lerp(this.reticleTarget.pos, posLerp);
        } else {
          this.sceneManager.virtualCursor3D.visible = false;
        }
      }

      // 3. Render 3D Scene
      this.sceneManager.render();
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.sync) {
      this.sync.disconnect();
    }
  }
}
