import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("stage");
window.__energy3DBooted = false;
const bootHintEl = document.getElementById("bootHint");
if (bootHintEl) {
  bootHintEl.hidden = true;
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = false;
renderer.physicallyCorrectLights = false;
renderer.setClearColor(0x020609, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020609);
scene.fog = new THREE.FogExp2(0x020609, 0.0092);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 260);
const HOME_CAMERA_POSITION = new THREE.Vector3(-28, 46, 34);
const HOME_CAMERA_TARGET = new THREE.Vector3(2, 1.2, -2);
camera.position.copy(HOME_CAMERA_POSITION);
camera.lookAt(HOME_CAMERA_TARGET);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME_CAMERA_TARGET);
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 10;
controls.maxDistance = 160;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = true;
controls.update();

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envTexture = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.02).texture;
scene.environment = envTexture;

const hemiLight = new THREE.HemisphereLight(0xb6c8df, 0x111a26, 1.9);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xe4ecff, 6.4);
keyLight.position.set(30, 52, 16);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(4096, 4096);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 160;
keyLight.shadow.camera.left = -60;
keyLight.shadow.camera.right = 60;
keyLight.shadow.camera.top = 60;
keyLight.shadow.camera.bottom = -60;
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x5b7fb2, 82, 210, 2.1);
fillLight.position.set(-20, 12, -14);
scene.add(fillLight);

const coolLight = new THREE.PointLight(0x6ea0d2, 58, 210, 2);
coolLight.position.set(22, 16, 24);
scene.add(coolLight);

const softAmbient = new THREE.AmbientLight(0x7d97b5, 0.72);
scene.add(softAmbient);

const palette = {
  steelDark: 0x2d3440,
  steelMid: 0x4d5968,
  steelLight: 0x8592a2,
  panelBlue: 0x2d3e58,
  glassBlue: 0x6caad8,
  accentBlue: 0x3ea7ff,
  accentCyan: 0x4fc3ff,
  accentAmber: 0xf3ae52,
  flowDC: 0x4ea8ff,
  flowAC: 0xf2857f,
  flowStorage: 0x68c89a
};

function metal(color, emissive = 0x000000, emissiveIntensity = 0.04, roughness = 0.34, metalness = 0.9) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.4,
    emissive,
    emissiveIntensity
  });
}

function glass(color, emissive = 0x2e5c84) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transmission: 0.58,
    transparent: true,
    opacity: 0.9,
    roughness: 0.08,
    metalness: 0.05,
    ior: 1.33,
    thickness: 0.3,
    envMapIntensity: 1.6,
    emissive,
    emissiveIntensity: 0.1
  });
}

function createIndustrialCampus() {
  const campus = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    metal(0x040810, 0x08111e, 0.08, 0.16, 0.94)
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -1.24;
  outer.receiveShadow = true;
  campus.add(outer);

  const outerGrid = new THREE.GridHelper(260, 32, 0x1a2e48, 0x0f1e30);
  outerGrid.position.y = -1.19;
  outerGrid.material.opacity = 0.38;
  outerGrid.material.transparent = true;
  campus.add(outerGrid);

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(106, 1.4, 76, 8, 0.9),
    metal(0x060c18, 0x0a1624, 0.12, 0.22, 0.96)
  );
  base.position.y = -0.8;
  base.receiveShadow = true;
  campus.add(base);

  // Reflective deck surface
  const deckMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1120,
    metalness: 0.96,
    roughness: 0.10,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2.2,
    emissive: 0x0d1a2c,
    emissiveIntensity: 0.06
  });
  const deck = new THREE.Mesh(
    new RoundedBoxGeometry(98, 0.16, 68, 8, 0.45),
    deckMat
  );
  deck.position.y = 0.02;
  deck.receiveShadow = true;
  campus.add(deck);

  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0x2b3850,
    transparent: true,
    opacity: 0.06
  });

  for (let x = -48; x <= 48; x += 2.5) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 68), gridMaterial);
    line.position.set(x, 0.13, 0);
    campus.add(line);
  }

  for (let z = -33; z <= 33; z += 2.5) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(98, 0.01, 0.03), gridMaterial);
    line.position.set(0, 0.13, z);
    campus.add(line);
  }

  return campus;
}

scene.add(createIndustrialCampus());

const deviceInfo = {
  pv: {
    name: "光伏组件",
    desc: "固定式光伏阵列，标准倾角布置并通过汇流箱输出直流电。",
    in: "11.04 kW",
    out: "10.71 kW",
    temp: "37.8°C",
    health: "97%",
    note: "光伏阵列作为主发电源之一，持续向直流中心送电。"
  },
  wind: {
    name: "风电机组",
    desc: "三叶水平轴风机，含塔筒、机舱与桨叶系统。",
    in: "6.82 kW",
    out: "6.34 kW",
    temp: "42.1°C",
    health: "95%",
    note: "风机输出参与可再生协同供能，补充直流侧输入。"
  },
  storage: {
    name: "储能系统",
    desc: "集装箱式电池簇，带温控与BMS机柜。",
    in: "3.20 kW",
    out: "2.76 kW",
    temp: "31.6°C",
    health: "99%",
    note: "储能系统执行充放电平衡，削峰填谷并稳定母线。"
  },
  dc_center: {
    name: "直流中心",
    desc: "汇流与保护核心单元，负责多路直流分配。",
    in: "17.05 kW",
    out: "16.62 kW",
    temp: "39.4°C",
    health: "98%",
    note: "直流中心承担源侧汇集与负载侧分发。"
  },
  inverter: {
    name: "逆变器",
    desc: "高功率并网逆变机柜，完成DC/AC变换。",
    in: "10.96 kW",
    out: "10.90 kW",
    temp: "41.2°C",
    health: "98%",
    note: "逆变器作为主变换节点，将直流电转为交流电。"
  },
  booster: {
    name: "升压站",
    desc: "包含主变与开关设备，执行交流升压并网。",
    in: "10.90 kW",
    out: "10.78 kW",
    temp: "36.9°C",
    health: "97%",
    note: "升压站将交流侧能量升压后送入电网。"
  },
  grid: {
    name: "电网接口",
    desc: "并网连接节点，承担外部电网互联与反送。",
    in: "10.78 kW",
    out: "4.86 kW",
    temp: "29.4°C",
    health: "99%",
    note: "并网接口与交流配电侧保持双向调节能力。"
  },
  dc_cabinet: {
    name: "直流配电柜",
    desc: "直流回路分配与保护柜，含断路与监测模块。",
    in: "5.66 kW",
    out: "5.34 kW",
    temp: "35.1°C",
    health: "97%",
    note: "直流配电柜将能量按回路输送到快充终端。"
  },
  dc_charger: {
    name: "直流充电站",
    desc: "高功率直流快充终端，包含双枪模块。",
    in: "5.34 kW",
    out: "5.18 kW",
    temp: "38.7°C",
    health: "96%",
    note: "直流充电站直接接入直流侧，降低变换损耗。"
  },
  ac_cabinet: {
    name: "交流配电柜",
    desc: "交流侧汇流与分路系统，包含保护与计量模块。",
    in: "9.28 kW",
    out: "8.90 kW",
    temp: "34.5°C",
    health: "98%",
    note: "交流配电柜接收并网与逆变双路供能。"
  },
  ac_charger: {
    name: "交流充电站",
    desc: "交流慢充终端，适配常规负荷。",
    in: "8.90 kW",
    out: "8.52 kW",
    temp: "33.9°C",
    health: "98%",
    note: "交流充电站为末端负荷提供稳定补能能力。"
  },
  weather: {
    name: "气象站",
    desc: "环境传感站，采集辐照、风速和温湿度。",
    in: "--",
    out: "Data",
    temp: "26.3°C",
    health: "99%",
    note: "气象站为发电预测与运行策略提供数据输入。"
  }
};

const devicePositions = {
  pv:         new THREE.Vector3(-30.0, 0.2,  4.0),
  wind:       new THREE.Vector3(-38.0, 0.2, -2.0),
  storage:    new THREE.Vector3(  2.0, 0.2,-21.0),
  dc_center:  new THREE.Vector3(  0.0, 0.2,  0.0),
  inverter:   new THREE.Vector3( 14.0, 0.2,  0.0),
  booster:    new THREE.Vector3( 26.0, 0.2, -4.0),
  grid:       new THREE.Vector3( 38.0, 0.2,-10.0),
  dc_cabinet: new THREE.Vector3( -2.0, 0.2, 13.0),
  dc_charger: new THREE.Vector3( -7.0, 0.2, 24.0),
  ac_cabinet: new THREE.Vector3( 14.0, 0.2, 13.0),
  ac_charger: new THREE.Vector3( 10.0, 0.2, 24.0),
  weather:    new THREE.Vector3( 34.0, 0.2,  8.0)
};

const deviceOrder = [
  "pv",
  "wind",
  "storage",
  "dc_center",
  "inverter",
  "booster",
  "grid",
  "dc_cabinet",
  "dc_charger",
  "ac_cabinet",
  "ac_charger",
  "weather"
];

const _MODEL_BASE = "https://github.com/lwk9161-cell/codex-3D/releases/download/v1.0-models/";
const deviceModelUrls = {
  pv: _MODEL_BASE + "pv.glb",
  wind: _MODEL_BASE + "wind.glb",
  storage: _MODEL_BASE + "storage.glb",
  dc_center: _MODEL_BASE + "dc_center.glb",
  inverter: _MODEL_BASE + "inverter.glb",
  booster: _MODEL_BASE + "booster.glb",
  grid: _MODEL_BASE + "grid.glb",
  dc_cabinet: _MODEL_BASE + "dc_cabinet.glb",
  dc_charger: _MODEL_BASE + "dc_charger.glb",
  ac_cabinet: _MODEL_BASE + "ac_cabinet.glb",
  ac_charger: _MODEL_BASE + "ac_charger.glb",
  weather: _MODEL_BASE + "weather.glb"
};

const deviceModelTuning = {
  pv: { footprint: 6.4, height: 2.5, yaw: Math.PI * 0.84, accent: 0x6caad8, yOffset: 0.02 },
  wind: { footprint: 4.5, height: 10.4, yaw: Math.PI * 0.48, accent: 0x8ca8c1, yOffset: 0.04 },
  storage: { footprint: 4.9, height: 4.2, yaw: Math.PI * 0.98, accent: 0x6f8fa8, yOffset: 0.06 },
  dc_center: { footprint: 5.2, height: 4.4, yaw: Math.PI * 0.98, accent: 0x6f9bc7, yOffset: 0.03 },
  inverter: { footprint: 5.2, height: 4.4, yaw: Math.PI * 0.98, accent: 0x7ca5cf, yOffset: 0.03 },
  booster: { footprint: 6.2, height: 4.8, yaw: Math.PI * 1.02, accent: 0xb18d89, yOffset: 0.05 },
  grid: { footprint: 4.8, height: 6.4, yaw: Math.PI * 0.86, accent: 0xb18d89, yOffset: 0.05 },
  dc_cabinet: { footprint: 4.3, height: 3.8, yaw: Math.PI * 0.98, accent: 0x6f9bc7, yOffset: 0.04 },
  dc_charger: { footprint: 3.9, height: 3.6, yaw: Math.PI * 0.98, accent: 0x6f9bc7, yOffset: 0.04 },
  ac_cabinet: { footprint: 4.3, height: 3.8, yaw: Math.PI * 0.98, accent: 0xaf8a86, yOffset: 0.04 },
  ac_charger: { footprint: 3.9, height: 3.6, yaw: Math.PI * 0.98, accent: 0xaf8a86, yOffset: 0.04 },
  weather: { footprint: 4.5, height: 7.0, yaw: Math.PI * 0.62, accent: 0x8cb6d8, yOffset: 0.04 }
};

const deviceReplicaLayouts = {
  pv: [
    { x:  0.0, z: -9.0, yawOffset:  0.01, scale: 0.99 },
    { x:  0.0, z:-18.0, yawOffset: -0.01, scale: 0.98 }
  ],
  wind: [
    { x:  0.0, z: 11.0, yawOffset: 0.08, scale: 0.96 }
  ],
  storage: [
    { x:  7.0, z:  0.0, yawOffset: 0.02, scale: 0.98 }
  ],
  inverter: [
    { x:  0.0, z: -6.0, yawOffset: 0.0, scale: 0.99 }
  ],
  dc_cabinet: [
    { x:  5.5, z:  0.0, yawOffset: 0.0, scale: 0.99 }
  ],
  dc_charger: [
    { x:  5.0, z:  0.0, yawOffset: -0.01, scale: 0.97 },
    { x: 10.0, z:  0.0, yawOffset:  0.01, scale: 0.97 },
    { x: 15.0, z:  0.0, yawOffset: -0.01, scale: 0.97 }
  ],
  ac_cabinet: [
    { x:  5.5, z:  0.0, yawOffset: 0.0, scale: 0.99 }
  ],
  ac_charger: [
    { x:  5.0, z:  0.0, yawOffset:  0.01, scale: 0.97 },
    { x: 10.0, z:  0.0, yawOffset: -0.01, scale: 0.97 },
    { x: 15.0, z:  0.0, yawOffset:  0.01, scale: 0.97 }
  ]
};

const devices = new Map();
const pickTargets = [];
const gltfLoader = new GLTFLoader();
const modelTemplateCache = new Map();
const deviceReplicaNodes = [];
const rotatingNodes = [];
const pulseNodes = [];
const BASE_DEVICE_SCALE = 1.2;

function createPad(width, depth, accentColor = palette.accentBlue) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(width, 0.26, depth, 6, 0.12),
    metal(0x212a38, 0x243247, 0.06, 0.45, 0.8)
  );
  base.position.y = 0.13;
  base.receiveShadow = true;
  g.add(base);

  const top = new THREE.Mesh(
    new RoundedBoxGeometry(width - 0.2, 0.03, depth - 0.2, 4, 0.08),
    metal(0x2a3343, 0x2e3f59, 0.04, 0.4, 0.72)
  );
  top.position.y = 0.29;
  g.add(top);

  const lineMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.35
  });

  const t = 0.03;
  const h = 0.305;
  const borderTop = new THREE.Mesh(new THREE.BoxGeometry(width - 0.22, t, t), lineMat);
  borderTop.position.set(0, h, -depth / 2 + 0.11);
  const borderBottom = borderTop.clone();
  borderBottom.position.z = depth / 2 - 0.11;
  const borderLeft = new THREE.Mesh(new THREE.BoxGeometry(t, t, depth - 0.22), lineMat);
  borderLeft.position.set(-width / 2 + 0.11, h, 0);
  const borderRight = borderLeft.clone();
  borderRight.position.x = width / 2 - 0.11;

  g.add(borderTop, borderBottom, borderLeft, borderRight);
  pulseNodes.push({ node: borderTop, baseOpacity: 0.35 });
  pulseNodes.push({ node: borderBottom, baseOpacity: 0.35 });
  return g;
}

function addVentArray(parent, options) {
  const { x = 0, y = 0.7, z = 0.62, columns = 8, rows = 2, gapX = 0.15, gapY = 0.14 } = options;
  const ventMat = metal(0x2f3948, 0x1e2c42, 0.02, 0.62, 0.95);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      const vent = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.06, 0.03, 2, 0.01), ventMat);
      vent.position.set(x + (c - (columns - 1) / 2) * gapX, y + r * gapY, z);
      parent.add(vent);
    }
  }
}

function addStatusLights(parent, y, z, count = 3) {
  for (let i = 0; i < count; i += 1) {
    const color = i === 0 ? 0x5ed38f : i === 1 ? 0x4fa8ff : 0xf3ae52;
    const led = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
    );
    led.position.set(-0.36 + i * 0.08, y, z);
    parent.add(led);
  }
}

function createSolar() {
  const g = new THREE.Group();
  g.add(createPad(6.2, 4.4, palette.accentCyan));

  const panelFrameMat = metal(0x3a4f69, 0x284f7a, 0.04, 0.24, 0.86);
  const panelGlassMat = glass(0x79aacd, 0x2c5c86);
  const supportMat = metal(0x6e7889, 0x253345, 0.02, 0.46, 0.85);

  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 6; c += 1) {
      const frame = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.04, 1.5, 4, 0.02), panelFrameMat);
      frame.position.set(-2.25 + c * 0.9, 1.15 + r * 0.04, -0.48 + r * 0.9);
      frame.rotation.x = -0.42;
      g.add(frame);

      const cell = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.33), panelGlassMat);
      cell.position.set(frame.position.x, frame.position.y + 0.027, frame.position.z + 0.015);
      cell.rotation.copy(frame.rotation);
      g.add(cell);
    }
  }

  for (let i = 0; i < 6; i += 1) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.88, 10), supportMat);
    leg.position.set(-2.22 + i * 0.9, 0.73, -0.2);
    leg.rotation.x = 0.21;
    g.add(leg);
  }

  return g;
}

function createWind() {
  const g = new THREE.Group();
  g.add(createPad(3.6, 3.6, palette.accentBlue));

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 4.8, 18), metal(0x99a7b8, 0x2e4866, 0.02, 0.36, 0.75));
  tower.position.y = 2.6;
  g.add(tower);

  const nacelle = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.42, 0.52, 5, 0.08), metal(0xb0bdca, 0x385575, 0.03, 0.34, 0.72));
  nacelle.position.set(0, 5.05, 0);
  g.add(nacelle);

  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), metal(0xd3dce7, 0x49688a, 0.04, 0.3, 0.68));
  hub.position.set(0.56, 5.05, 0);
  g.add(hub);

  const rotor = new THREE.Group();
  rotor.position.copy(hub.position);
  for (let i = 0; i < 3; i += 1) {
    const blade = new THREE.Mesh(new RoundedBoxGeometry(0.12, 1.65, 0.24, 4, 0.04), metal(0xe2e7ef, 0x5b7fa5, 0.02, 0.34, 0.58));
    blade.position.set(0.86, 0, 0);
    blade.rotation.z = 0.2;
    const bladePivot = new THREE.Group();
    bladePivot.rotation.x = (i / 3) * Math.PI * 2;
    bladePivot.add(blade);
    rotor.add(bladePivot);
  }
  rotor.rotation.z = Math.PI / 2;
  g.add(rotor);
  rotatingNodes.push({ node: rotor, axis: "x", speed: 1.7 });

  return g;
}

function createStorage() {
  const g = new THREE.Group();
  g.add(createPad(4.8, 3.6, 0x68c89a));

  const body = new THREE.Mesh(new RoundedBoxGeometry(4.2, 2.4, 2.6, 10, 0.09), metal(0x566172, 0x33553f, 0.05, 0.36, 0.85));
  body.position.y = 1.5;
  g.add(body);

  const doorL = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.95, 0.05, 6, 0.03), metal(0x687689, 0x426255, 0.06, 0.28, 0.78));
  doorL.position.set(-0.95, 1.52, 1.31);
  const doorR = doorL.clone();
  doorR.position.x = 0.95;
  g.add(doorL, doorR);

  addVentArray(g, { x: 0, y: 0.9, z: 1.35, columns: 10, rows: 3, gapX: 0.18, gapY: 0.15 });
  addStatusLights(g, 2.35, 1.33, 3);

  return g;
}

function createDcCenter() {
  const g = new THREE.Group();
  g.add(createPad(4.4, 3.2, palette.accentCyan));

  const core = new THREE.Mesh(new RoundedBoxGeometry(3.8, 2, 2.3, 10, 0.1), metal(0x44576f, 0x2d597f, 0.07, 0.3, 0.84));
  core.position.y = 1.25;
  g.add(core);

  const roof = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.22, 1.7, 6, 0.06), metal(0x5e7086, 0x334f6d, 0.06, 0.26, 0.78));
  roof.position.y = 2.28;
  g.add(roof);

  const screen = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.5, 0.05, 4, 0.03), glass(0x8cb6d8));
  screen.position.set(0.5, 1.5, 1.2);
  g.add(screen);

  for (let i = 0; i < 4; i += 1) {
    const breaker = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.7, 0.42, 4, 0.04), metal(0x5b6a7b, 0x2b4766, 0.05, 0.32, 0.82));
    breaker.position.set(-1.2 + i * 0.8, 0.74, -0.76);
    g.add(breaker);
  }

  addStatusLights(g, 1.78, 1.15, 3);
  return g;
}

function createInverter() {
  const g = new THREE.Group();
  g.add(createPad(4.8, 3.4, palette.accentBlue));

  const body = new THREE.Mesh(new RoundedBoxGeometry(4.2, 2.2, 2.6, 10, 0.11), metal(0x435d7a, 0x315b83, 0.08, 0.3, 0.84));
  body.position.y = 1.4;
  g.add(body);

  const panel = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.58, 0.05, 4, 0.03), glass(0x9bc1e1));
  panel.position.set(0.82, 1.66, 1.34);
  g.add(panel);

  for (let i = 0; i < 6; i += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 2.56), metal(0x2e4864, 0x2d4f70, 0.02, 0.5, 0.92));
    fin.position.set(-1.2 + i * 0.48, 0.5, 0);
    g.add(fin);
  }

  addVentArray(g, { x: -0.2, y: 1.1, z: 1.33, columns: 8, rows: 2, gapX: 0.16, gapY: 0.15 });
  addStatusLights(g, 2.28, 1.3, 3);
  return g;
}

function createBooster() {
  const g = new THREE.Group();
  g.add(createPad(4.8, 3.4, 0xf2857f));

  const platform = new THREE.Mesh(new RoundedBoxGeometry(4, 0.5, 2.8, 8, 0.07), metal(0x4a4f5a, 0x4f3d45, 0.04, 0.42, 0.86));
  platform.position.y = 0.6;
  g.add(platform);

  const tankA = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 2.6, 24), metal(0x6d7581, 0x694f57, 0.05, 0.34, 0.8));
  tankA.rotation.z = Math.PI / 2;
  tankA.position.set(-0.88, 1.36, 0.2);
  g.add(tankA);

  const tankB = tankA.clone();
  tankB.position.x = 0.88;
  g.add(tankB);

  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.46, 10), metal(0x9da6b1, 0x6f5960, 0.04, 0.28, 0.75));
      insulator.position.set(-1.2 + i * 2.4, 2.0, -0.58 + j * 0.58);
      g.add(insulator);
    }
  }

  const coil = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.08, 14, 34),
    metal(0xd9d4d3, 0x8f6464, 0.16, 0.28, 0.65)
  );
  coil.rotation.x = Math.PI / 2;
  coil.position.set(0, 2.2, 0);
  g.add(coil);
  rotatingNodes.push({ node: coil, axis: "z", speed: 0.6 });

  addStatusLights(g, 2.32, 1.1, 3);
  return g;
}

function createGridInterface() {
  const g = new THREE.Group();
  g.add(createPad(4.8, 3.6, 0xf2857f));

  const towerMat = metal(0x96a3b2, 0x624a53, 0.03, 0.3, 0.76);

  for (let i = 0; i < 4; i += 1) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 4.2, 10), towerMat);
    leg.position.set(i < 2 ? -0.74 : 0.74, 2.25, i % 2 === 0 ? -0.66 : 0.66);
    g.add(leg);
  }

  const bar1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), towerMat);
  bar1.position.y = 2.4;
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 0.08), towerMat);
  bar2.position.y = 3.25;
  const bar3 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), towerMat);
  bar3.position.y = 1.58;
  g.add(bar1, bar2, bar3);

  const cabinet = new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.4, 1.1, 6, 0.08), metal(0x556476, 0x4a3d49, 0.04, 0.34, 0.82));
  cabinet.position.set(0, 0.95, -1.28);
  g.add(cabinet);
  addStatusLights(g, 1.44, -0.72, 3);

  return g;
}

function createCabinet(accentColor) {
  const g = new THREE.Group();
  g.add(createPad(3.6, 2.8, accentColor));

  const shell = new THREE.Mesh(new RoundedBoxGeometry(3, 2.1, 1.9, 8, 0.09), metal(0x4f6072, 0x2e4b6b, 0.06, 0.34, 0.84));
  shell.position.y = 1.26;
  g.add(shell);

  for (let i = 0; i < 2; i += 1) {
    const door = new THREE.Mesh(new RoundedBoxGeometry(1.35, 1.72, 0.05, 5, 0.03), glass(0x8eaed1));
    door.position.set(-0.72 + i * 1.44, 1.3, 0.96);
    g.add(door);
  }

  addVentArray(g, { x: 0, y: 0.88, z: 0.99, columns: 7, rows: 2, gapX: 0.16, gapY: 0.14 });
  addStatusLights(g, 2.3, 0.95, 3);

  return g;
}

function createCharger(accentColor) {
  const g = new THREE.Group();
  g.add(createPad(3.4, 2.8, accentColor));

  const charger = new THREE.Mesh(new RoundedBoxGeometry(1.4, 2.2, 1.12, 8, 0.09), metal(0x5c6878, 0x34526f, 0.06, 0.34, 0.82));
  charger.position.y = 1.35;
  g.add(charger);

  const screen = new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.4, 0.05, 4, 0.03), glass(0x9ec0df));
  screen.position.set(0, 1.75, 0.6);
  g.add(screen);

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.58, 1.2, 0.46),
    new THREE.Vector3(0.94, 0.86, 0.12),
    new THREE.Vector3(0.5, 0.52, -0.3)
  ]);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(cableCurve, 20, 0.035, 8, false),
    metal(0x253547, 0x325a80, 0.02, 0.6, 0.72)
  );
  g.add(cable);

  const gun = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.32, 0.18, 3, 0.03), metal(0x6f7882, 0x3a556f, 0.04, 0.4, 0.74));
  gun.position.set(0.5, 0.47, -0.36);
  g.add(gun);

  addStatusLights(g, 2.48, 0.58, 3);
  return g;
}

function createWeatherStation() {
  const g = new THREE.Group();
  g.add(createPad(3.8, 2.8, palette.accentCyan));

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.1, 12), metal(0x94a6ba, 0x315775, 0.03, 0.38, 0.74));
  mast.position.y = 1.7;
  g.add(mast);

  const radar = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 22), glass(0x8eb9d8));
  radar.position.set(0, 3.45, 0);
  g.add(radar);

  const armGroup = new THREE.Group();
  armGroup.position.set(0, 2.95, 0);
  for (let i = 0; i < 3; i += 1) {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(1.14, 0.07, 0.12, 4, 0.03), metal(0xbdc8d6, 0x456f92, 0.03, 0.35, 0.68));
    arm.position.x = 0.57;
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 3) * Math.PI * 2;
    pivot.add(arm);
    armGroup.add(pivot);
  }
  g.add(armGroup);
  rotatingNodes.push({ node: armGroup, axis: "y", speed: 1.2 });

  const sensorBox = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.8, 0.9, 4, 0.06), metal(0x5a6778, 0x35526d, 0.04, 0.36, 0.8));
  sensorBox.position.set(0, 0.74, -0.3);
  g.add(sensorBox);

  addStatusLights(g, 1.1, 0.18, 3);
  return g;
}

function createLabelSprite(text) {
  const canvas2d = document.createElement("canvas");
  canvas2d.width = 460;
  canvas2d.height = 110;
  const ctx = canvas2d.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, canvas2d.width, 0);
  grad.addColorStop(0, "rgba(26,44,69,0.62)");
  grad.addColorStop(1, "rgba(18,29,45,0.62)");

  ctx.fillStyle = grad;
  ctx.strokeStyle = "rgba(156,188,220,0.72)";
  ctx.lineWidth = 1.5;

  roundedRect(ctx, 16, 18, 428, 74, 18);
  ctx.fill();
  roundedRect(ctx, 16, 18, 428, 74, 18);
  ctx.stroke();

  ctx.fillStyle = "#e8f2ff";
  ctx.font = "600 30px Rajdhani, Sora, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 230, 55);

  const texture = new THREE.CanvasTexture(canvas2d);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.72,
    depthTest: false,
    depthWrite: false
  }));
  sprite.scale.set(4.2, 1.02, 1);
  return sprite;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createZoneBlock(name, width, depth, color, position) {
  const group = new THREE.Group();
  group.position.copy(position);

  const fill = new THREE.Mesh(
    new RoundedBoxGeometry(width, 0.02, depth, 5, 0.14),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.055,
      depthWrite: false
    })
  );
  fill.position.y = 0.04;
  group.add(fill);

  const borderMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.28
  });
  const t = 0.03;
  const y = 0.065;
  const top = new THREE.Mesh(new THREE.BoxGeometry(width - 0.14, t, t), borderMat);
  const bottom = top.clone();
  top.position.set(0, y, -depth / 2 + 0.07);
  bottom.position.set(0, y, depth / 2 - 0.07);
  const left = new THREE.Mesh(new THREE.BoxGeometry(t, t, depth - 0.14), borderMat);
  const right = left.clone();
  left.position.set(-width / 2 + 0.07, y, 0);
  right.position.set(width / 2 - 0.07, y, 0);
  group.add(top, bottom, left, right);

  const tag = createLabelSprite(name);
  tag.position.set(0, 0.95, -depth / 2 + 1.15);
  tag.scale.set(2.7, 0.66, 1);
  tag.material.opacity = 0.44;
  group.add(tag);
  scene.add(group);
}

function addFunctionalZones() {
  createZoneBlock("新能源源侧区",  22, 30, 0x5f7da0, new THREE.Vector3(-34.0, 0,  -2.0));
  createZoneBlock("储能区",        18, 10, 0x68c89a, new THREE.Vector3(  5.5, 0, -21.0));
  createZoneBlock("直流汇流核心",  14, 14, 0x4ea8ff, new THREE.Vector3(  0.0, 0,   0.0));
  createZoneBlock("交流变换并网区",36, 20, 0x8f7f7f, new THREE.Vector3( 26.0, 0,  -4.0));
  createZoneBlock("直流充电区",    22, 18, 0x5f7da0, new THREE.Vector3(  2.5, 0,  19.0));
  createZoneBlock("交流充电区",    22, 18, 0x8f7f7f, new THREE.Vector3( 20.0, 0,  19.0));
}

const clayMaterialCache = {
  dark: new THREE.MeshStandardMaterial({
    color: 0x141c28,
    metalness: 0.72,
    roughness: 0.40,
    emissive: 0x06101a,
    emissiveIntensity: 0.04
  }),
  mid: new THREE.MeshStandardMaterial({
    color: 0x1f2c3e,
    metalness: 0.76,
    roughness: 0.36,
    emissive: 0x0a1522,
    emissiveIntensity: 0.045
  }),
  light: new THREE.MeshStandardMaterial({
    color: 0x2e4258,
    metalness: 0.65,
    roughness: 0.33,
    emissive: 0x0e1f30,
    emissiveIntensity: 0.05
  }),
  blue: new THREE.MeshStandardMaterial({
    color: 0x243650,
    metalness: 0.80,
    roughness: 0.28,
    emissive: 0x0c1a2c,
    emissiveIntensity: 0.07
  })
};

const accentMaterialCache = new Map();
function getAccentClayMaterial(accentColor) {
  if (!accentColor) return clayMaterialCache.blue;
  const key = `accent_${accentColor.toString(16)}`;
  if (accentMaterialCache.has(key)) return accentMaterialCache.get(key);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentColor).lerp(new THREE.Color(0x6b7483), 0.82),
    metalness: 0.22,
    roughness: 0.62,
    emissive: new THREE.Color(accentColor).multiplyScalar(0.07),
    emissiveIntensity: 0.06
  });
  accentMaterialCache.set(key, mat);
  return mat;
}

function stylizeModel(node, accentColor) {
  node.traverse((child) => {
    if (!child.isMesh) return;

    const n = (child.name || "").toLowerCase();
    let mat = clayMaterialCache.mid;
    if (n.includes("glass") || n.includes("screen") || n.includes("panel")) mat = clayMaterialCache.light;
    if (n.includes("base") || n.includes("floor") || n.includes("foot")) mat = clayMaterialCache.dark;
    if (n.includes("wire") || n.includes("cable") || n.includes("line")) mat = clayMaterialCache.blue;
    if (n.includes("led") || n.includes("light") || n.includes("indicator")) mat = getAccentClayMaterial(accentColor);

    child.material = mat;
  });
}

function normalizeModel(node, tuning = {}) {
  const sourceBox = new THREE.Box3().setFromObject(node);
  if (sourceBox.isEmpty()) return { width: 4.8, height: 4.2, depth: 4.8 };
  const sourceSize = sourceBox.getSize(new THREE.Vector3());

  const footprint = tuning.footprint ?? 5;
  const targetHeight = tuning.height ?? 4.2;
  const maxSide = Math.max(sourceSize.x, sourceSize.z, 0.0001);
  const scaleByFootprint = footprint / maxSide;
  const scaleByHeight = targetHeight / Math.max(sourceSize.y, 0.0001);
  const fitScale = Math.min(scaleByFootprint, scaleByHeight) * (tuning.extraScale ?? 1);

  node.position.set(0, 0, 0);
  node.scale.setScalar(fitScale);

  node.rotation.y = tuning.yaw ?? 0;
  node.rotation.x = tuning.pitch ?? 0;
  node.rotation.z = tuning.roll ?? 0;

  const fitted = new THREE.Box3().setFromObject(node);
  const fittedCenter = fitted.getCenter(new THREE.Vector3());
  node.position.x -= fittedCenter.x;
  node.position.z -= fittedCenter.z;
  node.position.y -= fitted.min.y;
  node.position.y += tuning.yOffset ?? 0;

  const finalBox = new THREE.Box3().setFromObject(node);
  const fittedSize = finalBox.getSize(new THREE.Vector3());
  return { width: fittedSize.x, height: fittedSize.y, depth: fittedSize.z };
}

function loadModelTemplate(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => resolve(gltf.scene || gltf.scenes?.[0]),
      undefined,
      reject
    );
  });
}

async function ensureModelTemplate(id) {
  if (modelTemplateCache.has(id)) return modelTemplateCache.get(id);
  const template = await loadModelTemplate(deviceModelUrls[id]);
  modelTemplateCache.set(id, template);
  return template;
}

function createDeviceModelInstance(id, overrideTuning = {}) {
  const template = modelTemplateCache.get(id);
  const instance = cloneSkinned(template);
  const tuning = { ...(deviceModelTuning[id] ?? {}), ...overrideTuning };
  const size = normalizeModel(instance, tuning);
  stylizeModel(instance, tuning.accent);
  return { instance, size };
}

function addDeviceReplicas(id) {
  const replicas = deviceReplicaLayouts[id];
  if (!replicas || replicas.length === 0) return;

  replicas.forEach((replica, index) => {
    const baseYaw = deviceModelTuning[id]?.yaw ?? 0;
    const { instance } = createDeviceModelInstance(id, {
      yaw: baseYaw + (replica.yawOffset ?? 0),
      extraScale: replica.scale ?? 1
    });

    const node = new THREE.Group();
    node.userData.deviceId = id;
    node.position.copy(devicePositions[id]).add(new THREE.Vector3(replica.x, replica.y ?? 0, replica.z));
    node.scale.setScalar(BASE_DEVICE_SCALE);
    node.add(instance);

    node.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
    });

    scene.add(node);
    deviceReplicaNodes.push({ id, node, baseY: node.position.y, phase: index * 0.9 + id.length * 0.25 });
  });
}

function addDevice(id, model, size) {
  const root = new THREE.Group();
  root.position.copy(devicePositions[id]);
  root.scale.setScalar(BASE_DEVICE_SCALE);
  root.userData.deviceId = id;

  root.add(model);

  const labelY = Math.max(4.2, size.height + 1.5);
  const label = createLabelSprite(deviceInfo[id].name);
  label.position.set(0, labelY, 0);
  root.add(label);
  root.userData.label = label;

  const colliderWidth = Math.max(4, size.width + 1.35);
  const colliderDepth = Math.max(4, size.depth + 1.35);
  const colliderHeight = Math.max(4.6, size.height + 1.4);
  const collider = new THREE.Mesh(
    new THREE.BoxGeometry(colliderWidth, colliderHeight, colliderDepth),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  collider.position.y = colliderHeight * 0.5;
  collider.userData.deviceId = id;
  root.add(collider);
  root.userData.flowAnchorY = Math.max(1.42, size.height * BASE_DEVICE_SCALE + 0.26);
  pickTargets.push(collider);

  const meshes = [];
  root.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = false;
      node.receiveShadow = false;
      node.userData.deviceId = id;
      if (node.material && "emissiveIntensity" in node.material) {
        node.userData.baseEmissive = node.material.emissiveIntensity;
      }
      meshes.push(node);
    }
  });

  root.userData.meshes = meshes;
  devices.set(id, root);
  scene.add(root);
}

const flowDefs = [
  { from: "pv",         to: "dc_center",  type: "dc",      laneX: -15.0, rise: 2.2, corner: 1.05, speed: 0.23 },
  { from: "wind",       to: "dc_center",  type: "dc",      laneX: -19.0, rise: 2.2, corner: 1.05, speed: 0.22 },
  { from: "storage",    to: "dc_center",  type: "storage",  laneZ: -10.5, rise: 2.4, corner: 1.1,  speed: 0.18 },
  { from: "dc_center",  to: "storage",    type: "storage",  laneZ: -10.5, rise: 2.4, corner: 1.1,  speed: 0.15 },
  { from: "dc_center",  to: "inverter",   type: "dc",       laneX:   7.0, rise: 1.8, corner: 0.95, speed: 0.24 },
  { from: "dc_center",  to: "dc_cabinet", type: "dc",       laneZ:   6.5, rise: 1.9, corner: 0.9,  speed: 0.21 },
  { from: "dc_cabinet", to: "dc_charger", type: "dc",       laneZ:  18.5, rise: 1.8, corner: 0.9,  speed: 0.22 },
  { from: "inverter",   to: "booster",    type: "ac",       laneX:  20.0, rise: 2.0, corner: 1.0,  speed: 0.25 },
  { from: "booster",    to: "grid",       type: "ac",       laneX:  32.0, rise: 1.8, corner: 0.95, speed: 0.19 },
  { from: "inverter",   to: "ac_cabinet", type: "ac",       laneZ:   6.5, rise: 1.9, corner: 0.9,  speed: 0.21 },
  { from: "grid",       to: "ac_cabinet", type: "ac",       laneX:  26.0, rise: 2.5, corner: 1.2,  speed: 0.17 },
  { from: "ac_cabinet", to: "ac_charger", type: "ac",       laneZ:  18.5, rise: 1.7, corner: 0.9,  speed: 0.21 }
];

const flowColors = {
  dc: { main: palette.flowDC, glow: 0x2f74c8 },
  ac: { main: palette.flowAC, glow: 0x9a4c57 },
  storage: { main: palette.flowStorage, glow: 0x3f7f65 }
};

addFunctionalZones();

const flows = [];
function addLineSegment(path, a, b) {
  if (a.distanceToSquared(b) < 1e-6) return;
  path.add(new THREE.LineCurve3(a.clone(), b.clone()));
}

function buildRoundedPath(points, cornerRadius = 0.9) {
  const clean = [];
  points.forEach((p) => {
    if (clean.length === 0 || clean[clean.length - 1].distanceToSquared(p) > 1e-6) {
      clean.push(p.clone());
    }
  });

  const path = new THREE.CurvePath();
  if (clean.length < 2) return path;

  let cursor = clean[0].clone();
  for (let i = 1; i < clean.length - 1; i += 1) {
    const prev = clean[i - 1];
    const curr = clean[i];
    const next = clean[i + 1];

    const dirIn = curr.clone().sub(prev).normalize();
    const dirOut = next.clone().sub(curr).normalize();
    const cornerDot = Math.abs(dirIn.dot(dirOut));
    const isCorner = cornerDot < 0.999;

    if (!isCorner) {
      addLineSegment(path, cursor, curr);
      cursor = curr.clone();
      continue;
    }

    const distIn = curr.distanceTo(prev);
    const distOut = next.distanceTo(curr);
    const r = Math.min(cornerRadius, distIn * 0.45, distOut * 0.45);
    const cutIn = curr.clone().addScaledVector(dirIn, -r);
    const cutOut = curr.clone().addScaledVector(dirOut, r);

    addLineSegment(path, cursor, cutIn);
    path.add(new THREE.QuadraticBezierCurve3(cutIn, curr.clone(), cutOut));
    cursor = cutOut.clone();
  }

  addLineSegment(path, cursor, clean[clean.length - 1]);
  return path;
}

function createOrthogonalFlowPath(start, end, def) {
  const rise = def.rise ?? 1.9;
  const routeY = Math.max(start.y, end.y) + rise;
  const nearEndY = Math.max(end.y + 0.24, routeY - rise * 0.72);
  const points = [start.clone(), new THREE.Vector3(start.x, routeY, start.z)];

  if (typeof def.laneZ === "number") {
    points.push(new THREE.Vector3(start.x, routeY, def.laneZ));
    points.push(new THREE.Vector3(end.x, routeY, def.laneZ));
  } else {
    const laneX = typeof def.laneX === "number" ? def.laneX : (start.x + end.x) * 0.5;
    points.push(new THREE.Vector3(laneX, routeY, start.z));
    points.push(new THREE.Vector3(laneX, routeY, end.z));
  }

  points.push(new THREE.Vector3(end.x, routeY, end.z));
  points.push(new THREE.Vector3(end.x, nearEndY, end.z));
  points.push(end.clone());
  return buildRoundedPath(points, def.corner ?? 0.9);
}

function createFlow(def) {
  const startAnchor = devices.get(def.from)?.userData?.flowAnchorY ?? 1.2;
  const endAnchor = devices.get(def.to)?.userData?.flowAnchorY ?? 1.2;
  const start = devicePositions[def.from].clone().add(new THREE.Vector3(0, startAnchor, 0));
  const end = devicePositions[def.to].clone().add(new THREE.Vector3(0, endAnchor, 0));
  const curve = createOrthogonalFlowPath(start, end, def);
  const colors = flowColors[def.type];
  const segmentCount = Math.max(28, Math.floor(curve.getLength() * 1.4));

  // Dark metallic conduit pipe (physical cable housing)
  const conduit = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segmentCount, 0.13, 8, false),
    new THREE.MeshPhysicalMaterial({
      color: 0x0c1420,
      metalness: 0.85,
      roughness: 0.25,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  scene.add(conduit);

  // Inner glowing energy core
  const core = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segmentCount, 0.034, 6, false),
    new THREE.MeshBasicMaterial({
      color: colors.main,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(core);

  // Outer soft glow halo
  const halo = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segmentCount, 0.10, 8, false),
    new THREE.MeshBasicMaterial({
      color: colors.main,
      transparent: true,
      opacity: 0.20,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(halo);

  const particles = [];
  const pulseHeads = [];
  const particleCount = 5;
  for (let i = 0; i < particleCount; i += 1) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 8),
      new THREE.MeshBasicMaterial({
        color: colors.main,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    scene.add(p);
    particles.push(p);
  }

  for (let i = 0; i < 2; i += 1) {
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    scene.add(head);
    pulseHeads.push(head);
  }

  flows.push({
    curve,
    core,
    halo,
    particles,
    pulseHeads,
    speed: def.speed,
    offset: Math.random()
  });
}

const ui = {
  totalPower: document.getElementById("totalPower"),
  systemEfficiency: document.getElementById("systemEfficiency"),
  hoverCard: document.getElementById("hoverCard"),
  hoverName: document.getElementById("hoverName"),
  hoverDesc: document.getElementById("hoverDesc"),
  hoverIn: document.getElementById("hoverIn"),
  hoverOut: document.getElementById("hoverOut"),
  hoverTemp: document.getElementById("hoverTemp"),
  hoverHealth: document.getElementById("hoverHealth")
};

let selectedDeviceId = "inverter";
let hoveredDeviceId = null;
let _pointerMoved = false;
let _pointerStartX = 0;
let _pointerStartY = 0;

async function bootstrapSceneDevices() {
  try {
    await Promise.all(deviceOrder.map((id) => ensureModelTemplate(id)));
    deviceOrder.forEach((id) => {
      const { instance, size } = createDeviceModelInstance(id);
      addDevice(id, instance, size);
    });
    deviceOrder.forEach((id) => addDeviceReplicas(id));
    flowDefs.forEach(createFlow);
    updateSelection();
    window.__energy3DBooted = true;
    if (bootHintEl) bootHintEl.hidden = true;
  } catch (error) {
    console.error("模型加载失败:", error);
    if (bootHintEl) {
      bootHintEl.textContent = "3D模型加载失败，请检查模型文件后刷新页面（Cmd/Ctrl + Shift + R）。";
      bootHintEl.hidden = false;
    }
  }
}

function updateHoverCard(id, clientX, clientY) {
  const card = ui.hoverCard;
  if (!card || !id) return;
  const info = deviceInfo[id];
  ui.hoverName.textContent = info.name;
  ui.hoverDesc.textContent = info.desc;
  ui.hoverIn.textContent = info.in;
  ui.hoverOut.textContent = info.out;
  ui.hoverTemp.textContent = info.temp;
  ui.hoverHealth.textContent = info.health;
  card.hidden = false;

  const xOffset = 18;
  const yOffset = 14;
  const cardWidth = 280;
  const cardHeight = 182;
  const maxX = window.innerWidth - cardWidth - 12;
  const maxY = window.innerHeight - cardHeight - 12;
  const left = Math.max(10, Math.min(maxX, clientX + xOffset));
  const top = Math.max(10, Math.min(maxY, clientY + yOffset));
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function hideHoverCard() {
  if (!ui.hoverCard) return;
  ui.hoverCard.hidden = true;
}

function updateSelection() {
  devices.forEach((group, id) => {
    const isSelected = id === selectedDeviceId;
    const isHovered = id === hoveredDeviceId;

    group.userData.meshes.forEach((mesh) => {
      const mat = mesh.material;
      if (!mat || !("emissiveIntensity" in mat)) return;
      const base = mesh.userData.baseEmissive ?? 0;
      let add = 0;
      if (isHovered) add += 0.08;
      if (isSelected) add += 0.2;
      mat.emissiveIntensity = base + add;
    });

    const targetScale = isSelected ? BASE_DEVICE_SCALE * 1.03 : isHovered ? BASE_DEVICE_SCALE * 1.015 : BASE_DEVICE_SCALE;
    group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);

    const label = group.userData.label;
    if (label && label.material) {
      const labelOpacity = isSelected || isHovered ? 0.96 : 0.36;
      label.material.opacity = labelOpacity;
      const labelScale = isSelected || isHovered ? 1 : 0.94;
      label.scale.set(4.2 * labelScale, 1.02 * labelScale, 1);
    }
  });
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function pickDevice(clientX, clientY) {
  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(pickTargets, false)[0];
  return hit ? hit.object.userData.deviceId : null;
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  _pointerMoved = false;
  _pointerStartX = event.clientX;
  _pointerStartY = event.clientY;
});

renderer.domElement.addEventListener("pointermove", (event) => {
  const dx = event.clientX - _pointerStartX;
  const dy = event.clientY - _pointerStartY;
  if (dx * dx + dy * dy > 36) _pointerMoved = true;

  if (_pointerMoved) {
    hoveredDeviceId = null;
    renderer.domElement.style.cursor = "default";
    hideHoverCard();
    return;
  }

  hoveredDeviceId = pickDevice(event.clientX, event.clientY);
  renderer.domElement.style.cursor = hoveredDeviceId ? "pointer" : "default";

  if (hoveredDeviceId) {
    updateHoverCard(hoveredDeviceId, event.clientX, event.clientY);
  } else {
    hideHoverCard();
  }
});

renderer.domElement.addEventListener("click", (event) => {
  if (_pointerMoved) return;
  const id = pickDevice(event.clientX, event.clientY);
  if (!id) return;
  selectedDeviceId = id;
});

renderer.domElement.addEventListener("pointerleave", () => {
  hoveredDeviceId = null;
  renderer.domElement.style.cursor = "default";
  hideHoverCard();
});

function animateStats(t) {
  const power = 428.72 + Math.sin(t * 0.22) * 0.44 + Math.sin(t * 0.49) * 0.12;
  const efficiency = 96.43 + Math.sin(t * 0.15) * 0.17;
  ui.totalPower.textContent = `${power.toFixed(2)} kWh`;
  ui.systemEfficiency.textContent = `${efficiency.toFixed(2)}%`;
}

function animateFlows(t, dt) {
  flows.forEach((flow, index) => {
    flow.offset = (flow.offset + dt * flow.speed) % 1;

    flow.particles.forEach((particle, i) => {
      const p = (flow.offset + i / flow.particles.length) % 1;
      particle.position.copy(flow.curve.getPointAt(p));
      const s = 1.0 + Math.sin(t * 6.0 + i * 1.1 + index) * 0.35;
      particle.scale.setScalar(s);
      particle.material.opacity = 0.72 + Math.sin(t * 4.8 + i + index) * 0.28;
    });

    flow.pulseHeads.forEach((head, i) => {
      const pulseT = (flow.offset + i * 0.38) % 1;
      head.position.copy(flow.curve.getPointAt(pulseT));
      const hs = 1.2 + Math.sin(t * 8 + i * 1.8 + index) * 0.38;
      head.scale.setScalar(hs);
      head.material.opacity = 0.78 + Math.sin(t * 6 + i + index) * 0.22;
    });

    flow.halo.material.opacity = 0.16 + Math.sin(t * 2.8 + index) * 0.08;
  });
}

function animateEquipment(t, dt) {
  rotatingNodes.forEach((item) => {
    item.node.rotation[item.axis] += dt * item.speed;
  });

  pulseNodes.forEach((entry, i) => {
    const opacity = entry.baseOpacity + Math.sin(t * 1.6 + i) * 0.08;
    entry.node.material.opacity = opacity;
  });

  devices.forEach((group, id) => {
    const offset = Math.sin(t * 0.7 + id.length) * 0.012;
    group.position.y = devicePositions[id].y + offset;
  });

  deviceReplicaNodes.forEach((entry) => {
    const offset = Math.sin(t * 0.66 + entry.phase) * 0.01;
    entry.node.position.y = entry.baseY + offset;
  });
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateHoverCard(selectedDeviceId, 340, 220);
hideHoverCard();
bootstrapSceneDevices();

const clock = new THREE.Clock();
function tick() {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  animateStats(t);
  animateFlows(t, dt);
  animateEquipment(t, dt);
  updateSelection();

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
