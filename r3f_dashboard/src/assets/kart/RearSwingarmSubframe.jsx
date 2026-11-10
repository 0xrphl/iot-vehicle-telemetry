import React from 'react';
import { TubeSegment, KART_DIMS } from './TubeSegment';

export function RearSwingarmSubframe() {
  const { W_MAIN, W_REAR_HUB, Z_REAR_BOX, Z_REAR, Y_FLOOR, Y_UPPER } = KART_DIMS;
  const mainColor  = '#38bdf8';
  const braceColor = '#94a3b8';

  const segments = [
    // Lower tapered swingarm fork legs converging to the single rear wheel hub
    { s: [W_MAIN, Y_FLOOR, Z_REAR_BOX], e: [W_REAR_HUB, Y_FLOOR + 0.05, Z_REAR], c: mainColor },
    { s: [-W_MAIN, Y_FLOOR, Z_REAR_BOX], e: [-W_REAR_HUB, Y_FLOOR + 0.05, Z_REAR], c: mainColor },

    // Upper triangulated stays converging to rear axle dropouts
    { s: [W_MAIN, Y_UPPER, Z_REAR_BOX], e: [W_REAR_HUB, Y_FLOOR + 0.05, Z_REAR], c: mainColor },
    { s: [-W_MAIN, Y_UPPER, Z_REAR_BOX], e: [-W_REAR_HUB, Y_FLOOR + 0.05, Z_REAR], c: mainColor },

    // Rear axle bridge tie tube
    { s: [W_REAR_HUB, Y_FLOOR + 0.05, Z_REAR], e: [-W_REAR_HUB, Y_FLOOR + 0.05, Z_REAR], c: braceColor }
  ];

  return (
    <group name="RearSwingarmSubframe">
      {segments.map((seg, idx) => (
        <TubeSegment key={idx} start={seg.s} end={seg.e} color={seg.c} />
      ))}
    </group>
  );
}
