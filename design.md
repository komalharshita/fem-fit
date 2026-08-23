# FemFit-Industrial: Design System

The FemFit-Industrial UI/UX is built around a **Cyber-Industrial** aesthetic, tailored to feel like high-end, rugged safety equipment software.

## 1. Color Palette
- **Primary Background:** Deep Black (`#080808`) - Reduces eye strain in dark industrial control rooms.
- **Primary Accent:** Neon Lime Green (`#B5E61D`) - Used for "Safe" states, active borders, and primary buttons. Provides high contrast and a futuristic tech feel.
- **Warning Accent:** Amber/Yellow (`#F2C94C`) - Used for moderate ergonomic warnings and vibrations.
- **Critical Accent:** Crimson Red (`#EF4444`) - Used for severe, dangerous postures requiring immediate haptic intervention.
- **Text:** Crisp White (`#FFFFFF`) and Light Gray (`#A3A3A3`) for secondary information.

## 2. Typography
- **Headers:** Geometric sans-serif, all-caps (e.g., Inter, Roboto Mono, or similar).
- **Body:** Clean, legible sans-serif for high readability on data-dense dashboards.

## 3. UI Components & Layout
- **Digital Twin Visualizer:** A central 3D skeleton/spine avatar (using Three.js) that mimics the worker's physical movements in real-time. The vertebrae glow based on localized stress.
- **Telemetry Stream:** Live-scrolling line charts (Chart.js) showing raw accelerometer and gyroscope data.
- **Haptic Alert Panel:** A dedicated modular panel that flashes synchronously with the physical vest's vibration motor, utilizing Web Audio API for auditory cues.
- **Shift Analytics:** KPI cards displaying max pitch, max roll, and cumulative vibration variance over the current shift.
