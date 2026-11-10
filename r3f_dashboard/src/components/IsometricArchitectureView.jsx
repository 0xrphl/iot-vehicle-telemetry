import React, { useState, useRef } from 'react';

const ARCH_NODES = [
  { id: 'item-kart', code: 'KART', color: '#f43f5e', x: 2, y: 2, name: 'Electric Delta-Kart (30mm Tube)', desc: 'Single-vehicle 30mm profile tube skeleton chassis (2 steerable front wheels, 1 rear drive wheel). Instrumented with LilyGO T-SIM7672G V1.1 telemetry node.' },
  { id: 'item-bmi160', code: 'BMI160', color: '#c084fc', x: 2, y: 6, name: 'Bosch BMI160 6-DOF IMU (0x68)', desc: '3-axis Gyroscope (±250 °/s) + 3-axis Accelerometer (±2g) + internal die temperature (°C). Wire0 (SDA=GPIO 1, SCL=GPIO 2 @ 400kHz). 30 Hz attitude fusion.' },
  { id: 'item-ds3231', code: 'DS3231', color: '#38bdf8', x: 2, y: 10, name: 'DS3231 TCXO RTC + AT24C32', desc: 'Precision TCXO Real-Time Clock (±2ppm, 0x68) + AT24C32 32Kbit EEPROM (0x57) with CR2032 backup on Wire1 (SDA=GPIO 42, SCL=GPIO 41 @ 400kHz). Zero address collision.' },
  { id: 'item-battery', code: '18650', color: '#10b981', x: 2, y: 14, name: '18650 Li-Ion Cell (GPIO 4 ADC)', desc: 'Onboard 18650 battery holder monitored via GPIO 4 x2 hardware voltage divider. Strictly raw Millivolts (mV) and Volts (V) with moving-average filter (no %).' },
  { id: 'item-solar', code: 'SOLAR', color: '#f59e0b', x: 2, y: 18, name: 'Solar Input Bus (GPIO 5 ADC)', desc: '5V–6V solar charging input monitored via GPIO 5 x2 hardware voltage divider in raw mV and V.' },
  { id: 'item-gnss', code: 'GNSS', color: '#60a5fa', x: 7, y: 2, name: 'SIM7672G Multi-GNSS Antenna', desc: 'Built-in GPS + GLONASS + Galileo + BeiDou receiver with active LNA control (Modem GPIO 4). Polled every 1.5s (0.67 Hz) + atomic UTC sync to DS3231.' },
  { id: 'item-bist', code: 'BIST', color: '#14b8a6', x: 8, y: 6, name: 'Parametric BIST Self-Test', desc: 'Boot & live self-test engine verifying Wi-Fi, 4G LTE SIM, BMI160 (0x68), 18650 Battery (>=2500mV), DS3231 RTC (0x68), and 32GB MicroSD mount.' },
  { id: 'item-tsim7672g', code: 'T-SIM', color: '#38bdf8', x: 8, y: 11, name: 'LilyGO T-SIM7672G V1.1 (ESP32-S3)', desc: 'Master MCU: ESP32-S3-WROOM-1 MCN16R8 (Dual-Core 240MHz, 16MB Flash, 8MB OPI PSRAM) + onboard SIM7672G 4G LTE Cat-1 & Multi-GNSS modem.' },
  { id: 'item-microsd', code: '32GB SD', color: '#a855f7', x: 8, y: 17, name: '32GB MicroSD Blackbox (5Hz CSV)', desc: 'Onboard SPI MicroSD slot (CS:13, MOSI:14, SCK:21, MISO:47). Logs full-rate CSV telemetry every 200ms (5 Hz) to /logs/kart_session_XXXX.csv (>11,000 hrs).' },
  { id: 'item-wifi-ws', code: 'WS 30Hz', color: '#38bdf8', x: 14, y: 7, name: 'Local Wi-Fi WebSocket (30Hz)', desc: 'Low-latency 30 Hz (every 33ms) JSON telemetry stream on port 81/8081 over LAN or fallback AP (Kart-IMU-AP) with 0 MB SIM data cost.' },
  { id: 'item-lte-movistar', code: '4G LTE', color: '#f59e0b', x: 14, y: 15, name: '4G LTE Cat-1 (Movistar 220MB)', desc: 'SIM7672G cellular data link (APN: internet.movistar.com.co). Adaptive cloud sync: every 3s (0.33 Hz) when moving, every 60s when parked.' },
  { id: 'item-realtime', code: 'RT WS', color: '#10b981', x: 20, y: 7, name: 'Supabase Realtime Stream', desc: 'PostgreSQL replication publication (supabase_realtime) pushing live kart_telemetry inserts & REST queries to remote web clients.' },
  { id: 'item-supabase', code: 'PG DB', color: '#10b981', x: 20, y: 13, name: 'Supabase PostgreSQL DB', desc: 'Cloud database storing kart_sessions and ultra-compact kart_telemetry (~76 bytes/row using SMALLINT/REAL/DOUBLE PRECISION + BRIN index).' },
  { id: 'item-guardrail', code: '<500MB', color: '#f43f5e', x: 20, y: 18, name: '500MB Free-Tier Ring-Buffer', desc: 'PostgreSQL trigger enforce_telemetry_storage_cap() automatically prunes oldest 50,000 rows if kart_telemetry exceeds 2,500,000 rows (~220 MB).' },
  { id: 'item-r3f-studio', code: 'R3F 3D', color: '#38bdf8', x: 26, y: 5, name: 'R3F 3D Kart Studio (View 1)', desc: 'React Three Fiber interactive 3D chassis studio rendering the parametric 30mm tube skeleton Delta-Kart with real-time Roll, Pitch, Yaw, and Peak G.' },
  { id: 'item-leaflet-map', code: 'MAP+3D', color: '#60a5fa', x: 26, y: 11, name: 'Dark Leaflet + 3D Kart Overlay', desc: 'Dark-mode OpenStreetMap Leaflet GPS trajectory with a transparent R3F 3D Delta-Kart canvas overlaid directly on the live GPS coordinate.' },
  { id: 'item-analytics', code: 'REPLAY', color: '#c084fc', x: 26, y: 17, name: 'Day Replay & G-G Charts (View 2)', desc: 'Multi-channel historical analytics, G-G traction circle, 18650 battery discharge curve (mV), dual thermal profile, and MicroSD CSV replay.' }
];

const ARCH_RECTS = [
  { from: { x: 0, y: 0 }, to: { x: 5, y: 20 }, color: '#c084fc', label: '1. Sensors & Dual I2C' },
  { from: { x: 6, y: 0 }, to: { x: 11, y: 20 }, color: '#38bdf8', label: '2. LilyGO T-SIM7672G & SD' },
  { from: { x: 12, y: 4 }, to: { x: 16, y: 18 }, color: '#f59e0b', label: '3. Wi-Fi 30Hz & 4G LTE' },
  { from: { x: 18, y: 4 }, to: { x: 22, y: 20 }, color: '#10b981', label: '4. Supabase Cloud (<500MB)' },
  { from: { x: 24, y: 2 }, to: { x: 29, y: 20 }, color: '#60a5fa', label: '5. R3F 3D + Dark Leaflet' }
];

const ARCH_LINKS = [
  { from: 'item-kart', to: 'item-bmi160', color: '#f43f5e', dashed: true, label: 'Chassis Dynamics' },
  { from: 'item-bmi160', to: 'item-tsim7672g', color: '#c084fc', dashed: false, label: 'Wire0 I2C (IO1/IO2 400kHz)' },
  { from: 'item-ds3231', to: 'item-tsim7672g', color: '#38bdf8', dashed: false, label: 'Wire1 I2C (IO42/IO41 400kHz)' },
  { from: 'item-battery', to: 'item-tsim7672g', color: '#10b981', dashed: false, label: 'GPIO 4 ADC (Raw mV/V)' },
  { from: 'item-solar', to: 'item-tsim7672g', color: '#f59e0b', dashed: true, label: 'GPIO 5 ADC (Solar mV)' },
  { from: 'item-gnss', to: 'item-tsim7672g', color: '#60a5fa', dashed: false, label: 'UART1 AT+CGNSSINFO (0.67Hz)' },
  { from: 'item-gnss', to: 'item-ds3231', color: '#14b8a6', dashed: true, label: 'Atomic UTC Sync' },
  { from: 'item-tsim7672g', to: 'item-microsd', color: '#a855f7', dashed: false, label: 'SPI 20MHz (5Hz CSV Log)' },
  { from: 'item-bist', to: 'item-tsim7672g', color: '#14b8a6', dashed: true, label: '6-Subsystem BIST JSON' },
  { from: 'item-tsim7672g', to: 'item-wifi-ws', color: '#38bdf8', dashed: false, label: '30Hz JSON Stream (Port 81)' },
  { from: 'item-tsim7672g', to: 'item-lte-movistar', color: '#f59e0b', dashed: false, label: 'AT+HTTPACTION (3s Move / 60s Idle)' },
  { from: 'item-lte-movistar', to: 'item-supabase', color: '#10b981', dashed: false, label: 'HTTPS POST kart_telemetry' },
  { from: 'item-wifi-ws', to: 'item-supabase', color: '#14b8a6', dashed: true, label: 'Wi-Fi HTTPS Fallback' },
  { from: 'item-guardrail', to: 'item-supabase', color: '#f43f5e', dashed: true, label: 'Prunes >2.5M Rows (~220MB)' },
  { from: 'item-supabase', to: 'item-realtime', color: '#10b981', dashed: false, label: 'CDC Publication' },
  { from: 'item-wifi-ws', to: 'item-r3f-studio', color: '#38bdf8', dashed: false, label: '30Hz LAN WS' },
  { from: 'item-realtime', to: 'item-r3f-studio', color: '#10b981', dashed: false, label: 'Live 4G Cloud Feed' },
  { from: 'item-realtime', to: 'item-leaflet-map', color: '#60a5fa', dashed: false, label: 'GPS + Attitude Sync' },
  { from: 'item-supabase', to: 'item-analytics', color: '#c084fc', dashed: false, label: 'Day History Query' },
  { from: 'item-microsd', to: 'item-analytics', color: '#a855f7', dashed: true, label: 'CSV File Upload' }
];

const tW = 54;
const tH = 30;
const oX = 320;
const oY = 120;

function t2p(x, y) {
  return { px: oX + ((x - y) * tW) / 2, py: oY + ((x + y) * tH) / 2 };
}

export function IsometricArchitectureView({ lang = 'en' }) {
  const [scale, setScale] = useState(1.12);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(ARCH_NODES[7]);
  const dragRef = useRef({ active: false, startX: 0, startY: 0 });

  const posMap = {};
  ARCH_NODES.forEach((n) => { posMap[n.id] = t2p(n.x, n.y); });

  const W = 1480;
  const H = 840;
  const vw = W / scale;
  const vh = H / scale;
  const vbX = -pan.x / scale + (W - vw) / 2;
  const vbY = -pan.y / scale + (H - vh) / 2;

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '10px', display: 'flex' }}>
      <div
        className="glass-stage"
        style={{ width: '100%', height: '100%', cursor: dragRef.current.active ? 'grabbing' : 'grab' }}
        onWheel={(e) => {
          e.preventDefault();
          setScale((s) => (e.deltaY < 0 ? Math.min(s * 1.12, 3.5) : Math.max(s / 1.12, 0.45)));
        }}
        onMouseDown={(e) => {
          if (e.button === 0) dragRef.current = { active: true, startX: e.clientX, startY: e.clientY };
        }}
        onMouseMove={(e) => {
          if (dragRef.current.active) {
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            dragRef.current.startX = e.clientX;
            dragRef.current.startY = e.clientY;
            setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
          }
        }}
        onMouseUp={() => { dragRef.current.active = false; }}
        onMouseLeave={() => { dragRef.current.active = false; }}
      >
        <div className="stage-badge">
          <span>{lang === 'es' ? 'ARQUITECTURA ISOMÉTRICA — UN SOLO VEHÍCULO (LILYGO T-SIM7672G)' : 'ISOMETRIC ARCHITECTURE — SINGLE-VEHICLE LILYGO T-SIM7672G TELEMETRY'}</span>
          <span className="sub">{lang === 'es' ? 'Clic en cualquier nodo 3D para inspeccionar · Arrastrar y Zoom' : 'Click any 3D cube to inspect · Drag to pan & scroll to zoom'}</span>
        </div>

        <div style={{ position: 'absolute', top: '12px', right: '14px', zIndex: 30, display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button className="btn" onClick={() => setScale((s) => Math.min(s * 1.2, 3.5))}>＋</button>
          <button className="btn" onClick={() => setScale((s) => Math.max(s / 1.2, 0.45))}>－</button>
          <span className="rtc-pill">{Math.round(scale * 100)}%</span>
          <button className="btn" onClick={() => { setScale(1.12); setPan({ x: 0, y: 0 }); }}>FIT</button>
        </div>

        <svg width="100%" height="100%" viewBox={`${vbX} ${vbY} ${vw} ${vh}`}>
          <defs>
            <filter id="isoShadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.55" />
            </filter>
          </defs>

          {ARCH_RECTS.map((r, idx) => {
            const c0 = t2p(r.from.x, r.from.y);
            const c1 = t2p(r.to.x, r.from.y);
            const c2 = t2p(r.to.x, r.to.y);
            const c3 = t2p(r.from.x, r.to.y);
            const pts = `${c0.px},${c0.py} ${c1.px},${c1.py} ${c2.px},${c2.py} ${c3.px},${c3.py}`;
            return (
              <g key={idx}>
                <polygon points={pts} fill={r.color} fillOpacity="0.06" stroke={r.color} strokeWidth="1.6" strokeOpacity="0.38" strokeDasharray="6,4" />
                <text x={c0.px} y={c0.py - 10} textAnchor="middle" fill={r.color} fontSize="10" fontWeight="800">{r.label}</text>
              </g>
            );
          })}
          {ARCH_LINKS.map((lk, idx) => {
            const f = posMap[lk.from];
            const t = posMap[lk.to];
            if (!f || !t) return null;
            const mx = (f.px + t.px) / 2;
            const my = (f.py + t.py) / 2;
            return (
              <g key={idx}>
                <line x1={f.px} y1={f.py} x2={t.px} y2={t.py} stroke={lk.color} strokeWidth={lk.dashed ? '1.4' : '2.1'} strokeOpacity="0.72" strokeDasharray={lk.dashed ? '6,4' : undefined} />
                <text x={mx} y={my - 5} textAnchor="middle" fill={lk.color} fontSize="8" fontWeight="700">{lk.label}</text>
              </g>
            );
          })}

          {ARCH_NODES.map((nd) => {
            const pos = posMap[nd.id];
            const s = 30;
            const ex = 12;
            const isSel = selectedNode?.id === nd.id;
            return (
              <g key={nd.id} filter="url(#isoShadow)" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedNode(nd); }}>
                <polygon points={`${pos.px},${pos.py - s / 2} ${pos.px + s},${pos.py} ${pos.px},${pos.py + s / 2} ${pos.px - s},${pos.py}`} fill={nd.color} fillOpacity={isSel ? '0.38' : '0.2'} stroke={isSel ? '#ffffff' : nd.color} strokeWidth={isSel ? '2.6' : '2'} />
                <polygon points={`${pos.px - s},${pos.py} ${pos.px},${pos.py + s / 2} ${pos.px},${pos.py + s / 2 + ex} ${pos.px - s},${pos.py + ex}`} fill={nd.color} fillOpacity="0.14" stroke={nd.color} strokeWidth="1" strokeOpacity="0.4" />
                <polygon points={`${pos.px + s},${pos.py} ${pos.px},${pos.py + s / 2} ${pos.px},${pos.py + s / 2 + ex} ${pos.px + s},${pos.py + ex}`} fill={nd.color} fillOpacity="0.08" stroke={nd.color} strokeWidth="1" strokeOpacity="0.28" />
                <text x={pos.px} y={pos.py + 3} textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="800" fontFamily="Consolas, monospace">{nd.code}</text>
                <text x={pos.px} y={pos.py + s / 2 + ex + 13} textAnchor="middle" fill="#e2e8f0" fontSize="8.5" fontWeight="700">{nd.name}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 25, background: 'rgba(9, 13, 24, 0.9)', backdropFilter: 'blur(14px)', border: '1px solid rgba(56, 189, 248, 0.28)', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', maxWidth: '340px' }}>
          <div style={{ color: '#38bdf8', fontWeight: 800, marginBottom: '6px', borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: '4px' }}>
            {lang === 'es' ? 'CAPAS DE TELEMETRÍA (1 VEHÍCULO)' : 'SINGLE-VEHICLE TELEMETRY LAYERS'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1', fontSize: '10px' }}>
            <div>🟣 <b>Wire0 / Wire1 Dual I2C:</b> BMI160 (IO1/2) + DS3231 (IO42/41)</div>
            <div>🔵 <b>Edge MCU &amp; Storage:</b> LilyGO T-SIM7672G + 32GB MicroSD (5Hz)</div>
            <div>🟠 <b>Dual Transport:</b> 30Hz LAN WebSocket + 4G LTE Movistar SIM</div>
            <div>🟢 <b>Supabase Cloud:</b> PostgreSQL (~76B/row) + &lt;500MB Guardrail</div>
            <div>💠 <b>3D R3F + Leaflet:</b> 30mm Tube Delta-Kart Studio &amp; GPS Overlay</div>
          </div>
        </div>

        {selectedNode && (
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 25, background: 'rgba(9, 13, 24, 0.92)', backdropFilter: 'blur(14px)', border: `1px solid ${selectedNode.color}`, borderRadius: '10px', padding: '12px 16px', maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: selectedNode.color, fontWeight: 800, fontSize: '13px' }}>{selectedNode.name}</span>
              <span className="badge-sota" style={{ fontSize: '9px' }}>{selectedNode.code}</span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: 1.45 }}>{selectedNode.desc}</p>
          </div>
        )}
      </div>
    </div>
  );
}

