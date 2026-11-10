/**
 * kart_model.js - Part 1
 * 30mm Profile Tube Electric Delta-Trike Long-Kart Skeleton
 * Outer tube diameter = 30mm (radius = 0.015m)
 */
(function(global) {
  'use strict';

  const TUBE_RADIUS = 0.015; // 30 mm diameter tube

  function createTube(p1, p2, material) {
    const v1 = new THREE.Vector3().copy(p1);
    const v2 = new THREE.Vector3().copy(p2);
    const dist = v1.distanceTo(v2);
    if (dist < 0.001) return new THREE.Group();

    const geometry = new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, dist, 12, 1, false);
    const mesh = new THREE.Mesh(geometry, material);

    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    mesh.position.copy(mid);

    const dir = new THREE.Vector3().subVectors(v2, v1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    mesh.quaternion.copy(quat);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createWheel(radius, width, rimMaterial, tireMaterial) {
    const group = new THREE.Group();

    const tireGeom = new THREE.CylinderGeometry(radius, radius, width, 24);
    const tire = new THREE.Mesh(tireGeom, tireMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    group.add(tire);

    const rimGeom = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, width * 1.05, 16);
    const rim = new THREE.Mesh(rimGeom, rimMaterial);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spokeGeom = new THREE.CylinderGeometry(0.008, 0.008, radius * 1.1, 8);
      const spoke = new THREE.Mesh(spokeGeom, rimMaterial);
      spoke.rotation.x = Math.PI / 2;
      spoke.rotation.y = angle;
      group.add(spoke);
    }
    return group;

(function(global) {
  'use strict';

  function buildKartSkeleton() {
    const kartRoot = new THREE.Group();

    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.85,
      roughness: 0.25
    });
    const crossTubeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.3
    });
    const rollCageMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      metalness: 0.7,
      roughness: 0.35
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
      metalness: 0.1
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15
    });

    const W_FRONT = 0.52;
    const W_MAIN  = 0.32;
    const Z_FRONT = 1.05;
    const Z_MID_F = 0.40;
    const Z_SEAT  = -0.30;
    const Z_REAR_BOX = -0.75;
    const Z_REAR  = -1.15;
    const Y_FLOOR = 0.14;
    const Y_UPPER = 0.44;
    const Y_CAGE  = 0.92;

    // 1. Lower rails & cross members
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(W_MAIN, Y_FLOOR, Z_REAR_BOX), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_REAR_BOX), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(0.18, Y_FLOOR, Z_FRONT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(-0.18, Y_FLOOR, Z_FRONT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(0.18, Y_FLOOR, Z_FRONT), new THREE.Vector3(-0.18, Y_FLOOR, Z_FRONT), crossTubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_MID_F), crossTubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_SEAT), new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_SEAT), crossTubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_REAR_BOX), new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_REAR_BOX), crossTubeMat));

    // 2. Upper rails & struts
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_UPPER, Z_MID_F), new THREE.Vector3(W_MAIN, Y_UPPER, Z_REAR_BOX), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_UPPER, Z_MID_F), new THREE.Vector3(-W_MAIN, Y_UPPER, Z_REAR_BOX), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(W_MAIN, Y_UPPER, Z_MID_F), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(-W_MAIN, Y_UPPER, Z_MID_F), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_SEAT), new THREE.Vector3(W_MAIN, Y_UPPER, Z_SEAT), tubeMat));

    // 3. Rear swingarm for single rear wheel
    const W_REAR_HUB = 0.09;
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_REAR_BOX), new THREE.Vector3(W_REAR_HUB, Y_FLOOR + 0.04, Z_REAR), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_REAR_BOX), new THREE.Vector3(-W_REAR_HUB, Y_FLOOR + 0.04, Z_REAR), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_UPPER, Z_REAR_BOX), new THREE.Vector3(W_REAR_HUB, Y_FLOOR + 0.04, Z_REAR), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_UPPER, Z_REAR_BOX), new THREE.Vector3(-W_REAR_HUB, Y_FLOOR + 0.04, Z_REAR), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_REAR_HUB, Y_FLOOR + 0.04, Z_REAR), new THREE.Vector3(-W_REAR_HUB, Y_FLOOR + 0.04, Z_REAR), crossTubeMat));

    // 4. Front suspension outriggers for 2 front wheels
    kartRoot.add(global.createTube(new THREE.Vector3(0.18, Y_FLOOR, Z_FRONT), new THREE.Vector3(W_FRONT - 0.05, Y_FLOOR, Z_FRONT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-0.18, Y_FLOOR, Z_FRONT), new THREE.Vector3(-W_FRONT + 0.05, Y_FLOOR, Z_FRONT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(W_FRONT - 0.05, Y_FLOOR, Z_FRONT), crossTubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_MID_F), new THREE.Vector3(-W_FRONT + 0.05, Y_FLOOR, Z_FRONT), crossTubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(0.18, Y_UPPER * 0.7, Z_FRONT), new THREE.Vector3(W_FRONT - 0.05, Y_UPPER * 0.7, Z_FRONT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-0.18, Y_UPPER * 0.7, Z_FRONT), new THREE.Vector3(-W_FRONT + 0.05, Y_UPPER * 0.7, Z_FRONT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_FRONT - 0.05, Y_FLOOR, Z_FRONT), new THREE.Vector3(W_FRONT - 0.05, Y_UPPER * 0.7, Z_FRONT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_FRONT + 0.05, Y_FLOOR, Z_FRONT), new THREE.Vector3(-W_FRONT + 0.05, Y_UPPER * 0.7, Z_FRONT), tubeMat));

    // 5. 30mm Roll Cage Hoops
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_UPPER, Z_SEAT), new THREE.Vector3(0.20, Y_CAGE, Z_SEAT - 0.05), rollCageMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_UPPER, Z_SEAT), new THREE.Vector3(-0.20, Y_CAGE, Z_SEAT - 0.05), rollCageMat));
    kartRoot.add(global.createTube(new THREE.Vector3(0.20, Y_CAGE, Z_SEAT - 0.05), new THREE.Vector3(-0.20, Y_CAGE, Z_SEAT - 0.05), rollCageMat));
    kartRoot.add(global.createTube(new THREE.Vector3(0.20, Y_CAGE, Z_SEAT - 0.05), new THREE.Vector3(W_MAIN, Y_UPPER, Z_REAR_BOX), rollCageMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-0.20, Y_CAGE, Z_SEAT - 0.05), new THREE.Vector3(-W_MAIN, Y_UPPER, Z_REAR_BOX), rollCageMat));

    // Steering Column & Wheel
    kartRoot.add(global.createTube(new THREE.Vector3(0, Y_FLOOR, Z_MID_F), new THREE.Vector3(0, Y_UPPER * 1.1, Z_MID_F - 0.15), tubeMat));
    const steerWheelGeom = new THREE.TorusGeometry(0.12, 0.012, 10, 24);
    const steerWheel = new THREE.Mesh(steerWheelGeom, tubeMat);
    steerWheel.position.set(0, Y_UPPER * 1.1, Z_MID_F - 0.15);
    steerWheel.rotation.x = Math.PI / 4;
    kartRoot.add(steerWheel);

    // 6. Wheels (2 Front, 1 Rear)
    const frontRadius = 0.18;
    const frontWidth  = 0.11;
    const rearRadius  = 0.22;
    const rearWidth   = 0.14;

    const leftFrontWheel = global.createWheel(frontRadius, frontWidth, rimMat, tireMat);
    leftFrontWheel.position.set(W_FRONT, frontRadius, Z_FRONT);
    kartRoot.add(leftFrontWheel);

    const rightFrontWheel = global.createWheel(frontRadius, frontWidth, rimMat, tireMat);
    rightFrontWheel.position.set(-W_FRONT, frontRadius, Z_FRONT);
    kartRoot.add(rightFrontWheel);

    const rearWheel = global.createWheel(rearRadius, rearWidth, rimMat, tireMat);
    rearWheel.position.set(0, rearRadius, Z_REAR);
    kartRoot.add(rearWheel);

    kartRoot.userData = { leftFrontWheel, rightFrontWheel, rearWheel };
    return kartRoot;
  }

  global.buildKartSkeleton = buildKartSkeleton;
})(window);

    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_SEAT), new THREE.Vector3(-W_MAIN, Y_UPPER, Z_SEAT), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_FLOOR, Z_REAR_BOX), new THREE.Vector3(W_MAIN, Y_UPPER, Z_REAR_BOX), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(-W_MAIN, Y_FLOOR, Z_REAR_BOX), new THREE.Vector3(-W_MAIN, Y_UPPER, Z_REAR_BOX), tubeMat));
    kartRoot.add(global.createTube(new THREE.Vector3(W_MAIN, Y_UPPER, Z_REAR_BOX), new THREE.Vector3(-W_MAIN, Y_UPPER, Z_REAR_BOX), crossTubeMat));

  }

  global.createTube = createTube;
  global.createWheel = createWheel;
})(window);
