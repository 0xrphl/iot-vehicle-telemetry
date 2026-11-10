import React from 'react';
import { TubeSegment, KART_DIMS } from './TubeSegment';

export function FrontSuspensionArms() {
  const { W_FRONT, W_MAIN, Z_FRONT, Z_MID_F, Y_FLOOR, Y_UPPER } = KART_DIMS;
  const armColor = '#38bdf8';
  const tieColor = '#94a3b8';

  const segments = [
    // Lower transverse A-arms
    { s: [0.18, Y_FLOOR, Z_FRONT], e: [W_FRONT - 0.05, Y_FLOOR, Z_FRONT], c: armColor },
    { s: [-0.18, Y_FLOOR, Z_FRONT], e: [-W_FRONT + 0.05, Y_FLOOR, Z_FRONT], c: armColor },

    // Swept trailing A-arm struts back to mid bulkhead
    { s: [W_MAIN, Y_FLOOR, Z_MID_F], e: [W_FRONT - 0.05, Y_FLOOR, Z_FRONT], c: tieColor },
    { s: [-W_MAIN, Y_FLOOR, Z_MID_F], e: [-W_FRONT + 0.05, Y_FLOOR, Z_FRONT], c: tieColor },

    // Upper camber arms
    { s: [0.18, Y_UPPER * 0.72, Z_FRONT], e: [W_FRONT - 0.05, Y_UPPER * 0.72, Z_FRONT], c: armColor },
    { s: [-0.18, Y_UPPER * 0.72, Z_FRONT], e: [-W_FRONT + 0.05, Y_UPPER * 0.72, Z_FRONT], c: armColor },
    { s: [0.18, Y_FLOOR, Z_FRONT], e: [0.18, Y_UPPER * 0.72, Z_FRONT], c: tieColor },
    { s: [-0.18, Y_FLOOR, Z_FRONT], e: [-0.18, Y_UPPER * 0.72, Z_FRONT], c: tieColor },
    { s: [0.18, Y_UPPER * 0.72, Z_FRONT], e: [-0.18, Y_UPPER * 0.72, Z_FRONT], c: tieColor },

    // Kingpin spindle upright 30mm tubes
    { s: [W_FRONT - 0.05, Y_FLOOR, Z_FRONT], e: [W_FRONT - 0.05, Y_UPPER * 0.72, Z_FRONT], c: armColor },
    { s: [-W_FRONT + 0.05, Y_FLOOR, Z_FRONT], e: [-W_FRONT + 0.05, Y_UPPER * 0.72, Z_FRONT], c: armColor }
  ];

  return (
    <group name="FrontSuspensionArms">
      {segments.map((seg, idx) => (
        <TubeSegment key={idx} start={seg.s} end={seg.e} color={seg.c} />
      ))}
    </group>
  );
}
