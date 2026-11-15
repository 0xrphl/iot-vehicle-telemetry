import React, { useState, useEffect } from 'react';

const FIRMWARE_FILES = [
  { id: 'main.ino', label: 'main/main.ino', path: './firmware/main/main.ino', desc: 'Master 30Hz IMU/WS + 20Hz INA22x 48V + 2Hz SHT31 + 1Hz DS18B20/GNSS + 5Hz SD + Supabase loop' },
  { id: 'config.h', label: 'main/config.h', path: './firmware/main/config.h', desc: 'Quad Isolated I2C + 1-Wire pin definitions, Multi-Wi-Fi fallback, UTP geofence & KartTelemetry struct' },
  { id: 'power_ina22x.h', label: 'power_ina22x.h', path: './firmware/main/power_ina22x/power_ina22x.h', desc: 'TI INA226 (16-bit) & INA228 (20-bit 85V) 48V DC Traction Pack monitor on SDA=IO6, SCL=IO7 + Wh/Ah integrator' },
  { id: 'env_sht31.h', label: 'env_sht31.h', path: './firmware/main/env_sht31/env_sht31.h', desc: 'Red 4-Pin Sensirion SHT31-DIS on SDA=IO40, SCL=IO39 (0x44), dual CRC-8, Magnus Dew Point/VPD & Heater BIST' },
  { id: 'temp_ds18b20.h', label: 'temp_ds18b20.h', path: './firmware/main/temp_ds18b20/temp_ds18b20.h', desc: 'Zero-dependency ESP32-S3 1-Wire driver on IO15 (+4.7k pull-up) for Controller & Motor DS18B20 probes' },
  { id: 'imu_bmi160.h', label: 'imu_bmi160.h', path: './firmware/main/imu_bmi160/imu_bmi160.h', desc: 'Bosch BMI160 6-DOF driver on Wire0 (IO1/IO2 @ 400kHz), gyro zero-bias cal, complementary filter & vibration RMS' },
  { id: 'rtc_ds3231.h', label: 'rtc_ds3231.h', path: './firmware/main/rtc_ds3231/rtc_ds3231.h', desc: 'Genuine DS3231 TCXO (0x68) + AT24C32 (0x57) on Wire1 (IO42/IO41), NTP/GNSS sync & crystal aging trim' },
  { id: 'gps_sim7672.h', label: 'gps_sim7672.h', path: './firmware/main/gps_sim7672/gps_sim7672.h', desc: 'SIM7670G/7672G 4G LTE + Multi-GNSS (active 28dBi LNA, $GxGSV SNR & UTP Pereira lock)' },
  { id: 'calibration_manager.h', label: 'calibration_manager.h', path: './firmware/main/calibration/calibration_manager.h', desc: '6-Sensor NVS & MicroSD (/calibration/*.csv) calibration curve manager' },
  { id: 'ina22x_48v_cal_test.ino', label: 'ina22x_48v_cal_test.ino', path: './firmware/ina22x_48v_cal_test/ina22x_48v_cal_test.ino', desc: 'Standalone bench testing & multimeter/shunt calibration suite for INA226/INA228 48V DC' },
  { id: 'self_test.h', label: 'self_test.h', path: './firmware/main/self_test/self_test.h', desc: '10-Subsystem Parametric Boot & Live Self-Test (BIST) synced to kart_sessions.test' },
  { id: 'schema.sql', label: 'supabase/schema.sql', path: './firmware/supabase/schema.sql', desc: 'PostgreSQL schema + additive migration columns for SHT31, DS18B20, INA22x 48V & Multi-GNSS' }
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
            <span>{lang === 'es' ? 'ESQUEMA ELÉCTRICO FINAL (4 BUSES I2C AISLADOS + 1-WIRE)' : 'FINAL HARDWARE WIRING SCHEMATIC (QUAD ISOLATED I2C + 1-WIRE)'}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <a href="./hardware_schematics/circuit_layout_full.svg" download="circuit_layout_full.svg" target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', padding: '3px 8px', fontSize: '10px' }}>⬇ VECTOR SVG</a>
              <a href="./hardware_schematics/circuit_layout_full.png" download="circuit_layout_full.png" target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', padding: '3px 8px', fontSize: '10px' }}>⬇ FINAL PNG</a>
            </div>
          </div>
          <div style={{ background: '#0b1120', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.25)', padding: '8px', textAlign: 'center' }}>
            <img
              src="./hardware_schematics/circuit_layout_full.png"
              alt="LilyGO T-SIM7672G Final Full Circuit Layout"
              style={{ width: '100%', maxHeight: '460px', objectFit: 'contain', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="card-hdr">
            <span>{lang === 'es' ? 'FOTOS REALES Y DESCARGA DE TODOS LOS DATASHEETS (PDF)' : 'REAL BUILD PHOTOS & ALL SENSOR DATASHEETS (DOWNLOAD PDF)'}</span>
            <span style={{ color: '#10b981' }}>8 Official PDFs</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <a href="./hardware_schematics/IMG_20261104_113059.jpg" target="_blank" rel="noreferrer">
              <img src="./hardware_schematics/IMG_20261104_113059.jpg" alt="BMI160 PCB" style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }} />
            </a>
            <a href="./hardware_schematics/IMG_20261104_113117.jpg" target="_blank" rel="noreferrer">
              <img src="./hardware_schematics/IMG_20261104_113117.jpg" alt="SIM7670G Modem" style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }} />
            </a>
            <a href="./hardware_schematics/IMG_20261104_113129.jpg" target="_blank" rel="noreferrer">
              <img src="./hardware_schematics/IMG_20261104_113129.jpg" alt="ESP32-S3 Headers" style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)' }} />
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
            <a href="./hardware_schematics/SIM7672X_Series_Hardware_Design_V1.02.pdf" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 SIM7670G/7672X Hardware PDF
            </a>
            <a href="./hardware_schematics/INA228.PDF" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 TI INA228 (85V 48V DC) PDF
            </a>
            <a href="./hardware_schematics/SHT31_Datasheet.pdf" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 Sensirion SHT31-DIS PDF
            </a>
            <a href="./hardware_schematics/DS18B20.PDF" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 Maxim DS18B20 1-Wire PDF
            </a>
            <a href="./hardware_schematics/bmi160-inertial-measurement-units.pdf" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 Bosch BMI160 6-DOF IMU PDF
            </a>
            <a href="./hardware_schematics/DS3231.PDF" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 Maxim DS3231 TCXO RTC PDF
            </a>
            <a href="./hardware_schematics/AT24C32.PDF" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 AT24C32 32Kb EEPROM PDF
            </a>
            <a href="./hardware_schematics/FNIRSI_2C53T_Manual.pdf" download target="_blank" rel="noreferrer" className="btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '10.5px', padding: '6px' }}>
              📄 FNIRSI 2C53T Scope/DMM PDF
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
