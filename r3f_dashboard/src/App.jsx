import React, { useState, useEffect } from 'react';
import { useTelemetryStream } from './hooks/useTelemetryStream';
import { KartStudioScene } from './components/KartStudioScene';
import { DarkLeafletMapWithKart } from './components/DarkLeafletMapWithKart';
import { TelemetrySidebar } from './components/TelemetrySidebar';
import { HistoricalAnalyticsView } from './components/HistoricalAnalyticsView';
import { FullTrackMapView } from './components/FullTrackMapView';
import { IsometricArchitectureView } from './components/IsometricArchitectureView';
import { PartsAndBomView } from './components/PartsAndBomView';
import { CircuitAndFirmwareView } from './components/CircuitAndFirmwareView';
import { StandaloneTopBar } from './components/StandaloneTopBar';

export default function App() {
  const [activeView, setActiveView] = useState('VIEW_1');
  const [lang, setLang] = useState(() => localStorage.getItem('iot-lang') || 'en');
  const [isStandalone] = useState(() => {
    try {
      return window.self === window.top;
    } catch (_) {
      return false;
    }
  });

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('iot-lang', l);
  };

  useEffect(() => {
    window.setLang = (l) => {
      changeLang(l);
    };
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    document.title = lang === 'es'
      ? 'Telemetría Vehicular IoT — Pereira, Risaralda'
      : 'IoT Vehicle Telemetry — Electric Delta-Kart SOTA';
  }, [lang, isStandalone]);

  const {
    telemetry,
    netRoll,
    netPitch,
    netYaw,
    connected,
    wsPortUsed,
    hz,
    history,
    gpsPoints,
    dataSource,
    setDataSource,
    supabaseStatus,
    simMode,
    setSimMode,
    tareNow,
    historicalRows,
    replayIndex,
    setReplayIndex,
    isPlaying,
    setIsPlaying,
    selectedDate,
    setSelectedDate,
    loadDayFromSupabase,
    handleCsvUpload
  } = useTelemetryStream();

  return (
    <div className="app-shell">
      {isStandalone && <StandaloneTopBar lang={lang} onChangeLang={changeLang} />}
      <header>
        <div className="brand">
          <span className="badge-sota">REACT THREE FIBER + LEAFLET</span>
          <span className="brand-title">
            {lang === 'es' ? 'Telemetría SOTA Delta-Kart Eléctrico' : 'Electric Delta-Kart SOTA Telemetry'}
          </span>
          <span className="rtc-pill">DS3231: {telemetry.ts}</span>
        </div>

        {/* Center Navigation: 6 Unified Engineering Views */}
        <div style={{ display: 'flex', background: 'rgba(15,23,42,0.9)', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.3)', padding: '2px', gap: '3px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeView === 'VIEW_1' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '10px', borderRadius: '6px' }}
            onClick={() => setActiveView('VIEW_1')}
          >
            {lang === 'es' ? '1. ESTUDIO 3D + MAPA' : '1. 3D STUDIO + MAP'}
          </button>
          <button
            className={`btn ${activeView === 'VIEW_2' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '10px', borderRadius: '6px' }}
            onClick={() => setActiveView('VIEW_2')}
          >
            {lang === 'es' ? '2. REPLAY Y GRÁFICAS' : '2. DAY REPLAY & CHARTS'}
          </button>
          <button
            className={`btn ${activeView === 'VIEW_3' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '10px', borderRadius: '6px' }}
            onClick={() => setActiveView('VIEW_3')}
          >
            {lang === 'es' ? '3. PISTA GPS + PIP' : '3. FULL GPS TRACK + PIP'}
          </button>
          <button
            className={`btn ${activeView === 'VIEW_4' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '10px', borderRadius: '6px' }}
            onClick={() => setActiveView('VIEW_4')}
          >
            {lang === 'es' ? '4. 🏗️ ARQUITECTURA' : '4. 🏗️ ARCHITECTURE'}
          </button>
          <button
            className={`btn ${activeView === 'VIEW_5' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '10px', borderRadius: '6px' }}
            onClick={() => setActiveView('VIEW_5')}
          >
            {lang === 'es' ? '5. 💰 PARTES Y BOM' : '5. 💰 PARTS & BOM'}
          </button>
          <button
            className={`btn ${activeView === 'VIEW_6' ? 'active' : ''}`}
            style={{ padding: '4px 9px', fontSize: '10px', borderRadius: '6px' }}
            onClick={() => setActiveView('VIEW_6')}
          >
            {lang === 'es' ? '6. ⚡ CIRCUITO Y .INO' : '6. ⚡ CIRCUIT & .INO'}
          </button>
        </div>

        {/* Right Controls: Live Wi-Fi vs Live 4G Supabase vs History */}
        <div className="controls-bar">
          <div style={{ display: 'flex', background: 'rgba(15,23,42,0.85)', borderRadius: '7px', border: '1px solid rgba(148,163,184,0.25)', padding: '2px', gap: '2px' }}>
            <button
              className={`btn ${dataSource === 'LOCAL_WS' ? 'active' : ''}`}
              style={{ borderRadius: '5px', padding: '4px 7px', fontSize: '10px' }}
              onClick={() => setDataSource('LOCAL_WS')}
            >
              LIVE WIFI/USB ({connected ? 'OK' : 'WAIT'})
            </button>
            <button
              className={`btn ${dataSource === 'SUPABASE' ? 'active' : ''}`}
              style={{ borderRadius: '5px', padding: '4px 7px', fontSize: '10px' }}
              onClick={() => setDataSource('SUPABASE')}
            >
              LIVE 4G SUPABASE ({supabaseStatus})
            </button>
            <button
              className={`btn ${dataSource === 'HISTORY' ? 'active' : ''}`}
              style={{ borderRadius: '5px', padding: '4px 7px', fontSize: '10px' }}
              onClick={() => {
                setActiveView('VIEW_2');
                loadDayFromSupabase(selectedDate);
              }}
            >
              {lang === 'es' ? 'HISTORIAL DÍA' : 'DAY HISTORY'}
            </button>
          </div>

          <button
            className={`btn ${simMode ? 'active' : ''}`}
            onClick={() => setSimMode((s) => !s)}
          >
            {simMode ? (lang === 'es' ? 'DETENER SIM' : 'STOP SIM') : 'DEMO'}
          </button>
          <button className="btn btn-tare" onClick={tareNow}>
            {lang === 'es' ? 'TARAR CERO' : 'TARE ZERO'}
          </button>
        </div>
      </header>

      {activeView === 'VIEW_1' && (
        <div id="workspace">
          <KartStudioScene
            roll={netRoll}
            pitch={netPitch}
            yaw={netYaw}
            gz={telemetry.gz}
            peakG={telemetry.peak_g}
          />
          <DarkLeafletMapWithKart
            telemetry={telemetry}
            gpsPoints={gpsPoints}
            roll={netRoll}
            pitch={netPitch}
            yaw={netYaw}
          />
          <TelemetrySidebar telemetry={telemetry} history={history} hz={hz} />
        </div>
      )}

      {activeView === 'VIEW_2' && (
        <HistoricalAnalyticsView
          telemetry={telemetry}
          history={history}
          historicalRows={historicalRows}
          replayIndex={replayIndex}
          setReplayIndex={setReplayIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          loadDayFromSupabase={loadDayFromSupabase}
          handleCsvUpload={handleCsvUpload}
        />
      )}

      {activeView === 'VIEW_3' && (
        <FullTrackMapView
          telemetry={telemetry}
          gpsPoints={gpsPoints}
          roll={netRoll}
          pitch={netPitch}
          yaw={netYaw}
          historicalRows={historicalRows}
          setReplayIndex={setReplayIndex}
        />
      )}

      {activeView === 'VIEW_4' && <IsometricArchitectureView lang={lang} />}
      {activeView === 'VIEW_5' && <PartsAndBomView lang={lang} />}
      {activeView === 'VIEW_6' && <CircuitAndFirmwareView lang={lang} />}
    </div>
  );
}

