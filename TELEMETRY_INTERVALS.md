# SOTA IoT Electric Delta-Kart Telemetry Documentation

This document explains the telemetry sampling rates, blackbox storage intervals on the **32 GB MicroSD Card**, and cloud synchronization intervals with **Supabase**, engineered to conserve both your **220 MB Movistar SIM Data Plan** and the **500 MB Supabase Free Tier limit**.

---

## 1. Multi-Tier Telemetry Capture Intervals

| Pipeline Stage | Frequency / Interval | Data Destination | Purpose | SIM Data Cost |
| :--- | :--- | :--- | :--- | :--- |
| **IMU & Attitude Fusion Loop** | **30 Hz** (every 33 ms) | RAM & Local WebSockets | 60 FPS 3D Kart rendering, steer angle, live Euler attitude, G-force monitoring | **0 MB** |
| **Local Wi-Fi WebSocket Stream** | **30 Hz** (every 33 ms) | Browser / LAN (Port `81`) | Local dashboard live telemetry streaming | **0 MB** |
| **32 GB MicroSD Blackbox Logger** | **5 Hz** (every 200 ms) | `/logs/kart_session_XXXX.csv` | Full-rate telemetry recording with exact DS3231 timestamps, no data loss | **0 MB** |
| **Multi-GNSS Satellite Polling** | **0.67 Hz** (every 1500 ms) | SIM7672G GNSS Engine | Satellite acquisition, lat/lon coordinate parsing, atomic UTC sync to DS3231 | **0 MB** |
| **Supabase Cloud Sync (Moving)** | **0.33 Hz** (every 3000 ms) | `public.kart_telemetry` | Cloud telemetry updates when vehicle is moving ($G_z > 3.5^\circ$/s, speed $> 1.5$ km/h, or peak $G > 1.15g$) | **~76 bytes/row** |
| **Supabase Cloud Sync (Parked)** | **0.016 Hz** (every 60000 ms) | `public.kart_telemetry` | Idle heartbeat updates when kart is stationary, saving 97% of bandwidth | **~76 bytes/min** |
| **Supabase Session Registration** | **On Boot** (once per power-on) | `public.kart_sessions` | Tracks boot count, SD file link, session start time, and overall metadata | **~120 bytes** |

---

## 2. MicroSD Blackbox Storage (`/logs/kart_session_XXXX.csv`)

### CSV File Structure:
Logged every **200 ms (5 samples per second)** with column headers:
```csv
rtc_ts,uptime_ms,vbat_mv,vbat_v,solar_mv,gyro_temp_c,rtc_temp_c,ax,ay,az,gx,gy,gz,roll,pitch,yaw,peak_g,vib_rms,lat,lon,speed_kmh,alt_m,course_deg,sats,gps_fix
2026-11-08T22:50:09Z,14200,4080,4.080,0,30.2,29.80,0.009,-0.106,1.015,-0.85,-0.30,0.35,-5.97,0.51,14.20,1.02,0.012,4.795200,-75.688600,0.0,1411.0,0.0,9,3
```

### Storage Math for 32 GB:
- 1 row ≈ **160 bytes**.
- 5 rows per second = **800 bytes/sec** = **~2.88 MB per hour**.
- A **32 GB MicroSD Card** holds **>11,000 hours (>1.2 years) of continuous driving data**!

---

## 3. Supabase Cloud Ingestion & Bandwidth Budget

### Row Structure in `public.kart_telemetry`:
- Optimized PostgreSQL types: `SMALLINT` (2 bytes) for voltages/temps/satellites, `REAL` (4 bytes) for IMU/orientation, `DOUBLE PRECISION` for GPS.
- Row footprint in PostgreSQL: **~76 bytes**.

### Data Consumption & 220 MB SIM Lifetime:
- While driving, updates are sent every **3 seconds** (each payload is ~280 bytes on the wire).
- **1 hour of continuous driving** = 1,200 requests ≈ **336 KB**.
- Your **220 MB Movistar Plan** provides **>650 hours of active driving telemetry**!
- When parked, the 60-second heartbeat uses only **~16 KB per hour**.

### 500 MB Free Tier Protection:
- The automatic trigger in `supabase/schema.sql` (`enforce_telemetry_storage_cap()`) maintains a rolling cap of **2,500,000 rows (~220 MB)**.
- If storage ever approaches this threshold, it automatically prunes the oldest 50,000 rows, ensuring your Supabase Free Tier **never exceeds 500 MB** and never locks up.
