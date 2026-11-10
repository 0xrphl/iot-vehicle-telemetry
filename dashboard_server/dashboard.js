/**
 * dashboard.js - Part 1
 * SOTA Dual-View Three.js + Dark Leaflet Map + 3D Kart Map Overlay + Telemetry Engine
 */

let scene, camera, renderer, controls, kart;
let mapScene, mapCamera, mapRenderer, mapKart;
let leafletMap, gpsTrackLine, gpsPulseMarker;
let trackCoords = [];

let tareRoll = 0, tarePitch = 0, tareYaw = 0;
let msgCount = 0, lastHzCheck = performance.now();
let latestState = null;
let currentRoll = 0, currentPitch = 0, currentYaw = 0;
let trackSimActive = false;
let simAngle = 0;

// Default base coordinates (Pereira / UTP Campus, Colombia)
let currentLat = 4.79520;
let currentLon = -75.68860;

// 1. Initialize Stage 1: 3D Engineering Studio
function initStudioScene() {
  const container = document.getElementById('viewport-container');
  const canvas = document.getElementById('three-canvas');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060911, 0.075);

  camera = new THREE.PerspectiveCamera(44, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(2.6, 1.7, 3.1);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0.38, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));

  const dir1 = new THREE.DirectionalLight(0x38bdf8, 1.3);
  dir1.position.set(4, 6, 4);
  scene.add(dir1);

  const dir2 = new THREE.DirectionalLight(0xf43f5e, 0.85);
  dir2.position.set(-4, 3, -4);
  scene.add(dir2);

  const grid = new THREE.GridHelper(12, 24, 0x0284c7, 0x1e293b);
  scene.add(grid);

  kart = window.buildKartSkeleton();
  scene.add(kart);
}

// 2. Initialize Stage 2: Dark-Mode Leaflet GPS Map + 3D Three.js Kart Overlay
function initLeafletAndMapKart() {
  leafletMap = L.map('leaflet-map', {
    center: [currentLat, currentLon],
    zoom: 18,
    zoomControl: false
  });

  // 100% Free OpenStreetMap Standard Tiles (No API Key Required!)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(leafletMap);

  gpsTrackLine = L.polyline([], {
    color: '#38bdf8',
    weight: 4,
    opacity: 0.9
  }).addTo(leafletMap);

  gpsPulseMarker = L.circleMarker([currentLat, currentLon], {
    radius: 7,
    color: '#f43f5e',
    fillColor: '#38bdf8',
    fillOpacity: 1,
    weight: 2
  }).addTo(leafletMap);

  // Initialize Transparent 3D Three.js Overlay directly over the Leaflet Map
  const mapContainer = document.getElementById('map-container');
  const mapCanvas = document.getElementById('map-kart-canvas');

  mapScene = new THREE.Scene();
  mapCamera = new THREE.PerspectiveCamera(40, mapContainer.clientWidth / mapContainer.clientHeight, 0.1, 100);
  // Top-down angled chase view so the 3D kart sits over the GPS coordinate on the map
  mapCamera.position.set(0, 4.2, -3.2);
  mapCamera.lookAt(0, 0, 0);

  mapRenderer = new THREE.WebGLRenderer({ canvas: mapCanvas, antialias: true, alpha: true });
  mapRenderer.setSize(mapContainer.clientWidth, mapContainer.clientHeight);
  mapRenderer.setPixelRatio(window.devicePixelRatio);
  mapRenderer.setClearColor(0x000000, 0); // 100% transparent background over dark map

  mapScene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const mapDir = new THREE.DirectionalLight(0x38bdf8, 1.5);
  mapDir.position.set(3, 8, 3);
  mapScene.add(mapDir);

  mapKart = window.buildKartSkeleton();
  mapKart.scale.set(0.65, 0.65, 0.65);
  mapScene.add(mapKart);
}

function onWindowResize() {
  const c1 = document.getElementById('viewport-container');
  if (c1 && camera && renderer) {
    camera.aspect = c1.clientWidth / c1.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(c1.clientWidth, c1.clientHeight);
  }
  const c2 = document.getElementById('map-container');
  if (c2 && mapCamera && mapRenderer) {
    mapCamera.aspect = c2.clientWidth / c2.clientHeight;
    mapCamera.updateProjectionMatrix();
    mapRenderer.setSize(c2.clientWidth, c2.clientHeight);
  }
  if (leafletMap) leafletMap.invalidateSize();
}


function resetCamera() {
  camera.position.set(2.6, 1.7, 3.1);
  controls.target.set(0, 0.38, 0);
  controls.update();
}

function tareOrientation() {
  if (latestState) {
    tareRoll = latestState.roll || 0;
    tarePitch = latestState.pitch || 0;
    tareYaw = latestState.yaw || 0;
  }
}

function toggleTrackSim() {
  trackSimActive = !trackSimActive;
  const btn = document.getElementById('btn-sim');
  if (trackSimActive) {
    btn.classList.add('active');
    btn.innerText = 'STOP TRACK SIM';
  } else {
    btn.classList.remove('active');
    btn.innerText = 'TEST TRACK DRIVE';
  }
}

// 3. Telemetry Strip Charts
const MAX_POINTS = 45;
const labels = Array(MAX_POINTS).fill('');
function createChartConfig(yMin, yMax) {
  return {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { borderColor: '#f43f5e', borderWidth: 1.6, data: Array(MAX_POINTS).fill(0), pointRadius: 0, tension: 0.25 },
        { borderColor: '#10b981', borderWidth: 1.6, data: Array(MAX_POINTS).fill(0), pointRadius: 0, tension: 0.25 },
        { borderColor: '#38bdf8', borderWidth: 1.6, data: Array(MAX_POINTS).fill(0), pointRadius: 0, tension: 0.25 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          min: yMin, max: yMax,
          ticks: { color: '#64748b', font: { size: 9 }, maxTicksLimit: 5 },
          grid: { color: 'rgba(51, 65, 85, 0.4)' }
        }
      }
    }
  };
}

let gyroChart, accChart;

function pushChartPoint(chart, x, y, z) {
  if (!chart) return;
  chart.data.datasets[0].data.push(x);
  chart.data.datasets[0].data.shift();
  chart.data.datasets[1].data.push(y);
  chart.data.datasets[1].data.shift();
  chart.data.datasets[2].data.push(z);
  chart.data.datasets[2].data.shift();
  chart.update();
}

// 4. Process Incoming Telemetry Packet (Supports both Full SOTA JSON & Legacy JSON)
function applyTelemetry(data) {
  latestState = data;
  msgCount++;

  // Timestamps
  if (data.ts) {
    document.getElementById('rtc-clock').innerText = `DS3231 UTC: ${data.ts}`;
  }

  // 18650 Battery Voltage (Strictly Volts & mV, NO percentage!)
  const vbatMv = data.vbat_mv !== undefined ? data.vbat_mv : 3980;
  const vbatV  = data.vbat_v  !== undefined ? data.vbat_v  : (vbatMv / 1000.0);
  const solMv  = data.solar_mv !== undefined ? data.solar_mv : 0;
  document.getElementById('stat-vbat').innerHTML = `${vbatV.toFixed(3)} V <span style="font-size:10px;color:#94a3b8;">(${vbatMv} mV)</span>`;
  document.getElementById('stat-solar').innerHTML = `${solMv} mV <span style="font-size:10px;color:#94a3b8;">(${(solMv/1000).toFixed(2)} V)</span>`;

  // Dual Thermal Sensors (BMI160 Gyro Temp + DS3231 RTC Temp)
  const gTemp = data.gyro_temp !== undefined ? data.gyro_temp : (data.temp !== undefined ? data.temp : 30.2);
  const rTemp = data.rtc_temp  !== undefined ? data.rtc_temp  : (gTemp - 0.3);
  document.getElementById('stat-gtemp').innerText = `${gTemp.toFixed(1)} °C`;
  document.getElementById('stat-rtemp').innerText = `${rTemp.toFixed(2)} °C`;

  // Gyro & Accel
  const gx = data.gx || 0, gy = data.gy || 0, gz = data.gz || 0;
  const ax = data.ax || 0, ay = data.ay || 0, az = data.az !== undefined ? data.az : 1.0;

  document.getElementById('stat-gx').innerText = gx.toFixed(2);
  document.getElementById('stat-gy').innerText = gy.toFixed(2);
  document.getElementById('stat-gz').innerText = gz.toFixed(2);
  document.getElementById('stat-ax').innerText = ax.toFixed(3);
  document.getElementById('stat-ay').innerText = ay.toFixed(3);
  document.getElementById('stat-az').innerText = az.toFixed(3);

  const totalG = Math.sqrt(ax * ax + ay * ay + az * az);
  const peakG  = data.peak_g !== undefined ? data.peak_g : totalG;
  const vibRms = data.vib    !== undefined ? data.vib    : Math.abs(totalG - 1.0);
  document.getElementById('hud-peakg').innerText = peakG.toFixed(2);
  document.getElementById('stat-vib').innerText  = `${vibRms.toFixed(3)} g`;

  // Attitude
  const netRoll  = (data.roll  || 0) - tareRoll;
  const netPitch = (data.pitch || 0) - tarePitch;
  const netYaw   = (data.yaw   || 0) - tareYaw;

  document.getElementById('hud-roll').innerText  = netRoll.toFixed(1);
  document.getElementById('hud-pitch').innerText = netPitch.toFixed(1);
  document.getElementById('hud-yaw').innerText   = ((netYaw % 360 + 360) % 360).toFixed(1);

  // GPS & Map Update
  if (data.lat && data.lon && Math.abs(data.lat) > 0.001 && !trackSimActive) {
    updateMapPosition(data.lat, data.lon, data.spd || 0, data.alt || 1411, data.sats || 8, data.fix || 3);
  } else if (!trackSimActive && Math.abs(gz) > 1.5) {
    // Dead-reckoning micro-movement on map from BMI160 IMU when indoors without satellite lock
    const headingRad = THREE.MathUtils.degToRad(netYaw);
    const step = 0.000004 * (1 + Math.abs(ax) + Math.abs(ay));
    currentLat += Math.cos(headingRad) * step;
    currentLon += Math.sin(headingRad) * step;
    updateMapPosition(currentLat, currentLon, Math.abs(gz) * 0.15, 1411, data.sats || 0, data.fix || 0);
  }

  // SD Card & Cloud Counters
  if (data.sd_ok !== undefined) {
    document.getElementById('stat-sd').innerText = data.sd_ok ? `OK (${data.sd_kb || 0} KB)` : `NO CARD`;
  }
  if (data.cloud !== undefined) {
    document.getElementById('stat-cloud').innerText = `${data.cloud} Sent`;
  }
  if (data.boot !== undefined) {
    document.getElementById('stat-boot').innerText = `Session #${data.boot}`;
  }

  pushChartPoint(gyroChart, gx, gy, gz);
  pushChartPoint(accChart, ax, ay, az);
}


function updateMapPosition(lat, lon, speedKmh, altM, sats, fixMode) {
  currentLat = lat;
  currentLon = lon;
  document.getElementById('hud-coords').innerText = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  document.getElementById('hud-speed').innerText  = speedKmh.toFixed(1);
  document.getElementById('hud-alt').innerText    = Math.round(altM);
  document.getElementById('hud-sats').innerText   = sats;
  document.getElementById('gps-fix-badge').innerText = fixMode >= 2 ? `3D GNSS LOCK (${sats} SVs)` : `IMU DEAD-RECKONING`;

  if (leafletMap && gpsTrackLine && gpsPulseMarker) {
    const pt = [lat, lon];
    trackCoords.push(pt);
    if (trackCoords.length > 180) trackCoords.shift();
    gpsTrackLine.setLatLngs(trackCoords);
    gpsPulseMarker.setLatLng(pt);
    leafletMap.panTo(pt, { animate: false });
  }
}

function connectWebSocket() {
  const wsDot  = document.getElementById('ws-dot');
  const wsText = document.getElementById('ws-text');

  const isDirectESP = (window.location.port === '' || window.location.port === '80');
  const targetPort  = isDirectESP ? 81 : 8081;
  const wsUrl = `ws://${window.location.hostname || '127.0.0.1'}:${targetPort}`;

  wsText.innerText = `Connecting (:${targetPort})...`;
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    wsDot.classList.add('ok');
    wsText.innerText = `LIVE STREAM (:${targetPort})`;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      applyTelemetry(data);
    } catch (e) {}
  };

  ws.onclose = () => {
    wsDot.classList.remove('ok');
    wsText.innerText = 'Reconnecting...';
    setTimeout(connectWebSocket, 1500);
  };

  ws.onerror = () => ws.close();
}

function animate() {
  requestAnimationFrame(animate);

  if (trackSimActive) {
    simAngle += 0.018;
    const simLat = 4.79520 + Math.sin(simAngle) * 0.00085;
    const simLon = -75.68860 + Math.cos(simAngle * 0.5) * 0.00120;
    const courseRad = Math.atan2(
      -0.5 * Math.sin(simAngle * 0.5) * 0.00120,
      Math.cos(simAngle) * 0.00085
    );
    const courseDeg = THREE.MathUtils.radToDeg(courseRad);
    updateMapPosition(simLat, simLon, 28.4 + Math.sin(simAngle * 2) * 6.5, 1412, 11, 3);

    if (!latestState) {
      applyTelemetry({
        ts: new Date().toISOString().slice(0, 19) + 'Z',
        vbat_mv: 4085, vbat_v: 4.085, solar_mv: 4920,
        gyro_temp: 30.3, rtc_temp: 29.85,
        ax: Math.sin(simAngle) * 0.35, ay: Math.cos(simAngle) * 0.22, az: 1.01,
        gx: Math.cos(simAngle) * 14.5, gy: Math.sin(simAngle) * 8.2, gz: Math.cos(simAngle * 0.5) * 38.0,
        roll: Math.sin(simAngle) * 8.5, pitch: Math.cos(simAngle * 2) * 3.2, yaw: courseDeg,
        sd_ok: 1, sd_kb: 148, cloud: 42, boot: 3
      });
    } else {
      latestState.yaw = courseDeg;
    }
  }

  if (latestState && kart) {
    const targetRoll  = THREE.MathUtils.degToRad((latestState.roll  || 0) - tareRoll);
    const targetPitch = THREE.MathUtils.degToRad((latestState.pitch || 0) - tarePitch);
    const targetYaw   = THREE.MathUtils.degToRad((latestState.yaw   || 0) - tareYaw);

    currentRoll  += (targetRoll  - currentRoll)  * 0.25;
    currentPitch += (targetPitch - currentPitch) * 0.25;
    currentYaw   += (targetYaw   - currentYaw)   * 0.25;

    kart.rotation.set(-currentPitch, currentYaw, currentRoll, 'YXZ');
    if (mapKart) mapKart.rotation.set(-currentPitch, currentYaw, currentRoll, 'YXZ');

    const steerAngle = THREE.MathUtils.clamp(-(latestState.gz || 0) * 0.006, -0.42, 0.42);
    [kart, mapKart].forEach((k) => {
      if (k && k.userData.leftFrontWheel && k.userData.rightFrontWheel) {
        k.userData.leftFrontWheel.rotation.y  = steerAngle;
        k.userData.rightFrontWheel.rotation.y = steerAngle;
      }
    });
  }

  const now = performance.now();
  if (now - lastHzCheck >= 1000) {
    const hz = Math.round((msgCount * 1000) / (now - lastHzCheck));
    document.getElementById('stat-hz').innerText = `${hz} Hz`;
    msgCount = 0;
    lastHzCheck = now;
  }

  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (mapRenderer && mapScene && mapCamera) mapRenderer.render(mapScene, mapCamera);
}

window.addEventListener('DOMContentLoaded', () => {
  gyroChart = new Chart(document.getElementById('gyroChart'), createChartConfig(-220, 220));
  accChart  = new Chart(document.getElementById('accChart'),  createChartConfig(-2.2, 2.2));
  initStudioScene();
  initLeafletAndMapKart();
  window.addEventListener('resize', onWindowResize);
  connectWebSocket();
  animate();
});
