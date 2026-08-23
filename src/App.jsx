import React, { useState, useCallback } from 'react';
import DigitalTwinAvatar from './components/DigitalTwinAvatar';
import IMUTelemetryStream from './components/IMUTelemetryStream';
import HapticAlertState from './components/HapticAlertState';
import ShiftAnalytics from './components/ShiftAnalytics';

export default function App() {
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [variance, setVariance] = useState(0);
  const [status, setStatus] = useState('SAFE');

  const handleDataUpdate = useCallback((row) => {
    setPitch(row.pitch);
    setRoll(row.roll);
    setVariance(row.variance);
    setStatus(row.status);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 font-sans">
      <header className="mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-neonLime">
          FEMFIT<span className="text-white">-INDUSTRIAL</span>
        </h1>
        <p className="text-neutral-400 text-sm mt-1">Edge-AI Powered Smart Safety Vest Dashboard</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 3D Visualization & Alerts */}
        <div className="space-y-6">
          <DigitalTwinAvatar pitch={pitch} roll={roll} status={status} />
          <HapticAlertState status={status} />
        </div>

        {/* Right Column: Telemetry & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <ShiftAnalytics pitch={pitch} roll={roll} variance={variance} status={status} />
          <IMUTelemetryStream onDataUpdate={handleDataUpdate} />
        </div>
      </div>
    </div>
  );
}
