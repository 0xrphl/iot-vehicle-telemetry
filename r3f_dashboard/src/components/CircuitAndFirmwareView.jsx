import React, { useState, useEffect } from 'react';

const FIRMWARE_FILES = [
  { id: 'main.ino', label: 'main/main.ino', path: './firmware/main/main.ino', desc: 'Master 30Hz IMU/WS + 5Hz MicroSD CSV + 0.67Hz GNSS + Adaptive 4G/Wi-Fi Supabase Sync loop' },
  { id: 'config.h', label: 'main/config.h', path: './firmware/main/config.h', desc: 'Pin definitions for LilyGO T-SIM7672G V1.1, Dual I2C buses, Movistar APN, Supabase credentials & KartTelemetry struct' },
  { id: 'imu_bmi160.h', label: 'imu_bmi160.h', path: './firmware/main/imu_bmi160/imu_bmi160.h', desc: 'Bosch BMI160 6-DOF driver on Wire0 (IO1/IO2 @ 400kHz), die temperature (°C), complementary filter & vibration RMS' },
  { id: 'rtc_ds3231.h', label: 'rtc_ds3231.h', path: './firmware/main/rtc_ds3231/rtc_ds3231.h', desc: 'DS3231 TCXO RTC (0x68) + AT24C32 EEPROM (0x57) on Wire1 (IO42/IO41), auto-pin-swap recovery & atomic GNSS UTC sync' },
  { id: 'gps_sim7672.h', label: 'gps_sim7672.h', path: './firmware/main/gps_sim7672/gps_sim7672.h', desc: 'SIM7672G 4G LTE Cat-1 (Movistar APN) + Multi-GNSS (AT+CGNSSINFO) driver & HTTPS POST via cellular AT commands' },
  { id: 'power_18650.h', label: 'power_18650.h', path: './firmware/main/power_18650/power_18650.h', desc: '18650 Li-Ion (GPIO 4) & Solar (GPIO 5) x2 ADC voltage divider monitor outputting raw mV and V (strictly no %)' },
  { id: 'sd_logger.h', label: 'sd_logger.h', path: './firmware/main/sd_logger/sd_logger.h', desc: '32GB MicroSD SPI blackbox logger (CS:13, MOSI:14, SCK:21, MISO:47) writing 5Hz CSV logs to /logs/kart_session_XXXX.csv' },
  { id: 'self_test.h', label: 'self_test.h', path: './firmware/main/self_test/self_test.h', desc: 'Parametric Built-In Self-Test (BIST) engine verifying 6 hardware subsystems on boot and syncing JSON to kart_sessions.test' },
  { id: 'telemetry_sync.h', label: 'telemetry_sync.h', path: './firmware/main/telemetry_sync/telemetry_sync.h', desc: 'Dual-path dispatcher: 30Hz local WebSocket server (Port 81) + Wi-Fi/4G LTE Supabase REST ingestion' },
  { id: 'rtc_troubleshoot.ino', label: 'rtc_troubleshoot.ino', path: './firmware/rtc_troubleshoot/rtc_troubleshoot.ino', desc: 'Dedicated diagnostic & auto-recovery suite for DS3231 + AT24C32 on Wire1 (IO42/IO41)' },
  { id: 'schema.sql', label: 'supabase/schema.sql', path: './firmware/supabase/schema.sql', desc: 'PostgreSQL schema: kart_sessions, kart_telemetry (~76B/row), BRIN index, 500MB free-tier ring-buffer trigger & Realtime' }
];

const PINOUT_ROWS = [
  ['RED (3V3)', '3V3 (Right Header, Pin 3)', 'BMI160 VIN + CS & DS3231 VCC', '3.3V Regulated Power Rail (CS tied HIGH locks BMI160 into I2C mode)'],
  ['BLACK (GND)', 'GND (Right Header, Pin 4)', 'BMI160 GND + SAO & DS3231 GND', 'Common Ground Reference (SAO tied LOW sets BMI160 address to 0x68)'],
  ['GREEN (SDA0)', 'GPIO 1 (Right Header, Pin 5)', 'BMI160 SDA (Wire Bus 0)', '400 kHz Fast-Mode I2C Data — 6-DOF Gyro/Accel + Die Temp (°C)'],
  ['YELLOW (SCL0)', 'GPIO 2 (Right Header, Pin 6)', 'BMI160 SCL (Wire Bus 0)', '400 kHz Fast-Mode I2C Clock — 30 Hz Attitude Fusion Loop'],
  ['CYAN (SDA1)', 'GPIO 42 (Right Header, Pin 7)', 'DS3231 SDA (Wire1 Bus 1)', '400 kHz Zero-Collision I2C Data — Precision TCXO Clock (0x68) + EEPROM (0x57)'],
  ['ORANGE (SCL1)', 'GPIO 41 (Right Header, Pin 8)', 'DS3231 SCL (Wire1 Bus 1)', '400 kHz Zero-Collision I2C Clock — Exact UTC Timestamp + Ambient Temp (°C)'],
  ['INTERNAL ADC', 'GPIO 4 (Left Header, Pin 4)', 'Onboard 18650 Battery Divider', 'vbat_mv = analogReadMilliVolts(4) * 2 — Raw V & mV (Strictly No %)'],
  ['INTERNAL ADC', 'GPIO 5 (Left Header, Pin 5)', 'Solar Input Voltage Divider', 'solar_mv = analogReadMilliVolts(5) * 2 — Solar Charging Bus Telemetry'],
  ['INTERNAL SPI', 'GPIO 13, 14, 21, 47', 'Onboard 32GB MicroSD Slot', 'CS=13, MOSI=14, SCK=21, MISO=47 @ 20MHz — 5Hz CSV Blackbox Logger'],
  ['INTERNAL UART1', 'GPIO 10, 11, 18, 9, 4', 'SIM7672G 4G LTE + Multi-GNSS', 'TX=11, RX=10, PWRKEY=18, DTR=9, GNSS LNA=Modem GPIO 4 (Movistar 220MB)']
];

const PIPELINE_ROWS = [
  ['1. IMU & Attitude Fusion', '30 Hz (33 ms)', 'RAM & Local WebSocket', '60 FPS 3D R3F Kart attitude, steering angle, Peak G & Vibration RMS', '0 MB'],
  ['2. Local Wi-Fi WebSocket', '30 Hz (33 ms)', 'Browser / LAN (Port 81)', 'Zero-latency local dashboard streaming over Wi-Fi or SoftAP', '0 MB'],
  ['3. 32GB MicroSD Blackbox', '5 Hz (200 ms)', '/logs/kart_session_XXXX.csv', 'Full-rate CSV blackbox archive (>11,000 hrs capacity on 32GB)', '0 MB'],
  ['4. Multi-GNSS Polling', '0.67 Hz (1.5 s)', 'SIM7672G GNSS Engine', 'GPS/GLONASS/Galileo/BeiDou coordinates + atomic UTC sync to DS3231', '0 MB'],
  ['5. Supabase Sync (Moving)', '0.33 Hz (3.0 s)', 'public.kart_telemetry', 'Live cloud sync when moving (Gz > 3.5°/s, spd > 1.5 km/h, or G > 1.15g)', '~76 B/row'],
  ['6. Supabase Sync (Parked)', '0.016 Hz (60 s)', 'public.kart_telemetry', 'Idle heartbeat when stationary — saves 97% of 220MB Movistar SIM plan', '~76 B/min']
];

export function CircuitAndFirmwareView({ lang = 'en' }) {
  const [selectedFile, setSelectedFile] = useState(FIRMWARE_FILES[0]);
  const [fileCode, setFileCode] = useState('// Loading firmware source...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setFileCode(`// Loading ${selectedFile.label}...`);
    fetch(selectedFile.path)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((txt) => {
        if (active) setFileCode(txt);
      })
      .catch(() => {
        if (active) setFileCode(`// Source file located at: ${selectedFile.path}`);
      });
    return () => { active = false; };
  }, [selectedFile]);

  const copyCode = () => {
    navigator.clipboard?.writeText(fileCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Vector Circuit Schematic & Real Hardware Build Photos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '12px' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="card-hdr">
            <span>{lang === 'es' ? 'ESQUEMA ELÉCTRICO COMPLETO (DUAL I2C SIN COLISIÓN)' : 'FULL HARDWARE WIRING SCHEMATIC (ZERO-COLLISION DUAL I2C)'}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <a href="./hardware_schematics/circuit_layout_full.svg" target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', padding: '3px 8px', fontSize: '10px' }}>OPEN VECTOR SVG ↗</a>
              <a href="./hardware_schematics/circuit_layout_full.png" target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', padding: '3px 8px', fontSize: '10px' }}>OPEN HIGH-RES PNG ↗</a>
            </div>
          </div>
          <div style={{ background: '#0b1120', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.25)', padding: '8px', textAlign: 'center' }}>
            <img
              src="./hardware_schematics/circuit_layout_full.svg"
              alt="LilyGO T-SIM7672G Full Circuit Schematic"
              style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="card-hdr">
            <span>{lang === 'es' ? 'FOTOS REALES DEL MONTAJE Y DATASHEETS' : 'REAL HARDWARE BUILD PHOTOS & DATASHEETS'}</span>
            <span style={{ color: '#10b981' }}>LilyGO T-SIM7672G V1.1</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <a href="./hardware_schematics/IMG_20261104_113059.jpg" target="_blank" rel="noreferrer">
              <img src="./hardware_schematics/IMG_20261104_113059.jpg" alt="Hardware Build 1" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }} />
            </a>
            <a href="./hardware_schematics/IMG_20261104_113117.jpg" target="_blank" rel="noreferrer">
              <img src="./hardware_schematics/IMG_20261104_113117.jpg" alt="Hardware Build 2" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }} />
            </a>
            <a href="./hardware_schematics/IMG_20261104_113129.jpg" target="_blank" rel="noreferrer" style={{ gridColumn: '1 / -1' }}>
              <img src="./hardware_schematics/IMG_20261104_113129.jpg" alt="Hardware Build 3" style={{ width: '100%', height: '145px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }} />
            </a>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <a href="./hardware_schematics/SIM7672X_Series_Hardware_Design_V1.02.pdf" target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>
              📄 SIM7672G Hardware Design PDF
            </a>
            <a href="./hardware_schematics/bmi160-inertial-measurement-units.pdf" target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', flex: 1, textAlign: 'center' }}>
              📄 Bosch BMI160 IMU Datasheet PDF
            </a>
          </div>
        </div>
      </div>
      {/* 2. Pinout Matrix & Multi-Tier Telemetry Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="glass-card">
          <div className="card-hdr">
            <span>LILYGO T-SIM7672G V1.1 PINOUT &amp; WIRING MATRIX</span>
            <span style={{ color: '#38bdf8' }}>Consecutive Right Header Pins 3–8</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', textAlign: 'left' }}>
                <th style={{ padding: '5px 8px' }}>Wire / Bus</th>
                <th style={{ padding: '5px 8px' }}>LilyGO Pin</th>
                <th style={{ padding: '5px 8px' }}>Target Module Pin</th>
                <th style={{ padding: '5px 8px' }}>Function</th>
              </tr>
            </thead>
            <tbody>
              {PINOUT_ROWS.map(([wire, pin, target, fn], idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 800, color: '#67e8f9' }}>{wire}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'Consolas, monospace', color: '#f8fafc' }}>{pin}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#cbd5e1' }}>{target}</td>
                  <td style={{ padding: '5px 8px', color: '#94a3b8' }}>{fn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card">
          <div className="card-hdr">
            <span>MULTI-TIER TELEMETRY INTERVALS (220MB SIM &amp; &lt;500MB SUPABASE)</span>
            <span style={{ color: '#10b981' }}>~76 Bytes/Row</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', textAlign: 'left' }}>
                <th style={{ padding: '5px 8px' }}>Stage</th>
                <th style={{ padding: '5px 8px' }}>Rate</th>
                <th style={{ padding: '5px 8px' }}>Destination</th>
                <th style={{ padding: '5px 8px' }}>Purpose</th>
                <th style={{ padding: '5px 8px' }}>SIM Cost</th>
              </tr>
            </thead>
            <tbody>
              {PIPELINE_ROWS.map(([st, rate, dest, purp, cost], idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 800, color: '#f8fafc' }}>{st}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'Consolas, monospace', color: '#10b981', fontWeight: 700 }}>{rate}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'Consolas, monospace', color: '#67e8f9' }}>{dest}</td>
                  <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>{purp}</td>
                  <td style={{ padding: '6px 8px', color: '#fbbf24', fontWeight: 700 }}>{cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(9,13,24,0.75)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.28)', fontSize: '11px', color: '#cbd5e1' }}>
            <b style={{ color: '#10b981' }}>Arduino IDE ESP32-S3 Flash Settings:</b> Board: <code>ESP32S3 Dev Module</code> · USB CDC On Boot: <code>Enabled</code> · Flash Size: <code>16MB (128Mb)</code> · PSRAM: <code>OPI PSRAM</code> · Upload Speed: <code>921600</code>
          </div>
        </div>
      </div>

      {/* 3. Interactive Arduino .INO Firmware & Supabase SQL Explorer */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="card-hdr">
          <span>{lang === 'es' ? 'EXPLORADOR DE CÓDIGO FUENTE (.INO FIRMWARE + DRIVERS + SUPABASE SQL)' : 'ARDUINO .INO MASTER FIRMWARE, MODULAR DRIVERS & SUPABASE SQL EXPLORER'}</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>{selectedFile.desc}</span>
            <button className="btn" onClick={copyCode} style={{ padding: '3px 9px', fontSize: '10px' }}>
              {copied ? '✓ COPIED' : '📋 COPY CODE'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {FIRMWARE_FILES.map((f) => (
            <button
              key={f.id}
              className={`btn ${selectedFile.id === f.id ? 'active' : ''}`}
              style={{ fontSize: '10px', padding: '4px 9px', fontFamily: 'Consolas, monospace' }}
              onClick={() => setSelectedFile(f)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <pre
          style={{
            background: '#050811',
            border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '11.5px',
            lineHeight: 1.5,
            color: '#e2e8f0',
            overflowX: 'auto',
            maxHeight: '460px',
            overflowY: 'auto',
            userSelect: 'text'
          }}
        >
          {fileCode}
        </pre>
      </div>
    </div>
  );
}
