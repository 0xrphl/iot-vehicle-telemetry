/**
 * imu_bmi160.h
 * Bosch BMI160 6-Axis Inertial Measurement Unit Driver & Kart Dynamics Engine
 * Features:
 *  - 6-DOF Gyroscope (deg/s) + Accelerometer (g) at 400 kHz I2C
 *  - Precision Internal Die Temperature (°C)
 *  - Complementary Attitude Fusion (Roll, Pitch, Yaw)
 *  - Peak G-Force Window Detector & Chassis Vibration RMS Analyzer
 */
#ifndef IMU_BMI160_H
#define IMU_BMI160_H

#include "../config.h"
#include <Wire.h>

#define BMI160_ADDR_LOW         0x68
#define BMI160_ADDR_HIGH        0x69
#define BMI160_REG_CHIP_ID      0x00
#define BMI160_REG_PMU_STATUS   0x03
#define BMI160_REG_GYR_X_LSB    0x0C
#define BMI160_REG_ACC_X_LSB    0x12
#define BMI160_REG_TEMP_LSB     0x20
#define BMI160_REG_ACC_CONF     0x40
#define BMI160_REG_ACC_RANGE    0x41
#define BMI160_REG_GYR_CONF     0x42
#define BMI160_REG_GYR_RANGE    0x43
#define BMI160_REG_CMD          0x7E

#define BMI160_CHIP_ID_VAL      0xD8
#define BMI160_CMD_SOFT_RESET   0xB6
#define BMI160_CMD_ACC_NORMAL   0x11
#define BMI160_CMD_GYR_NORMAL   0x15

#define ACCEL_LSB_PER_G         16384.0f  // +/- 2g range
#define GYRO_LSB_PER_DPS        131.2f    // +/- 250 deg/s range

class ImuBmi160 {
public:
    bool begin() {
        if (!_wireInitialized) {
            Wire.begin(BMI160_SDA_PIN, BMI160_SCL_PIN, I2C_FREQ_HZ);
            _wireInitialized = true;
        }
        _addr = scanAddress();
        if (_addr == 0) {
            _ready = false;
            return false;
        }

        writeReg(BMI160_REG_CMD, BMI160_CMD_SOFT_RESET);
        delay(100);
        writeReg(BMI160_REG_CMD, BMI160_CMD_ACC_NORMAL);
        delay(50);
        writeReg(BMI160_REG_CMD, BMI160_CMD_GYR_NORMAL);
        delay(100);

        // 100Hz ODR, Normal Bandwidth (0x28); Accel +/-2g (0x03); Gyro +/-250 dps (0x03)
        writeReg(BMI160_REG_ACC_CONF, 0x28);
        writeReg(BMI160_REG_ACC_RANGE, 0x03);
        writeReg(BMI160_REG_GYR_CONF, 0x28);
        writeReg(BMI160_REG_GYR_RANGE, 0x03);
        delay(20);

        _lastMicros = micros();
        _ready = true;
        USB_OUT.printf("[BMI160] Ready at 0x%02X on SDA=%d, SCL=%d\n", _addr, BMI160_SDA_PIN, BMI160_SCL_PIN);
        return true;
    }

    bool update(KartTelemetry &t) {
        if (!_ready) {
            unsigned long now = millis();
            if (now - _lastRetryMs < 2000) return false;
            _lastRetryMs = now;
            _ready = begin();
            if (!_ready) return false;
        }

        uint8_t raw[12] = {0};
        if (!readRegs(BMI160_REG_GYR_X_LSB, raw, 12)) {
            _ready = false;
            return false;
        }

        int16_t rawGx = (int16_t)((raw[1] << 8) | raw[0]);
        int16_t rawGy = (int16_t)((raw[3] << 8) | raw[2]);
        int16_t rawGz = (int16_t)((raw[5] << 8) | raw[4]);
        int16_t rawAx = (int16_t)((raw[7] << 8) | raw[6]);
        int16_t rawAy = (int16_t)((raw[9] << 8) | raw[8]);
        int16_t rawAz = (int16_t)((raw[11] << 8) | raw[10]);

        t.ax = (float)rawAx / ACCEL_LSB_PER_G;
        t.ay = (float)rawAy / ACCEL_LSB_PER_G;
        t.az = (float)rawAz / ACCEL_LSB_PER_G;
        t.gx = (float)rawGx / GYRO_LSB_PER_DPS;
        t.gy = (float)rawGy / GYRO_LSB_PER_DPS;
        t.gz = (float)rawGz / GYRO_LSB_PER_DPS;

        // Read Die Temperature (0x20..0x21)
        uint8_t tBuf[2] = {0};
        if (readRegs(BMI160_REG_TEMP_LSB, tBuf, 2)) {
            int16_t rawTemp = (int16_t)((tBuf[1] << 8) | tBuf[0]);
            t.gyroTempC = 23.0f + ((float)rawTemp / 512.0f);
        }

        // Sensor Fusion (Complementary Filter)
        unsigned long nowMicros = micros();
        float dt = (float)(nowMicros - _lastMicros) / 1000000.0f;
        _lastMicros = nowMicros;
        if (dt <= 0.0f || dt > 0.5f) dt = 0.033f;

        float accRoll  = atan2(t.ay, t.az) * 180.0f / PI;
        float accPitch = atan2(-t.ax, sqrt(t.ay * t.ay + t.az * t.az)) * 180.0f / PI;

        _roll  = 0.98f * (_roll + t.gx * dt) + 0.02f * accRoll;
        _pitch = 0.98f * (_pitch + t.gy * dt) + 0.02f * accPitch;
        // Deadband on Gz to prevent stationary yaw drift
        if (fabs(t.gz) > 0.65f) {
            _yaw += t.gz * dt;
        }

        t.roll  = _roll;
        t.pitch = _pitch;
        t.yaw   = _yaw;

        // Total G-Force & Chassis Vibration RMS
        float totalG = sqrt(t.ax * t.ax + t.ay * t.ay + t.az * t.az);
        if (totalG > _windowPeakG) _windowPeakG = totalG;
        t.peakG = _windowPeakG;

        float dynG = fabs(totalG - 1.0f);
        _vibSqSum += dynG * dynG;
        _vibSamples++;
        if (_vibSamples >= 25) {
            t.vibRms = sqrt(_vibSqSum / (float)_vibSamples);
            _vibSqSum = 0.0f;
            _vibSamples = 0;
        }

        return true;
    }

    void resetWindowPeak(KartTelemetry &t) {
        _windowPeakG = sqrt(t.ax * t.ax + t.ay * t.ay + t.az * t.az);
    }

private:
    uint8_t _addr = 0;
    bool _ready = false;
    bool _wireInitialized = false;
    unsigned long _lastRetryMs = 0;
    float _roll = 0.0f, _pitch = 0.0f, _yaw = 0.0f;
    float _windowPeakG = 1.0f;
    float _vibSqSum = 0.0f;
    uint16_t _vibSamples = 0;
    unsigned long _lastMicros = 0;

    uint8_t scanAddress() {
        uint8_t found = 0;
        for (uint8_t a = 0x08; a < 0x78; a++) {
            Wire.beginTransmission(a);
            if (Wire.endTransmission() == 0) {
                uint8_t id = 0;
                readRegsAddr(a, BMI160_REG_CHIP_ID, &id, 1);
                USB_OUT.printf("  [I2C Scan] Device at 0x%02X (Reg 0x00 = 0x%02X)\n", a, id);
                if (a == BMI160_ADDR_LOW || a == BMI160_ADDR_HIGH || id == BMI160_CHIP_ID_VAL) {
                    found = a;
                }
            }
        }
        return found;
    }

    bool writeReg(uint8_t reg, uint8_t val) {
        Wire.beginTransmission(_addr);
        Wire.write(reg);
        Wire.write(val);
        return (Wire.endTransmission() == 0);
    }

    bool readRegsAddr(uint8_t addr, uint8_t reg, uint8_t *buf, size_t len) {
        Wire.beginTransmission(addr);
        Wire.write(reg);
        if (Wire.endTransmission(false) != 0) return false;
        if (Wire.requestFrom(addr, (uint8_t)len) != len) return false;
        for (size_t i = 0; i < len; i++) buf[i] = Wire.read();
        return true;
    }

    bool readRegs(uint8_t reg, uint8_t *buf, size_t len) {
        return readRegsAddr(_addr, reg, buf, len);
    }
};

#endif
