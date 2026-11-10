import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { DeltaKartAssembly } from '../assets/kart/DeltaKartAssembly';

export function KartStudioScene({ roll, pitch, yaw, gz, peakG }) {
  return (
    <div className="glass-stage">
      <div className="stage-badge">
        <span>R3F 3D CHASSIS STUDIO</span>
        <span className="sub">30mm Profile Tube Skeleton | 2 Front / 1 Rear</span>
      </div>

      <Canvas shadows camera={{ position: [2.6, 1.7, 3.1], fov: 44 }}>
        <color attach="background" args={['#070a12']} />
        <fog attach="fog" args={['#070a12', 4, 14]} />

        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 4]} intensity={1.4} color="#38bdf8" castShadow />
        <directionalLight position={[-4, 3, -4]} intensity={0.9} color="#f43f5e" />

        <Grid
          position={[0, 0, 0]}
          args={[12, 12]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#1e293b"
          sectionSize={2}
          sectionThickness={1.2}
          sectionColor="#0284c7"
          fadeDistance={11}
        />

        <DeltaKartAssembly roll={roll} pitch={pitch} yaw={yaw} gz={gz} scale={1.0} />

        <OrbitControls target={[0, 0.38, 0]} enableDamping dampingFactor={0.06} />
      </Canvas>

      <div className="attitude-hud">
        <div className="hud-glass">
          <div className="lbl">Roll Angle</div>
          <div>
            <span className="val">{roll.toFixed(1)}</span>
            <span className="unit">deg</span>
          </div>
        </div>
        <div className="hud-glass">
          <div className="lbl">Pitch Angle</div>
          <div>
            <span className="val">{pitch.toFixed(1)}</span>
            <span className="unit">deg</span>
          </div>
        </div>
        <div className="hud-glass">
          <div className="lbl">Yaw Heading</div>
          <div>
            <span className="val">{((yaw % 360 + 360) % 360).toFixed(1)}</span>
            <span className="unit">deg</span>
          </div>
        </div>
        <div className="hud-glass">
          <div className="lbl">Peak G-Force</div>
          <div>
            <span className="val c-x">{peakG.toFixed(2)}</span>
            <span className="unit">g</span>
          </div>
        </div>
      </div>
    </div>
  );
}
