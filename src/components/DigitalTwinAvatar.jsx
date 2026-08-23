import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

function Spine({ pitch, roll, isCritical }) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      // Smoothly interpolate rotation
      const targetX = (pitch * Math.PI) / 180;
      const targetZ = (roll * Math.PI) / 180;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.1;
      groupRef.current.rotation.z += (targetZ - groupRef.current.rotation.z) * 0.1;
    }
  });

  const boneColor = isCritical ? '#EF4444' : '#B5E61D';

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Pelvis */}
      <Box args={[1.5, 0.5, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>
      
      {/* Vertebrae */}
      {[1, 2, 3, 4, 5].map((i) => (
        <group key={i} position={[0, i * 0.8, 0]}>
           <Box args={[0.6, 0.5, 0.6]}>
             <meshStandardMaterial 
               color={i >= 3 ? boneColor : '#A3A3A3'} 
               emissive={i >= 3 && isCritical ? '#EF4444' : '#000000'} 
               emissiveIntensity={0.8} 
             />
           </Box>
        </group>
      ))}
      
      {/* Head/Shoulder placeholder */}
      <Box args={[2, 0.5, 1]} position={[0, 4.8, 0]}>
        <meshStandardMaterial color="#555555" />
      </Box>
    </group>
  );
}

export default function DigitalTwinAvatar({ pitch, roll, status }) {
  const isCritical = status === 'CRITICAL';
  
  return (
    <div className="w-full h-[500px] bg-[#111111] rounded-xl border border-neutral-800 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 text-xs font-mono text-neutral-400 bg-black/50 px-2 py-1 rounded">
        3D KINEMATICS | PITCH: {pitch.toFixed(1)}° | ROLL: {roll.toFixed(1)}°
      </div>
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Spine pitch={pitch} roll={roll} isCritical={isCritical} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
