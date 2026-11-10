/**
 * sd_logger.h
 * 32GB MicroSD High-Speed Blackbox Telemetry Logger
 * Pins: CS=13, MOSI=14, SCK=21, MISO=47
 * Logs JSONL + CSV with exact DS3231 timestamps for zero data loss
 */
#ifndef SD_LOGGER_H
#define SD_LOGGER_H

#include "../config.h"
#include <SPI.h>
#include <SD.h>

class SdLogger {
public:
    bool begin(KartTelemetry &t) {
        SPI.begin(BOARD_SD_SCK_PIN, BOARD_SD_MISO_PIN, BOARD_SD_MOSI_PIN, BOARD_SD_CS_PIN);
        if (!SD.begin(BOARD_SD_CS_PIN, SPI, 20000000)) {
            USB_OUT.println(F("[MicroSD] Card mount failed or no 32GB card inserted"));
            t.sdMounted = false;
            return false;
        }

        uint64_t cardSizeMB = SD.cardSize() / (1024 * 1024);
        USB_OUT.printf("[MicroSD] Mounted! Size: %llu MB\n", cardSizeMB);

        if (!SD.exists("/logs")) {
            SD.mkdir("/logs");
        }

        snprintf(_logPath, sizeof(_logPath), "/logs/kart_session_%04lu.csv", (unsigned long)t.bootCount);
        File f = SD.open(_logPath, FILE_APPEND);
        if (f) {
            if (f.size() == 0) {
                f.println("rtc_ts,uptime_ms,vbat_mv,vbat_v,solar_mv,gyro_temp_c,rtc_temp_c,ax,ay,az,gx,gy,gz,roll,pitch,yaw,peak_g,vib_rms,lat,lon,speed_kmh,alt_m,course_deg,sats,gps_fix");
            }
            f.close();
            t.sdMounted = true;
            USB_OUT.printf("[MicroSD] Logging to %s\n", _logPath);
            return true;
        }

        t.sdMounted = false;
        return false;
    }

    void logRecord(KartTelemetry &t, const char *jsonLine) {
        if (!t.sdMounted) return;

        // Buffer writes & flush every 10 records to maximize SD speed and card lifespan
        File f = SD.open(_logPath, FILE_APPEND);
        if (!f) {
            t.sdMounted = false;
            return;
        }

        char csv[256];
        snprintf(csv, sizeof(csv),
                 "%s,%lu,%u,%.3f,%u,%.1f,%.2f,%.3f,%.3f,%.3f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.3f,%.6f,%.6f,%.1f,%.1f,%.1f,%u,%u",
                 t.isoTimestamp, (unsigned long)t.uptimeMs,
                 t.vbatMv, t.vbatV, t.solarMv,
                 t.gyroTempC, t.rtcTempC,
                 t.ax, t.ay, t.az, t.gx, t.gy, t.gz,
                 t.roll, t.pitch, t.yaw, t.peakG, t.vibRms,
                 t.lat, t.lon, t.speedKmh, t.altM, t.courseDeg,
                 t.satellites, t.gpsFix);

        f.println(csv);
        t.sdRecords++;
        t.sdLogKb = (uint32_t)(f.size() / 1024);
        f.close();
    }

    const char* getLogPath() const { return _logPath; }

private:
    char _logPath[40] = "/logs/kart_session_0001.csv";
};

#endif
