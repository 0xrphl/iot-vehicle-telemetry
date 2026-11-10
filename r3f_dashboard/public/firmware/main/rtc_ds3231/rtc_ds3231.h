/**
 * rtc_ds3231.h
 * DS3231 Precision TCXO Real-Time Clock (0x68) + AT24C32 32Kbit EEPROM (0x57)
 */
#ifndef RTC_DS3231_H
#define RTC_DS3231_H

#include "../config.h"
#include <Wire.h>

#define DS3231_ADDR         0x68
#define AT24C32_ADDR        0x57
#define DS3231_REG_TIME     0x00
#define DS3231_REG_CONTROL  0x0E
#define DS3231_REG_STATUS   0x0F
#define DS3231_REG_TEMP     0x11

class RtcDs3231 {
public:
    bool begin(KartTelemetry &t) {
        pinMode(DS3231_SDA_PIN, INPUT_PULLUP);
        pinMode(DS3231_SCL_PIN, INPUT_PULLUP);
        delay(10);

        // Try primary Wire1 configuration (SDA=42, SCL=41 @ 100 kHz)
        Wire1.begin(DS3231_SDA_PIN, DS3231_SCL_PIN, 100000);
        if (probeBus(&Wire1, DS3231_ADDR)) {
            _bus = &Wire1;
            _ready = true;
            USB_OUT.printf("[DS3231] Found on Wire1 (SDA=%d, SCL=%d @ 100kHz)\n", DS3231_SDA_PIN, DS3231_SCL_PIN);
        } else {
            // Auto-fallback 1: Check if SDA and SCL were swapped (SDA=41, SCL=42)
            Wire1.end();
            Wire1.begin(DS3231_SCL_PIN, DS3231_SDA_PIN, 100000);
            if (probeBus(&Wire1, DS3231_ADDR)) {
                _bus = &Wire1;
                _ready = true;
                USB_OUT.println(F("[DS3231] Found on Wire1 with SWAPPED pins (SDA=41, SCL=42)"));
            } else {
                // Auto-fallback 2: Check if connected to Wire (GPIO 1 & 2) in shared bus mode
                if (probeBus(&Wire, DS3231_ADDR) || probeBus(&Wire, AT24C32_ADDR)) {
                    _bus = &Wire;
                    _ready = true;
                    USB_OUT.println(F("[DS3231] Found on Wire bus (IO1/IO2 shared)"));
                } else {
                    _ready = false;
                    USB_OUT.println(F("[DS3231] Not responding. Using internal ESP32 RTC fallback"));
                }
            }
        }

        if (_ready) {
            uint8_t status = readReg(DS3231_REG_STATUS);
            if (status & 0x80) writeReg(DS3231_REG_STATUS, status & ~0x80);
            t.bootCount = readBootCounter() + 1;
            writeBootCounter(t.bootCount);
            USB_OUT.printf("[AT24C32] Persistent Boot #%lu\n", (unsigned long)t.bootCount);
        } else {
            t.bootCount = 1;
        }
        update(t);
        return _ready;
    }

    void update(KartTelemetry &t) {
        t.uptimeMs = millis();
        if (!_ready) {
            uint32_t totalSec = t.uptimeMs / 1000;
            snprintf(t.isoTimestamp, sizeof(t.isoTimestamp), "2026-11-08T%02u:%02u:%02uZ",
                     (uint8_t)((totalSec / 3600) % 24), (uint8_t)((totalSec / 60) % 60), (uint8_t)(totalSec % 60));
            if (t.rtcTempC == 0.0f) t.rtcTempC = t.gyroTempC;
            return;
        }

        uint8_t buf[7];
        if (readBytes(DS3231_ADDR, DS3231_REG_TIME, buf, 7)) {
            uint8_t sec   = bcd2dec(buf[0] & 0x7F);
            uint8_t min   = bcd2dec(buf[1]);
            uint8_t hour  = bcd2dec(buf[2] & 0x3F);
            uint8_t day   = bcd2dec(buf[4]);
            uint8_t month = bcd2dec(buf[5] & 0x1F);
            uint16_t year = 2000 + bcd2dec(buf[6]);
            if (year < 2025 || year > 2035) year = 2026;
            if (month < 1 || month > 12) month = 11;
            if (day < 1 || day > 31) day = 8;

            snprintf(t.isoTimestamp, sizeof(t.isoTimestamp),
                     "%04u-%02u-%02uT%02u:%02u:%02uZ", year, month, day, hour, min, sec);
        }

        uint8_t tBuf[2];
        if (readBytes(DS3231_ADDR, DS3231_REG_TEMP, tBuf, 2)) {
            int8_t msb = (int8_t)tBuf[0];
            uint8_t frac = (tBuf[1] >> 6) & 0x03;
            t.rtcTempC = (float)msb + ((float)frac * 0.25f);
        }
    }

    void syncFromGps(uint16_t year, uint8_t month, uint8_t day, uint8_t hour, uint8_t min, uint8_t sec) {
        if (!_ready || _gpsSynced || year < 2025) return;
        uint8_t buf[7] = {
            dec2bcd(sec), dec2bcd(min), dec2bcd(hour), 1,
            dec2bcd(day), dec2bcd(month), dec2bcd(year % 100)
        };
        _bus->beginTransmission(DS3231_ADDR);
        _bus->write(DS3231_REG_TIME);
        for (int i = 0; i < 7; i++) _bus->write(buf[i]);
        _bus->endTransmission();
        _gpsSynced = true;
    }

private:
    TwoWire *_bus = &Wire1;
    bool _ready = false;
    bool _gpsSynced = false;

    static uint8_t bcd2dec(uint8_t v) { return ((v / 16) * 10) + (v % 16); }
    static uint8_t dec2bcd(uint8_t v) { return ((v / 10) * 16) + (v % 10); }

    bool probeBus(TwoWire *w, uint8_t addr) {
        w->beginTransmission(addr);
        return (w->endTransmission() == 0);
    }

    uint8_t readReg(uint8_t reg) {
        uint8_t v = 0;
        readBytes(DS3231_ADDR, reg, &v, 1);
        return v;
    }

    void writeReg(uint8_t reg, uint8_t v) {
        _bus->beginTransmission(DS3231_ADDR);
        _bus->write(reg);
        _bus->write(v);
        _bus->endTransmission();
    }

    bool readBytes(uint8_t dev, uint8_t reg, uint8_t *buf, size_t len) {
        _bus->beginTransmission(dev);
        _bus->write(reg);
        if (_bus->endTransmission(false) != 0) return false;
        if (_bus->requestFrom(dev, (uint8_t)len) != len) return false;
        for (size_t i = 0; i < len; i++) buf[i] = _bus->read();
        return true;
    }

    uint32_t readBootCounter() {
        if (!probeBus(_bus, AT24C32_ADDR)) return 0;
        _bus->beginTransmission(AT24C32_ADDR);
        _bus->write(0x00);
        _bus->write(0x00);
        if (_bus->endTransmission(false) != 0) return 0;
        if (_bus->requestFrom((uint8_t)AT24C32_ADDR, (uint8_t)5) != 5) return 0;
        if (_bus->read() != 0xA5) return 0;
        uint32_t val = 0;
        for (int i = 0; i < 4; i++) val = (val << 8) | _bus->read();
        return val;
    }

    void writeBootCounter(uint32_t val) {
        if (!probeBus(_bus, AT24C32_ADDR)) return;
        _bus->beginTransmission(AT24C32_ADDR);
        _bus->write(0x00);
        _bus->write(0x00);
        _bus->write(0xA5);
        _bus->write((val >> 24) & 0xFF);
        _bus->write((val >> 16) & 0xFF);
        _bus->write((val >> 8) & 0xFF);
        _bus->write(val & 0xFF);
        _bus->endTransmission();
        delay(10);
    }
};

#endif

