# 🚛 IoT Vehicle Telemetry — Pereira, Risaralda

🌐 [Español](README.es.md)

> Real-time vehicle telemetry using CT Clamp + Gyroscope + GPS with LoRa Mesh & 4G LTE connectivity.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![Location](https://img.shields.io/badge/location-Pereira%2C%20Colombia-orange.svg)]()
[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-Dashboard-00c853.svg)](https://0xraphael.com/college/iot-vehicle-telemetry)
[![3D Dashboard](https://img.shields.io/badge/▶_Live_Demo-3D_Dashboard-7c4dff.svg)](https://0xraphael.com/college/iot-vehicle-telemetry/dashboard-3d.html)

## 📋 Overview

| Feature | Description |
|---------|-------------|
| **Current Monitoring** | CT Clamp (SCT-013-030) — 30A max, amps/voltage/PF |
| **Motion Tracking** | BMI160 gyroscope — pitch, roll, yaw, vibration |
| **GPS Tracking** | NEO-6M / T-Beam built-in — position, speed, heading |
| **Dual Connectivity** | LoRa Mesh (free) + 4G LTE (backup) |
| **Real-time Dashboard** | Supabase Realtime + Vue/React |
| **3D Visualization** | Three.js terrain + vehicle markers |

---

## 🔌 Circuit Diagrams

> Wiring schematic for the CT Clamp, BMI160 gyroscope, ADS1115 ADC, and ESP32/T-Beam LoRa node.

![Circuit Diagrams](images/circuit-diagrams.png)

---

## 📦 Bill of Materials — Detailed Component List

### 🟢 LoRa Node (Vehicle Unit) — ~$48.50

> One self-contained unit installed per vehicle. Collects telemetry and transmits via LoRa mesh.

#### 1. MCU + LoRa + GPS — LilyGo T-Beam V1.2

> ESP32 + SX1262 LoRa + NEO-6M GPS + 18650 battery holder + OLED display + AXP2101 PMU — Meshtastic compatible.

![LilyGo T-Beam V1.2](images/lilygo-tbeam-v12.png)

| Spec | Value |
|------|-------|
| MCU | ESP32 (240MHz dual-core) |
| LoRa | SX1262 — 433/868/915MHz |
| GPS | NEO-6M |
| Battery | 18650 holder + AXP2101 PMU |
| Price | **$28.00** |
| 🔗 | [Buy on AliExpress](https://aliexpress.com/item/4001178678568.html) |

---

#### 2. CT Clamp — SCT-013-030

> Split-core current transformer, 30A max, 1V AC output — clamp-on, no wire cutting needed.

![SCT-013 CT Clamp](images/sct013-ct-clamp.png)

| Spec | Value |
|------|-------|
| Range | 0–100A (30A variant recommended) |
| Output | 0–1V AC |
| Accuracy | ±1% |
| Type | Non-invasive, split-core |
| Price | **$6.03** |
| 🔗 | [Buy on AliExpress](https://www.aliexpress.us/item/3256808061666229.html) |

---

#### 3. ADC — ADS1115 16-Bit I2C (4 Channel)

> 16-bit precision ADC with programmable gain amplifier — reads the CT clamp analog output via I2C.

![ADS1115 ADC Module](images/ads1115-adc.png)

| Spec | Value |
|------|-------|
| Resolution | 16-bit |
| Channels | 4 (multiplexed) |
| Sample Rate | Up to 860 SPS |
| Voltage | 2.0–5.5V |
| Interface | I2C |
| Price | **$2.28** |
| 🔗 | [Buy on AliExpress](https://www.aliexpress.us/item/3256812085808204.html) |

---

#### 4. Gyroscope / Accelerometer — BMI160 GY-BMI160 6DOF

> 6-axis IMU (gyroscope + accelerometer) — measures pitch, roll, yaw, and vibration via I2C/SPI.

![BMI160 Gyroscope Module](images/bmi160-gyroscope.png)

| Spec | Value |
|------|-------|
| Axes | 6DOF (3-axis gyro + 3-axis accel) |
| Gyro Range | ±2000°/s |
| Accel Range | ±16g |
| Resolution | 16-bit |
| Interface | I2C / SPI |
| Voltage | 3–5V |
| Price | **$2.50** |
| 🔗 | [Buy on AliExpress](https://www.aliexpress.us/item/3256809462979321.html) |

---

#### 5. Solar Panel — Mini Mono/Poly 2V 150mA

> Compact solar panel for trickle-charging the 18650 battery — CE certified, weatherproof.

| Spec | Value |
|------|-------|
| Voltage | 2V |
| Current | 150mA |
| Size | 60×60mm |
| Type | Mono/Poly crystalline |
| Price | **$5.49** |
| 🔗 | [Buy on AliExpress](https://es.aliexpress.com/item/1005005825496564.html) |

---

#### 6. 3D Printed Enclosure — Elegoo Centauri Carbon 2

> IP65 weatherproof enclosure for all node types — printed on Elegoo Centauri Carbon 2 (CoreXY, 500mm/s).

| Spec | Value |
|------|-------|
| Printer | **Elegoo Centauri Carbon 2** (CoreXY, 500mm/s) |
| Body Material | PETG (weather-resistant, UV stable) |
| Body Infill | 30% gyroid pattern |
| Wall Thickness | 2.0mm (3 perimeters) |
| Layer Height | 0.2mm |
| Seal/Gasket | TPU 95A (flexible, waterproof compression seal) |
| IP Rating | IP65 (dust-tight + water jet) |
| Print Time | ~3.5h (body) + ~45min (gasket) |
| Weight | ~50g (body) + ~8g (gasket) |
| Nozzle | 0.4mm hardened steel |
| Temps | 240°C nozzle / 70°C bed (PETG) · 220°C / 50°C (TPU) |
| Features | Cable gland holes (×2), SMA antenna pass-through, 18650 bay, solar recess, mounting tabs, snap-fit lid |
| Fits | T-Beam V1.2, ESP32 + SX1278, T-SIM7670G-S3 |
| Price | **$1.00** ($0.75 body + $0.25 gasket) |

---

#### 7–8. Battery + Misc

| Component | Specs | Price |
|-----------|-------|-------|
| 18650 Li-ion Battery | 3400mAh, 3.7V | $3.00 |
| Misc (burden resistor 33Ω, filter caps 10µF, jumper wires, JST connectors) | — | $1.20 |

---

#### LoRa Node Summary

| # | Component | Price |
|---|-----------|-------|
| 1 | LilyGo T-Beam V1.2 (ESP32 + LoRa + GPS) | $28.00 |
| 2 | SCT-013-030 CT Clamp (30A) | $6.03 |
| 3 | ADS1115 ADC (16-bit, I2C) | $2.28 |
| 4 | BMI160 Gyroscope (6DOF) | $2.50 |
| 5 | Solar Panel (2V 150mA) | $5.49 |
| 6 | 18650 Battery (3400mAh) | $3.00 |
| 7 | Misc (resistors, caps, wires) | $1.20 |
| | **Total per vehicle** | **$48.50** |

---

### 🔵 LoRa Gateway Node — ~$22.70

> Standalone gateway that receives LoRa packets from vehicle nodes and forwards to Supabase via WiFi. Uses a dedicated ESP32 + SX1278 for best price/quality at 10km range.

#### Gateway LoRa Radio — SX1278 Ra-02 433MHz (10KM Range)

> 433MHz SX1278 LoRa spread spectrum module with IPX antenna — 10km range, 4000+ sold, 4.8★ rating.

![SX1278 LoRa Module Ra-02](images/sx1278-lora-module.png)

| Spec | Value |
|------|-------|
| Frequency | 433MHz |
| Chip | SX1278 (Semtech) |
| Range | Up to 10km (line of sight) |
| Antenna | IPX spring antenna (included) |
| Interface | SPI |
| Price | **$4.17** |
| 🔗 | [Buy on AliExpress](https://es.aliexpress.com/item/1005004991920495.html) |

---

#### Gateway Components Summary

| # | Component | Model / Specs | Price | Source |
|---|-----------|---------------|-------|--------|
| 1 | MCU | ESP32-WROOM-32 DevKit V1 (WiFi + BT, 240MHz) | $3.50 | AliExpress |
| 2 | LoRa Radio | SX1278 Ra-02 433MHz (10km, IPX antenna) | $4.17 | [AliExpress](https://es.aliexpress.com/item/1005004991920495.html) |
| 3 | Solar Panel | Mini Mono/Poly 3V 150mA 60×55mm | $5.49 | [AliExpress](https://es.aliexpress.com/item/1005005825496564.html) |
| 4 | Battery | 18650 Li-ion 3400mAh | $3.00 | — |
| 5 | Charge Controller | TP4056 USB-C Li-ion charger | $0.50 | AliExpress |
| 6 | Antenna | 433MHz spring antenna (included with Ra-02) | $0.00 | Included |
| 7 | Enclosure | IP65 waterproof box (100×68×50mm) | $3.00 | AliExpress |
| 8 | Mounting | Pole clamp + zip ties + silicone sealant | $2.00 | Local |
| 9 | Misc | SMA pigtail, jumper wires, solder | $1.04 | — |
| | | **Total per gateway** | **$22.70** | |

---

### 🟠 4G Gateway (Backup / Rural) — ~$58.00 + $5–8/mo

> Cellular-connected gateway for areas without WiFi. Uses LilyGo T-SIM7670G-S3 with built-in 4G + GPS.

#### LilyGo T-SIM7670G-S3 — ESP32-S3 + LTE 4G + GPS

> ESP32-S3 + SIM7670G LTE CAT-1 + GPS — cellular IoT module for long-range communication and low-power operation.

![LilyGo T-SIM7670G-S3](images/lilygo-tsim7670g.png)

| Spec | Value |
|------|-------|
| MCU | ESP32-S3 |
| Cellular | SIM7670G LTE CAT-1 |
| GPS | Built-in |
| Battery | 18650 holder |
| Price | **$45.00** |
| 🔗 | [Buy on AliExpress](https://aliexpress.com/item/1005007058444056.html) |

---

#### 4G Gateway Components Summary

| # | Component | Model / Specs | Price | Source |
|---|-----------|---------------|-------|--------|
| 1 | MCU + 4G + GPS | LilyGo T-SIM7670G-S3 (ESP32-S3 + SIM7670G) | $45.00 | [AliExpress](https://aliexpress.com/item/1005007058444056.html) |
| 2 | SIM Card | Claro / Movistar prepaid (Colombia) | $5.00 | Local carrier |
| 3 | Data Plan | 500MB/mo IoT data | $5–8/mo | Local carrier |
| 4 | Battery | 18650 Li-ion 3400mAh | $3.00 | — |
| 5 | Solar Panel | Mini Mono/Poly 3V 150mA 60×55mm | $5.49 | [AliExpress](https://es.aliexpress.com/item/1005005825496564.html) |
| 6 | Enclosure + Antenna | IP65 box + LTE external antenna | $4.50 | AliExpress |
| | | **Total** | **~$58.00** | + $5–8/mo |

---

### 🛠️ Tools & Consumables (One-Time)

| Item | Purpose | Est. Price |
|------|---------|------------|
| Soldering iron + solder | Assembly | $8.00 |
| Breadboard + jumper wires | Prototyping | $3.00 |
| Heat shrink tubing | Wire insulation | $2.00 |
| Multimeter | Testing & debugging | $10.00 |
| USB-C cables (×3) | Programming & charging | $3.00 |
| **Total** | | **$26.00** |

---

## 📡 LoRa Coverage (10 nodes)

| ID | Type | Location | Coverage |
|----|------|----------|----------|
| GW1 | Gateway | Centro (Plaza Bolívar) | 3.5 km |
| GW2 | Gateway | Dosquebradas Centro | 3.0 km |
| GW3 | Gateway | Cuba Industrial | 3.0 km |
| R1 | Repeater | Circunvalar Mall | 2.5 km |
| R2 | Repeater | Universidad Tecnológica | 2.5 km |
| R3 | Repeater | Boston | 2.5 km |
| R4 | Repeater | Kennedy | 2.5 km |
| R5 | Repeater | Perla del Otún | 2.5 km |
| R6 | Repeater | Villa Santana | 2.5 km |
| R7 | Repeater | Alamos | 2.5 km |

**Coverage: ~95% urban | 915 MHz ISM | 2.5–3.5 km/node**

---

## 💰 Cost Summary (10 Vehicles + Infrastructure)

### Full Deployment Budget

| Item | Qty | Unit Cost | Total |
|------|-----|-----------|-------|
| LoRa Node (vehicle unit) | 10 | $48.50 | $485.00 |
| LoRa Gateway | 3 | $22.70 | $68.10 |
| LoRa Repeater (T-Beam) | 7 | $28.00 + $5 mount | $231.00 |
| 4G Gateway (backup) | 1 | $58.00 | $58.00 |
| Tools & Consumables | 1 | $26.00 | $26.00 |
| **Grand Total (one-time)** | | | **$868.10** |
| **Monthly (4G data)** | 1 | $5–8/mo | **$5–8/mo** |

### LoRa vs 4G — 1 Year Cost Comparison (10 Vehicles)

| Metric | LoRa Mesh | 4G LTE |
|--------|-----------|--------|
| One-time | $894 | $668 |
| Monthly | ~$4/mo | ~$54/mo |
| Year Total | **$944** | **$1,316** |
| **Savings** | **$372/yr** | — |

**Break-even: ~4.5 months**

---

## ⚡ Technical Specs

### Sensors

- **CT Clamp (SCT-013-030)**: 30A max, 0–1V AC output, ±1% accuracy, split-core non-invasive
- **BMI160**: ±2000°/s gyro, ±16g accel, 16-bit resolution, I2C/SPI
- **ADS1115**: 16-bit ADC, 860 SPS, 4-channel, programmable gain, I2C

### Microcontrollers

| Board | MCU | Radio | GPS | Battery | Price |
|-------|-----|-------|-----|---------|-------|
| T-Beam V1.2 | ESP32 (240MHz) | SX1262 LoRa 433/868/915MHz | NEO-6M | 18650 + AXP2101 | ~$28 |
| T-SIM 7670G S3 | ESP32-S3 | SIM7670G LTE CAT-1 | Built-in | 18650 | ~$45 |
| ESP32 DevKit V1 | ESP32-WROOM-32 | — (add SX1278) | — | External | ~$3.50 |
| SX1278 Ra-02 | — | LoRa 433MHz, 10km | — | — | ~$4.17 |

### Data Pipeline

```
Vehicle → (every 60s) → Supabase Raw
         ↓
Edge Function → (every 15 min) → Aggregates
         ↓
Realtime WS → Dashboard (live)
```

### JSON Payload

```json
{
  "vehicle_id": "TRUCK-001",
  "ct": { "amps": 12.5, "volts": 12.4, "pf": 0.92 },
  "gyro": { "p": 2.3, "r": -1.2, "y": 45.6, "vib": 0.8 },
  "gps": { "lat": 4.8133, "lng": -75.6961, "spd": 45.2 },
  "meta": { "rssi": -85, "bat": 87 }
}
```

---

## 📊 Dashboard Tabs

| Tab | Content |
|-----|---------|
| 🏗️ Architecture | Isometric diagram with zoom/pan — full legend with all layers, lines, and regions |
| 🗺️ LoRa Map | Leaflet map with 10 coverage nodes |
| 💰 Costs | Full BOM with product images, AliExpress links, and prices |
| ⚡ Specs | Sensor datasheets, MCU comparison, circuit diagram, LoRa params, 3D print specs, data pipeline |
| 🗓️ Roadmap | 5-week day-by-day implementation plan with visual timeline |

### Architecture Legend — Layers & Colors

| Region | Color | Items |
|--------|-------|-------|
| 🔴 IoT Sensors | Red | CT Clamp (SCT-013), ADS1115 ADC, BMI160 Gyro, GPS NEO-6M |
| 🟠 LoRa Mesh | Orange | T-Beam V1.2, ESP32+SX1278, Repeaters, Solar, Battery, 3D Case |
| 🟣 4G LTE | Indigo | T-SIM7670G-S3, Cell Tower, EV Vehicle |
| 🟢 Cloud DB | Green | Supabase PostgreSQL, Realtime WS, Edge Functions |
| 🔵 Frontend | Blue | Hostinger VPS, Dashboard, Map, User Browser |

| Line Color | Connection Type |
|------------|----------------|
| 🔴 Red | Analog 0-1V / I2C Bus (sensor → MCU) |
| 🔵 Blue | I2C 0x68 (BMI160 → MCU) |
| 🩵 Cyan | UART GPS (NEO-6M → MCU) |
| 🟠 Orange | LoRa 915MHz mesh (node → repeater → gateway) |
| 🟣 Indigo | 4G LTE Cat-1 (T-SIM → cell tower → Supabase) |
| 🟢 Green | HTTPS / Realtime WS (gateway ↔ Supabase) |
| 🩶 Teal | 15-min cron (Supabase → Edge Functions) |
| 🟡 Yellow (dashed) | Solar 6V (panel → repeater) |
| 🟩 Lime (dashed) | 3.7V battery backup |
| ⚪ Grey | HTTPS (user browser → dashboard) |

## 🎮 3D Dashboard (dashboard-3d.html)

![3D Dashboard — Tilted View](images/3d%20three%20js%20and%20leaflet%20dashboard%20demo%20screenshot.png)

![3D Dashboard — 2D Flat View](images/3d%20three%20js%20and%20leaflet%20dashboard%20demo%20screenshot%202d%20tilt%20screenshot.png)

- **Three.js** terrain rendering
- **React Three Fiber** vehicle markers
- **Real-time** telemetry gauges (Online, km Today, Alerts, kWh)
- **Time-lapse** route replay
- **Dark mode** toggle
- **Coverage overlay** for LoRa mesh nodes

---

## 🚀 Quick Start

```bash
cd IOT_TELEMETRY_ARCHITECTURE
npm install
npm run dev          # → http://localhost:3334
```

---

## 📁 Project Files

```
IOT_TELEMETRY_ARCHITECTURE/
├── images/
│   ├── circuit-diagrams.png          # Wiring schematic for all sensors + MCU
│   ├── lilygo-tbeam-v12.png         # T-Beam V1.2 product photo
│   ├── lilygo-tsim7670g.png         # T-SIM7670G-S3 product photo
│   ├── sx1278-lora-module.png       # SX1278 Ra-02 LoRa module photo
│   ├── sct013-ct-clamp.png          # SCT-013 CT clamp photo
│   ├── ads1115-adc.png              # ADS1115 ADC module photo
│   └── bmi160-gyroscope.png         # BMI160 IMU module photo
├── iot-telemetry-architecture.json   # Isoflow model (21 items, 21 connectors)
├── index.html                        # Multi-tab report (Architecture, Map, Costs, Specs)
├── dashboard-3d.html                 # 3D Three.js/R3F telemetry dashboard
├── aliexpress materials.txt          # Component sourcing links & prices
├── icon-urls.json                    # Isometric SVG icon URLs
├── package.json                      # npm config
├── serve.js                          # Node HTTP server
├── README.md                         # This file (English)
└── README.es.md                      # Documentación (Español)
```

---

## 🗓️ 5-Week Implementation Roadmap

### Week 1 — Hardware Procurement & Dev Environment Setup

| Day | Task | Deliverable |
|-----|------|-------------|
| 1–2 | Order all components from AliExpress (T-Beam V1.2 ×10, SX1278 Ra-02 ×3, ESP32 DevKit ×3, SCT-013 ×10, ADS1115 ×10, BMI160 ×10, solar panels ×13, batteries ×13, enclosures ×3) | Purchase orders placed |
| 3 | Install Arduino IDE / PlatformIO, ESP32 board support, LoRa libraries (RadioLib, Meshtastic) | Dev environment ready |
| 4 | Set up Supabase project: create tables (`raw_telemetry`, `aggregates`, `vehicles`, `nodes`) | Database schema deployed |
| 5 | Design PCB layout / breadboard wiring for sensor node (CT + ADS1115 + BMI160 → T-Beam) | Wiring diagram finalized |
| 6–7 | Buffer / research Meshtastic firmware & LoRa parameters (SF7–SF12, BW, coding rate) | Parameter selection documented |

### Week 2 — Sensor Integration & Node Firmware

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Wire CT Clamp → burden resistor → ADS1115 → T-Beam (I2C) | CT clamp reading amps correctly |
| 2 | Wire BMI160 → T-Beam (I2C), read pitch/roll/yaw/vibration | Gyro data validated on serial monitor |
| 3 | Integrate GPS (T-Beam built-in NEO-6M), verify lat/lng/speed | GPS fix confirmed |
| 4 | Write unified firmware: read all sensors → build JSON payload → transmit via LoRa | Firmware v0.1 flashed |
| 5 | Add deep sleep + wake-on-timer (60s cycle), measure power consumption | Battery life estimated |
| 6 | Assemble solar charging circuit (panel → TP4056 → 18650 → T-Beam) | Solar charging tested |
| 7 | Assemble 2 complete LoRa node prototypes in enclosures | 2 nodes built & tested |

### Week 3 — LoRa Gateway & Mesh Network

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Assemble gateway: ESP32 DevKit + SX1278 Ra-02 (SPI wiring) | Gateway hardware assembled |
| 2 | Write gateway firmware: receive LoRa packets → parse JSON → POST to Supabase via WiFi | Gateway receiving data |
| 3 | Configure LoRa mesh parameters: 433MHz, SF10, BW 125kHz, CR 4/5 | Optimal settings for 10km |
| 4 | Range test: node ↔ gateway at 1km, 3km, 5km, 10km (open field + urban) | Range test report |
| 5 | Set up 4G backup gateway (T-SIM7670G-S3), test cellular data path | 4G failover working |
| 6 | Deploy Gateway 1 at Centro (Plaza Bolívar) — mount, solar panel, weatherproof | GW1 live |
| 7 | Deploy Gateway 2 at Dosquebradas Centro | GW2 live |

### Week 4 — Backend, Dashboard & Integration

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Write Supabase Edge Function: aggregate raw data every 15 min | Aggregation pipeline running |
| 2 | Set up Supabase Realtime subscriptions for live dashboard updates | WebSocket events verified |
| 3 | Connect `index.html` dashboard to live Supabase data (Architecture, Map, Costs, Specs tabs) | Dashboard showing real data |
| 4 | Connect `dashboard-3d.html` to live data (Three.js vehicle markers on terrain) | 3D dashboard live |
| 5 | Add alerts: over-current (>25A), excessive vibration, geofence breach, low battery (<20%) | Alert system tested |
| 6 | Build vehicle management UI: register vehicles, assign node IDs, view history | Admin panel functional |
| 7 | Deploy Gateway 3 at Cuba Industrial + 4G backup gateway | GW3 + 4G backup live |

### Week 5 — Field Testing, Deployment & Documentation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Flash firmware on all 10 LoRa nodes, pair with vehicle IDs | 10 nodes programmed |
| 2 | Install nodes on 10 test vehicles (mount CT clamp on power cable, secure enclosure) | All vehicles equipped |
| 3 | Deploy 7 repeater nodes across Pereira (R1–R7 locations) | Full mesh network live |
| 4 | Run 48-hour continuous field test — monitor RSSI, packet loss, battery drain, GPS accuracy | Test data collected |
| 5 | Analyze results: optimize SF/power, fix dead zones, tune sleep intervals | Performance report |
| 6 | Write final documentation: setup guide, troubleshooting, API reference | Docs complete |
| 7 | Team demo & handoff — present dashboard, explain maintenance procedures | ✅ **Project delivered** |

### Roadmap Timeline Summary

```
Week 1  ████████████████  Procurement & Setup
Week 2  ████████████████  Sensor Integration & Node Assembly
Week 3  ████████████████  LoRa Gateway & Mesh Network
Week 4  ████████████████  Backend & Dashboard
Week 5  ████████████████  Field Testing & Deployment
        ─────────────────────────────────────────
        Day 1              Day 35 → System Live ✅
```

---

## 📜 License

ISC License — Venus Team
