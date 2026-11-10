import React from 'react';
import { TubeSegment, KART_DIMS } from './TubeSegment';

export function MainLadderFrame() {
  const { W_MAIN, Z_FRONT, Z_MID_F, Z_SEAT, Z_REAR_BOX, Y_FLOOR, Y_UPPER } = KART_DIMS;
  const primaryColor = '#38bdf8';   // Electric Cyan 30mm main frame
  const crossColor   = '#94a3b8';   // Brushed Titanium 30mm cross-members

  const segments = [
    // Lower longitudinal rails
    { s: [W_MAIN, Y_FLOOR, Z_MID_F], e: [W_MAIN, Y_FLOOR, Z_REAR_BOX], c: primaryColor },
    { s: [-W_MAIN, Y_FLOOR, Z_MID_F], e: [-W_MAIN, Y_FLOOR, Z_REAR_BOX], c: primaryColor },

    // Front tapered nose rails
    { s: [W_MAIN, Y_FLOOR, Z_MID_F], e: [0.18, Y_FLOOR, Z_FRONT], c: primaryColor },
    { s: [-W_MAIN, Y_FLOOR, Z_MID_F], e: [-0.18, Y_FLOOR, Z_FRONT], c: primaryColor },

    // Lower ladder cross-members
    { s: [0.18, Y_FLOOR, Z_FRONT], e: [-0.18, Y_FLOOR, Z_FRONT], c: crossColor },
    { s: [W_MAIN, Y_FLOOR, Z_MID_F], e: [-W_MAIN, Y_FLOOR, Z_MID_F], c: crossColor },
    { s: [W_MAIN, Y_FLOOR, Z_SEAT], e: [-W_MAIN, Y_FLOOR, Z_SEAT], c: crossColor },
    { s: [W_MAIN, Y_FLOOR, Z_REAR_BOX], e: [-W_MAIN, Y_FLOOR, Z_REAR_BOX], c: crossColor },

    // Floor X-brace diagonals for torsional stiffness
    { s: [-W_MAIN, Y_FLOOR, Z_MID_F], e: [W_MAIN, Y_FLOOR, Z_SEAT], c: crossColor },
    { s: [W_MAIN, Y_FLOOR, Z_MID_F], e: [-W_MAIN, Y_FLOOR, Z_SEAT], c: crossColor },

    // Upper side-impact rails
    { s: [W_MAIN, Y_UPPER, Z_MID_F], e: [W_MAIN, Y_UPPER, Z_REAR_BOX], c: primaryColor },
    { s: [-W_MAIN, Y_UPPER, Z_MID_F], e: [-W_MAIN, Y_UPPER, Z_REAR_BOX], c: primaryColor },

    // Vertical struts between lower and upper rails
    { s: [W_MAIN, Y_FLOOR, Z_MID_F], e: [W_MAIN, Y_UPPER, Z_MID_F], c: primaryColor },
    { s: [-W_MAIN, Y_FLOOR, Z_MID_F], e: [-W_MAIN, Y_UPPER, Z_MID_F], c: primaryColor },
    { s: [W_MAIN, Y_FLOOR, Z_SEAT], e: [W_MAIN, Y_UPPER, Z_SEAT], c: primaryColor },
    { s: [-W_MAIN, Y_FLOOR, Z_SEAT], e: [-W_MAIN, Y_UPPER, Z_SEAT], c: primaryColor },
    { s: [W_MAIN, Y_FLOOR, Z_REAR_BOX], e: [W_MAIN, Y_UPPER, Z_REAR_BOX], c: primaryColor },
    { s: [-W_MAIN, Y_FLOOR, Z_REAR_BOX], e: [-W_MAIN, Y_UPPER, Z_REAR_BOX], c: primaryColor },

    // Upper rear cross-member
    { s: [W_MAIN, Y_UPPER, Z_REAR_BOX], e: [-W_MAIN, Y_UPPER, Z_REAR_BOX], c: crossColor }
  ];

  return (
    <group name="MainLadderFrame">
      {segments.map((seg, idx) => (
        <TubeSegment key={idx} start={seg.s} end={seg.e} color={seg.c} />
      ))}
    </group>
  );
}
