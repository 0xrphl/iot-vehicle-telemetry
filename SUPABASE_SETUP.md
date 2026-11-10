# Supabase Configuration & Setup Guide

This guide explains how to set up your free **Supabase** project to receive live telemetry from the LilyGO T-SIM7672G over **4G LTE (Movistar SIM)** or **Wi-Fi**, while keeping storage well within the **500 MB Free Tier limit**.

---

## 1. Get Your Project Credentials from Supabase

1. Go to your Supabase Dashboard: [https://app.supabase.com/](https://app.supabase.com/)
2. Open your project.
3. Click on the **Settings (gear icon)** at the bottom of the left sidebar.
4. Click on **API** (under *Project Settings*):
   - **Project URL**: Copy the URL (e.g. `https://xyzabcdefg.supabase.co`).
   - **Project API Keys**: Copy the `anon` / `public` key.
5. In your project directory, open `.env` and fill in:
   ```env
   SUPABASE_URL="https://xyzabcdefg.supabase.co"
   SUPABASE_ANON_KEY="eyJhbGciOi..."
   SUPABASE_DB_PASSWORD="Fourier98*ingdatosutp2026"
   ```
6. Also paste your `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `main/config.h`:
   ```cpp
   #define SUPABASE_URL      "https://xyzabcdefg.supabase.co"
   #define SUPABASE_ANON_KEY "eyJhbGciOi..."
   ```

---

## 2. Execute the Database Schema in Supabase

1. In your Supabase project, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Copy the entire contents of `supabase/schema.sql`:
   (`c:\Users\0xrph\Downloads\iot_vehicle_code\supabase\schema.sql`)
4. Paste it into the SQL Editor and click **Run** (green button).

### What this schema sets up:
- **`kart_sessions`**: Tracks boot count, SD card log file name, total distance, max G-forces, and start times.
- **`kart_telemetry`**: Ultra-compact ~76 bytes/row table storing:
  - Exact DS3231 / GNSS UTC timestamp (`rtc_ts`).
  - **18650 Battery voltage (`vbat_mv` and `vbat_v`) & solar `mV`** (*no percentage*).
  - **BMI160 Gyro die temperature (`gyro_temp_c`) & DS3231 RTC temperature (`rtc_temp_c`)**.
  - **6-DOF Gyro ($G_x, G_y, G_z$) & Accelerometer ($A_x, A_y, A_z$)** + Peak G-force & Vibration RMS.
  - **3D Kart Orientation** (Roll, Pitch, Yaw).
  - **SIM7672G Multi-GNSS Coordinates** (Latitude, Longitude, Speed km/h, Altitude m, Course, Satellites).
  - **Storage & Diagnostics** (MicroSD log KB, Wi-Fi / LTE RSSI, network mode).
- **Automatic 500 MB Free-Tier Guardrail**:
  A PostgreSQL trigger automatically prunes rows if the table exceeds **2,500,000 rows (~220 MB)**, guaranteeing your database **never exceeds the 500 MB limit** and never gets paused! All full-rate history remains safely archived on your **32 GB MicroSD card**.
- **Supabase Realtime Enabled**:
  `supabase_realtime` publication is enabled on `kart_telemetry` so any dashboard can subscribe to live GPS coordinates and 3D kart movements worldwide in real time.

---

## 3. Verify Tables & Live Data Ingestion

1. Click on **Table Editor** in the left sidebar.
2. You will see:
   - `kart_sessions`
   - `kart_telemetry`
   - `v_kart_live` (View)
3. Once the LilyGO board boots with the Movistar SIM card or Wi-Fi, telemetry packets will appear in `kart_telemetry`!
