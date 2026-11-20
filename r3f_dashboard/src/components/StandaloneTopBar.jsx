import React, { useState } from 'react';

const DATASHEETS = [
  { label: 'Final Circuit PNG', file: './hardware_schematics/circuit_layout_full.png' },
  { label: 'Final Circuit SVG', file: './hardware_schematics/circuit_layout_full.svg' },
  { label: 'SIM7672X / 7670G PDF', file: './hardware_schematics/SIM7672X_Series_Hardware_Design_V1.02.pdf' },
  { label: 'TI INA228 (48V DC) PDF', file: './hardware_schematics/INA228.PDF' },
  { label: 'Sensirion SHT31 PDF', file: './hardware_schematics/SHT31_Datasheet.pdf' },
  { label: 'Maxim DS18B20 PDF', file: './hardware_schematics/DS18B20.PDF' },
  { label: 'Bosch BMI160 IMU PDF', file: './hardware_schematics/bmi160-inertial-measurement-units.pdf' },
  { label: 'Maxim DS3231 RTC PDF', file: './hardware_schematics/DS3231.PDF' },
  { label: 'AT24C32 EEPROM PDF', file: './hardware_schematics/AT24C32.PDF' },
  { label: 'FNIRSI 2C53T Scope PDF', file: './hardware_schematics/FNIRSI_2C53T_Manual.pdf' }
];

export function StandaloneTopBar({ lang, onChangeLang }) {
  const [showDocs, setShowDocs] = useState(false);

  const title =
    lang === 'es'
      ? 'Telemetría SOTA Delta-Kart Eléctrico (LilyGO T-SIM7672G)'
      : 'Electric Delta-Kart SOTA Telemetry (LilyGO T-SIM7672G)';

  return (
    <>
      <div className="standalone-topbar">
        <div className="standalone-brand">
          <span style={{ fontSize: '17px' }}>📡</span>
          <span className="standalone-title">{title}</span>
        </div>

        <div className="standalone-actions">
          <button onClick={() => setShowDocs((v) => !v)} className="standalone-docs-btn">
            {lang === 'es' ? '📄 Datasheets y Circuito ⬇' : '📄 Datasheets & Circuit ⬇'}
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onChangeLang('en')}
              className={`standalone-lang-btn ${lang === 'en' ? 'active' : ''}`}
            >
              🇺🇸 EN
            </button>
            <button
              onClick={() => onChangeLang('es')}
              className={`standalone-lang-btn ${lang === 'es' ? 'active' : ''}`}
            >
              🇪🇸 ES
            </button>
          </div>

          <span className="standalone-pill-primary">T-SIM7672G · 4G + GNSS + R3F</span>
          <span className="standalone-pill-loc">Pereira, Colombia</span>
        </div>
      </div>

      {showDocs && (
        <div className="standalone-docs-drawer">
          <span className="standalone-docs-label">
            {lang === 'es' ? 'Descargar Oficiales:' : 'Official Downloads:'}
          </span>
          {DATASHEETS.map((d) => (
            <a
              key={d.label}
              href={d.file}
              download
              target="_blank"
              rel="noreferrer"
              className="standalone-doc-link"
            >
              ⬇ {d.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
