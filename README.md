# GestureFlow — JARVIS Edition (Mark VII)

**GestureFlow — JARVIS Edition** is an ultra-smooth, low-latency, touchless 3D spatial gesture manipulation environment inspired by cinematic AI holographic workstations. Powered by Three.js and MediaPipe Hand Landmarker, it features adaptive **1€ (One Euro) low-latency filtering**, an explicit interaction state machine, **quaternion-based delta rotation**, and an asynchronous decoupled rendering pipeline.

---

## 1. Architectural Upgrades & Performance Optimization

```
gestureflow/src/
├── modules/
│   ├── camera.js                   # Webcam lifecycle, hardware stream release, error formatting
│   ├── constants.js                # 21 Landmark topology, gesture types, hysteresis thresholds, settings
│   ├── gestureDetector.js          # Palm-scale normalized gesture classifier with 1€ adaptive filtering
│   ├── gestureStateMachine.js      # Explicit interaction state machine with tracking loss debouncing
│   ├── handDetector.js             # MediaPipe HandLandmarker, monotonic timestamps, GPU delegation
│   ├── interactionController.js    # Proximity raycasting, quaternion delta rotation, decoupled render lerp
│   ├── landmarkRenderer.js         # JARVIS holographic canvas overlay, tactical vectors, corner brackets
│   ├── oneEuroFilter.js            # 1€ (One Euro) adaptive filter for jitter-free, zero-lag spatial coordinates
│   ├── sceneManager.js             # Three.js 3D world: Quantum Cube, Arc Reactor Sphere, Torus Accelerator
│   ├── telemetry.js                # Pipeline diagnostics profiler, condition classification, render FPS
│   └── videoScheduler.js           # Native requestVideoFrameCallback scheduler with watchdog timer
├── main.js                         # Decoupled 60+ FPS render loop, batched 12 Hz DOM updater, event coordinator
├── style.css                       # Cinematic obsidian & ice-blue stylesheet, Diagnostics HUD panel
└── index.html                      # Large 3D stage, direct target selectors, in-viewport tactical HUD arcs
```

---

## 2. Bottlenecks Identified & Fixed

| Identified Bottleneck | Root Cause | Engineering Solution |
| :--- | :--- | :--- |
| **Intermittent Tracking Freezes** | `video.currentTime` stalls in RAF loops and MediaPipe timestamp non-monotonicity exceptions. | **Dedicated Hardware Frame Scheduler & Monotonic Timestamps:** Native `requestVideoFrameCallback` scheduler with automatic 200ms watchdog recovery; strictly monotonic timestamps enforced for MediaPipe. |
| **Render Micro-Stutters (30–40 FPS)** | MediaPipe `detectForVideo` executed synchronously inside the Three.js `requestAnimationFrame` loop, blocking the render frame. | **Decoupled Update Pipeline:** Three.js renders independently at native 60+ FPS using delta-time interpolation. ML inference runs asynchronously only when new video frames arrive. |
| **Fingertip Tremor & High-Speed Lag** | Static EMA filter ($0.35$ alpha) caused either high-speed trailing lag or low-speed camera noise tremor. | **1€ (One Euro) Adaptive Filter:** Dynamic cutoff frequency $f_c = f_{c,\min} + \beta \cdot |v|$. Clamps micro-tremor to near zero at rest, while scaling up during fast movement for zero latency. |
| **Target Selection Misses** | Raycasting against exact mesh faces missed hollow torus and required millimeter accuracy on webcam. | **Spatial Proximity Raycasting:** Automatic root mesh unwinding and 1.75 unit proximity targeting radius makes pointing at shapes effortless and instant. |
| **Pinch Sensitivity Drift** | Pinch distance measured in raw Euclidean space, varying drastically with distance from webcam. | **Palm-Scale Normalization:** Distance normalized relative to palm metric $D_{\text{palm}} = \text{dist}(\text{wrist}, \text{middle\_mcp})$. Gesture triggers reliably at any camera distance. |
| **Gimbal Lock & Rotation Drift** | Naive Euler angle addition along screen X/Y axes caused gimbal drift when tilted. | **Quaternion Delta Rotation:** Rotations computed as incremental quaternions about camera-aligned right and up spatial vectors. |
| **Object Snapping on Grab** | Centering object on raycast intersection point caused a visual jump upon pinch start. | **Initial Grab Offset Preservation:** Locks $\vec{O}_{\text{grab}} = \vec{P}_{\text{mesh}} - \vec{P}_{\text{hit}}$, keeping the object exactly where it was gripped. |
| **DOM Layout Thrashing** | 15+ DOM text nodes updated 60 times a second during the animation loop. | **Batched 12 Hz DOM Updates:** Non-critical telemetry updates batched and throttled to eliminate layout recalculations. |
| **Garbage Collection Spikes** | Frequent `new THREE.Vector3()` and `new THREE.Plane()` allocations inside loops. | **Zero-GC Scratchpads:** All math vectors, quaternions, matrices, and planes pre-allocated in class constructors. |

---

## 3. Gesture Command Matrix

| Gesture | Anatomical Definition | Spatial Action |
| :---: | :--- | :--- |
| **🤏 PINCH** | Thumb tip (#4) & Index tip (#8) within $0.28 \times D_{\text{palm}}$ | **Grab & Drag:** Translates 3D mesh along camera plane; moving hand rotates mesh via quaternions. |
| **👆 POINTING** | Index extended, middle/ring/pinky curled | **Hover Targeting:** Reticle tracks fingertip; highlights candidate target in cyan. |
| **🖐️ OPEN PALM** | All 5 fingers extended and spread | **Instant Release:** Neutral mode; immediately releases any held mesh. |
| **✊ FIST** | All fingers closed into palm | **Freeze Lock:** Locks mesh spatial position and orientation in place. |
| **👐 TWO HANDS** | Both hands present with index tips active | **Proportional Scale:** Distance between hands scales object dynamically ($0.35\times - 3.2\times$). |

---

## 4. Run & Build Instructions

```bash
# Navigate to project directory
cd gestureflow

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` (or the displayed Vite local URL) in **Google Chrome**.

### Production Bundle
```bash
npm run build
npm run preview
```

---

## 5. Physical Webcam Manual Verification Checklist

| Step | Action | Expected Behavior |
| :---: | :--- | :--- |
| **1** | Open app | Cinematic obsidian stage loads. Quantum Cube, Arc Reactor Sphere, Torus Accelerator, and ambient particles float in 3D. |
| **2** | Orbit fallback | Left-drag mouse rotates scene smoothly; right-drag pans; wheel zooms. |
| **3** | Direct Selectors | Click `01 CUBE`, `02 SPHERE`, or `03 TORUS` in command bar. Active target immediately shifts with HUD feedback. |
| **4** | Engage Sensors | Click **ENGAGE SENSORS**. Optical scanner initializes in bottom-right PiP card with holographic skeleton overlay. |
| **5** | Slow Movement | Move index finger slowly. 1€ filter completely eliminates sensor jitter and micro-tremor. |
| **6** | Fast Movement | Whip index finger rapidly across screen. Reticle tracks with zero trailing latency. |
| **7** | Pinch Grab | Pinch over an object. Mesh turns bright emerald and drags smoothly **without any position jump**. |
| **8** | Quaternion Rotation | While holding pinch, move hand left/right and up/down. Object rotates cleanly without gimbal flipping. |
| **9** | Release | Release pinch. Object drops at its exact release coordinates. |
| **10** | Open Palm | While dragging, open all 5 fingers flat. Object is immediately dropped into neutral mode. |
| **11** | Fist Freeze | While dragging, close hand into a fist. Movement freezes in place. |
| **12** | Two-Hand Scaling | Present both hands. Spreading hands apart scales mesh larger; bringing together scales smaller. |
| **13** | Brief Tracking Loss | Block camera for a brief moment (<400ms) then unblock. Interaction state machine recovers without dropping object. |
| **14** | Disengage | Click **DISENGAGE**. Hardware camera shuts down cleanly. |
