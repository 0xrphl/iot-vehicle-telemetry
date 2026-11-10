/**
 * gps_sim7672.h
 * LilyGO T-SIM7672G Built-in Multi-GNSS (GPS/GLONASS/Galileo/BeiDou) + 4G LTE Cellular
 */
#ifndef GPS_SIM7672_H
#define GPS_SIM7672_H

#include "../config.h"
#include "../rtc_ds3231/rtc_ds3231.h"

#define SerialAT Serial1

class GpsSim7672 {
public:
    bool begin() {
        pinMode(MODEM_DTR_PIN, OUTPUT);
        digitalWrite(MODEM_DTR_PIN, LOW);

        pinMode(MODEM_PWRKEY_PIN, OUTPUT);
        digitalWrite(MODEM_PWRKEY_PIN, LOW);
        delay(50);
        digitalWrite(MODEM_PWRKEY_PIN, HIGH);
        delay(120);
        digitalWrite(MODEM_PWRKEY_PIN, LOW);

        SerialAT.begin(115200, SERIAL_8N1, MODEM_RX_PIN, MODEM_TX_PIN);
        delay(500);

        for (int i = 0; i < 6; i++) {
            if (sendATWait("AT", "OK", 400)) {
                _modemAwake = true;
                break;
            }
        }

        if (_modemAwake) {
            USB_OUT.println(F("[SIM7672G] Modem responsive! Configuring 4G LTE Movistar & GNSS..."));
            enableGnss();
            configureLteApn();
            connect4GNetwork();
        }
        return _modemAwake;
    }

    void enableGnss() {
        sendATWait("AT+CGDRT=4,1", "OK", 300);
        sendATWait("AT+CGSETV=4,1", "OK", 300);
        sendATWait("AT+CGNSSPWR=1", "OK", 500);
        _gnssEnabled = true;
    }

    void configureLteApn() {
        // Set PDP context for Movistar Colombia
        String cmd = String("AT+CGDCONT=1,\"IP\",\"") + SIM_APN + "\"";
        sendATWait(cmd.c_str(), "OK", 500);
    }

    void connect4GNetwork() {
        // Check SIM status
        sendATWait("AT+CPIN?", "+CPIN: READY", 1000);
        // Enable EPS network registration status report
        sendATWait("AT+CEREG=2", "OK", 400);
        // Activate PDP context for cellular data
        sendATWait("AT+CGACT=1,1", "OK", 3000);
        // Query local cellular IP
        String cpip = readLineWithPrefix("+CGPADDR:", 2000);
        if (cpip.length() > 0) {
            USB_OUT.printf("[SIM7672G] 4G LTE Connected! %s\n", cpip.c_str());
        }
    }

    void poll(KartTelemetry &t, RtcDs3231 &rtc) {
        if (!_modemAwake) {
            if (sendATWait("AT", "OK", 150)) {
                _modemAwake = true;
                enableGnss();
                configureLteApn();
                connect4GNetwork();
            }
            return;
        }
        if (!_gnssEnabled) enableGnss();

        while (SerialAT.available()) SerialAT.read();
        SerialAT.println("AT+CGNSSINFO");

        String line = readLineWithPrefix("+CGNSSINFO:", 350);
        if (line.length() > 12) {
            parseCgnssInfo(line, t, rtc);
        }
    }

    bool postToSupabaseViaLte(const String &url, const String &anonKey, const String &jsonPayload) {
        if (!_modemAwake) return false;

        sendATWait("AT+HTTPTERM", "OK", 200);
        if (!sendATWait("AT+HTTPINIT", "OK", 1000)) return false;

        sendATWait("AT+CSSLCFG=\"sslversion\",0,4", "OK", 300);
        sendATWait("AT+CSSLCFG=\"enableSNI\",0,1", "OK", 300);

        String urlCmd = "AT+HTTPPARA=\"URL\",\"" + url + "\"";
        if (!sendATWait(urlCmd.c_str(), "OK", 500)) {
            sendATWait("AT+HTTPTERM", "OK", 200);
            return false;
        }

        sendATWait("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK", 300);
        String keyHdr = "AT+HTTPPARA=\"USERDATA\",\"apikey: " + anonKey + "\\r\\nAuthorization: Bearer " + anonKey + "\\r\\nPrefer: return=minimal\"";
        sendATWait(keyHdr.c_str(), "OK", 400);

        String dataCmd = "AT+HTTPDATA=" + String(jsonPayload.length()) + ",5000";
        if (!sendATWait(dataCmd.c_str(), "DOWNLOAD", 1500)) {
            sendATWait("AT+HTTPTERM", "OK", 200);
            return false;
        }

        SerialAT.print(jsonPayload);
        if (!waitResponse("OK", 2000)) {
            sendATWait("AT+HTTPTERM", "OK", 200);
            return false;
        }

        SerialAT.println("AT+HTTPACTION=1");
        String actLine = readLineWithPrefix("+HTTPACTION:", 8000);
        sendATWait("AT+HTTPTERM", "OK", 300);

        return (actLine.indexOf(",201,") > 0 || actLine.indexOf(",200,") > 0 || actLine.indexOf(",204,") > 0);
    }

private:
    bool _modemAwake = false;
    bool _gnssEnabled = false;

    bool sendATWait(const char *cmd, const char *expected, uint32_t timeoutMs) {
        while (SerialAT.available()) SerialAT.read();
        SerialAT.println(cmd);
        return waitResponse(expected, timeoutMs);
    }

    bool waitResponse(const char *expected, uint32_t timeoutMs) {
        unsigned long start = millis();
        String buf = "";
        while (millis() - start < timeoutMs) {
            while (SerialAT.available()) {
                char c = (char)SerialAT.read();
                buf += c;
                if (buf.indexOf(expected) >= 0) return true;
                if (buf.indexOf("ERROR") >= 0) return false;
            }
            delay(1);
        }
        return false;
    }

    String readLineWithPrefix(const char *prefix, uint32_t timeoutMs) {
        unsigned long start = millis();
        String line = "";
        while (millis() - start < timeoutMs) {
            while (SerialAT.available()) {
                char c = (char)SerialAT.read();
                if (c == '\n') {
                    line.trim();
                    if (line.startsWith(prefix)) return line;
                    line = "";
                } else if (c != '\r') {
                    line += c;
                }
            }
            delay(1);
        }
        return "";
    }

    static double nmeaToDecimal(double ddmm, char indicator) {
        int deg = (int)(ddmm / 100.0);
        double mins = ddmm - (deg * 100.0);
        double dec = (double)deg + (mins / 60.0);
        if (indicator == 'S' || indicator == 'W') dec = -dec;
        return dec;
    }

    void parseCgnssInfo(const String &line, KartTelemetry &t, RtcDs3231 &rtc) {
        int colon = line.indexOf(':');
        if (colon < 0) return;
        String body = line.substring(colon + 1);
        body.trim();

        String fields[16];
        int fIdx = 0;
        int start = 0;
        for (int i = 0; i <= (int)body.length() && fIdx < 16; i++) {
            if (i == (int)body.length() || body.charAt(i) == ',') {
                fields[fIdx++] = body.substring(start, i);
                start = i + 1;
            }
        }

        if (fIdx < 14) return;
        uint8_t fixMode = (uint8_t)fields[0].toInt();
        t.gpsFix = fixMode;

        t.satellites = (uint8_t)(fields[1].toInt() + fields[2].toInt() + fields[3].toInt() + fields[4].toInt());

        if ((fixMode == 2 || fixMode == 3) && fields[5].length() > 0 && fields[7].length() > 0) {
            double rawLat = fields[5].toDouble();
            char ns = fields[6].length() > 0 ? fields[6].charAt(0) : 'N';
            double rawLon = fields[7].toDouble();
            char ew = fields[8].length() > 0 ? fields[8].charAt(0) : 'W';

            t.lat = nmeaToDecimal(rawLat, ns);
            t.lon = nmeaToDecimal(rawLon, ew);
            t.altM = fields[11].toFloat();
            t.speedKmh = fields[12].toFloat() * 1.852f;
            t.courseDeg = fields[13].toFloat();

            if (fields[9].length() == 6 && fields[10].length() >= 6) {
                uint8_t d = fields[9].substring(0, 2).toInt();
                uint8_t m = fields[9].substring(2, 4).toInt();
                uint16_t y = 2000 + fields[9].substring(4, 6).toInt();
                uint8_t hh = fields[10].substring(0, 2).toInt();
                uint8_t mm = fields[10].substring(2, 4).toInt();
                uint8_t ss = fields[10].substring(4, 6).toInt();
                rtc.syncFromGps(y, m, d, hh, mm, ss);
            }
        }
    }
};

#endif

