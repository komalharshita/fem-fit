import React from 'react';
import { Activity, AlertTriangle, Vibrate } from 'lucide-react';

export default function ShiftAnalytics({ pitch, roll, variance, status }) {
  const isCritical = status === 'CRITICAL';
  const isWarning = status === 'WARNING';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pitch Card */}
      <div className={`p-4 rounded-xl border ${isCritical && pitch > 45 ? 'border-criticalRed bg-criticalRed/10' : 'border-neutral-800 bg-[#111111]'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-neutral-400 text-sm font-semibold tracking-wider">LUMBAR PITCH</h3>
          <Activity size={18} className="text-neutral-500" />
        </div>
        <p className="text-3xl font-bold font-mono">{pitch.toFixed(1)}°</p>
        <p className="text-xs text-neutral-500 mt-1">Threshold: 45°</p>
      </div>

      {/* Roll Card */}
      <div className={`p-4 rounded-xl border ${isCritical && Math.abs(roll) > 15 ? 'border-criticalRed bg-criticalRed/10' : 'border-neutral-800 bg-[#111111]'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-neutral-400 text-sm font-semibold tracking-wider">SPINE TWIST (ROLL)</h3>
          <AlertTriangle size={18} className="text-neutral-500" />
        </div>
        <p className="text-3xl font-bold font-mono">{Math.abs(roll).toFixed(1)}°</p>
        <p className="text-xs text-neutral-500 mt-1">Threshold: 15°</p>
      </div>

      {/* Vibration Card */}
      <div className={`p-4 rounded-xl border ${variance > 2.25 ? 'border-amberWarning bg-amberWarning/10' : 'border-neutral-800 bg-[#111111]'}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-neutral-400 text-sm font-semibold tracking-wider">VIBRATION VAR.</h3>
          <Vibrate size={18} className="text-neutral-500" />
        </div>
        <p className="text-3xl font-bold font-mono">{variance.toFixed(2)}</p>
        <p className="text-xs text-neutral-500 mt-1">ISO-5349 limit: 2.25</p>
      </div>
    </div>
  );
}
