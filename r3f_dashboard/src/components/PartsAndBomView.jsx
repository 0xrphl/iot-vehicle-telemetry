import React from 'react';

const BOM_ITEMS = [
  {
    id: 'lilygo-tsim7672g',
    title: '1. Master MCU + 4G LTE + Multi-GNSS — LilyGO T-SIM7672G V1.1',
    badge: 'ESP32-S3 MCN16R8',
    color: '#38bdf8',
    image: './images/lilygo-tsim7670g.png',
    secondaryImage: './hardware_schematics/IMG_20261104_113117.jpg',
    link: 'https://aliexpress.com/item/1005007058444056.html',
    price: '$45.00',
    specs: [
      ['Microcontroller', 'ESP32-S3-WROOM-1 MCN16R8 (Dual-Core 240MHz, 16MB Flash, 8MB OPI PSRAM)'],
      ['Cellular Modem', 'SIM7672G 4G LTE Cat-1 (UART1: TX=GPIO 11, RX=GPIO 10, PWRKEY=18, DTR=9)'],
      ['Multi-GNSS', 'GPS + GLONASS + Galileo + BeiDou (Active LNA power on Modem GPIO 4)'],
      ['Onboard Storage', 'MicroSD SPI Slot (CS=GPIO 13, MOSI=14, SCK=21, MISO=47)'],
      ['Power & ADC', 'Onboard 18650 Holder (VBAT ADC=GPIO 4 x2 divider) + Solar Input (GPIO 5 x2 divider)']
    ]
  },
  {
    id: 'bosch-bmi160',
    title: '2. 6-DOF Inertial Measurement Unit — Bosch BMI160 (GY-BMI160)',
    badge: 'Wire0 I2C (0x68)',
    color: '#c084fc',
    image: './images/bmi160-gyroscope.png',
    secondaryImage: './hardware_schematics/IMG_20261104_113129.jpg',
    link: 'https://www.aliexpress.us/item/3256809462979321.html',
    price: '$2.50',
    specs: [
      ['Axes & Range', '6-DOF: 3-Axis Gyroscope (±250 °/s) + 3-Axis Accelerometer (±2g), 16-bit ADC'],
      ['Thermal Sensor', 'Internal Die Temperature Sensor (°C) read from Reg 0x20–0x21'],
      ['Bus & Pins', 'Wire0 I2C @ 400 kHz Fast-Mode — SDA = GPIO 1 (Pin 5), SCL = GPIO 2 (Pin 6)'],
      ['Hardware Strapping', 'VIN + CS tied to 3V3 (I2C mode), GND + SAO tied to GND (Address 0x68)'],
      ['Sampling & Fusion', '30 Hz (every 33ms) Complementary Filter (Roll, Pitch, Yaw, Peak G, Vibration RMS)']
    ]
  },
  {
    id: 'ds3231-rtc',
    title: '3. Precision TCXO Real-Time Clock — DS3231SN/MZ + AT24C32 EEPROM',
    badge: 'Wire1 I2C (0x68 / 0x57)',
    color: '#60a5fa',
    image: './hardware_schematics/IMG_20261104_113059.jpg',
    secondaryImage: './hardware_schematics/circuit_layout_full.png',
    link: 'https://www.aliexpress.com/w/wholesale-DS3231-AT24C32-module.html',
    price: '$2.20',
    specs: [
      ['Clock Accuracy', '±2 ppm Temperature-Compensated Crystal Oscillator (TCXO) with CR2032 3V backup'],
      ['Onboard EEPROM', 'AT24C32 32Kbit I2C EEPROM (0x57) storing persistent boot/session counter'],
      ['Ambient Thermal', 'High-precision RTC temperature register (±0.25 °C resolution) for dual thermal profiling'],
      ['Zero-Collision Bus', 'Dedicated Wire1 I2C @ 400 kHz — SDA = GPIO 42 (Pin 7), SCL = GPIO 41 (Pin 8)'],
      ['Atomic GNSS Sync', 'Automatically disciplined to UTC satellite time upon SIM7672G 3D GNSS fix']
    ]
  },
  {
    id: 'power-storage-sim',
    title: '4. Power, 32GB MicroSD Blackbox & 4G SIM — Single-Vehicle Kit',
    badge: '18650 + 32GB SD + SIM',
    color: '#10b981',
    image: './hardware_schematics/circuit_layout_full.png',
    secondaryImage: './hardware_schematics/IMG_20261104_113117.jpg',
    link: 'https://es.aliexpress.com/item/1005005825496564.html',
    price: '$19.80',
    specs: [
      ['18650 Li-Ion Cell', '3400mAh 3.7V/4.2V rechargeable cell seated in onboard holder ($3.50) — raw V & mV telemetry'],
      ['Solar Panel Input', '5V–6V 150mA mono/poly solar charger connected to solar input bus ($5.49)'],
      ['32GB MicroSDHC', 'Class 10 UHS-I 32 GB card logging 5 Hz CSV blackbox files (>11,000 hrs capacity) ($5.80)'],
      ['Movistar 4G SIM', 'Colombia Nano-SIM with 220 MB IoT data plan (APN: internet.movistar.com.co) ($3.50)'],
      ['Wiring & Mounts', 'Silicone Dupont jumper harness (Consecutive Right Header Pins 3–8) + PETG mount ($1.51)']
    ]
  }
];

export function PartsAndBomView({ lang = 'en' }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span className="badge-sota">SINGLE-VEHICLE SOURCE OF TRUTH</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {lang === 'es'
                ? 'Lista de Partes y BOM — Nodo de Telemetría LilyGO T-SIM7672G (1 Vehículo)'
                : 'Single-Vehicle Parts List & BOM — LilyGO T-SIM7672G Electric Delta-Kart'}
            </h2>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {lang === 'es'
              ? 'Hardware real desplegado en el Delta-Kart Eléctrico · Sin nodos LoRa ni extras multi-vehículo'
              : 'Exact production hardware deployed on the Electric Delta-Kart · Zero multi-vehicle/LoRa bloat'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
          <div className="pill"><div className="k">{lang === 'es' ? 'Costo Total (1 Vehículo)' : 'Single-Vehicle Total'}</div><div className="v c-y" style={{ fontSize: '18px' }}>$69.50 USD</div></div>
          <div className="pill"><div className="k">{lang === 'es' ? 'MCU + 4G + GNSS' : 'Master MCU + 4G + GNSS'}</div><div className="v c-z" style={{ fontSize: '15px' }}>T-SIM7672G ($45)</div></div>
          <div className="pill"><div className="k">{lang === 'es' ? 'IMU 6-DOF + RTC TCXO' : '6-DOF IMU + TCXO RTC'}</div><div className="v c-purple" style={{ fontSize: '15px' }}>BMI160 + DS3231 ($4.70)</div></div>
          <div className="pill"><div className="k">{lang === 'es' ? 'Caja Negra MicroSD' : 'MicroSD Blackbox'}</div><div className="v c-amber" style={{ fontSize: '15px' }}>32 GB (&gt;11,000 hrs)</div></div>
          <div className="pill"><div className="k">{lang === 'es' ? 'Plan Datos 4G Movistar' : 'Movistar 4G SIM Plan'}</div><div className="v c-x" style={{ fontSize: '15px' }}>220 MB (&gt;650 hrs)</div></div>
          <div className="pill"><div className="k">{lang === 'es' ? 'Nube Supabase' : 'Supabase Cloud DB'}</div><div className="v c-y" style={{ fontSize: '15px' }}>$0/mo (&lt;500MB Cap)</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '12px' }}>
        {BOM_ITEMS.map((item) => (
          <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="card-hdr" style={{ borderBottom: '1px solid rgba(148,163,184,0.16)', paddingBottom: '6px' }}>
              <span style={{ color: item.color, fontSize: '12px' }}>{item.title}</span>
              <span className="badge-sota" style={{ fontSize: '9px' }}>{item.badge}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(9,13,24,0.75)', padding: '8px', borderRadius: '8px' }}>
              <a href={item.link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={item.image} alt={item.title} style={{ maxHeight: '155px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} />
              </a>
              <a href={item.secondaryImage} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={item.secondaryImage} alt={`${item.title} build`} style={{ maxHeight: '155px', maxWidth: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.25)' }} />
              </a>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                {item.specs.map(([k, v], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <td style={{ padding: '5px 8px', color: '#94a3b8', fontWeight: 700, width: '34%' }}>{k}</td>
                    <td style={{ padding: '5px 8px', color: '#e2e8f0' }}>{v}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '7px 8px', color: '#38bdf8', fontWeight: 800 }}>Unit Cost</td>
                  <td style={{ padding: '7px 8px', fontWeight: 800 }}>
                    <a href={item.link} target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'none' }}>
                      {item.price} USD — View Component Source ↗
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <div className="glass-card">
        <div className="card-hdr">
          <span>COMPLETE SINGLE-VEHICLE BILL OF MATERIALS (ELECTRIC DELTA-KART TELEMETRY NODE)</span>
          <span style={{ color: '#10b981' }}>100% Verified Hardware</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', textAlign: 'left' }}>
              <th style={{ padding: '7px 10px' }}>#</th>
              <th style={{ padding: '7px 10px' }}>Component</th>
              <th style={{ padding: '7px 10px' }}>Interface / Pins on LilyGO T-SIM7672G</th>
              <th style={{ padding: '7px 10px' }}>Telemetry Role</th>
              <th style={{ padding: '7px 10px' }}>Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '6px 10px' }}>1</td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>LilyGO T-SIM7672G V1.1 (ESP32-S3 MCN16R8)</td>
              <td style={{ padding: '6px 10px', fontFamily: 'Consolas, monospace' }}>UART1 (IO10/11/18/9), USB-C CDC</td>
              <td style={{ padding: '6px 10px' }}>Dual-Core 240MHz MCU + 4G LTE Cat-1 + Multi-GNSS</td>
              <td style={{ padding: '6px 10px', color: '#10b981', fontWeight: 800 }}>$45.00</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '6px 10px' }}>2</td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>Bosch BMI160 6-DOF IMU Module</td>
              <td style={{ padding: '6px 10px', fontFamily: 'Consolas, monospace' }}>Wire0: SDA=GPIO 1, SCL=GPIO 2 (0x68)</td>
              <td style={{ padding: '6px 10px' }}>30Hz Roll/Pitch/Yaw, 6-Axis G/dps, Vibration RMS, Die Temp (°C)</td>
              <td style={{ padding: '6px 10px', color: '#10b981', fontWeight: 800 }}>$2.50</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '6px 10px' }}>3</td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>DS3231SN TCXO RTC + AT24C32 EEPROM + CR2032</td>
              <td style={{ padding: '6px 10px', fontFamily: 'Consolas, monospace' }}>Wire1: SDA=GPIO 42, SCL=GPIO 41 (0x68/0x57)</td>
              <td style={{ padding: '6px 10px' }}>Precision UTC Timestamp, Ambient Temp (°C), Boot Counter</td>
              <td style={{ padding: '6px 10px', color: '#10b981', fontWeight: 800 }}>$2.20</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '6px 10px' }}>4</td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>18650 Li-Ion Cell (3400mAh 3.7V/4.2V)</td>
              <td style={{ padding: '6px 10px', fontFamily: 'Consolas, monospace' }}>Onboard Holder → GPIO 4 ADC (x2 divider)</td>
              <td style={{ padding: '6px 10px' }}>Primary Node Power + Raw V &amp; mV Telemetry (Strictly No %)</td>
              <td style={{ padding: '6px 10px', color: '#10b981', fontWeight: 800 }}>$3.50</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '6px 10px' }}>5</td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>Mono/Poly Solar Panel (5V–6V 150mA)</td>
              <td style={{ padding: '6px 10px', fontFamily: 'Consolas, monospace' }}>Solar Input → GPIO 5 ADC (x2 divider)</td>
              <td style={{ padding: '6px 10px' }}>Auxiliary Solar Charging &amp; Solar Input Bus mV Monitoring</td>
              <td style={{ padding: '6px 10px', color: '#10b981', fontWeight: 800 }}>$5.49</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '6px 10px' }}>6</td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>32 GB MicroSDHC Card (Class 10 SPI)</td>
              <td style={{ padding: '6px 10px', fontFamily: 'Consolas, monospace' }}>CS=13, MOSI=14, SCK=21, MISO=47</td>
              <td style={{ padding: '6px 10px' }}>5 Hz (200ms) Full-Rate CSV Blackbox Logger (&gt;11,000 hrs)</td>
              <td style={{ padding: '6px 10px', color: '#10b981', fontWeight: 800 }}>$5.80</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              <td style={{ padding: '6px 10px' }}>7</td>
              <td style={{ padding: '6px 10px', fontWeight: 700 }}>Movistar Colombia 4G Nano-SIM + Dupont Harness</td>
              <td style={{ padding: '6px 10px', fontFamily: 'Consolas, monospace' }}>Nano-SIM Slot + Right Header Pins 3–8</td>
              <td style={{ padding: '6px 10px' }}>220 MB Data Plan (&gt;650 hrs active driving sync to Supabase)</td>
              <td style={{ padding: '6px 10px', color: '#10b981', fontWeight: 800 }}>$5.01</td>
            </tr>
            <tr style={{ borderTop: '2px solid rgba(56,189,248,0.4)', fontWeight: 800, fontSize: '13px' }}>
              <td colSpan={4} style={{ padding: '8px 10px', color: '#38bdf8' }}>TOTAL SINGLE-VEHICLE TELEMETRY BUILD</td>
              <td style={{ padding: '8px 10px', color: '#10b981' }}>$69.50 USD</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
