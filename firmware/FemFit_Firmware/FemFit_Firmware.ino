/**
 * ==================================================================================
 *                       FEMFIT-INDUSTRIAL SMART SAFETY VEST
 *                       Edge-AI & Ergonomic Posture Monitor
 * ==================================================================================
 * Developer: The Gilded Girl | Komal Harshita
 * Target Hardware: ESP32 with MPU6050 OR Arduino Nano 33 BLE Sense
 * Function: Real-time biomechanical analysis of female trunk posture
 *           and heavy machinery micro-vibration exposure.
 * ==================================================================================
 */

// ==========================================
// 1. HARDWARE CONFIGURATION & BOARD SELECTION
// ==========================================
// Toggle the comments below depending on the board you are flashing:
#define BOARD_ESP32
//#define BOARD_NANO_BLE

#include <Wire.h>

#ifdef BOARD_ESP32
  // ESP32 MPU6050 Configuration
  const int HAPTIC_PIN = 25;      // Digital GPIO Pin for Haptic Vibration Motor
  const int MPU_ADDR = 0x68;       // I2C Address of MPU6050
#elif defined(BOARD_NANO_BLE)
  // Arduino Nano 33 BLE Sense Configuration
  #include <Arduino_LSM9DS1.h>
  const int HAPTIC_PIN = 2;       // Digital GPIO Pin for Haptic Vibration Motor
#endif

// ==========================================
// 2. CONSTANTS & TUNABLE THRESHOLDS (FEMALE CALIBRATED)
// ==========================================
// Sampling & Filter constants
const int SAMPLE_RATE_HZ = 50;                  // Target sampling rate
const unsigned long SAMPLE_PERIOD_MS = 20;     // 20ms period (50Hz)
const float ALPHA = 0.98;                      // Complementary filter weight (98% Gyro, 2% Accel)

// Ergonomic thresholds (Female Center of Gravity & REBA/RULA alignment)
const float THRESHOLD_PITCH_WARN = 20.0;       // Moderate trunk flexion (REBA trunk score 2)
const float THRESHOLD_PITCH_CRIT = 45.0;       // Severe forward bending (REBA score 3/4)
const float THRESHOLD_ROLL_CRIT  = 15.0;       // Asymmetric twist / side bend under load (high hernia risk)

// Machinery vibration threshold (Rolling variance on accelerometer axes)
// Exceeding this indicates significant exposure to high-frequency industrial jitter (10-40Hz)
const float THRESHOLD_VIBE_VARIANCE = 2.25;    // Equivalent to SD of ~1.5 m/s^2 (squared)
const int VIBE_WINDOW_SIZE = 10;                // 10 samples (rolling 200ms window)

// ==========================================
// 3. GLOBAL VARIABLES
// ==========================================
// IMU Sensor Readings
float ax, ay, az;                              // Linear Accelerations (m/s^2)
float gx, gy, gz;                              // Angular Velocities (deg/s)

// Estimated angles
float pitch = 0.0;                             // Estimated spine pitch (forward flex) in degrees
float roll = 0.0;                              // Estimated spine roll (lateral sway) in degrees
unsigned long lastSampleTime = 0;

// Circular buffer for rolling variance (vibration detection)
float accelMagHistory[VIBE_WINDOW_SIZE];
int bufferIndex = 0;
bool bufferFull = false;

// Alert states
enum AlertState {
  ALERT_NONE = 0,
  ALERT_POSTURE_WARNING,                       // Moderate trunk flexion
  ALERT_CRITICAL_STRAIN,                       // Severe flexion or awkward twisting
  ALERT_MACHINERY_VIBRATION                    // Exposure to dangerous machinery vibrations
};
AlertState currentAlert = ALERT_NONE;

// Non-blocking Haptic state machine variables
unsigned long hapticTimer = 0;
int hapticStep = 0;
bool hapticActive = false;

// ==========================================
// 4. FUNCTION PROTOTYPES
// ==========================================
void initializeIMU();
void readIMU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz);
void processSensors();
void updateHapticAlerts();
void triggerHapticPattern();

// ==========================================
// 5. SETUP & MAIN LOOP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=================================================");
  Serial.println(" FemFit-Industrial PoC - Starting System...      ");
  Serial.println("=================================================");

  pinMode(HAPTIC_PIN, OUTPUT);
  digitalWrite(HAPTIC_PIN, LOW); // Ensure haptics start OFF

  initializeIMU();
  
  // Clear rolling buffer
  for(int i = 0; i < VIBE_WINDOW_SIZE; i++) {
    accelMagHistory[i] = 0.0;
  }
  
  lastSampleTime = millis();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Enforce rigid 50Hz sampling loop
  if (currentTime - lastSampleTime >= SAMPLE_PERIOD_MS) {
    float dt = (currentTime - lastSampleTime) / 1000.0;
    lastSampleTime = currentTime;
    
    // Read raw data and process estimated biomechanics
    readIMU(ax, ay, az, gx, gy, gz);
    processSensors();
    
    // Run decision matrix
    updateHapticAlerts();
  }

  // Continuously handle haptic pulsing (runs in non-blocking loop)
  triggerHapticPattern();
}

// ==========================================
// 6. SENSOR INIT & ACQUISITION
// ==========================================
void initializeIMU() {
  #ifdef BOARD_ESP32
    Wire.begin();
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x6B); // Power Management 1 register
    Wire.write(0);    // Wake up MPU6050
    if (Wire.endTransmission() != 0) {
      Serial.println("[-] MPU6050 connection failed! Check wiring.");
      while (1);
    }
    Serial.println("[+] MPU6050 Initialized.");
  #elif defined(BOARD_NANO_BLE)
    if (!IMU.begin()) {
      Serial.println("[-] LSM9DS1 IMU initialization failed!");
      while (1);
    }
    Serial.println("[+] On-board LSM9DS1 Initialized.");
  #endif
}

void readIMU(float &ax, float &ay, float &az, float &gx, float &gy, float &gz) {
  #ifdef BOARD_ESP32
    // Read MPU6050 data registers
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B); // Start address for Accel X, Y, Z, Temp, Gyro X, Y, Z
    Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 14, true);

    // Combine bytes into signed integers
    int16_t raw_ax = (Wire.read() << 8) | Wire.read();
    int16_t raw_ay = (Wire.read() << 8) | Wire.read();
    int16_t raw_az = (Wire.read() << 8) | Wire.read();
    int16_t raw_temp = (Wire.read() << 8) | Wire.read(); // Skip temp
    int16_t raw_gx = (Wire.read() << 8) | Wire.read();
    int16_t raw_gy = (Wire.read() << 8) | Wire.read();
    int16_t raw_gz = (Wire.read() << 8) | Wire.read();

    // Convert raw values into physical quantities
    // MPU6050 defaults: Accel +/- 2g (16384 LSB/g), Gyro +/- 250 deg/s (131 LSB/deg/s)
    ax = (raw_ax / 16384.0) * 9.81;
    ay = (raw_ay / 16384.0) * 9.81;
    az = (raw_az / 16384.0) * 9.81;

    gx = raw_gx / 131.0;
    gy = raw_gy / 131.0;
    gz = raw_gz / 131.0;
    
  #elif defined(BOARD_NANO_BLE)
    float raw_ax, raw_ay, raw_az;
    float raw_gx, raw_gy, raw_gz;

    if (IMU.accelerationAvailable() && IMU.gyroscopeAvailable()) {
      IMU.readAcceleration(raw_ax, raw_ay, raw_az);
      IMU.readGyroscope(raw_gx, raw_gy, raw_gz);
      
      // LSM9DS1 outputs accelerometer in g's and gyro in deg/s
      ax = raw_ax * 9.81;
      ay = raw_ay * 9.81;
      az = raw_az * 9.81;
      
      gx = raw_gx;
      gy = raw_gy;
      gz = raw_gz;
    }
  #endif
}

// ==========================================
// 7. BIOMECHANICAL PROCESSING (COMPLEMENTARY FILTER)
// ==========================================
void processSensors() {
  float dt = SAMPLE_PERIOD_MS / 1000.0;
  
  // Calculate accelerometer-derived inclination angles (degrees)
  // Assumes sensor flat on back: Y along spine, X shoulder-to-shoulder, Z normal to back
  float pitch_acc = atan2(az, sqrt(ax*ax + ay*ay)) * 180.0 / PI;
  float roll_acc  = atan2(-ax, sqrt(ay*ay + az*az)) * 180.0 / PI;

  // Gyro integration & Complementary Filter (Drift-free pose tracking)
  // Gx is pitch rate (bending forward/backward), Gz/Gy is roll rate
  pitch = ALPHA * (pitch + gx * dt) + (1.0 - ALPHA) * pitch_acc;
  roll  = ALPHA * (roll + gz * dt) + (1.0 - ALPHA) * roll_acc;

  // Calculate current Acceleration Magnitude (excluding gravity)
  float accelMag = sqrt(ax*ax + ay*ay + az*az);
  
  // Add to circular buffer for vibration variance calculation
  accelMagHistory[bufferIndex] = accelMag;
  bufferIndex = (bufferIndex + 1) % VIBE_WINDOW_SIZE;
  if (bufferIndex == 0) bufferFull = true;
}

// ==========================================
// 8. ERGONOMIC DECISION MATRIX
// ==========================================
void updateHapticAlerts() {
  // 1. Calculate Rolling Variance for Machinery Vibration
  int limit = bufferFull ? VIBE_WINDOW_SIZE : bufferIndex;
  float sum = 0.0;
  for (int i = 0; i < limit; i++) {
    sum += accelMagHistory[i];
  }
  float mean = sum / limit;

  float varianceSum = 0.0;
  for (int i = 0; i < limit; i++) {
    varianceSum += pow(accelMagHistory[i] - mean, 2);
  }
  float variance = varianceSum / limit;

  // 2. Evaluate Biomechanical States & Select Alert Pattern
  // Priorities: Critical Posture > Machinery Vibration > Posture Warning > Safe
  
  // Check for critical posture (Severe bend or twisting under load)
  if (abs(pitch) > THRESHOLD_PITCH_CRIT || abs(roll) > THRESHOLD_ROLL_CRIT) {
    currentAlert = ALERT_CRITICAL_STRAIN;
  }
  // Check for machinery micro-vibration overload
  else if (bufferFull && variance > THRESHOLD_VIBE_VARIANCE) {
    currentAlert = ALERT_MACHINERY_VIBRATION;
  }
  // Check for moderate posture warning
  else if (abs(pitch) > THRESHOLD_PITCH_WARN) {
    currentAlert = ALERT_POSTURE_WARNING;
  }
  // Safe ergonomic zone
  else {
    currentAlert = ALERT_NONE;
  }

  // Serial debug stream (useful for prototyping plotter)
  Serial.print("Pitch: "); Serial.print(pitch);
  Serial.print(" | Roll: "); Serial.print(roll);
  Serial.print(" | AccelVar: "); Serial.print(variance);
  Serial.print(" | Alert: ");
  switch(currentAlert) {
    case ALERT_NONE: Serial.println("SAFE"); break;
    case ALERT_POSTURE_WARNING: Serial.println("WARNING (POSTURE)"); break;
    case ALERT_CRITICAL_STRAIN: Serial.println("CRITICAL (STRAIN)"); break;
    case ALERT_MACHINERY_VIBRATION: Serial.println("DANGER (VIBRATION)"); break;
  }
}

// ==========================================
// 9. NON-BLOCKING HAPTIC ALARM STATE MACHINE
// ==========================================
void triggerHapticPattern() {
  unsigned long now = millis();

  // If no alert, keep motor off and reset state machine
  if (currentAlert == ALERT_NONE) {
    digitalWrite(HAPTIC_PIN, LOW);
    hapticActive = false;
    hapticStep = 0;
    return;
  }

  // Alert State Machine Patterns (Executed dynamically without delay())
  switch (currentAlert) {
    
    // Pattern 1: Posture warning -> Moderate slow pulse (200ms ON, 400ms OFF)
    case ALERT_POSTURE_WARNING:
      if (!hapticActive || (now - hapticTimer >= (hapticStep == 0 ? 200 : 400))) {
        hapticTimer = now;
        hapticActive = true;
        hapticStep = !hapticStep; // Alternates between 0 (ON) and 1 (OFF)
        digitalWrite(HAPTIC_PIN, hapticStep ? HIGH : LOW);
      }
      break;

    // Pattern 2: Critical Strain -> Rapid warning double pulses (100ms ON, 100ms OFF, 100ms ON, 500ms OFF)
    case ALERT_CRITICAL_STRAIN:
      if (!hapticActive) {
        hapticActive = true;
        hapticStep = 0;
        hapticTimer = now;
        digitalWrite(HAPTIC_PIN, HIGH);
      } else {
        unsigned long elapsed = now - hapticTimer;
        
        if (hapticStep == 0 && elapsed >= 100) {      // ON 1 done -> Turn OFF
          hapticStep = 1;
          hapticTimer = now;
          digitalWrite(HAPTIC_PIN, LOW);
        }
        else if (hapticStep == 1 && elapsed >= 100) { // OFF 1 done -> Turn ON 2
          hapticStep = 2;
          hapticTimer = now;
          digitalWrite(HAPTIC_PIN, HIGH);
        }
        else if (hapticStep == 2 && elapsed >= 100) { // ON 2 done -> Turn OFF 2 (sustained rest)
          hapticStep = 3;
          hapticTimer = now;
          digitalWrite(HAPTIC_PIN, LOW);
        }
        else if (hapticStep == 3 && elapsed >= 500) { // Rest done -> Loop back to ON 1
          hapticStep = 0;
          hapticTimer = now;
          digitalWrite(HAPTIC_PIN, HIGH);
        }
      }
      break;

    // Pattern 3: Machinery Vibration -> Long sustained pulses (800ms ON, 200ms OFF)
    case ALERT_MACHINERY_VIBRATION:
      if (!hapticActive || (now - hapticTimer >= (hapticStep == 0 ? 800 : 200))) {
        hapticTimer = now;
        hapticActive = true;
        hapticStep = !hapticStep;
        digitalWrite(HAPTIC_PIN, hapticStep ? HIGH : LOW);
      }
      break;

    default:
      digitalWrite(HAPTIC_PIN, LOW);
      break;
  }
}
