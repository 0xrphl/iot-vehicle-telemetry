import asyncio
import json
import re
import os
import time
import math
import urllib.request
import serial
from serial.tools import list_ports
import websockets

WS_PORT = 8081
BAUD_RATE = 115200

CONNECTED_SOCKETS = set()
LATEST_DATA = {
    "ts": "2026-11-08T17:00:00Z",
    "vbat_mv": 4040, "vbat_v": 4.040, "solar_mv": 0,
    "gyro_temp": 30.2, "rtc_temp": 29.85,
    "ax": 0.008, "ay": -0.105, "az": 1.015,
    "gx": -0.78, "gy": -0.31, "gz": 0.32,
    "roll": 0.0, "pitch": 0.0, "yaw": 0.0,
    "peak_g": 1.02, "vib": 0.012,
    "lat": 4.79520, "lon": -75.68860,
    "spd": 0.0, "alt": 1411.0, "crs": 0.0, "sats": 9, "fix": 3,
    "sd_ok": 1, "sd_kb": 0, "sd_rec": 0, "boot": 1,
    "rssi": -48, "net": 1, "cloud": 0
}

def load_dotenv():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")
    return env_vars

ENV = load_dotenv()

def find_esp32_port():
    ports = list(list_ports.comports())
    for p in ports:
        if p.vid == 0x303A or "COM3" in p.device:
            return p.device
    for p in ports:
        if "USB" in p.description or "Serial" in p.description:
            return p.device
    return "COM3"

async def ws_handler(websocket):
    CONNECTED_SOCKETS.add(websocket)
    try:
        await websocket.send(json.dumps(LATEST_DATA))
        async for _ in websocket:
            pass
    except Exception:
        pass
    finally:
        CONNECTED_SOCKETS.discard(websocket)

async def broadcast(data_str):
    if not CONNECTED_SOCKETS:
        return
    dead = set()
    for ws in CONNECTED_SOCKETS:
        try:
            await ws.send(data_str)
        except Exception:
            dead.add(ws)
    for ws in dead:
        CONNECTED_SOCKETS.discard(ws)

def post_to_supabase(payload):
    url = ENV.get("SUPABASE_URL", "")
    key = ENV.get("SUPABASE_ANON_KEY", "")
    if not url or "YOUR_PROJECT_REF" in url or not key:
        return False
    try:
        endpoint = f"{url.rstrip('/')}/rest/v1/kart_telemetry"
        row = {
            "rtc_ts": payload.get("ts", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
            "vbat_mv": int(payload.get("vbat_mv", 4000)),
            "solar_mv": int(payload.get("solar_mv", 0)),
            "gyro_temp_c": float(payload.get("gyro_temp", payload.get("temp", 30.0))),
            "rtc_temp_c": float(payload.get("rtc_temp", 29.8)),
            "ax": float(payload.get("ax", 0)),
            "ay": float(payload.get("ay", 0)),
            "az": float(payload.get("az", 1)),
            "gx": float(payload.get("gx", 0)),
            "gy": float(payload.get("gy", 0)),
            "gz": float(payload.get("gz", 0)),
            "roll": float(payload.get("roll", 0)),
            "pitch": float(payload.get("pitch", 0)),
            "yaw": float(payload.get("yaw", 0)),
            "peak_g": float(payload.get("peak_g", 1.0)),
            "vib_rms": float(payload.get("vib", 0.01)),
            "lat": float(payload.get("lat", 4.7952)),
            "lon": float(payload.get("lon", -75.6886)),
            "speed_kmh": float(payload.get("spd", 0.0)),
            "alt_m": float(payload.get("alt", 1411.0)),
            "course_deg": float(payload.get("crs", 0.0)),
            "sats": int(payload.get("sats", 0)),
            "gps_fix": int(payload.get("fix", 0)),
            "sd_kb": int(payload.get("sd_kb", 0)),
            "rssi": int(payload.get("rssi", -50)),
            "net_mode": int(payload.get("net", 1))
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(row).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Prefer": "return=minimal"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            return 200 <= resp.status < 300
    except Exception:
        return False

def serial_reader_task(port_name, loop):
    global LATEST_DATA
    print(f"[Serial Bridge] Opening {port_name} at {BAUD_RATE} baud...")
    ser = None
    last_cloud_sync = 0

    pipe_regex = re.compile(
        r'([+-]?\d+\.\d+)\s*\|\s*([+-]?\d+\.\d+)\s*\|\s*([+-]?\d+\.\d+)\s*\|\|\s*'
        r'([+-]?\d+\.\d+)\s*\|\s*([+-]?\d+\.\d+)\s*\|\s*([+-]?\d+\.\d+)\s*\|\|\s*'
        r'([+-]?\d+\.\d+)\s*C'
    )

    roll, pitch, yaw = 0.0, 0.0, 0.0
    last_t = time.time()

    while True:
        if ser is None:
            try:
                ser = serial.Serial(port_name, BAUD_RATE, timeout=0.1)
                print(f"[Serial Bridge] Connected to {port_name}!")
            except Exception:
                time.sleep(1.0)
                continue

        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if not line:
                continue

            now = time.time()
            dt = now - last_t
            last_t = now
            if dt <= 0 or dt > 0.5:
                dt = 0.033

            if line.startswith("{"):
                # Repair truncated JSON lines from earlier firmware if missing closing '}'
                if not line.endswith("}"):
                    if '"cloud' in line:
                        line = line[:line.rfind(',"cloud')] + '}'
                try:
                    payload = json.loads(line)
                    LATEST_DATA = payload
                    asyncio.run_coroutine_threadsafe(broadcast(json.dumps(payload)), loop)

                    if now - last_cloud_sync > 3.0:
                        last_cloud_sync = now
                        post_to_supabase(payload)
                    continue
                except Exception:
                    pass

            m = pipe_regex.search(line)
            if m:
                ax = float(m.group(1))
                ay = float(m.group(2))
                az = float(m.group(3))
                gx = float(m.group(4))
                gy = float(m.group(5))
                gz = float(m.group(6))
                temp = float(m.group(7))

                acc_roll = math.atan2(ay, az) * 180.0 / math.pi
                acc_pitch = math.atan2(-ax, math.sqrt(ay * ay + az * az)) * 180.0 / math.pi
                roll = 0.98 * (roll + gx * dt) + 0.02 * acc_roll
                pitch = 0.98 * (pitch + gy * dt) + 0.02 * acc_pitch
                yaw += gz * dt

                LATEST_DATA = {
                    "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "vbat_mv": 4040, "vbat_v": 4.04, "solar_mv": 0,
                    "gyro_temp": round(temp, 1), "rtc_temp": round(temp - 0.3, 2),
                    "ax": round(ax, 3), "ay": round(ay, 3), "az": round(az, 3),
                    "gx": round(gx, 2), "gy": round(gy, 2), "gz": round(gz, 2),
                    "roll": round(roll, 2), "pitch": round(pitch, 2), "yaw": round(yaw, 2),
                    "peak_g": round(math.sqrt(ax*ax + ay*ay + az*az), 2),
                    "vib": round(abs(math.sqrt(ax*ax + ay*ay + az*az) - 1.0), 3),
                    "lat": 4.79520, "lon": -75.68860, "spd": 0.0, "alt": 1411.0, "crs": 0.0, "sats": 9, "fix": 3,
                    "sd_ok": 1, "sd_kb": 24, "sd_rec": 180, "boot": 1,
                    "rssi": -48, "net": 1, "cloud": 1
                }
                asyncio.run_coroutine_threadsafe(broadcast(json.dumps(LATEST_DATA)), loop)

                if now - last_cloud_sync > 3.0:
                    last_cloud_sync = now
                    post_to_supabase(LATEST_DATA)
        except Exception:
            try:
                ser.close()
            except Exception:
                pass
            ser = None
            time.sleep(1.0)

async def main():
    port = find_esp32_port()
    loop = asyncio.get_running_loop()

    import threading
    t = threading.Thread(target=serial_reader_task, args=(port, loop), daemon=True)
    t.start()

    print(f"[WebSocket Server] Listening on ws://0.0.0.0:{WS_PORT}")
    async with websockets.serve(ws_handler, "0.0.0.0", WS_PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting.")
