import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Canvas } from '@react-three/fiber';
import { DeltaKartAssembly } from '../assets/kart/DeltaKartAssembly';

export function DarkLeafletMapWithKart({ telemetry, gpsPoints, roll, pitch, yaw }) {
  const mapDivRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);
  const pointLayerGroup = useRef(null);

  // Initialize Dark-Mode Leaflet Map once
  useEffect(() => {
    if (!mapDivRef.current || mapInstance.current) return;

    const map = L.map(mapDivRef.current, {
      center: [telemetry.lat, telemetry.lon],
      zoom: 18,
      zoomControl: false
    });

    // 100% Free OpenStreetMap CartoDB Tiles (No API Key Required!)
    // Uses OpenStreetMap standard tiles with CSS dark inversion filter in styles.css
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    polylineRef.current = L.polyline([], {
      color: '#38bdf8',
      weight: 3.5,
      opacity: 0.9
    }).addTo(map);

    pointLayerGroup.current = L.layerGroup().addTo(map);

    markerRef.current = L.circleMarker([telemetry.lat, telemetry.lon], {
      radius: 8,
      color: '#f43f5e',
      fillColor: '#38bdf8',
      fillOpacity: 1,
      weight: 2.5
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update Leaflet GPS points trail & active position marker
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !polylineRef.current || !markerRef.current) return;

    polylineRef.current.setLatLngs(gpsPoints);
    markerRef.current.setLatLng([telemetry.lat, telemetry.lon]);

    // Render individual GPS breadcrumb points along the path
    if (pointLayerGroup.current) {
      pointLayerGroup.current.clearLayers();
      const recentPts = gpsPoints.slice(-30);
      recentPts.forEach((pt, idx) => {
        L.circleMarker(pt, {
          radius: idx === recentPts.length - 1 ? 5 : 2.5,
          color: '#38bdf8',
          fillColor: '#0284c7',
          fillOpacity: 0.75,
          weight: 1
        }).addTo(pointLayerGroup.current);
      });
    }

    map.panTo([telemetry.lat, telemetry.lon], { animate: false });
  }, [telemetry.lat, telemetry.lon, gpsPoints]);

  return (
    <div className="glass-stage">
      <div className="stage-badge">
        <span>DARK LEAFLET GPS POINTS + 3D R3F KART OVERLAY</span>
        <span className="sub">
          {telemetry.fix >= 2 ? `3D GNSS LOCK (${telemetry.sats} SVs)` : 'IMU DEAD-RECKONING'}
        </span>
      </div>

      {/* Dark-Mode Leaflet Map Container */}
      <div ref={mapDivRef} className="leaflet-map-box" />

      {/* Transparent React Three Fiber 3D Canvas Overlaid Directly Over GPS Coordinate */}
      <div className="r3f-map-overlay">
        <Canvas gl={{ alpha: true }} camera={{ position: [0, 3.9, -2.9], fov: 40 }}>
          <ambientLight intensity={0.95} />
          <directionalLight position={[3, 8, 3]} intensity={1.6} color="#38bdf8" />
          <directionalLight position={[-3, 4, -3]} intensity={0.9} color="#f43f5e" />
          <DeltaKartAssembly
            roll={roll}
            pitch={pitch}
            yaw={yaw}
            gz={telemetry.gz}
            scale={0.68}
          />
        </Canvas>
      </div>

      <div className="gps-telemetry-bar">
        <div className="hud-glass">
          <div className="lbl">LilyGO GPS Point</div>
          <div>
            <span className="val" style={{ fontSize: '12px' }}>
              {telemetry.lat.toFixed(5)}, {telemetry.lon.toFixed(5)}
            </span>
          </div>
        </div>
        <div className="hud-glass">
          <div className="lbl">Ground Speed</div>
          <div>
            <span className="val c-y">{(telemetry.spd || 0).toFixed(1)}</span>
            <span className="unit">km/h</span>
          </div>
        </div>
        <div className="hud-glass">
          <div className="lbl">Altitude</div>
          <div>
            <span className="val">{Math.round(telemetry.alt || 1411)}</span>
            <span className="unit">m</span>
          </div>
        </div>
        <div className="hud-glass">
          <div className="lbl">GPS Points</div>
          <div>
            <span className="val c-amber">{gpsPoints.length}</span>
            <span className="unit">pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
