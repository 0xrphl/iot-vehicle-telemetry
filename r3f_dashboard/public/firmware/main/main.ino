/**
 * main.ino
 * SOTA IoT Electric Delta-Kart Master Firmware
 * Hardware:
 *  - LilyGO T-SIM7672G V1.1 (ESP32-S3-WROOM-1 MCN16R8)
 *  - Bosch BMI160 6-DOF IMU (SDA=IO1, SCL=IO2 @ 400kHz)
 *  - DS3231 TCXO RTC + AT24C32 EEPROM (SDA=IO42, SCL=IO41 @ 400kHz)
 *  - 32GB MicroSD Blackbox Logger (CS=13, MOSI=14, SCK=21, MISO=47)
 *  - 18650 Battery Voltage Monitor in V & mV (IO4) + Solar (IO5)
 *  - SIM7672G Built-in Multi-GNSS (GPS/GLONASS/Galileo/BeiDou) + 4G LTE (220MB Plan Saver)
 *
 * Modular Architecture:
 *  - config.h
 *  - imu_bmi160/imu_bmi160.h
 *  - rtc_ds3231/rtc_ds3231.h
 *  - gps_sim7672/gps_sim7672.h
 *  - sd_logger/sd_logger.h
 *  - power_18650/power_18650.h
 *  - telemetry_sync/telemetry_sync.h
 */

#include "config.h"
#include "imu_bmi160/imu_bmi160.h"
#include "rtc_ds3231/rtc_ds3231.h"
#include "gps_sim7672/gps_sim7672.h"
#include "sd_logger/sd_logger.h"
#include "power_18650/power_18650.h"
#include "self_test/self_test.h"
#include "telemetry_sync/telemetry_sync.h"

static KartTelemetry state = {
    "2026-11-08T00:00:00Z", 0,
    3950, 3.950f, 0, 0.0f,
    29.5f, 29.0f,
    0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f,
    0.0f, 0.0f, 0.0f, 1.0f, 0.0f,
    4.81333, -75.69611, 0.0f, 1411.0f, 0.0f, 0, 0,
    false, 0, 0, 1, -50, 1, 0, 0
};

ImuBmi160      imu;
RtcDs3231      rtc;
GpsSim7672     gpsModem;
SdLogger       sdCard;
Power18650     battery;
SelfTestEngine selfTest;
TelemetrySync  netSync;

static unsigned long lastImuMs = 0;
static unsigned long lastGpsMs = 0;
static unsigned long lastSdMs  = 0;

void setup() {
    pinMode(BOARD_LED_PIN, OUTPUT);
    digitalWrite(BOARD_LED_PIN, HIGH);

    Serial.begin(115200);
#if defined(ARDUINO_USB_MODE) && (ARDUINO_USB_MODE == 1) && (!defined(ARDUINO_USB_CDC_ON_BOOT) || (ARDUINO_USB_CDC_ON_BOOT == 0))
    USBSerial.begin(115200);
#endif
    delay(800);

    USB_OUT.println(F("\n======================================================================"));
    USB_OUT.println(F("  SOTA ELECTRIC DELTA-KART TELEMETRY NODE (LilyGO T-SIM7672G V1.1)"));
    USB_OUT.println(F("  BMI160 IMU + DS3231/AT24C32 + 32GB SD + 18650 + 4G LTE / GNSS"));
    USB_OUT.println(F("======================================================================"));

    // 1. Initialize 18650 Battery & Solar ADC
    battery.begin();
    battery.update(state);
    USB_OUT.printf("[18650] VBAT: %u mV (%.3f V) | Solar: %u mV\n", state.vbatMv, state.vbatV, state.solarMv);

    // 2. Initialize Bosch BMI160 6-DOF IMU
    imu.begin();
    imu.update(state);

    // 3. Initialize DS3231 Precision RTC + AT24C32 EEPROM
    rtc.begin(state);

    // 4. Initialize 32GB MicroSD Blackbox Logger
    sdCard.begin(state);

    // 5. Initialize SIM7672G 4G LTE + Multi-GNSS Engine
    gpsModem.begin();

    // 6. Initialize Wi-Fi + Local WebSocket Server
    netSync.begin();

    // 7. Run Parametric Boot Self-Test (Wi-Fi, 4G, BMI160 Gyro, 18650 Battery, DS3231 RTC, 32GB SD)
    String testReportJson = selfTest.runAllToJson(state);
    USB_OUT.print(F("[SELF-TEST JSON] "));
    USB_OUT.println(testReportJson);

    // 8. Register Boot Session & Self-Test JSON in Supabase `kart_sessions.test` (via Wi-Fi or 4G)
    netSync.registerCloudSession(state, testReportJson, gpsModem);
}

void loop() {
    netSync.loop();
    unsigned long now = millis();

    // 1. High-Frequency 30 Hz IMU & Local WebSocket Telemetry Loop (Every 33 ms)
    if (now - lastImuMs >= 33) {
        lastImuMs = now;

        imu.update(state);
        battery.update(state);
        rtc.update(state);

        char jsonBuf[512];
        netSync.broadcastLocal(state, jsonBuf, sizeof(jsonBuf));

        // 2. Log to 32GB MicroSD Card at 5 Hz (Every 200 ms) for clean multi-hour blackbox files
        if (now - lastSdMs >= 200) {
            lastSdMs = now;
            sdCard.logRecord(state, jsonBuf);
        }

        // 3. Adaptive Supabase Cloud Sync (3s when moving, 60s when idle)
        if (netSync.syncToSupabaseIfDue(state, gpsModem)) {
            imu.resetWindowPeak(state);
        }
    }

    // 4. Poll SIM7672G Multi-GNSS Satellite Position (Every 1500 ms)
    if (now - lastGpsMs >= 1500) {
        lastGpsMs = now;
        gpsModem.poll(state, rtc);
    }
}
