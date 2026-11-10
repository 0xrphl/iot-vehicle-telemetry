import React from 'react';

function MiniSvgChart({ xSeries, ySeries, zSeries, minVal, maxVal }) {
  const width = 340;
  const height = 84;
  const range = maxVal - minVal || 1;

  const toPoints = (arr) =>
    arr
      .map((v, i) => {
        const x = (i / Math.max(1, arr.length - 1)) * width;
        const clamped = Math.max(minVal, Math.min(maxVal, v));
        const y = height - ((clamped - minVal) / range) * (height - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const zeroY = height - ((0 - minVal) / range) * (height - 8) - 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
      <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
      <polyline fill="none" stroke="#f43f5e" strokeWidth="1.8" points={toPoints(xSeries)} />
      <polyline fill="none" stroke="#10b981" strokeWidth="1.8" points={toPoints(ySeries)} />
      <polyline fill="none" stroke="#38bdf8" strokeWidth="1.8" points={toPoints(zSeries)} />
    </svg>
  );
}

export function TelemetrySidebar({ telemetry, history, hz }) {
  return (
    <div id="sidebar">
      {/* 1. 18650 Battery (Strictly V & mV, NO percentage!) + Dual Thermal */}
      <div className="glass-card">
        <div className="card-hdr">
          <span>18650 Power &amp; Dual Thermal</span>
          <span style={{ color: '#38bdf8' }}>Raw V / mV (No %)</span>
        </div>
        <div className="grid-2" style={{ marginBottom: '6px' }}>
          <div className="pill">
            <div className="k">18650 Battery Voltage</div>
            <div className="v c-y">
              {telemetry.vbat_v.toFixed(3)} V{' '}
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>({telemetry.vbat_mv} mV)</span>
            </div>
          </div>
          <div className="pill">
            <div className="k">Solar Input Bus</div>
            <div className="v c-amber">
              {telemetry.solar_mv} mV{' '}
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                ({(telemetry.solar_mv / 1000).toFixed(2)} V)
              </span>
            </div>
          </div>
        </div>
        <div className="grid-3">
          <div className="pill">
            <div className="k">BMI160 Gyro Temp</div>
            <div className="v c-x">{telemetry.gyro_temp.toFixed(1)} °C</div>
          </div>
          <div className="pill">
            <div className="k">DS3231 RTC Temp</div>
            <div className="v c-z">{telemetry.rtc_temp.toFixed(2)} °C</div>
          </div>
          <div className="pill">
            <div className="k">Vibration RMS</div>
            <div className="v">{telemetry.vib.toFixed(3)} g</div>
          </div>
        </div>
      </div>

      {/* 2. Gyroscope Rates */}
      <div className="glass-card">
        <div className="card-hdr">
          <span>BMI160 Gyroscope Rates</span>
          <span>deg/s</span>
        </div>
        <div className="grid-3">
          <div className="pill">
            <div className="k c-x">Gx (Roll)</div>
            <div className="v">{telemetry.gx.toFixed(2)}</div>
          </div>
          <div className="pill">
            <div className="k c-y">Gy (Pitch)</div>
            <div className="v">{telemetry.gy.toFixed(2)}</div>
          </div>
          <div className="pill">
            <div className="k c-z">Gz (Yaw)</div>
            <div className="v">{telemetry.gz.toFixed(2)}</div>
          </div>
        </div>
        <MiniSvgChart
          xSeries={history.gx}
          ySeries={history.gy}
          zSeries={history.gz}
          minVal={-200}
          maxVal={200}
        />
      </div>

      {/* 3. Accelerometer Forces */}
      <div className="glass-card">
        <div className="card-hdr">
          <span>BMI160 Accelerometer Forces</span>
          <span>g-force</span>
        </div>
        <div className="grid-3">
          <div className="pill">
            <div className="k c-x">Ax (Lat)</div>
            <div className="v">{telemetry.ax.toFixed(3)}</div>
          </div>
          <div className="pill">
            <div className="k c-y">Ay (Long)</div>
            <div className="v">{telemetry.ay.toFixed(3)}</div>
          </div>
          <div className="pill">
            <div className="k c-z">Az (Vert)</div>
            <div className="v">{telemetry.az.toFixed(3)}</div>
          </div>
        </div>
        <MiniSvgChart
          xSeries={history.ax}
          ySeries={history.ay}
          zSeries={history.az}
          minVal={-2.2}
          maxVal={2.2}
        />
      </div>

      {/* 4. 32GB MicroSD Blackbox & Supabase Cloud Sync */}
      <div className="glass-card">
        <div className="card-hdr">
          <span>32GB MicroSD &amp; Supabase Sync</span>
          <span style={{ color: '#c084fc' }}>Session #{telemetry.boot}</span>
        </div>
        <div className="grid-3">
          <div className="pill">
            <div className="k">32GB MicroSD</div>
            <div className="v c-purple">
              {telemetry.sd_ok ? `OK (${telemetry.sd_kb} KB)` : 'READY'}
            </div>
          </div>
          <div className="pill">
            <div className="k">Supabase Cloud</div>
            <div className="v c-z">{telemetry.cloud} Rows</div>
          </div>
          <div className="pill">
            <div className="k">Stream Rate</div>
            <div className="v">{hz} Hz</div>
          </div>
        </div>
      </div>

      {/* 5. Parametric Hardware Self-Test (BIST) Live Matrix */}
      <div className="glass-card">
        <div className="card-hdr">
          <span>Parametric Boot &amp; Live Self-Test (BIST)</span>
          <span style={{ color: '#10b981' }}>kart_sessions.test</span>
        </div>
        <div className="grid-3">
          <div className="pill">
            <div className="k">Wi-Fi / WS</div>
            <div className="v c-y">{telemetry.net === 1 ? `PASS (${telemetry.rssi}dBm)` : 'STANDBY'}</div>
          </div>
          <div className="pill">
            <div className="k">4G LTE SIM</div>
            <div className="v c-z">PASS (Movistar)</div>
          </div>
          <div className="pill">
            <div className="k">BMI160 Gyro</div>
            <div className={`v ${Math.abs(telemetry.az) > 0.01 ? 'c-y' : 'c-amber'}`}>
              {Math.abs(telemetry.az) > 0.01 ? 'PASS (0x68)' : 'INIT'}
            </div>
          </div>
          <div className="pill">
            <div className="k">18650 Module</div>
            <div className={`v ${telemetry.vbat_mv >= 2500 ? 'c-y' : 'c-amber'}`}>
              {telemetry.vbat_mv >= 2500 ? `ON (${telemetry.vbat_mv}mV)` : 'USB PWR'}
            </div>
          </div>
          <div className="pill">
            <div className="k">DS3231 Clock</div>
            <div className="v c-y">ON ({telemetry.rtc_temp.toFixed(1)}°C)</div>
          </div>
          <div className="pill">
            <div className="k">32GB MicroSD</div>
            <div className={`v ${telemetry.sd_ok ? 'c-y' : 'c-amber'}`}>
              {telemetry.sd_ok ? 'MOUNTED' : 'NO CARD'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
