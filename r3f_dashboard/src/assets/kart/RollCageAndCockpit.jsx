import React from 'react';
import { TubeSegment, KART_DIMS } from './TubeSegment';

export function RollCageAndCockpit({ steerAngle = 0 }) {
  const { W_MAIN, Z_MID_F, Z_SEAT, Z_REAR_BOX, Y_FLOOR, Y_UPPER, Y_CAGE } = KART_DIMS;
  const cageColor = '#f43f5e'; // High-visibility safety neon-coral 30mm roll cage
  const seatColor = '#38bdf8';
  const slatColor = '#94a3b8';

  const segments = [
    // Main Roll Hoop behind driver seat
    { s: [W_MAIN, Y_UPPER, Z_SEAT], e: [0.20, Y_CAGE, Z_SEAT - 0.05], c: cageColor },
    { s: [-W_MAIN, Y_UPPER, Z_SEAT], e: [-0.20, Y_CAGE, Z_SEAT - 0.05], c: cageColor },
    { s: [0.20, Y_CAGE, Z_SEAT - 0.05], e: [-0.20, Y_CAGE, Z_SEAT - 0.05], c: cageColor },

    // Diagonal rear roll bar stays to rear subframe box
    { s: [0.20, Y_CAGE, Z_SEAT - 0.05], e: [W_MAIN, Y_UPPER, Z_REAR_BOX], c: cageColor },
    { s: [-0.20, Y_CAGE, Z_SEAT - 0.05], e: [-W_MAIN, Y_UPPER, Z_REAR_BOX], c: cageColor },

    // Skeleton Bucket Seat 30mm tube frame
    { s: [0.16, Y_FLOOR + 0.04, Z_SEAT + 0.08], e: [0.14, Y_UPPER * 0.92, Z_SEAT - 0.08], c: seatColor },
    { s: [-0.16, Y_FLOOR + 0.04, Z_SEAT + 0.08], e: [-0.14, Y_UPPER * 0.92, Z_SEAT - 0.08], c: seatColor },
    { s: [0.14, Y_UPPER * 0.92, Z_SEAT - 0.08], e: [-0.14, Y_UPPER * 0.92, Z_SEAT - 0.08], c: slatColor },
    { s: [0.16, Y_FLOOR + 0.04, Z_SEAT + 0.08], e: [0.16, Y_FLOOR + 0.04, Z_MID_F * 0.55], c: slatColor },
    { s: [-0.16, Y_FLOOR + 0.04, Z_SEAT + 0.08], e: [-0.16, Y_FLOOR + 0.04, Z_MID_F * 0.55], c: slatColor },
    { s: [0.16, Y_FLOOR + 0.04, Z_MID_F * 0.55], e: [-0.16, Y_FLOOR + 0.04, Z_MID_F * 0.55], c: slatColor },

    // Steering Column Support Tube
    { s: [0, Y_FLOOR, Z_MID_F], e: [0, Y_UPPER * 1.12, Z_MID_F - 0.15], c: seatColor }
  ];

  return (
    <group name="RollCageAndCockpit">
      {segments.map((seg, idx) => (
        <TubeSegment key={idx} start={seg.s} end={seg.e} color={seg.c} />
      ))}

      {/* Dynamic Steering Wheel Hoop */}
      <group position={[0, Y_UPPER * 1.12, Z_MID_F - 0.15]} rotation={[Math.PI / 4, 0, steerAngle * 1.8]}>
        <mesh castShadow>
          <torusGeometry args={[0.12, 0.012, 12, 28]} />
          <meshStandardMaterial color="#f43f5e" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* LilyGO T-SIM7672G + 18650 Telemetry Box mounted behind seat */}
      <mesh position={[0, Y_FLOOR + 0.06, Z_SEAT - 0.25]} castShadow>
        <boxGeometry args={[0.22, 0.08, 0.18]} />
        <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}
