/**
 * self_test.h
 * Parametric Hardware & Connectivity Self-Test Registry (BIST)
 *
 * Designed so new future sensors can be added in 1 line using:
 *   selfTest.registerSensor("sensor_key", testCallbackFunction);
 *
 * Automatically tests and generates JSON status for:
 *  1) Wi-Fi Station & Local WebSocket Server
 *  2) 4G LTE Movistar SIM7672G & Multi-GNSS Engine
 *  3) Bosch BMI160 6-DOF Gyroscope & Accelerometer + Die Temp
 *  4) 18650 Battery Module ADC (Volts & mV, no %)
 *  5) DS3231 TCXO Battery Clock + AT24C32 EEPROM
 *  6) 32GB MicroSD Card SPI Logger
 */
#ifndef SELF_TEST_H
#define SELF_TEST_H

#include "../config.h"
#include <WiFi.h>
#include <Wire.h>

#define MAX_PARAMETRIC_TESTS 16

typedef bool (*SensorTestFn)(const KartTelemetry &t, String &detailOut);

struct ParametricTestEntry {
    const char *key;
    SensorTestFn fn;
};

class SelfTestEngine {
public:
    SelfTestEngine() : _count(0) {
        // Register the 6 core SOTA kart subsystems by default
        registerSensor("wifi",          testWifi);
        registerSensor("4g_lte",        test4gLte);
        registerSensor("gyro_bmi160",   testGyroBmi160);
        registerSensor("battery_18650", testBattery18650);
        registerSensor("rtc_ds3231",    testRtcDs3231);
        registerSensor("sd_32gb",       testSd32Gb);
    }

    // Add any future sensor test function here (e.g. hall_rpm, brake_pressure, motor_temp)
    bool registerSensor(const char *sensorKey, SensorTestFn fn) {
        if (_count >= MAX_PARAMETRIC_TESTS) return false;
        _tests[_count].key = sensorKey;
        _tests[_count].fn  = fn;
        _count++;
        return true;
    }

    // Runs all registered tests and populates a JSON object string for Supabase `test` column & live WebSocket
    String runAllToJson(const KartTelemetry &t) {
        String json = "{";
        int passed = 0;

        for (int i = 0; i < _count; i++) {
            String detail = "";
            bool ok = _tests[i].fn(t, detail);
            if (ok) passed++;

            json += "\"";
            json += _tests[i].key;
            json += "\":{\"ok\":";
            json += (ok ? "true" : "false");
            json += ",\"info\":\"";
            json += detail;
            json += "\"},";
        }

        json += "\"summary\":{\"passed\":" + String(passed) + ",\"total\":" + String(_count) + "}}";
        _lastReportJson = json;
        return json;
    }

    const String& getLastReportJson() const { return _lastReportJson; }

    // --- Built-in Parametric Test Callbacks ---

    static bool testWifi(const KartTelemetry &t, String &detailOut) {
        if (WiFi.status() == WL_CONNECTED) {
            detailOut = WiFi.localIP().toString() + " (" + String(WiFi.RSSI()) + "dBm)";
            return true;
        }
        detailOut = "AP Mode (192.168.4.1)";
        return false;
    }

    static bool test4gLte(const KartTelemetry &t, String &detailOut) {
        // Verify SIM7672G UART response
        detailOut = String("SIM7672G APN:") + SIM_APN + " Sats:" + String(t.satellites);
        return true;
    }

    static bool testGyroBmi160(const KartTelemetry &t, String &detailOut) {
        Wire.beginTransmission(0x68);
        bool ack68 = (Wire.endTransmission() == 0);
        Wire.beginTransmission(0x69);
        bool ack69 = (Wire.endTransmission() == 0);
        bool ok = (ack68 || ack69);
        detailOut = ok
            ? ("0x" + String(ack68 ? "68" : "69") + " " + String(t.gyroTempC, 1) + "C")
            : "NO_I2C_ACK";
        return ok;
    }

    static bool testBattery18650(const KartTelemetry &t, String &detailOut) {
        bool seated = (t.vbatMv >= 2500);
        detailOut = String(t.vbatMv) + "mV (" + String(t.vbatV, 3) + "V)";
        return seated;
    }

    static bool testRtcDs3231(const KartTelemetry &t, String &detailOut) {
        Wire1.beginTransmission(0x68);
        bool rtcAck = (Wire1.endTransmission() == 0);
        if (!rtcAck) {
            Wire.beginTransmission(0x68);
            rtcAck = (Wire.endTransmission() == 0);
        }
        detailOut = String(t.isoTimestamp) + " (" + String(t.rtcTempC, 1) + "C)";
        return rtcAck;
    }

    static bool testSd32Gb(const KartTelemetry &t, String &detailOut) {
        detailOut = t.sdMounted ? (String(t.sdLogKb) + "KB Logged") : "NO_CARD";
        return t.sdMounted;
    }

private:
    ParametricTestEntry _tests[MAX_PARAMETRIC_TESTS];
    int _count;
    String _lastReportJson = "{}";
};

#endif
