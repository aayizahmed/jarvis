/**
 * GestureFlow — JARVIS Edition
 * 3D Interaction Controller with Quaternion Delta Rotation,
 * Frame-Rate Independent Lerping, and Zero-GC Math Scratchpads
 */

import * as THREE from 'three';
import { GESTURE_CONFIG } from './constants.js';
import { GestureStateMachine, INTERACTION_STATES } from './gestureStateMachine.js';

export class InteractionController {
  constructor(sceneManager) {
    this.sm = sceneManager;

    // Explicit Gesture State Machine
    this.fsm = new GestureStateMachine({
      trackingLossTimeoutMs: GESTURE_CONFIG.TRACKING_LOSS_TIMEOUT_MS
    });

    // Zero-GC Pre-allocated Math Scratchpads
    this.raycaster = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane();
    this.planeIntersection = new THREE.Vector3();
    this.grabOffset = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
    this.cameraDir = new THREE.Vector3();
    this.cameraUp = new THREE.Vector3();
    this.cameraRight = new THREE.Vector3();
    this.deltaQuatY = new THREE.Quaternion();
    this.deltaQuatX = new THREE.Quaternion();
    this.rayToObjVec = new THREE.Vector3();

    // Interaction State
    this.heldObject = null;
    this.lastCursorScreen = { x: 0.5, y: 0.5 };
    this.lastUpdateTime = performance.now();

    // Configurable parameters
    this.rotationSensitivity = GESTURE_CONFIG.DEFAULT_ROTATION_SENSITIVITY;
    this.gestureControlEnabled = true;

    // Two-hand scaling state
    this.isTwoHandScaling = false;
    this.initialTwoHandDist = null;
    this.initialObjectScale = new THREE.Vector3(1, 1, 1);
    this.targetScale = new THREE.Vector3(1, 1, 1);

    this.latestGesture = 'NEUTRAL';
    this.previousGesture = 'NEUTRAL';
    this.onTargetSelected = null;
    this.onGestureTriggered = null;
    this._bindStateMachineEvents();
  }

  _bindStateMachineEvents() {
    this.fsm.on('grabStart', (target) => {
      this._onGrabStart(target);
      if (this.onGestureTriggered) this.onGestureTriggered('GRAB', target);
    });

    this.fsm.on('grabRelease', (target) => {
      this._onGrabRelease(target);
      if (this.onGestureTriggered) this.onGestureTriggered('RELEASE', target);
    });

    this.fsm.on('stateChange', (oldState, newState) => {
      // Visual feedback synchronization
      if (newState === INTERACTION_STATES.DRAGGING) {
        if (this.heldObject) this.sm.setSelectedObject(this.heldObject, true);
      } else if (newState === INTERACTION_STATES.HOVERING) {
        if (this.heldObject) this.sm.setSelectedObject(this.heldObject, false);
      }
    });
  }

  /**
   * Main inference update called when new vision landmarks/gestures are computed
   * 
   * @param {Object} gestureFrame Output from GestureDetector.process()
   * @param {number} currentTime High-res timestamp
   * @returns {Object} Interaction status snapshot for UI
   */
  updateInference(gestureFrame, currentTime) {
    if (!gestureFrame) return this._getStatusSnapshot('NEUTRAL');

    if (!this.gestureControlEnabled) {
      return this._getStatusSnapshot('NEUTRAL');
    }

    const {
      gesture,
      isPinching,
      cursor,
      ndc,
      handCount,
      twoHandDistance
    } = gestureFrame;

    this.latestGesture = gesture;

    // 1. Raycast from Normalized Device Coordinates
    this.raycaster.setFromCamera(ndc, this.sm.camera);

    // 2. Identify Hovered / Targeted Object when not currently holding
    let candidateHover = null;
    if (!this.heldObject) {
      // Step 2a: Direct mesh geometry intersection with parent root unwinding
      const intersects = this.raycaster.intersectObjects(this.sm.interactiveObjects, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !this.sm.interactiveObjects.includes(hit) && hit.parent) {
          hit = hit.parent;
        }
        if (this.sm.interactiveObjects.includes(hit)) {
          candidateHover = hit;
        }
      }

      // Step 2b: Proximity cone / ray distance test (if ray doesn't hit exact mesh faces)
      // Allows natural pointing at the Quantum Cube or Torus without pixel-perfect precision
      if (!candidateHover) {
        let minRayDist = Infinity;
        let bestCandidate = null;
        const PROXIMITY_THRESHOLD = 1.75; // Spatial targeting tolerance in 3D world units

        for (const obj of this.sm.interactiveObjects) {
          this.rayToObjVec.subVectors(obj.position, this.sm.camera.position);
          // Check that target object is in front of the camera ray
          if (this.raycaster.ray.direction.dot(this.rayToObjVec) > 0) {
            const rayDist = this.raycaster.ray.distanceToPoint(obj.position);
            if (rayDist < PROXIMITY_THRESHOLD && rayDist < minRayDist) {
              minRayDist = rayDist;
              bestCandidate = obj;
            }
          }
        }

        if (bestCandidate) {
          candidateHover = bestCandidate;
        }
      }

      // Step 2c: Apply visual hovering and synchronize selected target
      if (candidateHover) {
        const wasDifferent = this.sm.selectedObject !== candidateHover;
        this.sm.setHoveredObject(candidateHover);
        this.sm.setSelectedObject(candidateHover, false);
        if (wasDifferent && this.onTargetSelected) {
          this.onTargetSelected(candidateHover);
        }
      } else {
        this.sm.setHoveredObject(null);
      }
    }

    // 2d: Contextual Scientific Gesture Actions
    if (gesture === 'OPEN_PALM' && this.previousGesture !== 'OPEN_PALM') {
      if (this.sm.activeModuleId === 'matter' && this.sm.matterEngine) {
        this.sm.matterEngine.triggerBurst();
      }
      if (this.onGestureTriggered) this.onGestureTriggered('BURST');
    } else if (gesture === 'FIST' && this.previousGesture !== 'FIST') {
      if (this.sm.activeModuleId === 'matter' && this.sm.matterEngine) {
        this.sm.matterEngine.setFrozen(true);
      }
      if (this.onGestureTriggered) this.onGestureTriggered('FREEZE');
    } else if (this.previousGesture === 'FIST' && gesture !== 'FIST') {
      if (this.sm.activeModuleId === 'matter' && this.sm.matterEngine) {
        this.sm.matterEngine.setFrozen(false);
      }
      if (this.onGestureTriggered) this.onGestureTriggered('UNFREEZE');
    }
    this.previousGesture = gesture;

    // 3. Update Camera Spatial Directions
    this.sm.camera.getWorldDirection(this.cameraDir);
    this.cameraUp.copy(this.sm.camera.up);
    this.cameraRight.crossVectors(this.cameraDir, this.cameraUp).normalize();

    // 4. Update Interaction Drag Plane
    const cursorPlaneDist = this.heldObject ? this.heldObject.position.z : (this.sm.selectedObject ? this.sm.selectedObject.position.z : 0);
    this.dragPlane.setFromNormalAndCoplanarPoint(
      this.cameraDir.clone().negate(),
      new THREE.Vector3(0, 0, cursorPlaneDist)
    );
    this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection);

    // 5. Update State Machine
    const isTwoHand = handCount >= 2 && twoHandDistance !== null && !!this.heldObject;
    const activeTargetCandidate = candidateHover || this.sm.hoveredObject || this.sm.selectedObject;
    const currentState = this.fsm.update({
      handCount,
      gesture,
      isPinching,
      hoveredObject: activeTargetCandidate,
      isTwoHandScaling: isTwoHand
    }, currentTime);

    // 6. Update Target Transforms & Visual 3D Reticle
    if (currentState === INTERACTION_STATES.DRAGGING) {
      this._updateDragTargetAndRotate(cursor);
      this.sm.updateCursor(this.planeIntersection, 'DRAGGING');
    } else if (currentState === INTERACTION_STATES.SCALING) {
      this._updateScalingTarget(twoHandDistance);
      this.sm.updateCursor(this.planeIntersection, 'SCALING');
    } else if (currentState === INTERACTION_STATES.FROZEN) {
      this.sm.updateCursor(this.planeIntersection, 'FROZEN');
    } else if (currentState === INTERACTION_STATES.HOVERING || currentState === INTERACTION_STATES.TRACKING) {
      // Snap 3D reticle directly onto the targeted shape when pointing at it
      const cursorTarget = candidateHover ? candidateHover.position : this.planeIntersection;
      this.sm.updateCursor(cursorTarget, candidateHover ? 'HOVER' : 'TRACKING');
    } else {
      this.sm.updateCursor(null);
    }

    return this._getStatusSnapshot(gesture);
  }

  /**
   * Continuous per-frame render tick called from the Three.js RAF loop.
   * Smoothly interpolates held mesh transforms at 60/120 Hz, completely
   * decoupled from camera inference frame rate!
   * 
   * @param {number} dt Delta time in seconds
   */
  tickRender(dt) {
    if (!this.heldObject) return;

    const clampedDt = Math.max(0.001, Math.min(0.05, dt));
    const currentState = this.fsm.currentState;

    if (currentState === INTERACTION_STATES.DRAGGING || currentState === INTERACTION_STATES.TRACKING_LOST) {
      // Exponential smoothing towards latest target position
      const posLerp = 1.0 - Math.exp(-24.0 * clampedDt);
      this.heldObject.position.lerp(this.targetPos, posLerp);
    }

    if (currentState === INTERACTION_STATES.SCALING) {
      // Exponential smoothing towards latest scale
      const scaleLerp = 1.0 - Math.exp(-18.0 * clampedDt);
      this.heldObject.scale.lerp(this.targetScale, scaleLerp);
    }
  }

  renderInterpolate(delta, currentTime) {
    this.tickRender(delta);
  }

  /**
   * Combined update for backward compatibility
   */
  update(gestureFrame, currentTime) {
    const dt = Math.max(0.001, Math.min(0.1, (currentTime - this.lastUpdateTime) / 1000.0));
    this.lastUpdateTime = currentTime;
    const snap = this.updateInference(gestureFrame, currentTime);
    this.tickRender(dt);
    return snap;
  }

  _onGrabStart(target) {
    if (this.sm.activeTool === 'WEB_SHOOTER') {
      this.sm.shootWebToSelected();
    } else if (this.sm.activeTool === 'ENERGY_BLASTER') {
      this.sm.launchProjectileAtCursor();
    }

    this.heldObject = target;
    this.targetPos.copy(target.position);
    this.targetScale.copy(target.scale);

    // Anchor drag plane at object's exact center
    this.dragPlane.setFromNormalAndCoplanarPoint(
      this.cameraDir.clone().negate(),
      this.heldObject.position
    );

    // Intersect ray with this exact plane
    this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection);

    // PRESERVE INITIAL GRAB OFFSET: prevents snap/jump
    this.grabOffset.copy(this.heldObject.position).sub(this.planeIntersection);

    // Baseline cursor for rotation
    this.lastCursorScreen = { ...this.planeIntersection };

    // Highlight mesh
    this.sm.setSelectedObject(this.heldObject, true);

    // Temporarily pause OrbitControls
    if (this.sm.controls) {
      this.sm.controls.enabled = false;
    }
  }

  _onGrabRelease(target) {
    if (this.heldObject) {
      // Calculate and transfer gentle release inertia to object physics
      if (this.heldObject.userData && this.heldObject.userData.velocity) {
        const releaseVel = new THREE.Vector3().subVectors(this.targetPos, this.heldObject.position).multiplyScalar(3.2);
        this.heldObject.userData.velocity.copy(releaseVel);
      }
      this.sm.setSelectedObject(this.heldObject, false);
      this.heldObject = null;
    }
    this.isTwoHandScaling = false;
    this.initialTwoHandDist = null;

    // Re-enable OrbitControls
    if (this.sm.controls) {
      this.sm.controls.enabled = true;
    }
  }

  _updateDragTargetAndRotate(cursor) {
    if (!this.heldObject) return;

    // 1. Calculate Target Position along Drag Plane
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersection)) {
      this.targetPos.copy(this.planeIntersection).add(this.grabOffset);

      // Clamping within visible studio bounds
      this.targetPos.x = Math.max(-5.5, Math.min(5.5, this.targetPos.x));
      this.targetPos.y = Math.max(-0.9, Math.min(4.2, this.targetPos.y));
      this.targetPos.z = Math.max(-3.5, Math.min(3.5, this.targetPos.z));
    }

    // 2. Quaternion-Based Delta Rotation
    const deltaX = cursor.x - this.lastCursorScreen.x;
    const deltaY = cursor.y - this.lastCursorScreen.y;

    // Deadzone filter for resting hand tremor
    if (Math.abs(deltaX) > 0.0018 || Math.abs(deltaY) > 0.0018) {
      const angleY = deltaX * this.rotationSensitivity * 6.5;
      const angleX = deltaY * this.rotationSensitivity * 6.5;

      // Rotate around world Y / camera Up
      this.deltaQuatY.setFromAxisAngle(this.cameraUp, angleY);
      // Rotate around camera Right
      this.deltaQuatX.setFromAxisAngle(this.cameraRight, angleX);

      this.heldObject.quaternion.premultiply(this.deltaQuatY);
      this.heldObject.quaternion.premultiply(this.deltaQuatX);
    }

    this.lastCursorScreen = { ...cursor };
  }

  _updateScalingTarget(twoHandDistance) {
    if (!this.heldObject) return;

    if (!this.isTwoHandScaling) {
      this.isTwoHandScaling = true;
      this.initialTwoHandDist = twoHandDistance;
      this.initialObjectScale.copy(this.heldObject.scale);
      this.targetScale.copy(this.heldObject.scale);
    } else if (this.initialTwoHandDist && this.initialTwoHandDist > 0.02) {
      const ratio = twoHandDistance / this.initialTwoHandDist;
      this.targetScale.copy(this.initialObjectScale).multiplyScalar(ratio);

      this.targetScale.x = Math.max(GESTURE_CONFIG.MIN_SCALE, Math.min(GESTURE_CONFIG.MAX_SCALE, this.targetScale.x));
      this.targetScale.y = Math.max(GESTURE_CONFIG.MIN_SCALE, Math.min(GESTURE_CONFIG.MAX_SCALE, this.targetScale.y));
      this.targetScale.z = Math.max(GESTURE_CONFIG.MIN_SCALE, Math.min(GESTURE_CONFIG.MAX_SCALE, this.targetScale.z));
    }
  }

  setRotationSensitivity(val) {
    this.rotationSensitivity = Math.max(0.2, Math.min(4.0, val));
  }

  _getStatusSnapshot(gesture) {
    const state = this.fsm.currentState;
    const activeTarget = this.heldObject || this.sm.hoveredObject || this.sm.selectedObject;
    return {
      interactionState: state,
      detectedGesture: gesture,
      selectedObjectName: activeTarget ? activeTarget.name : 'None',
      selectedObject: activeTarget,
      isHoldingObject: !!this.heldObject,
      isScaling: state === INTERACTION_STATES.SCALING
    };
  }
}
