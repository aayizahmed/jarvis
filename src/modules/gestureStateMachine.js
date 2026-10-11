/**
 * GestureFlow — JARVIS Edition
 * Explicit Gesture Interaction State Machine
 * States: IDLE, TRACKING, HOVERING, GRABBING, DRAGGING, SCALING, FROZEN, TRACKING_LOST
 */

export const INTERACTION_STATES = {
  IDLE: 'IDLE',
  TRACKING: 'TRACKING',
  HOVERING: 'HOVERING',
  GRABBING: 'GRABBING',
  DRAGGING: 'DRAGGING',
  SCALING: 'SCALING',
  FROZEN: 'FROZEN',
  TRACKING_LOST: 'TRACKING_LOST'
};

export class GestureStateMachine {
  constructor(options = {}) {
    this.currentState = INTERACTION_STATES.IDLE;
    this.previousState = INTERACTION_STATES.IDLE;

    // Configurable timeouts
    this.trackingLossTimeoutMs = options.trackingLossTimeoutMs || 420;
    this.lastTrackingTimestamp = performance.now();
    this.stateEnterTimestamp = performance.now();

    // Held target reference
    this.targetObject = null;

    // Event listeners
    this.listeners = {
      stateChange: [],
      grabStart: [],
      grabRelease: []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  _transition(nextState, timestamp = performance.now()) {
    if (this.currentState === nextState) return;

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = nextState;
    this.stateEnterTimestamp = timestamp;

    // Notify listeners
    this.listeners.stateChange.forEach(fn => fn(oldState, nextState));
  }

  /**
   * Evaluate state transitions based on filtered vision inputs
   * 
   * @param {Object} input 
   * @param {number} timestamp 
   * @returns {string} Current interaction state
   */
  update(input, timestamp = performance.now()) {
    const {
      handCount,
      gesture,
      isPinching,
      hoveredObject,
      isTwoHandScaling
    } = input;

    // 1. Hand presence & Tracking Loss Debouncing
    if (handCount > 0) {
      this.lastTrackingTimestamp = timestamp;

      // Recover from temporary tracking loss if hand returns
      if (this.currentState === INTERACTION_STATES.TRACKING_LOST) {
        if (this.targetObject && isPinching) {
          this._transition(INTERACTION_STATES.DRAGGING, timestamp);
        } else if (this.targetObject) {
          this._releaseGrab(timestamp);
          this._transition(INTERACTION_STATES.TRACKING, timestamp);
        } else {
          this._transition(INTERACTION_STATES.TRACKING, timestamp);
        }
      }
    } else {
      // Hand disappeared: Handle tracking loss buffer
      if (this.currentState === INTERACTION_STATES.DRAGGING || this.currentState === INTERACTION_STATES.SCALING) {
        if (this.currentState !== INTERACTION_STATES.TRACKING_LOST) {
          this._transition(INTERACTION_STATES.TRACKING_LOST, timestamp);
        } else {
          // If lost longer than timeout, drop object safely
          if (timestamp - this.lastTrackingTimestamp > this.trackingLossTimeoutMs) {
            this._releaseGrab(timestamp);
            this._transition(INTERACTION_STATES.IDLE, timestamp);
          }
        }
        return this.currentState;
      } else {
        this._transition(INTERACTION_STATES.IDLE, timestamp);
        return this.currentState;
      }
    }

    // 2. Gesture Override: OPEN PALM (Instant Neutral Release)
    if (gesture === 'OPEN_PALM') {
      if (this.targetObject) {
        this._releaseGrab(timestamp);
      }
      this._transition(hoveredObject ? INTERACTION_STATES.HOVERING : INTERACTION_STATES.TRACKING, timestamp);
      return this.currentState;
    }

    // 3. Gesture Override: FIST (Freeze/Pause)
    if (gesture === 'FIST') {
      this._transition(INTERACTION_STATES.FROZEN, timestamp);
      return this.currentState;
    } else if (this.currentState === INTERACTION_STATES.FROZEN) {
      // Exit freeze once fist opens
      this._transition(this.targetObject ? INTERACTION_STATES.DRAGGING : INTERACTION_STATES.TRACKING, timestamp);
    }

    // 4. Two-Hand Scaling
    if (isTwoHandScaling && handCount >= 2 && this.targetObject) {
      this._transition(INTERACTION_STATES.SCALING, timestamp);
      return this.currentState;
    } else if (this.currentState === INTERACTION_STATES.SCALING && (!isTwoHandScaling || handCount < 2)) {
      this._transition(this.targetObject ? INTERACTION_STATES.DRAGGING : INTERACTION_STATES.TRACKING, timestamp);
    }

    // 5. Pinch Dragging Transitions
    if (isPinching) {
      if (!this.targetObject) {
        // Can only grab if an object is hovered or eligible
        if (hoveredObject) {
          this.targetObject = hoveredObject;
          this._transition(INTERACTION_STATES.GRABBING, timestamp);
          this.listeners.grabStart.forEach(fn => fn(this.targetObject));
          // Rapidly advance to DRAGGING
          this._transition(INTERACTION_STATES.DRAGGING, timestamp);
        } else {
          // Pinching in empty space
          this._transition(INTERACTION_STATES.TRACKING, timestamp);
        }
      } else {
        // Continue dragging
        if (this.currentState !== INTERACTION_STATES.SCALING) {
          this._transition(INTERACTION_STATES.DRAGGING, timestamp);
        }
      }
    } else {
      // Pinch released
      if (this.targetObject) {
        this._releaseGrab(timestamp);
      }

      // Free navigation: Hovering or Tracking
      if (hoveredObject) {
        this._transition(INTERACTION_STATES.HOVERING, timestamp);
      } else {
        this._transition(INTERACTION_STATES.TRACKING, timestamp);
      }
    }

    return this.currentState;
  }

  _releaseGrab(timestamp) {
    if (this.targetObject) {
      const released = this.targetObject;
      this.targetObject = null;
      this.listeners.grabRelease.forEach(fn => fn(released));
    }
  }

  forceReset() {
    this._releaseGrab(performance.now());
    this._transition(INTERACTION_STATES.IDLE);
  }
}
