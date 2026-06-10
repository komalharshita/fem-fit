# FemFit-Industrial: Edge-AI Ergonomic Smart Safety Vest

**FemFit-Industrial** is an edge-AI powered smart safety vest designed specifically for female industrial workers. It aims to prevent work-related Musculoskeletal Disorders (MSDs) caused by improper lifting, ergonomic strain, and high-vibration heavy machinery environments. Developed by **The Gilded Girl** (**Komal Harshita**).

---

## 📌 Project Overview & System Architecture

The project consists of three integrated parts:
1. **Synthetic Data Generator (Python):** Simulates 3-axis accelerometer and 3-axis gyroscope data at 50Hz, modeling four distinct ergonomic and vibratory work conditions.
2. **On-Device Firmware (C++):** Real-time posture tracking and vibration analysis running directly on an ESP32 or Arduino Nano 33 BLE Sense. Uses a drift-free complementary filter, rolling-window variance estimation, and a non-blocking haptic alert state machine.
3. **Canva-Ready Presentation Deck (PPTX):** A pitch presentation generated using the high-contrast lime-and-black styling requested.

```
       +---------------------------------------------+
       |             Python Simulator                |
       |  (Generates Labeled IMU Data at 50 Hz)      |
       +-----------------------+---------------------+
                               |
                               v
       +---------------------------------------------+
       |             Edge Impulse Studio             |
       |  - Upload Segmented CSV Trials              |
       |  - DSP Spectral Features Extraction         |
       |  - Train 1D Convolutional Neural Network    |
       |  - Export as C++ TFLite Micro Library       |
       +-----------------------+---------------------+
                               |
                               v
       +---------------------------------------------+
       |             Microcontroller                 |
       |   (ESP32 / Arduino Nano 33 BLE Sense)       |
       |  - Acquires 6-Axis IMU Streams (50 Hz)       |
       |  - Runs TFLite Micro Model (or Heuristics)  |
       |  - Triggers Non-Blocking Haptic Vibrations  |
       +---------------------------------------------+
```

---

## 👩‍🔧 Female Biomechanical Ergonomics

Standard ergonomics frameworks (RULA/REBA) and safety equipment are typically calibrated against male anthropometric averages. FemFit-Industrial addresses this gap by adjusting thresholds based on female biomechanics:
* **Lower Center of Gravity (CoG):** Bending forward from the waist (trunk flexion) shifts loading forces to the lower lumbar spine (L4-S1) differently in females. Unsafe forward trunk flexion starts at **>20°** (REBA Trunk Score 2) and becomes critical at **>45°** (REBA Trunk Score 3/4).
* **Pelvic & Lumbar Angle Differences:** Asymmetric lateral bending or rotation (spine twisting) significantly amplifies loading pressure on spinal discs. Lateral tilt or twisting is capped at **>15°** under load to prevent acute injury.
* **Micro-Vibrations:** Operators of hand tools or machinery are exposed to high-frequency micro-vibrations (10Hz – 50Hz) which trigger vascular and neurological micro-strain. The system detects this by calculating the variance of the acceleration signal.

---

## 💻 Codebase Structure

* `data_generator/generate_data.py`: Creates synthetic IMU datasets for model training.
* `firmware/FemFit_Firmware/FemFit_Firmware.ino`: Arduino sketch containing sensory filters, decision matrices, and haptic logic.
* `generate_presentation.py`: Python script to output the Canva-ready presentation deck.
* `dataset/`: Folder created automatically containing the simulated IMU datasets.
* `femfit_presentation.pptx`: The generated Canva-ready pitch presentation.

---

## 🚀 Running the Python Scripts

### Prerequisites
Make sure Python 3 is installed. Open your terminal and run:
```bash
pip install numpy pandas python-pptx
```

### 1. Generating the Dataset
Run the following command in the workspace directory:
```bash
python data_generator/generate_data.py
```
This script creates a `dataset/` directory containing:
* **Consolidated Shift Data (`dataset/femfit_consolidated_shift.csv`):** Continuous time-series simulating an 8-hour shift, labeled for model prototyping.
* **Segmented Data Folders:** 10-second trials (500 samples at 50Hz) sorted into folders:
  - `safe_ergonomic/`: Proper squat lifts, walking, standing.
  - `unsafe_bend/`: Deep stoop lifting (waist bending > 45°).
  - `unsafe_twist/`: Asymmetric lateral trunk twisting (> 20°).
  - `heavy_vibration/`: Heavy mechanical micro-vibrations (20-40 Hz) superimposed on baseline posture.

### 2. Generating the Presentation Slides
Run the following command in the workspace directory:
```bash
python generate_presentation.py
```
This outputs `femfit_presentation.pptx` in the workspace root, matching your requested styling: deep black backgrounds, neon lime green bold headers, and warm yellow subheadings. You can open and edit this file directly in Microsoft PowerPoint or import it into Canva.

---

## 🔌 Firmware Details (`FemFit_Firmware.ino`)

The firmware runs a high-performance, non-blocking execution loop at exactly 50Hz.
* **Board Selection:** Toggle selection using preprocessor macros:
  - `#define BOARD_ESP32` (uses MPU6050 via Wire I2C; haptics on GPIO 25).
  - `#define BOARD_NANO_BLE` (uses onboard LSM9DS1 IMU; haptics on GPIO 2).
* **Complementary Filter:** Estimates pitch and roll while eliminating gyro drift:
  $$\text{Pitch}_{new} = 0.98 \times (\text{Pitch}_{prev} + \text{GyroX} \times dt) + 0.02 \times \text{Pitch}_{acc}$$
* **High-Frequency Vibration Detection:** Calculates rolling variance on a window of 10 samples (200ms) of accelerometer magnitude. If the variance exceeds `2.25` (equivalent to standard deviation of $1.5\text{ m/s}^2$), a machinery vibration alert is raised.
* **Non-Blocking Haptic State Machine:** Pulsing patterns are managed using `millis()` to avoid blocking sensor readings:
  - **ALERT_POSTURE_WARNING:** Slow pulsing (200ms ON, 400ms OFF).
  - **ALERT_CRITICAL_STRAIN:** Rapid double pulse (100ms ON, 100ms OFF, 100ms ON, 500ms OFF).
  - **ALERT_MACHINERY_VIBRATION:** Long sustained pulse (800ms ON, 200ms OFF).

---

## 🧠 Step-by-Step TinyML Migration Plan (Edge Impulse & TFLite)

To replace the heuristic decision matrix in the firmware with a true Edge-AI TinyML classifier, follow these steps:

### Step 1: Upload Data to Edge Impulse Studio
1. Sign up/log in at [Edge Impulse Studio](https://studio.edgeimpulse.com). Create a new project called **FemFit-Industrial**.
2. Install the **Edge Impulse CLI** or use the **Web Uploader** under the **Data Acquisition** tab.
3. Click "Upload Files". Select all CSV files inside `dataset/safe_ergonomic/`, `dataset/unsafe_bend/`, `dataset/unsafe_twist/`, and `dataset/heavy_vibration/`.
4. Choose **Infer category from folder name** to automatically label the uploads based on folder structures (`safe_ergonomic`, `unsafe_bend`, `unsafe_twist`, `heavy_vibration`).
5. Let Edge Impulse split your files automatically into Training (80%) and Test (20%) datasets.

### Step 2: Configure the Impulse (DSP & ML Blocks)
1. Go to **Create Impulse**.
2. Set the **Window size** to `10000ms` (10 seconds, matching our generated duration) and the **Window increase** to `1000ms` (creating overlapping windows for better training).
3. Set the frequency to `50Hz`.
4. Add a **Spectral Analysis** processing block (great for separating physical postures from high-frequency vibration signals). Select `ax, ay, az, gx, gy, gz` as input axes.
5. Add a **Classification (Keras)** learning block (this outputs a Neural Network classifier).
6. Click **Save Impulse**.

### Step 3: Extract Spectral Features
1. Go to the **Spectral Features** tab.
2. Select **Filter Type**: High-pass filter (cut-off at ~0.5Hz to remove baseline gravity bias) or keep the raw spectrum. The default parameters are optimized for IMU sensors.
3. Click **Save parameters** and then click **Generate Features**.
4. Review the **Feature Explorer** (a 3D plot of extracted characteristics). You should see clear spatial separation between your 4 classes.

### Step 4: Train the Neural Network Model
1. Navigate to the **Classifier** tab.
2. Configure your neural network. A recommended model is a 1D Convolutional Neural Network (1D CNN) or a standard Dense neural network.
3. Set the training parameters:
   - **Epochs:** `30`
   - **Learning rate:** `0.0005`
   - **Validation size:** `20%`
4. Click **Start Training**.
5. Once complete, review the model accuracy (targeting >95% accuracy) and the Confusion Matrix. Check the calculated on-device latency and RAM/Flash footprint estimation.

### Step 5: Export as C++ TFLite Micro Library
1. Navigate to the **Deployment** tab.
2. Under "Search for board or library", select **C++ Library** (this packages the model as a generic, highly optimized C++ library containing the TensorFlow Lite Micro compiler).
3. Under "Select optimizations", choose **Quantized (int8)** for maximum efficiency and low memory usage.
4. Click **Build** to download a compressed `.zip` file containing the source code.

### Step 6: Deploy on the Microcontroller
1. Unzip the downloaded library and copy the folder into your Arduino library directory (usually `Documents/Arduino/libraries/`).
2. Open the example sketch generated by Edge Impulse (e.g., `nano_ble_sense_accelerometer` or a generic static buffer classifier example).
3. In `FemFit_Firmware.ino`, replace the heuristic function `updateHapticAlerts()` with the Edge Impulse inference runner:
   - Copy the sensor features (`ax, ay, az, gx, gy, gz`) into the input signal buffer.
   - Call `run_classifier(&signal, &result, false)` to run on-device inference.
   - Read output probabilities:
     ```cpp
     float safe_prob = result.classification[0].value;
     float bend_prob = result.classification[1].value;
     float twist_prob = result.classification[2].value;
     float vibe_prob = result.classification[3].value;
     ```
   - Update the alert state based on the highest probability:
     ```cpp
     if (bend_prob > 0.70) currentAlert = ALERT_CRITICAL_STRAIN;
     else if (twist_prob > 0.70) currentAlert = ALERT_CRITICAL_STRAIN;
     else if (vibe_prob > 0.70) currentAlert = ALERT_MACHINERY_VIBRATION;
     else if (pitch > THRESHOLD_PITCH_WARN) currentAlert = ALERT_POSTURE_WARNING; // fallback
     else currentAlert = ALERT_NONE;
     ```
4. Compile and upload the code! Your system is now running true edge machine learning.
