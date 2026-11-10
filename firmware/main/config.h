/**
 * config.h
 * Central Hardware & Cloud Configuration for SOTA Electric Delta-Kart
 * LilyGO T-SIM7672G V1.1 (ESP32-S3) + BMI160 + DS3231/AT24C32 + 32GB SD + 18650
 */
#ifndef KART_CONFIG_H
#define KART_CONFIG_H

#include <Arduino.h>

// ============================================================================
// 1. USB-C Serial Routing (Native USB CDC + UART0 Fallback)
// ============================================================================
#if defined(ARDUINO_USB_MODE) && (ARDUINO_USB_MODE == 1)
  #if defined(ARDUINO_USB_CDC_ON_BOOT) && (ARDUINO_USB_CDC_ON_BOOT == 1)
    #define USB_OUT Serial
  #else
    #define USB_OUT USBSerial
  #endif
#else
  #define USB_OUT Serial
#endif

// ============================================================================
// 2. Network & Supabase Cloud Credentials (Synced with .env)
// ============================================================================
#define WIFI_SSID               "FamiliaSanchez."
#define WIFI_PASS               "Movistar0898*"

// Cellular 4G LTE APN (220 MB Data Plan)
#define SIM_APN                 "internet.movistar.com.co"
#define SIM_USER                ""
#define SIM_PASS                ""

// Supabase REST API Configuration (< 500 MB Free Tier Optimized)
#define SUPABASE_URL            "https://tapjoxeplcyeohsnrmnl.supabase.co"
#define SUPABASE_ANON_KEY       "sb_publishable_m6sJshs7hjbYHlE0lUGx9Q_ZM-wXn6e"
#define DEVICE_ID               "KART_DELTA_01"

// ============================================================================
// 3. Pin Definitions - LilyGO T-SIM7672G V1.1 (ESP32-S3-WROOM-1 MCN16R8)
// ============================================================================
#define BOARD_LED_PIN           12      // Active LOW Blue Status LED

// Bus 0 (Wire): Bosch BMI160 6-DOF IMU (Right Header Pins 5 & 6)
#define BMI160_SDA_PIN          1       // GPIO 1
#define BMI160_SCL_PIN          2       // GPIO 2
#define I2C_FREQ_HZ             400000  // 400 kHz Fast-Mode

// Bus 1 (Wire1): DS3231 RTC + AT24C32 EEPROM (Right Header Pins 7 & 8)
#define DS3231_SDA_PIN          42      // GPIO 42
#define DS3231_SCL_PIN          41      // GPIO 41

// Onboard 18650 Battery & Solar Input ADC (Left Header Pins 4 & 5)
#define BOARD_BAT_ADC_PIN       4       // GPIO 4 (x2 hardware divider)
#define BOARD_SOLAR_ADC_PIN     5       // GPIO 5 (x2 hardware divider)

// Onboard 32GB MicroSD Card SPI Slot
#define BOARD_SD_CS_PIN         13      // GPIO 13
#define BOARD_SD_MOSI_PIN       14      // GPIO 14
#define BOARD_SD_SCK_PIN        21      // GPIO 21
#define BOARD_SD_MISO_PIN       47      // GPIO 47

// Onboard SIM7672G 4G LTE + Multi-GNSS Modem
#define MODEM_TX_PIN            11      // ESP32 TX -> SIM7672G RX
#define MODEM_RX_PIN            10      // ESP32 RX -> SIM7672G TX
#define MODEM_PWRKEY_PIN        18      // Power Key Pulse
#define MODEM_DTR_PIN           9       // Wake / Sleep control
#define MODEM_RING_PIN          3       // Ring indicator
#define MODEM_RESET_PIN         17      // Reset pin
#define MODEM_GPS_ENABLE_GPIO   4       // Modem internal GPIO 4 controls GNSS LNA

// ============================================================================
// 4. Unified Telemetry State Struct
// ============================================================================
struct KartTelemetry {
    // Timestamps
    char isoTimestamp[25];      // "2026-11-08T16:45:12Z"
    uint32_t uptimeMs;

    // 18650 Battery & Solar (Strictly Volts & mV, NO percentage)
    uint16_t vbatMv;            // e.g. 4120 mV
    float    vbatV;             // e.g. 4.120 V
    uint16_t solarMv;           // e.g. 5010 mV
    float    solarV;            // e.g. 5.010 V

    // Dual Temperatures
    float gyroTempC;            // BMI160 Die Temp (°C)
    float rtcTempC;             // DS3231 Ambient Temp (°C)

    // 6-DOF IMU & Attitude
    float ax, ay, az;           // g
    float gx, gy, gz;           // deg/s
    float roll, pitch, yaw;     // deg
    float peakG;                // Peak G-force in window
    float vibRms;               // Chassis vibration RMS (g)

    // SIM7672G GNSS Coordinates
    double lat;
    double lon;
    float  speedKmh;
    float  altM;
    float  courseDeg;
    uint8_t satellites;
    uint8_t gpsFix;             // 0=No Fix, 2=2D, 3=3D

    // Storage & Connectivity
    bool     sdMounted;
    uint32_t sdLogKb;
    uint32_t sdRecords;
    uint32_t bootCount;
    int16_t  rssi;
    uint8_t  netMode;           // 1=Wi-Fi, 2=4G SIM, 0=Offline SD
    uint32_t cloudSentCount;
    int64_t  cloudSessionId;    // Remote Supabase kart_sessions primary key ID
};

#endif
