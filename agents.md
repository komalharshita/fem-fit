# FemFit-Industrial: Agentic Architecture

The FemFit-Industrial ecosystem is designed to incorporate autonomous and semi-autonomous AI agents to enhance worker safety and streamline supervisor operations.

## 1. Edge-AI Safety Monitoring Agent
- **Location:** On-device (ESP32 / Nano 33 BLE)
- **Role:** Continuously monitors the 6-axis IMU sensor stream in real-time.
- **Capabilities:** Utilizes a lightweight TinyML model (or deterministic dynamic matrix) to classify postures. It acts autonomously with zero cloud latency to trigger haptic feedback motors when dangerous spinal flexion, twisting, or high-frequency vibrations are detected.

## 2. Ergonomics Analysis Agent (Planned)
- **Location:** Web Dashboard (Client-side / Web Worker)
- **Role:** Analyzes the streaming telemetry to calculate RULA (Rapid Upper Limb Assessment) and REBA (Rapid Entire Body Assessment) scores dynamically.
- **Capabilities:** Generates historical shift reports and predicts musculoskeletal fatigue over time.

## 3. Alert Dispatch Agent (Planned)
- **Location:** Supervisor Dashboard
- **Role:** Monitors the fleet of active vests on the factory floor.
- **Capabilities:** Automatically dispatches critical warnings to supervisors if a worker repeatedly violates safety thresholds or experiences a sudden impact/fall.
