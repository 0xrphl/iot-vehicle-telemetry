/**
 * embedded_dashboard.h - Part 1
 * Full 3D Three.js + Dark Leaflet Map + Telemetry Dashboard served directly from ESP32 IP (http://<ESP32_IP>/)
 */
#ifndef EMBEDDED_DASHBOARD_H
#define EMBEDDED_DASHBOARD_H

#include <Arduino.h>

const char KART_EMBEDDED_HTML[] PROGMEM = R"rawliteral(<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ESP32-S3 Direct 3D Kart & GPS Dashboard</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script src="https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:sans-serif}
    body{background:#060911;color:#f1f5f9;height:100vh;display:flex;flex-direction:column;overflow:hidden}
    header{height:48px;background:#0d1322;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 14px}
    .b{background:#0284c7;color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:4px}
    .grid{flex:1;display:grid;grid-template-columns:1fr 1fr 330px;gap:8px;padding:8px;overflow:hidden}
    .box{position:relative;background:rgba(15,23,42,0.75);border:1px solid rgba(56,189,248,0.25);border-radius:10px;overflow:hidden}
    #c3d,#map{width:100%;height:100%;display:block}
    .leaflet-tile{filter:brightness(0.65) invert(1) contrast(3) hue-rotate(200deg) saturate(0.35)}
    .side{display:flex;flex-direction:column;gap:8px;overflow-y:auto}
    .card{background:rgba(15,23,42,0.8);border:1px solid rgba(56,189,248,0.22);border-radius:10px;padding:10px}
    .lbl{font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:6px}
    .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;text-align:center}
    .p{background:#090d16;border:1px solid #1e293b;border-radius:6px;padding:5px}
    .p .k{font-size:9px;color:#64748b;font-weight:700}
    .p .v{font-size:13px;font-weight:800;color:#38bdf8;margin-top:2px}
  </style>
</head>
<body>
  <header>
    <div><span class="b">ESP32-S3 DIRECT IP</span> <b style="font-size:14px;margin-left:6px">30mm Tube Delta-Kart Live Telemetry</b></div>
    <div id="st" style="font-size:12px;color:#10b981;font-weight:700">WS: Connecting...</div>
  </header>
  <div class="grid">
    <div class="box"><canvas id="c3d"></canvas></div>
    <div class="box"><div id="map"></div></div>
    <div class="side">
      <div class="card">
        <div class="lbl">18650 Battery (No %) &amp; Temperatures</div>
        <div class="g3">
          <div class="p"><div class="k">18650 V / mV</div><div class="v" id="vb" style="color:#10b981">-- V</div></div>
          <div class="p"><div class="k">Gyro Temp</div><div class="v" id="gt" style="color:#f43f5e">-- °C</div></div>
          <div class="p"><div class="k">RTC Temp</div><div class="v" id="rt">-- °C</div></div>
        </div>
      </div>
      <div class="card">
        <div class="lbl">3D Attitude (Roll / Pitch / Yaw)</div>
        <div class="g3">
          <div class="p"><div class="k">Roll</div><div class="v" id="ro">0.0°</div></div>
          <div class="p"><div class="k">Pitch</div><div class="v" id="pi">0.0°</div></div>
          <div class="p"><div class="k">Yaw</div><div class="v" id="ya">0.0°</div></div>
        </div>
      </div>
      <div class="card">
        <div class="lbl">BMI160 Gyroscope (deg/s)</div>
        <div class="g3">
          <div class="p"><div class="k">Gx</div><div class="v" id="gx">0.0</div></div>
          <div class="p"><div class="k">Gy</div><div class="v" id="gy">0.0</div></div>
          <div class="p"><div class="k">Gz</div><div class="v" id="gz">0.0</div></div>
        </div>
      </div>
      <div class="card">
        <div class="lbl">BMI160 Accelerometer (g)</div>
        <div class="g3">
          <div class="p"><div class="k">Ax</div><div class="v" id="ax">0.00</div></div>
          <div class="p"><div class="k">Ay</div><div class="v" id="ay">0.00</div></div>
          <div class="p"><div class="k">Az</div><div class="v" id="az">1.00</div></div>
        </div>
      </div>
      <div class="card">
        <div class="lbl">32GB MicroSD &amp; Supabase Cloud</div>
        <div class="g3">
          <div class="p"><div class="k">SD Log</div><div class="v" id="sd">0 KB</div></div>
          <div class="p"><div class="k">Cloud Rows</div><div class="v" id="cl">0</div></div>
          <div class="p"><div class="k">GPS Sats</div><div class="v" id="sa">0</div></div>
        </div>
      </div>
      <div class="card">
        <div class="lbl">Parametric Boot Self-Test (BIST)</div>
        <div class="g3" id="bist">
          <div class="p"><div class="k">Wi-Fi</div><div class="v" id="t-wifi">OK</div></div>
          <div class="p"><div class="k">4G LTE</div><div class="v" id="t-4g">OK</div></div>
          <div class="p"><div class="k">BMI160</div><div class="v" id="t-imu">OK</div></div>
          <div class="p"><div class="k">18650</div><div class="v" id="t-bat">OK</div></div>
          <div class="p"><div class="k">DS3231</div><div class="v" id="t-rtc">OK</div></div>
          <div class="p"><div class="k">32GB SD</div><div class="v" id="t-sd">OK</div></div>
        </div>
      </div>
    </div>
  </div>
)rawliteral"

R"rawliteral(
  <script>
    const c=document.getElementById('c3d'),box=c.parentElement;
    const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,box.clientWidth/box.clientHeight,0.1,100);
    cam.position.set(2.4,1.6,2.8);
    const ren=new THREE.WebGLRenderer({canvas:c,antialias:true});
    ren.setSize(box.clientWidth,box.clientHeight);
    new THREE.OrbitControls(cam,ren.domElement);
    sc.add(new THREE.AmbientLight(0xffffff,0.8));
    const dl=new THREE.DirectionalLight(0x38bdf8,1.4);dl.position.set(4,6,4);sc.add(dl);
    sc.add(new THREE.GridHelper(10,20,0x0284c7,0x1e293b));
    const kart=new THREE.Group();sc.add(kart);
    function tube(p1,p2,col){
      const v1=new THREE.Vector3(...p1),v2=new THREE.Vector3(...p2),d=v1.distanceTo(v2);
      const m=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,d,10),new THREE.MeshStandardMaterial({color:col,metalness:0.8,roughness:0.2}));
      m.position.copy(v1.clone().add(v2).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v2.clone().sub(v1).normalize());
      kart.add(m);
    }
    [[[0.32,0.14,0.4],[0.32,0.14,-0.75],0x38bdf8],[[-0.32,0.14,0.4],[-0.32,0.14,-0.75],0x38bdf8],
     [[0.32,0.14,0.4],[0.18,0.14,1.05],0x38bdf8],[[-0.32,0.14,0.4],[-0.18,0.14,1.05],0x38bdf8],
     [[0.32,0.44,-0.3],[0.2,0.92,-0.35],0xf43f5e],[[-0.32,0.44,-0.3],[-0.2,0.92,-0.35],0xf43f5e],
     [[0.2,0.92,-0.35],[-0.2,0.92,-0.35],0xf43f5e],[[0.32,0.14,-0.75],[0.09,0.18,-1.15],0x38bdf8],
     [[-0.32,0.14,-0.75],[-0.09,0.18,-1.15],0x38bdf8],[[0.18,0.14,1.05],[0.48,0.14,1.05],0x38bdf8],
     [[-0.18,0.14,1.05],[-0.48,0.14,1.05],0x38bdf8]].forEach(s=>tube(s[0],s[1],s[2]));
    [[0.52,0.18,1.05],[-0.52,0.18,1.05],[0,0.22,-1.15]].forEach(p=>{
      const w=new THREE.Mesh(new THREE.CylinderGeometry(p[1],p[1],0.12,20),new THREE.MeshStandardMaterial({color:0x18181b}));
      w.rotation.z=Math.PI/2;w.position.set(...p);kart.add(w);
    });
    const map=L.map('map',{center:[4.7952,-75.6886],zoom:17,zoomControl:false});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const mk=L.circleMarker([4.7952,-75.6886],{radius:7,color:'#f43f5e',fillColor:'#38bdf8',fillOpacity:1}).addTo(map);
    let r=0,p=0,y=0;
    function anim(){requestAnimationFrame(anim);kart.rotation.set(-p,y,r,'YXZ');ren.render(sc,cam);}anim();
    function conn(){
      const ws=new WebSocket('ws://'+location.hostname+':81');
      ws.onopen=()=>document.getElementById('st').innerText='WS: LIVE (:81)';
      ws.onmessage=e=>{
        const d=JSON.parse(e.data);
        r=(d.roll||0)*Math.PI/180;p=(d.pitch||0)*Math.PI/180;y=(d.yaw||0)*Math.PI/180;
        document.getElementById('vb').innerText=(d.vbat_v||0).toFixed(2)+'V ('+(d.vbat_mv||0)+'mV)';
        document.getElementById('gt').innerText=(d.gyro_temp||0).toFixed(1)+'°C';
        document.getElementById('rt').innerText=(d.rtc_temp||0).toFixed(1)+'°C';
        document.getElementById('ro').innerText=(d.roll||0).toFixed(1)+'°';
        document.getElementById('pi').innerText=(d.pitch||0).toFixed(1)+'°';
        document.getElementById('ya').innerText=(d.yaw||0).toFixed(1)+'°';
        document.getElementById('gx').innerText=(d.gx||0).toFixed(1);
        document.getElementById('gy').innerText=(d.gy||0).toFixed(1);
        document.getElementById('gz').innerText=(d.gz||0).toFixed(1);
        document.getElementById('ax').innerText=(d.ax||0).toFixed(2);
        document.getElementById('ay').innerText=(d.ay||0).toFixed(2);
        document.getElementById('az').innerText=(d.az||0).toFixed(2);
        document.getElementById('sd').innerText=(d.sd_kb||0)+' KB';
        document.getElementById('cl').innerText=(d.cloud||0);
        document.getElementById('sa').innerText=(d.sats||0);
        if(d.lat&&Math.abs(d.lat)>0.01){mk.setLatLng([d.lat,d.lon]);map.panTo([d.lat,d.lon]);}
      };
      ws.onclose=()=>setTimeout(conn,1500);
    }conn();
    fetch('/test').then(r=>r.json()).then(t=>{
      const setB=(id,obj)=>{const el=document.getElementById(id);if(el&&obj){el.innerText=obj.ok?'PASS':'CHK';el.style.color=obj.ok?'#10b981':'#f59e0b';}};
      setB('t-wifi',t.wifi);setB('t-4g',t['4g_lte']);setB('t-imu',t.gyro_bmi160);
      setB('t-bat',t.battery_18650);setB('t-rtc',t.rtc_ds3231);setB('t-sd',t.sd_32gb);
    }).catch(()=>{});
  </script>
</body>
</html>)rawliteral";

#endif
