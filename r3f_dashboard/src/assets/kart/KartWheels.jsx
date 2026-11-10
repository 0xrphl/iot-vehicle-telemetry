import React from 'react';
import { KART_DIMS } from './TubeSegment';

function WheelMesh({ radius, width }) {
  const spokeAngles = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);

  return (
    <group>
      {/* Racing Slick Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, width, 28]} />
        <meshStandardMaterial color="#18181b" roughness={0.82} metalness={0.12} />
      </mesh>

      {/* Alloy Rim Barrel */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.62, radius * 0.62, width * 1.04, 20]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* 5-Spoke Star Pattern */}
      {spokeAngles.map((ang, i) => (
        <mesh key={i} rotation={[Math.PI / 2, ang, 0]}>
          <cylinderGeometry args={[0.009, 0.009, radius * 1.15, 8]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export function KartWheels({ steerAngle = 0 }) {
  const { W_FRONT, Z_FRONT, Z_REAR } = KART_DIMS;
  const frontRadius = 0.18;
  const frontWidth  = 0.11;
  const rearRadius  = 0.22;
  const rearWidth   = 0.14;

  return (
    <group name="KartWheels">
      {/* Left Front Steerable Wheel */}
      <group position={[W_FRONT, frontRadius, Z_FRONT]} rotation={[0, steerAngle, 0]}>
        <WheelMesh radius={frontRadius} width={frontWidth} />
      </group>

      {/* Right Front Steerable Wheel */}
      <group position={[-W_FRONT, frontRadius, Z_FRONT]} rotation={[0, steerAngle, 0]}>
        <WheelMesh radius={frontRadius} width={frontWidth} />
      </group>

      {/* Single Central Rear Electric Hub-Motor Drive Wheel */}
      <group position={[0, rearRadius, Z_REAR]}>
        <WheelMesh radius={rearRadius} width={rearWidth} />
      </group>
    </group>
  );
}
