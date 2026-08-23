import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import Papa from 'papaparse';
import { Play, Pause, RotateCcw, Upload } from 'lucide-react';

export default function IMUTelemetryStream({ onDataUpdate }) {
  const [data, setData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { label: 'Acc X', data: [], borderColor: '#EF4444', borderWidth: 1, pointRadius: 0 },
      { label: 'Acc Y', data: [], borderColor: '#B5E61D', borderWidth: 1, pointRadius: 0 },
      { label: 'Acc Z', data: [], borderColor: '#3B82F6', borderWidth: 1, pointRadius: 0 },
    ]
  });

  const intervalRef = useRef(null);

  // Generate synthetic preset data if no CSV
  const loadPreset = (type) => {
    let synth = [];
    let t = 0;
    for (let i = 0; i < 500; i++) {
      let pitch = 0, roll = 0, accX = 0, accY = 9.8, accZ = 0, status = 'SAFE', variance = 0.5;
      
      if (type === 'SAFE') {
        pitch = Math.sin(t) * 5;
      } else if (type === 'BEND') {
        pitch = Math.min(50, i * 0.5);
        if (pitch > 45) status = 'CRITICAL';
        else if (pitch > 20) status = 'WARNING';
      } else if (type === 'TWIST') {
        roll = Math.min(20, i * 0.2);
        if (roll > 15) status = 'CRITICAL';
      } else if (type === 'VIBE') {
        accX = Math.random() * 5 - 2.5;
        variance = 3.0;
        status = 'VIBRATION';
      }
      
      synth.push({ pitch, roll, accX, accY, accZ, status, variance });
      t += 0.1;
    }
    setData(synth);
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    // Load default preset on mount
    loadPreset('SAFE');
  }, []);

  useEffect(() => {
    if (isPlaying && data.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= data.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const nextRow = data[prev + 1];
          onDataUpdate(nextRow);
          
          // Update chart
          setChartData(curr => {
            const newLabels = [...curr.labels, prev].slice(-50);
            const newX = [...curr.datasets[0].data, nextRow.accX].slice(-50);
            const newY = [...curr.datasets[1].data, nextRow.accY].slice(-50);
            const newZ = [...curr.datasets[2].data, nextRow.accZ].slice(-50);
            return {
              labels: newLabels,
              datasets: [
                { ...curr.datasets[0], data: newX },
                { ...curr.datasets[1], data: newY },
                { ...curr.datasets[2], data: newZ }
              ]
            };
          });
          
          return prev + 1;
        });
      }, 20 / speed); // 50Hz = 20ms
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, data, onDataUpdate]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Map CSV row to our internal structure
            const mapped = results.data.map(row => ({
              pitch: row.pitch || row.Pitch || 0,
              roll: row.roll || row.Roll || 0,
              accX: row.acc_x || row.AccX || 0,
              accY: row.acc_y || row.AccY || 9.8,
              accZ: row.acc_z || row.AccZ || 0,
              variance: row.variance || 0,
              status: row.label || row.status || 'SAFE'
            }));
            setData(mapped);
            setCurrentIndex(0);
          }
        }
      });
    }
  };

  return (
    <div className="bg-[#111111] p-6 rounded-xl border border-neutral-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">IMU Telemetry Stream</h2>
        <div className="flex gap-2">
           <button onClick={() => loadPreset('SAFE')} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded">Safe</button>
           <button onClick={() => loadPreset('BEND')} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded">Bend</button>
           <button onClick={() => loadPreset('TWIST')} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded">Twist</button>
           <button onClick={() => loadPreset('VIBE')} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded">Vibration</button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-neonLime text-black rounded-full hover:bg-opacity-80">
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={() => {setCurrentIndex(0); setChartData(c => ({...c, labels:[], datasets: c.datasets.map(d => ({...d, data:[]}))}))}} className="p-2 text-neutral-400 hover:text-white">
          <RotateCcw size={20} />
        </button>
        <div className="flex bg-neutral-800 rounded">
          <button onClick={() => setSpeed(1)} className={`px-3 py-1 text-sm ${speed === 1 ? 'bg-neutral-600' : ''}`}>1X</button>
          <button onClick={() => setSpeed(2)} className={`px-3 py-1 text-sm ${speed === 2 ? 'bg-neutral-600' : ''}`}>2X</button>
        </div>
        
        <div className="flex-1"></div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 hover:text-white">
          <Upload size={16} /> Upload CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="w-full bg-neutral-900 rounded-full h-1 mb-6">
        <div className="bg-neonLime h-1 rounded-full" style={{ width: `${(currentIndex / Math.max(1, data.length)) * 100}%` }}></div>
      </div>

      <div className="h-[250px] w-full">
        <Line 
          data={chartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
              x: { display: false },
              y: { grid: { color: '#333' } }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
          }} 
        />
      </div>
    </div>
  );
}
