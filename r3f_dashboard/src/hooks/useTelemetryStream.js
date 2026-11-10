import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_TELEMETRY = {
  ts: '2026-11-08T17:00:00Z',
  vbat_mv: 4040,
  vbat_v: 4.040,
  solar_mv: 0,
  gyro_temp: 30.2,
  rtc_temp: 29.85,
  ax: 0.008,
  ay: -0.105,
  az: 1.015,
  gx: -0.78,
  gy: -0.31,
  gz: 0.32,
  roll: 0.0,
  pitch: 0.0,
  yaw: 0.0,
  peak_g: 1.02,
  vib: 0.012,
  lat: 4.79520,
  lon: -75.68860,
  spd: 0.0,
  alt: 1411.0,
  crs: 0.0,
  sats: 9,
  fix: 3,
  sd_ok: 1,
  sd_kb: 24,
  sd_rec: 180,
  boot: 1,
  rssi: -52,
  net: 1,
  cloud: 12
};

export function useTelemetryStream() {
  const [telemetry, setTelemetry] = useState(DEFAULT_TELEMETRY);
  const [connected, setConnected] = useState(false);
  const [wsPortUsed, setWsPortUsed] = useState(8081);
  const [hz, setHz] = useState(0);
  const [dataSource, setDataSource] = useState('LOCAL_WS'); // 'LOCAL_WS' | 'SUPABASE' | 'HISTORY'
  const [supabaseStatus, setSupabaseStatus] = useState('SYNCED');
  const [tare, setTare] = useState({ roll: 0, pitch: 0, yaw: 0 });
  const [simMode, setSimMode] = useState(true);
  const [gpsPoints, setGpsPoints] = useState([[4.79520, -75.68860]]);
  const [historicalRows, setHistoricalRows] = useState([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-11-08');
  const [history, setHistory] = useState({
    gx: Array(45).fill(0),
    gy: Array(45).fill(0),
    gz: Array(45).fill(0),
    ax: Array(45).fill(0),
    ay: Array(45).fill(0),
    az: Array(45).fill(1)
  });

  const msgCounter = useRef(0);
  const latestRef  = useRef(DEFAULT_TELEMETRY);
  const simAngle   = useRef(0);

  const pushSample = useCallback((raw) => {
    msgCounter.current += 1;
    const vbatMv = raw.vbat_mv !== undefined ? raw.vbat_mv : 4040;
    const vbatV  = raw.vbat_v  !== undefined ? raw.vbat_v  : vbatMv / 1000.0;
    const gTemp  = raw.gyro_temp !== undefined ? raw.gyro_temp : (raw.temp !== undefined ? raw.temp : 30.2);
    const rTemp  = raw.rtc_temp  !== undefined ? raw.rtc_temp  : +(gTemp - 0.3).toFixed(2);

    const ax = raw.ax ?? 0;
    const ay = raw.ay ?? 0;
    const az = raw.az ?? 1.0;
    const gx = raw.gx ?? 0;
    const gy = raw.gy ?? 0;
    const gz = raw.gz ?? 0;

    const totalG = Math.sqrt(ax * ax + ay * ay + az * az);
    const peakG  = raw.peak_g !== undefined ? raw.peak_g : totalG;
    const vib    = raw.vib    !== undefined ? raw.vib    : Math.abs(totalG - 1.0);

    let nextLat = raw.lat && Math.abs(raw.lat) > 0.001 ? raw.lat : latestRef.current.lat;
    let nextLon = raw.lon && Math.abs(raw.lon) > 0.001 ? raw.lon : latestRef.current.lon;

    if ((!raw.lat || Math.abs(raw.lat) < 0.001) && Math.abs(gz) > 1.5) {
      const yawRad = ((raw.yaw || 0) * Math.PI) / 180.0;
      const step = 0.000005 * (1 + Math.abs(ax) + Math.abs(ay));
      nextLat += Math.cos(yawRad) * step;
      nextLon += Math.sin(yawRad) * step;
    }

    const merged = {
      ...latestRef.current,
      ...raw,
      vbat_mv: vbatMv,
      vbat_v: vbatV,
      gyro_temp: gTemp,
      rtc_temp: rTemp,
      ax, ay, az, gx, gy, gz,
      peak_g: peakG,
      vib,
      lat: nextLat,
      lon: nextLon
    };

    latestRef.current = merged;
    setTelemetry(merged);

    setGpsPoints((prev) => {
      const last = prev[prev.length - 1];
      if (!last || Math.hypot(last[0] - nextLat, last[1] - nextLon) > 0.000002) {
        const updated = [...prev, [nextLat, nextLon]];
        return updated.length > 200 ? updated.slice(updated.length - 200) : updated;
      }
      return prev;
    });

    setHistory((prev) => ({
      gx: [...prev.gx.slice(1), gx],
      gy: [...prev.gy.slice(1), gy],
      gz: [...prev.gz.slice(1), gz],
      ax: [...prev.ax.slice(1), ax],
      ay: [...prev.ay.slice(1), ay],
      az: [...prev.az.slice(1), az]
    }));
  }, []);

  useEffect(() => {
    let ws = null;
    let retryTimer = null;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      const host = window.location.hostname || '127.0.0.1';
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
      if (window.location.protocol === 'https:' && !isLocal) return;
      const port = window.location.port === '80' || window.location.port === '' ? 81 : 8081;
      setWsPortUsed(port);

      try {
        ws = new WebSocket(`ws://${host}:${port}`);
        ws.onopen = () => {
          if (!unmounted) {
            setConnected(true);
            setSimMode(false);
          }
        };
        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            pushSample(data);
          } catch (_) {}
        };
        ws.onclose = () => {
          if (!unmounted) {
            setConnected(false);
            retryTimer = setTimeout(connect, 2500);
          }
        };
        ws.onerror = () => {
          try { ws.close(); } catch (_) {}
        };
      } catch (_) {}
    };

    connect();
    return () => {
      unmounted = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) ws.close();
    };
  }, [pushSample]);

  // Supabase Cloud Poller (when user selects 4G LTE SUPABASE mode)
  useEffect(() => {
    if (dataSource !== 'SUPABASE') return;

    let unmounted = false;
    const fetchLatestFromSupabase = async () => {
      try {
        const url = 'https://tapjoxeplcyeohsnrmnl.supabase.co/rest/v1/kart_telemetry?order=id.desc&limit=1';
        const key = 'sb_publishable_m6sJshs7hjbYHlE0lUGx9Q_ZM-wXn6e';
        const resp = await fetch(url, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });
        if (resp.ok) {
          const rows = await resp.json();
          if (rows && rows.length > 0 && !unmounted) {
            const r = rows[0];
            pushSample({
              ts: r.rtc_ts,
              vbat_mv: r.vbat_mv,
              vbat_v: r.vbat_mv / 1000.0,
              solar_mv: r.solar_mv || 0,
              gyro_temp: r.gyro_temp_c,
              rtc_temp: r.rtc_temp_c,
              ax: r.ax, ay: r.ay, az: r.az,
              gx: r.gx, gy: r.gy, gz: r.gz,
              roll: r.roll, pitch: r.pitch, yaw: r.yaw,
              peak_g: r.peak_g, vib: r.vib_rms,
              lat: r.lat, lon: r.lon,
              spd: r.speed_kmh, alt: r.alt_m, crs: r.course_deg,
              sats: r.sats, fix: r.gps_fix,
              sd_ok: 1, sd_kb: r.sd_kb, cloud: r.id, boot: r.session_id || 1,
              rssi: r.rssi, net: r.net_mode
            });
            setSupabaseStatus(`ROW #${r.id} LIVE`);
          }
        }
      } catch (e) {
        if (!unmounted) setSupabaseStatus('OFFLINE');
      }
    };

    fetchLatestFromSupabase();
    const interval = setInterval(fetchLatestFromSupabase, 2000);
    return () => {
      unmounted = true;
      clearInterval(interval);
    };
  }, [dataSource, pushSample]);


  useEffect(() => {
    const id = setInterval(() => {
      setHz(msgCounter.current);
      msgCounter.current = 0;
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!simMode) return;
    const id = setInterval(() => {
      simAngle.current += 0.04;
      const a = simAngle.current;
      const simLat = 4.79520 + Math.sin(a) * 0.00085;
      const simLon = -75.68860 + Math.cos(a * 0.5) * 0.00120;
      const courseRad = Math.atan2(
        -0.5 * Math.sin(a * 0.5) * 0.00120,
        Math.cos(a) * 0.00085
      );
      const courseDeg = (courseRad * 180) / Math.PI;

      pushSample({
        ts: new Date().toISOString().slice(0, 19) + 'Z',
        vbat_mv: 4075 - Math.round(Math.sin(a) * 15),
        vbat_v: +(4.075 - Math.sin(a) * 0.015).toFixed(3),
        solar_mv: 4890,
        gyro_temp: +(30.2 + Math.sin(a * 0.2) * 0.3).toFixed(1),
        rtc_temp: 29.75,
        ax: +(Math.sin(a) * 0.42).toFixed(3),
        ay: +(Math.cos(a) * 0.28).toFixed(3),
        az: +(1.01 + Math.sin(a * 3) * 0.05).toFixed(3),
        gx: +(Math.cos(a) * 18.4).toFixed(2),
        gy: +(Math.sin(a) * 9.5).toFixed(2),
        gz: +(Math.cos(a * 0.5) * 42.0).toFixed(2),
        roll: +(Math.sin(a) * 9.5).toFixed(2),
        pitch: +(Math.cos(a * 2) * 3.8).toFixed(2),
        yaw: +courseDeg.toFixed(2),
        lat: simLat,
        lon: simLon,
        spd: +(29.5 + Math.sin(a * 2) * 7.2).toFixed(1),
        alt: 1412,
        crs: +courseDeg.toFixed(1),
        sats: 11,
        fix: 3,
        sd_ok: 1,
        sd_kb: 164,
        cloud: 48,
        boot: 3
      });
    }, 50);
    return () => clearInterval(id);
  }, [simMode, pushSample]);

  const tareNow = useCallback(() => {
    setTare({
      roll: latestRef.current.roll || 0,
      pitch: latestRef.current.pitch || 0,
      yaw: latestRef.current.yaw || 0
    });
  }, []);

  const loadDayFromSupabase = useCallback(async (dateStr) => {
    try {
      setSupabaseStatus('LOADING DAY...');
      const startIso = `${dateStr}T00:00:00Z`;
      const endIso   = `${dateStr}T23:59:59Z`;
      const url = `https://tapjoxeplcyeohsnrmnl.supabase.co/rest/v1/kart_telemetry?rtc_ts=gte.${startIso}&rtc_ts=lte.${endIso}&order=id.asc&limit=500`;
      const key = 'sb_publishable_m6sJshs7hjbYHlE0lUGx9Q_ZM-wXn6e';
      const resp = await fetch(url, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      if (resp.ok) {
        const rows = await resp.json();
        if (rows && rows.length > 0) {
          const mapped = rows.map((r) => ({
            ts: r.rtc_ts,
            vbat_mv: r.vbat_mv,
            vbat_v: r.vbat_mv / 1000.0,
            solar_mv: r.solar_mv || 0,
            gyro_temp: r.gyro_temp_c,
            rtc_temp: r.rtc_temp_c,
            ax: r.ax, ay: r.ay, az: r.az,
            gx: r.gx, gy: r.gy, gz: r.gz,
            roll: r.roll, pitch: r.pitch, yaw: r.yaw,
            peak_g: r.peak_g, vib: r.vib_rms,
            lat: r.lat, lon: r.lon,
            spd: r.speed_kmh, alt: r.alt_m, crs: r.course_deg,
            sats: r.sats, fix: r.gps_fix,
            sd_ok: 1, sd_kb: r.sd_kb, cloud: r.id, boot: r.session_id || 1
          }));
          setHistoricalRows(mapped);
          setGpsPoints(mapped.map((m) => [m.lat, m.lon]));
          setReplayIndex(0);
          pushSample(mapped[0]);
          setDataSource('HISTORY');
          setSupabaseStatus(`${mapped.length} ROWS`);
        } else {
          setSupabaseStatus('0 ROWS ON DATE');
        }
      }
    } catch (_) {
      setSupabaseStatus('ERR LOADING');
    }
  }, [pushSample]);

  const handleCsvUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;
      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 23) {
          parsed.push({
            ts: cols[0],
            vbat_mv: Number(cols[2]),
            vbat_v: Number(cols[3]),
            solar_mv: Number(cols[4]),
            gyro_temp: Number(cols[5]),
            rtc_temp: Number(cols[6]),
            ax: Number(cols[7]), ay: Number(cols[8]), az: Number(cols[9]),
            gx: Number(cols[10]), gy: Number(cols[11]), gz: Number(cols[12]),
            roll: Number(cols[13]), pitch: Number(cols[14]), yaw: Number(cols[15]),
            peak_g: Number(cols[16]), vib: Number(cols[17]),
            lat: Number(cols[18]), lon: Number(cols[19]),
            spd: Number(cols[20]), alt: Number(cols[21]), crs: Number(cols[22]),
            sats: Number(cols[23] || 8), fix: Number(cols[24] || 3)
          });
        }
      }
      if (parsed.length > 0) {
        setHistoricalRows(parsed);
        setGpsPoints(parsed.map((m) => [m.lat, m.lon]));
        setReplayIndex(0);
        pushSample(parsed[0]);
        setDataSource('HISTORY');
      }
    };
    reader.readAsText(file);
  }, [pushSample]);

  // Replay Scrubbing & Auto-Play Effect
  useEffect(() => {
    if (historicalRows.length > 0 && replayIndex < historicalRows.length) {
      pushSample(historicalRows[replayIndex]);
    }
  }, [replayIndex, historicalRows, pushSample]);

  useEffect(() => {
    if (!isPlaying || historicalRows.length === 0) return;
    const id = setInterval(() => {
      setReplayIndex((idx) => (idx + 1) % historicalRows.length);
    }, 200);
    return () => clearInterval(id);
  }, [isPlaying, historicalRows]);

  return {
    telemetry,
    netRoll: (telemetry.roll || 0) - tare.roll,
    netPitch: (telemetry.pitch || 0) - tare.pitch,
    netYaw: (telemetry.yaw || 0) - tare.yaw,
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
  };
}
