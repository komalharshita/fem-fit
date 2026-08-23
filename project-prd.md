# Product Requirements Document (PRD)
## FemFit-Industrial: Edge-AI Ergonomic Smart Safety Vest

---

| Document Attribute | Details |
| :--- | :--- |
| **Product Name** | FemFit-Industrial: Edge-AI Ergonomic Smart Safety Vest |
| **Document Version** | 1.0.0 |
| **Author / Lead Lead** | The Gilded Girl (**Komal Harshita**) |
| **Status** | Approved for Execution / Hackathon Baseline |
| **Target Hardware Target** | ESP32-WROOM-32 / Arduino Nano 33 BLE Sense |
| **Target Market** | Industrial Manufacturing, Warehouse Operations, Heavy Assembly |
| **Date Created** | August 2026 |

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
**FemFit-Industrial** is an ultra-low-power, zero-cloud Edge-AI smart safety vest specifically engineered for female industrial and warehouse workers. Traditional occupational ergonomics frameworks (RULA/REBA) and personal protective equipment (PPE) have historically been calibrated against male anthropometric and biomechanical standards. FemFit-Industrial bridges this critical gender safety gap by embedding real-time biomechanical analysis and haptic bio-feedback directly into a standard safety vest.

By running real-time sensor fusion, drift-free complementary filtering, and TinyML neural classifiers locally on an embedded microcontroller, FemFit-Industrial detects hazardous ergonomic postures (lumbar flexion, torso twisting) and high-frequency machinery micro-vibrations in under 5 milliseconds—warning workers within 50 milliseconds to correct their movement before acute or chronic Musculoskeletal Disorders (MSDs) occur.

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
       +-----------------------+---------------------+
```

---

## 2. Problem Statement & Market Rationale

### 2.1 The Ergonomic & Gender Gap in Occupational Health
Work-related Musculoskeletal Disorders (MSDs)—including lower back pain, disc herniation, hand-arm vibration syndrome (HAVS), and spinal shear injuries—represent the leading cause of industrial absenteeism globally, accounting for over **$50 Billion** in direct workers' compensation and lost productivity annually.

Current industrial safety equipment suffers from systemic biases:
1. **Anthropometric Misalignment:** Standard safety equipment and ergonomic scoring systems assume male center of gravity (CoG), mass distribution, and pelvic morphology.
2. **Female Lumbar Biomechanics:** Females possess a lower center of mass and distinct pelvic tilt dynamics. During waist bending (trunk flexion), spinal shear forces concentrated at the L4-S1 lumbar junction reach damaging thresholds at lower angular displacements than in males.
3. **Combination Trauma:** Simultaneous trunk flexion (>20°) and asymmetric lateral twisting (>15°) under load drastically amplifies intradiscal pressure, making combination movements the primary cause of severe acute herniations.
4. **Machinery Micro-Vibrations:** Continuous exposure to power tool or machinery jitter (10–50 Hz) damages micro-vascular and neurological networks over time (ISO 5349 HAVS hazards).

### 2.2 Business Objectives & Opportunity
* **Target User Base:** Over **150 Million** female industrial, logistics, and assembly line workers globally.
* **Target Unit Cost:** $\le \$20.00$ Bill of Materials (BOM) cost per unit for rapid mass adoption.
* **Expected Impact:**
  * **60%+ Reduction** in back muscle strain and fatigue-related MSD claims within 12 months.
  * **90%+ Posture Correction Compliance** via intuitive, instant haptic pulses.
  * **15% Increase** in shift operational efficiency due to reduced worker fatigue.
  * **< 3 Months Payback Period** for enterprise employers by preventing a single MSD claim.

---

## 3. Product Goals, Metrics & KPIs

| Metric Category | Target KPI | Verification Method |
| :--- | :--- | :--- |
| **Detection Latency** | $< 5\text{ ms}$ processing time per sample | Oscilloscope / GPIO toggle timing |
| **Feedback Latency** | $< 50\text{ ms}$ from trigger to haptic response | High-speed camera / Sensor logging |
| **Sampling Rate** | Rigid $50\text{ Hz}$ ($20\text{ ms}$ period $\pm 0.5\text{ ms}$) | Hardware timer / RTOS ticker |
| **Classification Accuracy** | $> 95\%$ accuracy across 4 movement classes | Edge Impulse Confusion Matrix |
| **Battery Autonomy** | $\ge 12\text{ hours}$ continuous active shift use | 500mAh LiPo discharge test |
| **Edge Autonomy** | $100\%$ offline operation (0 cloud dependency) | Air-gapped network testing |
| **BOM Cost** | $\le \$20.00$ at 1,000 unit volume | Itemized Procurement Sheet |

---

## 4. Female Biomechanical Ergonomic Calibration

Standard ergonomic risk evaluation frameworks (RULA/REBA) are re-calibrated within FemFit-Industrial specifically to accommodate female lumbar biomechanics:

### 4.1 Postural Thresholds (Spine Orientation)
* **Trunk Flexion (Pitch Angle $\theta_P$):**
  * *Safe Zone:* $\theta_P \le 20.0^\circ$ (REBA Trunk Score 1)
  * *Posture Warning:* $20.0^\circ < \theta_P \le 45.0^\circ$ (REBA Trunk Score 2 - Moderate flexion)
  * *Critical Strain:* $\theta_P > 45.0^\circ$ (REBA Trunk Score 3/4 - High herniation risk)
* **Lateral Twist / Asymmetric Bend (Roll Angle $\theta_R$):**
  * *Safe Zone:* $\theta_R \le 15.0^\circ$
  * *Critical Strain:* $\theta_R > 15.0^\circ$ (High spinal disc shear force)

### 4.2 Micro-Vibration Thresholds (Machinery Exposure)
* **Rolling Acceleration Variance ($\sigma_{acc}^2$):** Calculated over a sliding window of $N=10$ samples ($200\text{ ms}$ at $50\text{ Hz}$).
* **Vibration Threshold:** $\sigma_{acc}^2 > 2.25\text{ m}^2/\text{s}^4$ (equivalent to a standard deviation of $\approx 1.5\text{ m/s}^2$). Exceeding this threshold isolates machine-induced micro-vibrations ($10\text{ Hz} - 50\text{ Hz}$) from static physical posture.

---

## 5. System Architecture & Hardware Specifications

```
                       +-------------------------------+
                       | 6-Axis IMU (MPU6050 / LSM9DS1)|
                       |  - Accel: +/- 2g (50Hz)       |
                       |  - Gyro: +/- 250 dps (50Hz)   |
                       +---------------+---------------+
                                       |
                                       | I2C (400kHz)
                                       v
                       +-------------------------------+
                       | Embedded Microcontroller      |
                       | (ESP32-WROOM-32 / Nano 33 BLE)|
                       |  - Dual-Core / 32-bit ARM     |
                       |  - Complementary Filter       |
                       |  - Rolling Variance Engine    |
                       |  - TFLite Micro Classifier    |
                       +---------------+---------------+
                                       |
                                       | GPIO (PWM / Digital)
                                       v
                       +-------------------------------+
                       | Non-Blocking Haptic Actuator  |
                       |  - ERM Vibration Disc Motor   |
                       |  - 3 Distinct Haptic Grammars |
                       +-------------------------------+
```

### 5.1 Hardware Component Specifications

| Component | Part / Spec | Rationale & Function |
| :--- | :--- | :--- |
| **Microcontroller (Option A)** | ESP32-WROOM-32 (Xtensa 32-bit Dual-Core 240MHz) | Integrated Wi-Fi/BLE, low power, low cost (\$3.50). Primary target. |
| **Microcontroller (Option B)** | Arduino Nano 33 BLE Sense (nRF52840 ARM Cortex-M4F 64MHz) | Low-power BLE, onboard IMU. Secondary dual-target option. |
| **Motion Sensor (Option A)** | MPU6050 (3-Axis Accel + 3-Axis Gyro) | I2C address `0x68`, configured to $\pm 2g$ and $\pm 250^\circ/\text{s}$. |
| **Motion Sensor (Option B)** | LSM9DS1 (9-Axis IMU onboard Nano BLE) | High precision, ultra-low power consumption. |
| **Haptic Actuator** | 1027 Flat Coin ERM Vibration Motor ($3\text{V}$, $80\text{mA}$) | Tactical bio-feedback placed at upper spine / thoracic region. |
| **Power Supply** | 3.7V 500mAh LiPo Battery + TP4056 Charge Controller | 12+ hour shift operation with step-up regulator to $3.3\text{V}/5\text{V}$. |
| **Wearable Enclosure** | IP65 Splash-proof TPU flexible 3D printed housing | Embedded within breathability-optimized industrial mesh vest. |

---

## 6. Functional Requirements (FRs)

### FR-1: High-Frequency Sensor Data Acquisition
* **Requirement:** The system MUST acquire 6-axis IMU raw readings (Linear accelerations $a_x, a_y, a_z$ in $\text{m/s}^2$, Angular velocities $g_x, g_y, g_z$ in $\text{deg/s}$) at a strict, deterministic rate of $50\text{ Hz}$ ($20\text{ ms}$ interval).
* **Implementation:** Executed via non-blocking millis polling loops on ESP32 / Arduino Nano 33 BLE Sense.

### FR-2: Drift-Free Posture Estimation (Complementary Filter)
* **Requirement:** The system MUST combine accelerometer gravity vectors and integrated gyroscope rates to output pitch ($\theta_P$) and roll ($\theta_R$) without experiencing long-term integration drift.
* **Mathematical Formulation:**
  $$\theta_{P,\text{acc}} = \text{atan2}(a_z, \sqrt{a_x^2 + a_y^2}) \times \frac{180}{\pi}$$
  $$\theta_{R,\text{acc}} = \text{atan2}(-a_x, \sqrt{a_y^2 + a_z^2}) \times \frac{180}{\pi}$$
  $$\theta_P = \alpha \times (\theta_P + g_x \cdot \Delta t) + (1 - \alpha) \times \theta_{P,\text{acc}}$$
  $$\theta_R = \alpha \times (\theta_R + g_z \cdot \Delta t) + (1 - \alpha) \times \theta_{R,\text{acc}}$$
  *(where filter constant $\alpha = 0.98$ and sampling period $\Delta t = 0.02\text{ s}$)*.

### FR-3: Machinery Micro-Vibration Analytics Engine
* **Requirement:** The system MUST calculate rolling variance on the overall acceleration magnitude over a window of $N=10$ samples ($200\text{ ms}$).
* **Mathematical Formulation:**
  $$\text{Mag}_i = \sqrt{a_{x,i}^2 + a_{y,i}^2 + a_{z,i}^2}$$
  $$\mu = \frac{1}{N} \sum_{i=1}^{N} \text{Mag}_i$$
  $$\sigma^2 = \frac{1}{N} \sum_{i=1}^{N} (\text{Mag}_i - \mu)^2$$
* **Action:** If $\sigma^2 > 2.25$, trigger `ALERT_MACHINERY_VIBRATION`.

### FR-4: Ergonomic Decision Matrix & Priority Escalation
* **Requirement:** The system MUST continuously evaluate estimated posture and vibration states against female-calibrated ergonomic thresholds using a deterministic priority hierarchy:
  1. **Priority 1 (Highest):** `ALERT_CRITICAL_STRAIN` ($|\theta_P| > 45.0^\circ$ OR $|\theta_R| > 15.0^\circ$).
  2. **Priority 2:** `ALERT_MACHINERY_VIBRATION` ($\sigma^2 > 2.25$).
  3. **Priority 3:** `ALERT_POSTURE_WARNING` ($|\theta_P| > 20.0^\circ$).
  4. **Priority 4 (Default):** `ALERT_NONE` (Safe posture).

### FR-5: Non-Blocking Haptic Alarm State Machine
* **Requirement:** Haptic feedback MUST execute dynamically without blocking sensor acquisition loops (strictly prohibiting `delay()` calls).
* **Haptic Grammar Code:**

| Alert State | Vibration Pattern | Tactical Rationale |
| :--- | :--- | :--- |
| `ALERT_NONE` | `OFF` (0ms ON / 0ms OFF) | Baseline safe condition. |
| `ALERT_POSTURE_WARNING` | **Moderate Slow Pulse:** 200ms ON, 400ms OFF | Gentle reminder to adjust trunk flexion. |
| `ALERT_CRITICAL_STRAIN` | **Rapid Double Pulse:** 100ms ON, 100ms OFF, 100ms ON, 500ms OFF | Urgent warning of severe herniation risk. |
| `ALERT_MACHINERY_VIBRATION` | **Long Sustained Pulse:** 800ms ON, 200ms OFF | Warns worker of excessive vibration exposure. |

### FR-6: Synthetic Data Generation Pipeline (`generate_data.py`)
* **Requirement:** The system MUST provide a high-fidelity Python simulation script to generate labeled IMU datasets simulating an 8-hour worker shift at $50\text{ Hz}$ across 4 distinct classes:
  1. `safe_ergonomic/`: Proper squatting, walking, standing.
  2. `unsafe_bend/`: Stoop lifting with trunk flexion $>45^\circ$.
  3. `unsafe_twist/`: Asymmetric torso twisting $>20^\circ$.
  4. `heavy_vibration/`: Micro-vibrations ($20-40\text{ Hz}$) superimposed on baseline posture.

### FR-7: TinyML Edge Impulse Classifier Migration Plan
* **Requirement:** The firmware MUST support drop-in replacement of heuristic threshold logic with a TensorFlow Lite for Microcontrollers (TFLite Micro) quantized C++ model trained via Edge Impulse.
* **Pipeline:** 10-second sliding windows ($10,000\text{ ms}$) $\rightarrow$ High-pass DSP Spectral Filter ($0.5\text{ Hz}$) $\rightarrow$ 1D CNN Neural Network $\rightarrow$ Quantized `int8` C++ library deployment.

---

## 7. Non-Functional Requirements (NFRs)

### NFR-1: Performance & Latency
* The end-to-end loop time (sensor acquisition, filter computation, variance math, decision matrix, haptic state tick) MUST execute in $< 5\text{ ms}$ per iteration, well within the $20\text{ ms}$ ($50\text{ Hz}$) sampling budget.

### NFR-2: Zero-Cloud Edge Autonomy
* The system MUST function $100\%$ independently of internet connections, external gateways, or mobile applications, eliminating latency and privacy concerns.

### NFR-3: Power Consumption & Battery Life
* Average current consumption MUST not exceed $35\text{ mA}$ during regular operation and $95\text{ mA}$ during active haptic pulsing.
* Must support a minimum of $12\text{ hours}$ continuous operation on a single 500mAh LiPo charge.

### NFR-4: Ergonomics & Wearability
* Total electronics enclosure weight MUST be $< 65\text{ grams}$.
* Mounted unobtrusively between the shoulder blades (T2-T4 vertebrae) inside a washable, breathable high-visibility mesh vest.

---

## 8. Bill of Materials (BOM) & Economics

| Item | Component Description | Supplier / Target | Qty | Unit Cost (USD) | Ext. Cost (1k Vol) |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | ESP32-WROOM-32 Microcontroller | Espressif Systems | 1 | \$3.50 | \$2.80 |
| 2 | MPU6050 6-Axis IMU Module | TDK InvenSense | 1 | \$1.20 | \$0.85 |
| 3 | 1027 ERM Haptic Vibration Motor | Precision Microdrives | 1 | \$0.80 | \$0.45 |
| 4 | 3.7V 500mAh LiPo Battery | Generic / PKCELL | 1 | \$2.50 | \$1.80 |
| 5 | TP4056 Charge & Protection Board | Generic | 1 | \$0.40 | \$0.25 |
| 6 | Custom Flexible PCB & Wiring Harness | JLCPCB / PCBWay | 1 | \$2.00 | \$1.20 |
| 7 | IP65 3D-Printed TPU Housing | Internal | 1 | \$1.50 | \$0.90 |
| 8 | High-Vis Breathable Mesh Safety Vest | Workwear OEM | 1 | \$6.00 | \$4.50 |
| **Total** | **FemFit-Industrial Smart Safety Vest** | | | **\$17.90** | **\$12.75** |

---

## 9. Product Roadmap & Execution Plan

```
+-----------------------------------------------------------------------------------+
| PHASE 1: POC & Simulation (COMPLETED)                                             |
|  - Synthetic Python Data Generator (50Hz 4-Class Dataset)                         |
|  - Canva-Ready Pitch Presentation Deck Generation                                |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| PHASE 2: Firmware & Sensor Validation (COMPLETED)                                 |
|  - Arduino/ESP32 C++ Firmware with Complementary Filter                           |
|  - Non-Blocking Haptic State Machine & Rolling Variance Engine                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| PHASE 3: TinyML Deployment & Edge Impulse (NEXT - Q4 2026)                       |
|  - Upload Synthetic & Real IMU Datasets to Edge Impulse                           |
|  - Train 1D-CNN Classifier & Export Quantized Int8 C++ Library                     |
|  - Integrate TFLite Micro Runtime into Firmware                                   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| PHASE 4: Hardware PCB & Field Pilots (Q1 2027)                                    |
|  - Custom Coin-Sized Flexible PCB Design                                          |
|  - Conduct Field Trials with 50 Female Industrial & Logistics Operators           |
+-----------------------------------------------------------------------------------+
```

---

## 10. Risk Analysis & Mitigation Matrix

| Risk Factor | Impact | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Gyroscope Orientation Drift** | False posture warnings after continuous movement | High | Implemented fast-converging complementary filter ($98\%$ gyro, $2\%$ accel) restricting angle drift to $< 1^\circ$. |
| **Feedback Latency (>100ms)** | Warning occurs after worker completes unsafe lift | Critical | Replaced heavy floating-point math with fixed-point decision matrix executed in $<5\text{ ms}$. |
| **Real Female IMU Data Scarcity** | Inadequate training samples for TinyML model | Medium | Built high-fidelity Python synthetic simulation generating 120+ labeled shift trials. |
| **Sensor Displacement on Vest** | Misalignment of IMU relative to spine | Medium | Form-fitting elastic vest harness securing IMU flush against T2-T4 thoracic spine. |

---

## 11. Document Verification & Sign-off

* **Lead Architect & Developer:** The Gilded Girl (**Komal Harshita**)
* **Project Repository:** `femfit`
* **Artifact Output File:** `project-prd.md` (Generated locally in workspace root, not pushed to `main` branch).
