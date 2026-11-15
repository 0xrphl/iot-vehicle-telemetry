-- ============================================================================
-- PENDING SUPABASE SQL QUERIES: ADD SHT31 + DS18B20 + GNSS QUALITY COLUMNS
-- Database: https://tapjoxeplcyeohsnrmnl.supabase.co
-- Safe for existing production data (uses `IF NOT EXISTS` + `DEFAULT NULL`)
-- ============================================================================

ALTER TABLE public.kart_sessions
    ADD COLUMN IF NOT EXISTS test        JSONB DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS calibration JSONB DEFAULT '{}'::JSONB;

ALTER TABLE public.kart_telemetry
    ADD COLUMN IF NOT EXISTS sht_temp_c    REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS sht_hum_rh    REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS dew_point_c   REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS hdop          REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS sats_view     SMALLINT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ds18_ctrl_c   REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ds18_motor_c  REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ina_bus_v     REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ina_current_a REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ina_power_w   REAL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ina_energy_wh REAL DEFAULT NULL;

CREATE OR REPLACE VIEW public.v_kart_live AS
SELECT
    id, session_id, rtc_ts, vbat_mv,
    ROUND((vbat_mv / 1000.0)::NUMERIC, 3) AS vbat_v,
    solar_mv, gyro_temp_c, rtc_temp_c,
    ax, ay, az, gx, gy, gz,
    roll, pitch, yaw, peak_g, vib_rms,
    lat, lon, speed_kmh, alt_m, course_deg, sats, gps_fix,
    sd_kb, rssi, net_mode,
    sht_temp_c, sht_hum_rh, dew_point_c, hdop, sats_view,
    ds18_ctrl_c, ds18_motor_c,
    ina_bus_v, ina_current_a, ina_power_w, ina_energy_wh
FROM public.kart_telemetry
ORDER BY id DESC
LIMIT 100;

NOTIFY pgrst, 'reload schema';
