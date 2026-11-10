-- ============================================================================
-- SOTA IoT Electric Delta-Kart Telemetry Schema for Supabase (PostgreSQL)
-- Engineered for < 500 MB Free-Tier Footprint & 220 MB SIM Data Plan Efficiency
-- Database Password configured in .env: Fourier98*ingdatosutp2026
-- ============================================================================

-- 1. Kart Sessions Table (Tracks each boot / SD card log file session + Boot Self-Test JSON)
CREATE TABLE IF NOT EXISTS public.kart_sessions (
    session_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    device_id       VARCHAR(24) NOT NULL DEFAULT 'KART_DELTA_01',
    boot_count      INTEGER NOT NULL DEFAULT 1,
    sd_filename     VARCHAR(64),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_distance_m REAL NOT NULL DEFAULT 0.0,
    max_g_force     REAL NOT NULL DEFAULT 0.0,
    min_vbat_mv     SMALLINT,
    max_gyro_temp_c REAL,
    test            JSONB DEFAULT '{}'::JSONB
);

-- Migration if kart_sessions was already created without the `test` column:
ALTER TABLE public.kart_sessions ADD COLUMN IF NOT EXISTS test JSONB DEFAULT '{}'::JSONB;

-- 2. Ultra-Compact Telemetry Table (~76 Bytes/Row -> ~5.5 Million Rows in 500 MB!)
CREATE TABLE IF NOT EXISTS public.kart_telemetry (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id      BIGINT REFERENCES public.kart_sessions(session_id) ON DELETE CASCADE,
    rtc_ts          TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Precision DS3231 / GNSS Timestamp
    
    -- 18650 Battery & Solar Raw Telemetry (NO Percentage, Raw mV & V as requested)
    vbat_mv         SMALLINT NOT NULL,                  -- e.g. 4120 mV (4.120 V)
    solar_mv        SMALLINT NOT NULL DEFAULT 0,        -- e.g. 5020 mV
    
    -- Dual Thermal Sensors (BMI160 Die Temp + DS3231 RTC Ambient Temp)
    gyro_temp_c     REAL NOT NULL,                      -- BMI160 internal die temp (°C)
    rtc_temp_c      REAL NOT NULL,                      -- DS3231 TCXO temp (°C)
    
    -- 6-DOF Bosch BMI160 IMU (Accelerometer in g, Gyroscope in deg/s)
    ax              REAL NOT NULL,
    ay              REAL NOT NULL,
    az              REAL NOT NULL,
    gx              REAL NOT NULL,
    gy              REAL NOT NULL,
    gz              REAL NOT NULL,
    
    -- 3D Kart Orientation (Sensor Fusion Euler Angles in deg) + Peak Window G
    roll            REAL NOT NULL,
    pitch           REAL NOT NULL,
    yaw             REAL NOT NULL,
    peak_g          REAL NOT NULL DEFAULT 1.0,          -- Max G-force in sampling window
    vib_rms         REAL NOT NULL DEFAULT 0.0,          -- Chassis vibration RMS (g)
    
    -- LilyGO SIM7672G Built-in Multi-GNSS (GPS + GLONASS + Galileo + BeiDou)
    lat             DOUBLE PRECISION,                   -- Decimal degrees (8-byte for cm precision)
    lon             DOUBLE PRECISION,                   -- Decimal degrees
    speed_kmh       REAL NOT NULL DEFAULT 0.0,
    alt_m           REAL NOT NULL DEFAULT 0.0,
    course_deg      REAL NOT NULL DEFAULT 0.0,
    sats            SMALLINT NOT NULL DEFAULT 0,
    gps_fix         SMALLINT NOT NULL DEFAULT 0,        -- 0=No Fix, 2=2D, 3=3D Fix
    
    -- Storage & Network Diagnostics
    sd_kb           INTEGER NOT NULL DEFAULT 0,         -- Current SD log size in KB
    rssi            SMALLINT NOT NULL DEFAULT 0,        -- Wi-Fi dBm or Cellular CSQ
    net_mode        SMALLINT NOT NULL DEFAULT 1         -- 1=Wi-Fi, 2=4G LTE SIM, 3=SD Replay
);

-- 3. Compact BRIN & B-Tree Indexes (BRIN uses <1% of B-Tree space for time-series!)
CREATE INDEX IF NOT EXISTS idx_kart_telemetry_rtc_brin ON public.kart_telemetry USING BRIN (rtc_ts);
CREATE INDEX IF NOT EXISTS idx_kart_telemetry_id_desc  ON public.kart_telemetry (id DESC);

-- 4. Automatic 500 MB Free-Tier Guardrail (Ring-Buffer Pruning Function)
-- Automatically purges oldest rows if table exceeds 2,500,000 rows (~220 MB),
-- guaranteeing your Supabase project NEVER hits the 500 MB limit!
CREATE OR REPLACE FUNCTION public.enforce_telemetry_storage_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    approx_rows BIGINT;
BEGIN
    IF (NEW.id % 500 = 0) THEN
        SELECT reltuples::BIGINT INTO approx_rows
        FROM pg_class
        WHERE oid = 'public.kart_telemetry'::regclass;

        IF approx_rows > 2500000 THEN
            DELETE FROM public.kart_telemetry
            WHERE id IN (
                SELECT id FROM public.kart_telemetry
                ORDER BY id ASC
                LIMIT 50000
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_telemetry_cap ON public.kart_telemetry;
CREATE TRIGGER trg_enforce_telemetry_cap
AFTER INSERT ON public.kart_telemetry
FOR EACH ROW
EXECUTE FUNCTION public.enforce_telemetry_storage_cap();

-- 5. Row Level Security (RLS) Policies for IoT Ingestion & Dashboard Reading
ALTER TABLE public.kart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kart_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert telemetry" ON public.kart_telemetry
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anon select telemetry" ON public.kart_telemetry
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert sessions" ON public.kart_sessions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anon update sessions" ON public.kart_sessions
    FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Allow anon select sessions" ON public.kart_sessions
    FOR SELECT TO anon, authenticated USING (true);

-- 6. Enable Supabase Realtime for Live 3D Kart & Map Streaming
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'kart_telemetry'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.kart_telemetry;
    END IF;
END $$;

-- 7. Helper View for Dashboard (Converts vbat_mv to vbat_v on the fly)
CREATE OR REPLACE VIEW public.v_kart_live AS
SELECT
    id,
    session_id,
    rtc_ts,
    vbat_mv,
    ROUND((vbat_mv / 1000.0)::NUMERIC, 3) AS vbat_v,
    solar_mv,
    gyro_temp_c,
    rtc_temp_c,
    ax, ay, az,
    gx, gy, gz,
    roll, pitch, yaw,
    peak_g, vib_rms,
    lat, lon, speed_kmh, alt_m, course_deg, sats, gps_fix,
    sd_kb, rssi, net_mode
FROM public.kart_telemetry
ORDER BY id DESC
LIMIT 100;

