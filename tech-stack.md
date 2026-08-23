# FemFit-Industrial: Technology Stack

The project leverages a modern, fast, and edge-first technology stack to ensure zero-latency safety monitoring and an immersive web experience.

## 1. Frontend Web Dashboard (The Current Migration)
- **Framework:** React 18
- **Build Tool:** Vite (Chosen for blazing fast HMR and minimal configuration)
- **Styling:** Tailwind CSS (Enables rapid implementation of the Cyber-Industrial design system)
- **3D Visualization:** Three.js & `@react-three/fiber` (Renders the real-time Digital Twin spine avatar)
- **Charting:** Chart.js & `react-chartjs-2` (For smooth, 50Hz telemetry streaming)
- **Data Parsing:** PapaParse (For client-side parsing of synthetic shift CSV data)
- **Hosting:** Vercel (Instant, zero-config static deployments from the GitHub repository root)

## 2. Edge Hardware & Firmware
- **Microcontroller:** ESP32 or Arduino Nano 33 BLE Sense
- **Sensors:** MPU6050 (6-axis Accelerometer & Gyroscope)
- **Language:** C++ / Arduino Framework
- **Core Logic:** Complementary filter for pitch/roll estimation; rolling window variance for vibration analysis.
- **Actuator:** Low-power haptic vibration motor connected via GPIO.

## 3. Data & AI Pipeline
- **Synthetic Data Generator:** Python (`numpy`, `pandas`) script generating 50Hz time-series IMU data mimicking female ergonomic profiles.
- **TinyML (Planned):** Edge Impulse for training a 1D Convolutional Neural Network (CNN) to replace the deterministic decision matrix, exported as a TensorFlow Lite Micro library.
