/**
 * telemetry_sync.h
 * Dual-Path Telemetry Dispatcher (Local Wi-Fi WebSockets + Supabase Cloud Sync)
 */
#ifndef TELEMETRY_SYNC_H
#define TELEMETRY_SYNC_H

#include "../config.h"
#include "../gps_sim7672/gps_sim7672.h"
#include "MinWebSockets.h"
#include "embedded_dashboard.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <HTTPClient.h>

class TelemetrySync {
public:
    TelemetrySync() : _httpServer(80), _wsServer(81) {}

    void begin() {
        USB_OUT.printf("[Wi-Fi] Connecting to %s", WIFI_SSID);
        WiFi.disconnect(true);
        delay(150);
        WiFi.mode(WIFI_STA);
        WiFi.begin(WIFI_SSID, WIFI_PASS);

        unsigned long start = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - start < 12000) {
            delay(350);
            digitalWrite(BOARD_LED_PIN, !digitalRead(BOARD_LED_PIN));
            USB_OUT.print(".");
        }

        if (WiFi.status() == WL_CONNECTED) {
            digitalWrite(BOARD_LED_PIN, LOW);
            USB_OUT.println(F("\n[Wi-Fi] Connected!"));
            USB_OUT.printf("[Wi-Fi] Local 3D Dashboard IP: http://%s | WS: ws://%s:81\n",
                           WiFi.localIP().toString().c_str(), WiFi.localIP().toString().c_str());
        } else {
            USB_OUT.println(F("\n[Wi-Fi] Starting Fallback AP: Kart-IMU-AP (12345678)"));
            WiFi.mode(WIFI_AP);
            WiFi.softAP("Kart-IMU-AP", "12345678");
            USB_OUT.printf("[Wi-Fi] AP 3D Dashboard IP: http://%s\n", WiFi.softAPIP().toString().c_str());
        }

        _httpServer.on("/", [this]() {
            _httpServer.sendHeader("Access-Control-Allow-Origin", "*");
            _httpServer.send_P(200, "text/html", KART_EMBEDDED_HTML);
        });
        _httpServer.on("/status", [this]() {
            _httpServer.sendHeader("Access-Control-Allow-Origin", "*");
            _httpServer.send(200, "application/json", _lastJson);
        });
        _httpServer.on("/test", [this]() {
            _httpServer.sendHeader("Access-Control-Allow-Origin", "*");
            _httpServer.send(200, "application/json", _bootTestJson);
        });
        _httpServer.begin();
        _wsServer.begin();
    }

    void registerCloudSession(KartTelemetry &t, const String &testJson, GpsSim7672 &modem) {
        _bootTestJson = testJson;
        String urlStr = String(SUPABASE_URL);
        if (urlStr.indexOf("YOUR_PROJECT_REF") >= 0) return;
        String endpoint = urlStr + "/rest/v1/kart_sessions";

        String sessWithTest = String("{\"device_id\":\"") + DEVICE_ID +
                              "\",\"boot_count\":" + String(t.bootCount) +
                              ",\"sd_filename\":\"kart_session_" + String(t.bootCount) +
                              ".csv\",\"test\":" + testJson + "}";

        String sessFallback = String("{\"device_id\":\"") + DEVICE_ID +
                              "\",\"boot_count\":" + String(t.bootCount) +
                              ",\"sd_filename\":\"kart_session_" + String(t.bootCount) + ".csv\"}";

        if (WiFi.status() == WL_CONNECTED) {
            WiFiClientSecure client;
            client.setInsecure();
            HTTPClient http;
            if (http.begin(client, endpoint)) {
                http.addHeader("Content-Type", "application/json");
                http.addHeader("apikey", SUPABASE_ANON_KEY);
                http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
                http.addHeader("Prefer", "return=representation");
                int code = http.POST(sessWithTest);
                if (code < 200 || code >= 300) {
                    // Fallback if user has not yet run ALTER TABLE to add `test` JSONB column
                    code = http.POST(sessFallback);
                }
                if (code >= 200 && code < 300) {
                    String resp = http.getString();
                    int idIdx = resp.indexOf("\"session_id\":");
                    if (idIdx > 0) {
                        t.cloudSessionId = resp.substring(idIdx + 13).toInt();
                        USB_OUT.printf("[Supabase] Boot Session & Self-Test Registered! ID: #%lld\n", (long long)t.cloudSessionId);
                    }
                }
                http.end();
            }
        } else {
            // Send boot session + self-test JSON via Movistar 4G LTE SIM
            if (modem.postToSupabaseViaLte(endpoint, SUPABASE_ANON_KEY, sessWithTest)) {
                USB_OUT.println(F("[Supabase 4G] Boot Session & Self-Test Registered via 4G LTE!"));
            } else {
                modem.postToSupabaseViaLte(endpoint, SUPABASE_ANON_KEY, sessFallback);
            }
        }
    }

    void loop() {
        _httpServer.handleClient();
        _wsServer.loop();
    }

    void broadcastLocal(KartTelemetry &t, char *outBuf, size_t outSize) {
        if (WiFi.status() == WL_CONNECTED) {
            t.rssi = WiFi.RSSI();
            t.netMode = 1;
        } else {
            t.rssi = -55;
            t.netMode = 2;
        }

        snprintf(outBuf, outSize,
                 "{\"ts\":\"%s\",\"vbat_mv\":%u,\"vbat_v\":%.3f,\"solar_mv\":%u,"
                 "\"gyro_temp\":%.1f,\"rtc_temp\":%.2f,"
                 "\"ax\":%.3f,\"ay\":%.3f,\"az\":%.3f,\"gx\":%.2f,\"gy\":%.2f,\"gz\":%.2f,"
                 "\"roll\":%.2f,\"pitch\":%.2f,\"yaw\":%.2f,\"peak_g\":%.2f,\"vib\":%.3f,"
                 "\"lat\":%.6f,\"lon\":%.6f,\"spd\":%.1f,\"alt\":%.1f,\"crs\":%.1f,\"sats\":%u,\"fix\":%u,"
                 "\"sd_ok\":%d,\"sd_kb\":%lu,\"sd_rec\":%lu,\"boot\":%lu,\"rssi\":%d,\"net\":%u,\"cloud\":%lu}",
                 t.isoTimestamp, t.vbatMv, t.vbatV, t.solarMv,
                 t.gyroTempC, t.rtcTempC,
                 t.ax, t.ay, t.az, t.gx, t.gy, t.gz,
                 t.roll, t.pitch, t.yaw, t.peakG, t.vibRms,
                 t.lat, t.lon, t.speedKmh, t.altM, t.courseDeg, t.satellites, t.gpsFix,
                 t.sdMounted ? 1 : 0, (unsigned long)t.sdLogKb, (unsigned long)t.sdRecords,
                 (unsigned long)t.bootCount, (int)t.rssi, t.netMode, (unsigned long)t.cloudSentCount);

        _lastJson = String(outBuf);
        _wsServer.broadcastTXT(outBuf);
        USB_OUT.println(outBuf);
    }

    bool syncToSupabaseIfDue(KartTelemetry &t, GpsSim7672 &modem) {
        String urlStr = String(SUPABASE_URL);
        if (urlStr.indexOf("YOUR_PROJECT_REF") >= 0) return false;

        unsigned long now = millis();
        if (now - _lastCloudSync < 4000) return false;
        _lastCloudSync = now;

        String endpoint = urlStr + "/rest/v1/kart_telemetry";
        char body[420];
        if (t.cloudSessionId > 0) {
            snprintf(body, sizeof(body),
                     "{\"session_id\":%lld,\"rtc_ts\":\"%s\",\"vbat_mv\":%u,\"solar_mv\":%u,"
                     "\"gyro_temp_c\":%.1f,\"rtc_temp_c\":%.2f,"
                     "\"ax\":%.3f,\"ay\":%.3f,\"az\":%.3f,\"gx\":%.2f,\"gy\":%.2f,\"gz\":%.2f,"
                     "\"roll\":%.2f,\"pitch\":%.2f,\"yaw\":%.2f,\"peak_g\":%.2f,\"vib_rms\":%.3f,"
                     "\"lat\":%.6f,\"lon\":%.6f,\"speed_kmh\":%.1f,\"alt_m\":%.1f,\"course_deg\":%.1f,"
                     "\"sats\":%u,\"gps_fix\":%u,\"sd_kb\":%lu,\"rssi\":%d,\"net_mode\":%u}",
                     (long long)t.cloudSessionId, t.isoTimestamp, t.vbatMv, t.solarMv,
                     t.gyroTempC, t.rtcTempC,
                     t.ax, t.ay, t.az, t.gx, t.gy, t.gz,
                     t.roll, t.pitch, t.yaw, t.peakG, t.vibRms,
                     t.lat, t.lon, t.speedKmh, t.altM, t.courseDeg,
                     t.satellites, t.gpsFix, (unsigned long)t.sdLogKb, (int)t.rssi, t.netMode);
        } else {
            snprintf(body, sizeof(body),
                     "{\"rtc_ts\":\"%s\",\"vbat_mv\":%u,\"solar_mv\":%u,"
                     "\"gyro_temp_c\":%.1f,\"rtc_temp_c\":%.2f,"
                     "\"ax\":%.3f,\"ay\":%.3f,\"az\":%.3f,\"gx\":%.2f,\"gy\":%.2f,\"gz\":%.2f,"
                     "\"roll\":%.2f,\"pitch\":%.2f,\"yaw\":%.2f,\"peak_g\":%.2f,\"vib_rms\":%.3f,"
                     "\"lat\":%.6f,\"lon\":%.6f,\"speed_kmh\":%.1f,\"alt_m\":%.1f,\"course_deg\":%.1f,"
                     "\"sats\":%u,\"gps_fix\":%u,\"sd_kb\":%lu,\"rssi\":%d,\"net_mode\":%u}",
                     t.isoTimestamp, t.vbatMv, t.solarMv,
                     t.gyroTempC, t.rtcTempC,
                     t.ax, t.ay, t.az, t.gx, t.gy, t.gz,
                     t.roll, t.pitch, t.yaw, t.peakG, t.vibRms,
                     t.lat, t.lon, t.speedKmh, t.altM, t.courseDeg,
                     t.satellites, t.gpsFix, (unsigned long)t.sdLogKb, (int)t.rssi, t.netMode);
        }

        if (WiFi.status() == WL_CONNECTED) {
            WiFiClientSecure client;
            client.setInsecure();
            HTTPClient http;
            if (http.begin(client, endpoint)) {
                http.addHeader("Content-Type", "application/json");
                http.addHeader("apikey", SUPABASE_ANON_KEY);
                http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
                http.addHeader("Prefer", "return=minimal");
                int code = http.POST((uint8_t*)body, strlen(body));
                http.end();
                if (code >= 200 && code < 300) {
                    t.cloudSentCount++;
                    return true;
                }
            }
        } else {
            if (modem.postToSupabaseViaLte(endpoint, SUPABASE_ANON_KEY, String(body))) {
                t.cloudSentCount++;
                return true;
            }
        }
        return false;
    }

private:
    WebServer _httpServer;
    MinWebSocketServer _wsServer;
    unsigned long _lastCloudSync = 0;
    String _lastJson = "{}";
    String _bootTestJson = "{}";
};

#endif

