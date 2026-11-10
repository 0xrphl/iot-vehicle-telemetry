import React, { useMemo } from 'react';
import * as THREE from 'three';

// 30mm outer diameter tube => radius = 0.015 meters
export const TUBE_RADIUS = 0.015;

export const KART_DIMS = {
  W_FRONT: 0.52,
  W_MAIN: 0.32,
  Z_FRONT: 1.05,
  Z_MID_F: 0.40,
  Z_SEAT: -0.30,
  Z_REAR_BOX: -0.75,
  Z_REAR: -1.15,
  Y_FLOOR: 0.14,
  Y_UPPER: 0.44,
  Y_CAGE: 0.92,
  W_REAR_HUB: 0.09
};

export function TubeSegment({ start, end, color = '#38bdf8', metalness = 0.85, roughness = 0.22 }) {
  const { position, quaternion, length } = useMemo(() => {
    const v1 = new THREE.Vector3(...start);
    const v2 = new THREE.Vector3(...end);
    const len = v1.distanceTo(v2);
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return {
      position: [mid.x, mid.y, mid.z],
      quaternion: quat,
      length: len
    };
  }, [start, end]);

  if (length < 0.001) return null;

  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, length, 16, 1, false]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

export function WeldJoint({ position, color = '#64748b' }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[TUBE_RADIUS * 1.18, 12, 12]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.3} />
    </mesh>
  );
}
