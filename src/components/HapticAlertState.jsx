import React, { useEffect, useRef } from 'react';
import { BellRing } from 'lucide-react';

export default function HapticAlertState({ status }) {
  const isCritical = status === 'CRITICAL';
  const isWarning = status === 'WARNING';
  const isSafe = status === 'SAFE';
  const isVibration = status === 'VIBRATION';

  const audioCtxRef = useRef(null);

  // Initialize Web Audio API on first interaction/mount
  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  useEffect(() => {
    if (!audioCtxRef.current) return;
    
    // Play sounds when state changes
    if (isCritical) {
      playBeep(400, 'square', [100, 100, 100]);
    } else if (isWarning) {
      playBeep(300, 'sine', [200]);
    } else if (isVibration) {
      playBeep(150, 'sawtooth', [50, 50, 50, 50]);
    }
  }, [status, isCritical, isWarning, isVibration]);

  const playBeep = (freq, type, pattern) => {
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    let time = audioCtxRef.current.currentTime;
    pattern.forEach((duration) => {
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      
      gain.gain.setValueAtTime(0.1, time);
      osc.start(time);
      osc.stop(time + duration / 1000);
      
      time += (duration + 100) / 1000;
    });
  };

  let bgColor = 'bg-neonLime/10';
  let borderColor = 'border-neonLime';
  let textColor = 'text-neonLime';
  let label = 'SAFE POSTURE';

  if (isCritical) {
    bgColor = 'bg-criticalRed/20';
    borderColor = 'border-criticalRed';
    textColor = 'text-criticalRed';
    label = 'CRITICAL: HAPTIC ENGAGED';
  } else if (isWarning) {
    bgColor = 'bg-amberWarning/20';
    borderColor = 'border-amberWarning';
    textColor = 'text-amberWarning';
    label = 'WARNING: ADJUST POSTURE';
  } else if (isVibration) {
    bgColor = 'bg-blue-500/20';
    borderColor = 'border-blue-500';
    textColor = 'text-blue-500';
    label = 'MACHINERY VIBRATION ALERT';
  }

  return (
    <div className={`p-6 rounded-xl border-2 transition-colors duration-300 flex flex-col items-center justify-center text-center ${bgColor} ${borderColor}`}>
      <BellRing size={32} className={`mb-3 ${isCritical ? 'animate-bounce' : ''} ${textColor}`} />
      <h2 className={`text-xl font-bold tracking-widest ${textColor}`}>{label}</h2>
      <p className="text-neutral-400 text-sm mt-2">
        {isCritical && "Severe ergonomic stress detected. Physical vest motor running."}
        {isWarning && "Approaching limits (RULA score rising)."}
        {isSafe && "Biomechanics normal."}
        {isVibration && "High frequency vibration limits exceeded (ISO-5349)."}
      </p>
    </div>
  );
}
