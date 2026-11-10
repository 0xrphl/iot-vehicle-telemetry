import React from 'react';

function LargeTelemetrySvgChart({ title, unit, seriesList, minVal, maxVal, activeIdx }) {
  const width = 620;
  const height = 140;
  const range = maxVal - minVal || 1;

  const toPoints = (arr) =>
    arr
      .map((v, i) => {
        const x = (i / Math.max(1, arr.length - 1)) * width;
        const clamped = Math.max(minVal, Math.min(maxVal, v ?? 0));
        const y = height - ((clamped - minVal) / range) * (height - 16) - 8;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const zeroY = height - ((0 - minVal) / range) * (height - 16) - 8;
  const cursorX =
    activeIdx !== null && seriesList[0]?.data?.length > 1
      ? (activeIdx / (seriesList[0].data.length - 1)) * width
      : null;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div className="card-hdr">
        <span>{title}</span>
        <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
          {seriesList.map((s, idx) => (
            <span key={idx} style={{ color: s.color, fontWeight: 700 }}>
              ● {s.label}: {s.current} {unit}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart" style={{ height: '135px' }}>
        <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
        {seriesList.map((s, idx) => (
          <polyline key={idx} fill="none" stroke={s.color} strokeWidth="2" points={toPoints(s.data)} />
        ))}
        {cursorX !== null && (
          <line x1={cursorX} y1="0" x2={cursorX} y2={height} stroke="#fbbf24" strokeWidth="1.5" />
        )}
      </svg>
    </div>
  );
}

export function HistoricalAnalyticsView({
  telemetry,
  history,
  historicalRows,
  replayIndex,
  setReplayIndex,
  isPlaying,
  setIsPlaying,
  selectedDate,
  setSelectedDate,
  loadDayFromSupabase,
  handleCsvUpload
}) {
  const isReplay = historicalRows.length > 0;
  const gxData = isReplay ? historicalRows.map((r) => r.gx) : history.gx;
  const gyData = isReplay ? historicalRows.map((r) => r.gy) : history.gy;
  const gzData = isReplay ? historicalRows.map((r) => r.gz) : history.gz;

  const axData = isReplay ? historicalRows.map((r) => r.ax) : history.ax;
  const ayData = isReplay ? historicalRows.map((r) => r.ay) : history.ay;
  const azData = isReplay ? historicalRows.map((r) => r.az) : history.az;

  const vbatData  = isReplay ? historicalRows.map((r) => r.vbat_mv) : Array(45).fill(telemetry.vbat_mv);
  const gTempData = isReplay ? historicalRows.map((r) => r.gyro_temp || r.gyro_temp_c || 30.2) : Array(45).fill(telemetry.gyro_temp);
  const rTempData = isReplay ? historicalRows.map((r) => r.rtc_temp || r.rtc_temp_c || 29.8) : Array(45).fill(telemetry.rtc_temp);

  const ggX = 75 + Math.max(-1.5, Math.min(1.5, telemetry.ax)) * 42;
  const ggY = 75 - Math.max(-1.5, Math.min(1.5, telemetry.ay)) * 42;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', overflowY: 'auto' }}>
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge-sota">VIEW 2: HISTORICAL &amp; MULTI-CHANNEL ANALYTICS</span>
          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ background: '#090d16', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}
          />
          <button className="btn active" onClick={() => loadDayFromSupabase(selectedDate)}>
            LOAD DAY FROM SUPABASE
          </button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            IMPORT 32GB SD CSV
            <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
          <button className="btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸ PAUSE' : '▶ PLAY REPLAY'}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, historicalRows.length - 1)}
            value={replayIndex}
            onChange={(e) => setReplayIndex(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#38bdf8' }}
          />
          <span style={{ fontSize: '11px', color: '#67e8f9', fontFamily: 'monospace' }}>
            {historicalRows.length > 0 ? `Sample ${replayIndex + 1}/${historicalRows.length}` : 'Live Window (45 pts)'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 260px', gap: '10px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <LargeTelemetrySvgChart
            title="BMI160 Gyroscope Angular Velocity (Gx, Gy, Gz)"
            unit="°/s"
            minVal={-220}
            maxVal={220}
            activeIdx={isReplay ? replayIndex : null}
            seriesList={[
              { label: 'Gx', color: '#f43f5e', data: gxData, current: telemetry.gx.toFixed(1) },
              { label: 'Gy', color: '#10b981', data: gyData, current: telemetry.gy.toFixed(1) },
              { label: 'Gz', color: '#38bdf8', data: gzData, current: telemetry.gz.toFixed(1) }
            ]}
          />
          <LargeTelemetrySvgChart
            title="BMI160 Accelerometer G-Forces (Ax, Ay, Az)"
            unit="g"
            minVal={-2.2}
            maxVal={2.2}
            activeIdx={isReplay ? replayIndex : null}
            seriesList={[
              { label: 'Ax', color: '#f43f5e', data: axData, current: telemetry.ax.toFixed(2) },
              { label: 'Ay', color: '#10b981', data: ayData, current: telemetry.ay.toFixed(2) },
              { label: 'Az', color: '#38bdf8', data: azData, current: telemetry.az.toFixed(2) }
            ]}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <LargeTelemetrySvgChart
            title="18650 Battery Discharge & Power Curve (mV - No %)"
            unit="mV"
            minVal={3000}
            maxVal={4300}
            activeIdx={isReplay ? replayIndex : null}
            seriesList={[
              { label: '18650 VBAT', color: '#10b981', data: vbatData, current: `${telemetry.vbat_mv} (${telemetry.vbat_v.toFixed(3)}V)` }
            ]}
          />
          <LargeTelemetrySvgChart
            title="Dual Thermal Profile: BMI160 Gyro Temp vs DS3231 RTC Temp"
            unit="°C"
            minVal={15}
            maxVal={50}
            activeIdx={isReplay ? replayIndex : null}
            seriesList={[
              { label: 'Gyro Die', color: '#f43f5e', data: gTempData, current: telemetry.gyro_temp.toFixed(1) },
              { label: 'DS3231 RTC', color: '#38bdf8', data: rTempData, current: telemetry.rtc_temp.toFixed(2) }
            ]}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div className="card-hdr"><span>KART G-G TRACTION CIRCLE</span><span>1.5g Max</span></div>
            <svg viewBox="0 0 150 150" style={{ width: '155px', height: '155px', margin: '0 auto' }}>
              <circle cx="75" cy="75" r="64" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
              <circle cx="75" cy="75" r="42" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="75" cy="75" r="21" fill="none" stroke="#1e293b" strokeWidth="1" />
              <line x1="11" y1="75" x2="139" y2="75" stroke="#1e293b" strokeWidth="1" />
              <line x1="75" y1="11" x2="75" y2="139" stroke="#1e293b" strokeWidth="1" />
              <circle cx={ggX} cy={ggY} r="5.5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
            </svg>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Lat: <b className="c-x">{telemetry.ax.toFixed(2)}g</b> | Long: <b className="c-y">{telemetry.ay.toFixed(2)}g</b>
            </div>
          </div>

          <div className="glass-card" style={{ flex: 1 }}>
            <div className="card-hdr"><span>DAY / SESSION SUMMARY</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="pill"><div className="k">Timestamp (DS3231)</div><div className="v" style={{ fontSize: '11px' }}>{telemetry.ts}</div></div>
              <div className="pill"><div className="k">Peak G-Force</div><div className="v c-x">{telemetry.peak_g.toFixed(2)} g</div></div>
              <div className="pill"><div className="k">Chassis Vibration RMS</div><div className="v c-amber">{telemetry.vib.toFixed(3)} g</div></div>
              <div className="pill"><div className="k">GPS Coordinates</div><div className="v c-z" style={{ fontSize: '11px' }}>{telemetry.lat.toFixed(5)}, {telemetry.lon.toFixed(5)}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
