import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Canvas } from '@react-three/fiber';
import { DeltaKartAssembly } from '../assets/kart/DeltaKartAssembly';

export function FullTrackMapView({
  telemetry,
  gpsPoints,
  roll,
  pitch,
  yaw,
  historicalRows,
  setReplayIndex
}) {
  const mapDivRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);
  const pointsLayer = useRef(null);

  useEffect(() => {
    if (!mapDivRef.current || mapInstance.current) return;

    const map = L.map(mapDivRef.current, {
      center: [telemetry.lat, telemetry.lon],
      zoom: 18,
      zoomControl: true
    });

    // 100% Free OpenStreetMap standard tiles (Dark mode CSS applied via .leaflet-tile)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    polylineRef.current = L.polyline([], {
      color: '#38bdf8',
      weight: 4.5,
      opacity: 0.92
    }).addTo(map);

    pointsLayer.current = L.layerGroup().addTo(map);

    markerRef.current = L.circleMarker([telemetry.lat, telemetry.lon], {
      radius: 9,
      color: '#f43f5e',
      fillColor: '#38bdf8',
      fillOpacity: 1,
      weight: 3
    }).addTo(map);

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !polylineRef.current || !markerRef.current) return;

    polylineRef.current.setLatLngs(gpsPoints);
    markerRef.current.setLatLng([telemetry.lat, telemetry.lon]);

    if (pointsLayer.current) {
      pointsLayer.current.clearLayers();
      gpsPoints.forEach((pt, idx) => {
        const cm = L.circleMarker(pt, {
          radius: 4,
          color: '#38bdf8',
          fillColor: '#0284c7',
          fillOpacity: 0.85,
          weight: 1.2
        });
        if (historicalRows && historicalRows.length > idx) {
          cm.on('click', () => setReplayIndex(idx));
        }
        cm.addTo(pointsLayer.current);
      });
    }

    map.panTo([telemetry.lat, telemetry.lon], { animate: false });
  }, [telemetry.lat, telemetry.lon, gpsPoints, historicalRows, setReplayIndex]);

  return (
    <div style={{ flex: 1, padding: '10px', display: 'flex' }}>
      <div className="glass-stage" style={{ width: '100%', height: '100%' }}>
        <div className="stage-badge">
          <span>VIEW 3: FULL-SCREEN GPS TRAJECTORY &amp; 3D CHASE TELEMETRY</span>
          <span className="sub">Click any GPS point to inspect timestamp | 100% Free OpenStreetMap</span>
        </div>

        <div ref={mapDivRef} className="leaflet-map-box" />

        {/* Picture-in-Picture 3D R3F Chase Cam in Top-Right Corner */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '360px',
            height: '250px',
            zIndex: 25,
            background: 'rgba(9, 13, 24, 0.86)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.65)'
          }}
        >
          <div style={{ position: 'absolute', top: '8px', left: '10px', fontSize: '10px', fontWeight: 800, color: '#38bdf8', zIndex: 5 }}>
            3D CHASE CAM (30mm TUBE SKELETON)
          </div>
          <Canvas camera={{ position: [0, 1.4, -2.6], fov: 45 }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[3, 6, 3]} intensity={1.5} color="#38bdf8" />
            <DeltaKartAssembly roll={roll} pitch={pitch} yaw={yaw} gz={telemetry.gz} scale={0.85} />
          </Canvas>
        </div>

        <div className="gps-telemetry-bar">
          <div className="hud-glass">
            <div className="lbl">LilyGO GPS Coordinates</div>
            <div><span className="val" style={{ fontSize: '13px' }}>{telemetry.lat.toFixed(6)}, {telemetry.lon.toFixed(6)}</span></div>
          </div>
          <div className="hud-glass">
            <div className="lbl">Ground Speed / Course</div>
            <div><span className="val c-y">{(telemetry.spd || 0).toFixed(1)}</span><span className="unit">km/h ({telemetry.crs || 0}°)</span></div>
          </div>
          <div className="hud-glass">
            <div className="lbl">18650 Battery (No %)</div>
            <div><span className="val c-y">{telemetry.vbat_v.toFixed(3)} V</span><span className="unit">({telemetry.vbat_mv} mV)</span></div>
          </div>
          <div className="hud-glass">
            <div className="lbl">Gyro / RTC Temps</div>
            <div><span className="val c-x">{telemetry.gyro_temp.toFixed(1)}°C</span><span className="unit">/ {telemetry.rtc_temp.toFixed(1)}°C</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
