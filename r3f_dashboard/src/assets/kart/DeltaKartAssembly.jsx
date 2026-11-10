import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MainLadderFrame } from './MainLadderFrame';
import { FrontSuspensionArms } from './FrontSuspensionArms';
import { RearSwingarmSubframe } from './RearSwingarmSubframe';
import { RollCageAndCockpit } from './RollCageAndCockpit';
import { KartWheels } from './KartWheels';

/**
 * DeltaKartAssembly
 * Complete 30mm Profile Tube Electric Delta-Kart (2 Front Wheels, 1 Rear Wheel)
 * Smoothly interpolates Roll, Pitch, Yaw, and Steering Angle at 60 FPS using R3F useFrame
 */
export function DeltaKartAssembly({ roll = 0, pitch = 0, yaw = 0, gz = 0, scale = 1 }) {
  const groupRef = useRef();
  const smoothed = useRef({ r: 0, p: 0, y: 0 });

  useFrame(() => {
    if (!groupRef.current) return;
    const targetR = THREE.MathUtils.degToRad(roll);
    const targetP = THREE.MathUtils.degToRad(pitch);
    const targetY = THREE.MathUtils.degToRad(yaw);

    smoothed.current.r += (targetR - smoothed.current.r) * 0.22;
    smoothed.current.p += (targetP - smoothed.current.p) * 0.22;
    smoothed.current.y += (targetY - smoothed.current.y) * 0.22;

    groupRef.current.rotation.set(
      -smoothed.current.p,
      smoothed.current.y,
      smoothed.current.r,
      'YXZ'
    );
  });

  const steerAngle = THREE.MathUtils.clamp(-gz * 0.006, -0.42, 0.42);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <MainLadderFrame />
      <FrontSuspensionArms />
      <RearSwingarmSubframe />
      <RollCageAndCockpit steerAngle={steerAngle} />
      <KartWheels steerAngle={steerAngle} />
    </group>
  );
}
