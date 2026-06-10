import os
import numpy as np
import pandas as pd

# Design Parameters
SAMPLE_RATE = 50  # Hz (suitable for human movement & vibration aliasing detection)
DURATION = 10  # Seconds per file
SAMPLES_PER_FILE = SAMPLE_RATE * DURATION  # 500 samples
NUM_FILES_PER_CLASS = 30
OUTPUT_DIR = "dataset"

# Classes definition
CLASSES = {
    "safe_ergonomic": 0,
    "unsafe_bend": 1,
    "unsafe_twist": 2,
    "heavy_vibration": 3
}

def add_noise(signal, std_dev):
    return signal + np.random.normal(0, std_dev, len(signal))

def generate_safe_ergonomic(file_idx):
    """
    Simulates safe worker activity: standing, walking, or a biomechanically correct squat lift.
    Keep back upright (pitch < 15 degrees, roll < 10 degrees).
    """
    t = np.linspace(0, DURATION, SAMPLES_PER_FILE)
    activity_type = file_idx % 3  # Rotate between standing, walking, and safe lift
    
    # Base acceleration: Ay = 9.81 m/s^2 (vertical), Ax = 0, Az = 0
    ax = np.zeros(SAMPLES_PER_FILE)
    ay = np.ones(SAMPLES_PER_FILE) * 9.81
    az = np.zeros(SAMPLES_PER_FILE)
    
    gx = np.zeros(SAMPLES_PER_FILE)
    gy = np.zeros(SAMPLES_PER_FILE)
    gz = np.zeros(SAMPLES_PER_FILE)
    
    if activity_type == 0:
        # Standing still
        # Just sensor baseline + noise
        ax = add_noise(ax, 0.08)
        ay = add_noise(ay, 0.08)
        az = add_noise(az, 0.08)
        gx = add_noise(gx, 0.5)
        gy = add_noise(gy, 0.5)
        gz = add_noise(gz, 0.5)
        
    elif activity_type == 1:
        # Walking (periodic gait)
        # Vertical acceleration peaks at heel strike (~1.8 Hz)
        gait_freq = 1.8
        ay = 9.81 + 1.5 * np.sin(2 * np.pi * gait_freq * t)
        # Side-to-side sway at half gait frequency
        ax = 0.5 * np.sin(2 * np.pi * (gait_freq / 2) * t)
        # Small forward tilt sway
        az = 0.3 * np.sin(2 * np.pi * gait_freq * t)
        
        # Gyroscope rotations matching pelvic/trunk sway
        gx = 6.0 * np.cos(2 * np.pi * gait_freq * t)  # Pitching
        gy = 4.0 * np.cos(2 * np.pi * (gait_freq / 2) * t)  # Twisting
        gz = 8.0 * np.sin(2 * np.pi * (gait_freq / 2) * t)  # Roll sway
        
        ax = add_noise(ax, 0.15)
        ay = add_noise(ay, 0.15)
        az = add_noise(az, 0.15)
        gx = add_noise(gx, 1.2)
        gy = add_noise(gy, 1.2)
        gz = add_noise(gz, 1.2)
        
    elif activity_type == 2:
        # Safe lift (squat): keeping spine vertical (tilt pitch < 12 degrees)
        # Phase 1: bend knees (t: 2s to 4s) -> slight tilt
        # Phase 2: lift weight (t: 4s to 6s) -> vertical upward acceleration peak
        # Phase 3: return (t: 6s to 8s)
        pitch = np.zeros(SAMPLES_PER_FILE)
        for i, val_t in enumerate(t):
            if 2.0 <= val_t < 4.0:
                # Bending down: pitch goes 0 -> 12 degrees
                pitch[i] = 12 * np.sin(np.pi * (val_t - 2.0) / 4.0)
            elif 4.0 <= val_t < 6.0:
                # Bending down holds, starts lifting
                pitch[i] = 12
            elif 6.0 <= val_t < 8.0:
                # Returning: pitch 12 -> 0 degrees
                pitch[i] = 12 * np.cos(np.pi * (val_t - 6.0) / 4.0)
                
        pitch_rad = np.radians(pitch)
        ay = 9.81 * np.cos(pitch_rad)
        az = 9.81 * np.sin(pitch_rad)
        
        # Add upward acceleration thrust during the lift phase (4s to 6s)
        for i, val_t in enumerate(t):
            if 4.0 <= val_t < 6.5:
                # Upward acceleration thrust (peak ~ 1.3g)
                ay[i] += 3.0 * np.sin(np.pi * (val_t - 4.0) / 2.5)
                
        # Gyroscope pitch rate Gx = d(pitch)/dt
        gx = np.zeros(SAMPLES_PER_FILE)
        dt = 1.0 / SAMPLE_RATE
        gx[1:] = np.diff(pitch) / dt
        
        ax = add_noise(ax, 0.1)
        ay = add_noise(ay, 0.1)
        az = add_noise(az, 0.1)
        gx = add_noise(gx, 0.8)
        gy = add_noise(gy, 0.8)
        gz = add_noise(gz, 0.8)
        
    return ax, ay, az, gx, gy, gz

def generate_unsafe_bend(file_idx):
    """
    Simulates unsafe ergonomic strain: severe trunk flexion (stoop lifting).
    Trunk bends forward exceeding 50 degrees (sometimes up to 75 degrees).
    """
    t = np.linspace(0, DURATION, SAMPLES_PER_FILE)
    
    # Target unsafe pitch profile:
    # 0s-2s: Standing
    # 2s-4.5s: Bending forward (pitch goes 0 -> 60 degrees)
    # 4.5s-7s: Sustained deep bend under load (holding 60 degrees)
    # 7s-9s: Straightening up (pitch goes 60 -> 0 degrees)
    # 9s-10s: Standing
    pitch = np.zeros(SAMPLES_PER_FILE)
    for i, val_t in enumerate(t):
        if 2.0 <= val_t < 4.5:
            pitch[i] = 60.0 * (0.5 - 0.5 * np.cos(np.pi * (val_t - 2.0) / 2.5))
        elif 4.5 <= val_t < 7.0:
            pitch[i] = 60.0
        elif 7.0 <= val_t < 9.0:
            pitch[i] = 60.0 * (0.5 + 0.5 * np.cos(np.pi * (val_t - 7.0) / 2.0))
            
    pitch_rad = np.radians(pitch)
    # Gravity distribution on accelerometer
    ay = 9.81 * np.cos(pitch_rad)
    az = 9.81 * np.sin(pitch_rad)  # Gravity shifts to Z axis (chest-to-back axis)
    ax = np.zeros(SAMPLES_PER_FILE)
    
    # Calculate Gx (pitch rate) as derivative of pitch
    gx = np.zeros(SAMPLES_PER_FILE)
    dt = 1.0 / SAMPLE_RATE
    gx[1:] = np.diff(pitch) / dt
    
    gy = np.zeros(SAMPLES_PER_FILE)
    gz = np.zeros(SAMPLES_PER_FILE)
    
    # Add noise
    ax = add_noise(ax, 0.1)
    ay = add_noise(ay, 0.12)
    az = add_noise(az, 0.12)
    gx = add_noise(gx, 1.5)
    gy = add_noise(gy, 1.0)
    gz = add_noise(gz, 1.0)
    
    return ax, ay, az, gx, gy, gz

def generate_unsafe_twist(file_idx):
    """
    Simulates unsafe asymmetric lateral bending / twisting under load.
    Roll (side bending) reaches 25-35 degrees, combined with yaw rotation.
    """
    t = np.linspace(0, DURATION, SAMPLES_PER_FILE)
    
    # Target roll (lateral bend) profile:
    # 2s-4.5s: Roll goes 0 -> 28 degrees
    # 4.5s-7s: Hold lateral tilt
    # 7s-9.5s: Return 28 -> 0 degrees
    roll = np.zeros(SAMPLES_PER_FILE)
    for i, val_t in enumerate(t):
        if 2.0 <= val_t < 4.5:
            roll[i] = 28.0 * (0.5 - 0.5 * np.cos(np.pi * (val_t - 2.0) / 2.5))
        elif 4.5 <= val_t < 7.0:
            roll[i] = 28.0
        elif 7.0 <= val_t < 9.5:
            roll[i] = 28.0 * (0.5 + 0.5 * np.cos(np.pi * (val_t - 7.0) / 2.5))
            
    # Target twist (yaw/gy) rotation:
    # Simulates worker twisting spine to the side
    gy = np.zeros(SAMPLES_PER_FILE)
    for i, val_t in enumerate(t):
        if 2.0 <= val_t < 3.5:
            gy[i] = 25.0 * np.sin(np.pi * (val_t - 2.0) / 1.5)  # Twisting out
        elif 7.0 <= val_t < 8.5:
            gy[i] = -25.0 * np.sin(np.pi * (val_t - 7.0) / 1.5)  # Twisting back
            
    roll_rad = np.radians(roll)
    ax = 9.81 * np.sin(roll_rad)  # Gravity shifts to X axis (shoulder axis)
    ay = 9.81 * np.cos(roll_rad)
    az = np.zeros(SAMPLES_PER_FILE)
    
    # Roll rate (Gz) as derivative of roll
    gz = np.zeros(SAMPLES_PER_FILE)
    dt = 1.0 / SAMPLE_RATE
    gz[1:] = np.diff(roll) / dt
    
    gx = np.zeros(SAMPLES_PER_FILE)
    
    # Add noise
    ax = add_noise(ax, 0.12)
    ay = add_noise(ay, 0.12)
    az = add_noise(az, 0.1)
    gx = add_noise(gx, 1.0)
    gy = add_noise(gy, 1.5)
    gz = add_noise(gz, 1.5)
    
    return ax, ay, az, gx, gy, gz

def generate_heavy_vibration(file_idx):
    """
    Simulates a worker standing near or operating heavy high-vibration machinery.
    The baseline posture is upright standing, but high-frequency vibrations (20-40 Hz)
    are superimposed onto the accelerometer and gyroscope signals.
    """
    t = np.linspace(0, DURATION, SAMPLES_PER_FILE)
    
    # Base posture (standing)
    ax = np.zeros(SAMPLES_PER_FILE)
    ay = np.ones(SAMPLES_PER_FILE) * 9.81
    az = np.zeros(SAMPLES_PER_FILE)
    
    gx = np.zeros(SAMPLES_PER_FILE)
    gy = np.zeros(SAMPLES_PER_FILE)
    gz = np.zeros(SAMPLES_PER_FILE)
    
    # Superimpose high-frequency mechanical vibration:
    # We will simulate mechanical oscillations at 22 Hz, 31 Hz, and 38 Hz.
    # The amplitude of this vibration is dangerous (RMS acceleration variation > 0.4g)
    vibe_ax = 4.5 * np.sin(2 * np.pi * 22 * t) + 3.0 * np.sin(2 * np.pi * 31 * t)
    vibe_ay = 5.0 * np.sin(2 * np.pi * 22 * t) + 2.5 * np.sin(2 * np.pi * 38 * t)
    vibe_az = 3.5 * np.sin(2 * np.pi * 31 * t) + 2.0 * np.sin(2 * np.pi * 38 * t)
    
    vibe_gx = 35.0 * np.sin(2 * np.pi * 22 * t)
    vibe_gy = 25.0 * np.sin(2 * np.pi * 31 * t)
    vibe_gz = 30.0 * np.sin(2 * np.pi * 38 * t)
    
    ax += vibe_ax
    ay += vibe_ay
    az += vibe_az
    gx += vibe_gx
    gy += vibe_gy
    gz += vibe_gz
    
    # Add general white noise
    ax = add_noise(ax, 0.2)
    ay = add_noise(ay, 0.2)
    az = add_noise(az, 0.2)
    gx = add_noise(gx, 2.0)
    gy = add_noise(gy, 2.0)
    gz = add_noise(gz, 2.0)
    
    return ax, ay, az, gx, gy, gz

def main():
    print("Initializing synthetic data generation for FemFit-Industrial...")
    
    # Create directories
    for class_name in CLASSES.keys():
        class_dir = os.path.join(OUTPUT_DIR, class_name)
        os.makedirs(class_dir, exist_ok=True)
        
    consolidated_data = []
    
    # Generate files for each class
    for class_name, label in CLASSES.items():
        print(f"Generating data for class: {class_name} (label: {label})...")
        for file_idx in range(NUM_FILES_PER_CLASS):
            if class_name == "safe_ergonomic":
                ax, ay, az, gx, gy, gz = generate_safe_ergonomic(file_idx)
            elif class_name == "unsafe_bend":
                ax, ay, az, gx, gy, gz = generate_unsafe_bend(file_idx)
            elif class_name == "unsafe_twist":
                ax, ay, az, gx, gy, gz = generate_unsafe_twist(file_idx)
            elif class_name == "heavy_vibration":
                ax, ay, az, gx, gy, gz = generate_heavy_vibration(file_idx)
                
            # Create Dataframe
            # Edge Impulse prefers columns: timestamp, ax, ay, az, gx, gy, gz
            # Timestamp in milliseconds
            timestamps = np.arange(0, SAMPLES_PER_FILE) * (1000.0 / SAMPLE_RATE)
            df = pd.DataFrame({
                "timestamp": timestamps,
                "ax": ax,
                "ay": ay,
                "az": az,
                "gx": gx,
                "gy": gy,
                "gz": gz
            })
            
            # Save individual CSV
            file_name = f"{class_name}_{file_idx:02d}.csv"
            file_path = os.path.join(OUTPUT_DIR, class_name, file_name)
            df.to_csv(file_path, index=False)
            
            # Keep copy for consolidated dataset with labels and continuous timestamps
            df_cons = df.copy()
            df_cons["label"] = label
            df_cons["class_name"] = class_name
            df_cons["file_id"] = f"{class_name}_{file_idx:02d}"
            consolidated_data.append(df_cons)
            
    # Concatenate and save consolidated CSV
    print("Saving consolidated shift dataset...")
    full_df = pd.concat(consolidated_data, ignore_index=True)
    
    # Generate continuous timestamp for consolidated shift representation
    full_df["timestamp"] = np.arange(len(full_df)) * (1000.0 / SAMPLE_RATE)
    
    consolidated_path = os.path.join(OUTPUT_DIR, "femfit_consolidated_shift.csv")
    full_df.to_csv(consolidated_path, index=False)
    print(f"Data generation complete! Saved in '{OUTPUT_DIR}/'.")
    print(f"Consolidated file saved at: {consolidated_path}")

if __name__ == "__main__":
    main()
