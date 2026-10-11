/**
 * GestureFlow - Hand Tracking Studio & 3D Workspace (Stage 2)
 * Landmark indices, skeletal topology, gestures, and interaction constants
 */

export const LANDMARK_NAMES = [
  'Wrist',            // 0
  'Thumb CMC',        // 1
  'Thumb MCP',        // 2
  'Thumb IP',         // 3
  'Thumb Tip',        // 4
  'Index MCP',        // 5
  'Index PIP',        // 6
  'Index DIP',        // 7
  'Index Tip',        // 8
  'Middle MCP',       // 9
  'Middle PIP',       // 10
  'Middle DIP',       // 11
  'Middle Tip',       // 12
  'Ring MCP',         // 13
  'Ring PIP',         // 14
  'Ring DIP',         // 15
  'Ring Tip',         // 16
  'Pinky MCP',        // 17
  'Pinky PIP',        // 18
  'Pinky DIP',        // 19
  'Pinky Tip'         // 20
];

export const KEY_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
};

export const FINGER_GROUPS = {
  PALM: 'palm',
  THUMB: 'thumb',
  INDEX: 'index',
  MIDDLE: 'middle',
  RING: 'ring',
  PINKY: 'pinky'
};

// Hand skeletal connections grouped by anatomical segment
export const SKELETAL_CONNECTIONS = [
  // Palm Base / Carpal Arch
  { from: 0, to: 1, group: FINGER_GROUPS.PALM },
  { from: 0, to: 5, group: FINGER_GROUPS.PALM },
  { from: 5, to: 9, group: FINGER_GROUPS.PALM },
  { from: 9, to: 13, group: FINGER_GROUPS.PALM },
  { from: 13, to: 17, group: FINGER_GROUPS.PALM },
  { from: 0, to: 17, group: FINGER_GROUPS.PALM },

  // Thumb
  { from: 1, to: 2, group: FINGER_GROUPS.THUMB },
  { from: 2, to: 3, group: FINGER_GROUPS.THUMB },
  { from: 3, to: 4, group: FINGER_GROUPS.THUMB },

  // Index Finger
  { from: 5, to: 6, group: FINGER_GROUPS.INDEX },
  { from: 6, to: 7, group: FINGER_GROUPS.INDEX },
  { from: 7, to: 8, group: FINGER_GROUPS.INDEX },

  // Middle Finger
  { from: 9, to: 10, group: FINGER_GROUPS.MIDDLE },
  { from: 10, to: 11, group: FINGER_GROUPS.MIDDLE },
  { from: 11, to: 12, group: FINGER_GROUPS.MIDDLE },

  // Ring Finger
  { from: 13, to: 14, group: FINGER_GROUPS.RING },
  { from: 14, to: 15, group: FINGER_GROUPS.RING },
  { from: 15, to: 16, group: FINGER_GROUPS.RING },

  // Pinky Finger
  { from: 17, to: 18, group: FINGER_GROUPS.PINKY },
  { from: 18, to: 19, group: FINGER_GROUPS.PINKY },
  { from: 19, to: 20, group: FINGER_GROUPS.PINKY }
];

export const FINGER_COLORS = {
  [FINGER_GROUPS.PALM]: {
    stroke: '#64748b',
    joint: '#94a3b8',
    glow: 'rgba(100, 116, 139, 0.4)'
  },
  [FINGER_GROUPS.THUMB]: {
    stroke: '#f59e0b',
    joint: '#fbbf24',
    tip: '#fde68a',
    glow: 'rgba(245, 158, 11, 0.6)'
  },
  [FINGER_GROUPS.INDEX]: {
    stroke: '#06b6d4',
    joint: '#22d3ee',
    tip: '#a5f3fc',
    glow: 'rgba(6, 182, 212, 0.6)'
  },
  [FINGER_GROUPS.MIDDLE]: {
    stroke: '#10b981',
    joint: '#34d399',
    tip: '#a7f3d0',
    glow: 'rgba(16, 185, 129, 0.6)'
  },
  [FINGER_GROUPS.RING]: {
    stroke: '#8b5cf6',
    joint: '#a78bfa',
    tip: '#ddd6fe',
    glow: 'rgba(139, 92, 246, 0.6)'
  },
  [FINGER_GROUPS.PINKY]: {
    stroke: '#ec4899',
    joint: '#f472b6',
    tip: '#fbcfe8',
    glow: 'rgba(236, 72, 153, 0.6)'
  }
};

export const TRACKING_STATES = {
  STOPPED: 'STOPPED',
  INITIALIZING: 'INITIALIZING',
  SEARCHING: 'SEARCHING',
  TRACKING: 'TRACKING',
  ERROR: 'ERROR'
};

// Recognized Gestures
export const GESTURE_TYPES = {
  NEUTRAL: 'NEUTRAL',
  POINTING: 'POINTING',
  PINCH: 'PINCH',
  OPEN_PALM: 'OPEN_PALM',
  FIST: 'FIST',
  TWO_HAND_SCALE: 'TWO_HAND_SCALE'
};

// 3D Interaction Lifecycle States
export const INTERACTION_STATES = {
  IDLE: 'IDLE',
  HOVERING: 'HOVERING',
  GRABBING: 'GRABBING',
  SCALING: 'SCALING',
  FROZEN: 'FROZEN'
};

// Calibrated Hysteresis Thresholds
export const GESTURE_CONFIG = {
  PINCH_GRAB_DISTANCE: 0.055,      // Pinch triggers grab under 0.055 normalized dist
  PINCH_RELEASE_DISTANCE: 0.085,   // Pinch releases above 0.085 to prevent jitter flicker
  DEFAULT_SMOOTHING: 0.35,         // Smoothing coefficient (0.05 = raw, 0.9 = ultra smooth)
  DEFAULT_ROTATION_SENSITIVITY: 1.6,// Hand delta to Euler rotation sensitivity
  MIN_SCALE: 0.35,                 // Two-hand scale clamp min
  MAX_SCALE: 3.2,                  // Two-hand scale clamp max
  TRACKING_LOSS_TIMEOUT_MS: 400    // Release held objects after 400ms without hand detection
};

export const DEFAULT_SETTINGS = {
  mirrorPreview: true,
  showLandmarks: true,
  showSkeleton: true,
  showCoordinates: true,
  showTelemetry: true,
  colorScheme: 'fingerCoded', // 'fingerCoded' | 'cyberEmerald' | 'neonCyan'
  activeHandIndex: 0,
  gestureControlEnabled: true,
  smoothing: GESTURE_CONFIG.DEFAULT_SMOOTHING,
  rotationSensitivity: GESTURE_CONFIG.DEFAULT_ROTATION_SENSITIVITY,
  orbitControlsEnabled: true
};
