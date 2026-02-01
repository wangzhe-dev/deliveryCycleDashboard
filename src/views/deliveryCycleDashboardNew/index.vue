<template>
  <div class="page" :class="themeClass" style="overflow: auto">
    <div class="dashboard">
      <div class="main-content mb20">
        <div ref="viewerContainerRef" class="viewer-container">
          <div class="viewer-header">
            <div class="viewer-toolbar">
              <div class="viewer-title row-start">{{ shipTitle }} 船体装配视图</div>
              <div class="view-controls">
                <button
                  class="btn"
                  :class="{ active: currentView === 'complete' }"
                  @click="setView('complete')"
                >
                  船体概览
                </button>
                <!-- <button
                  class="btn"
                  :class="{ active: currentView === 'missing' }"
                  @click="setView('missing')"
                >
                  未开工分段
                </button> -->
                <button
                  class="btn"
                  :class="{ active: currentView === 'progress' }"
                  @click="setView('progress')"
                >
                  建造进度
                </button>
              </div>
            </div>
          </div>

          <button
            class="fullscreen-btn"
            @click="toggleFullscreen"
            :title="isFullscreen ? '退出全屏' : '全屏'"
          >
            {{ isFullscreen ? '⮌' : '⛶' }}
          </button>
          <div ref="canvasWrapRef" class="canvas-wrap" @contextmenu.prevent>
            <canvas ref="canvasRef"></canvas>
            <div class="viewer-hint">左键旋转 · 右键平移 · 滚轮缩放</div>

            <!-- 全屏时左上角：整体进度 -->
            <div class="fs-progress-overlay" v-if="isFullscreen">
              <div class="sp-ring-row">
                <div class="sp-ring">
                  <svg viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="var(--border)"
                      stroke-width="5"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="url(#ringGradFs)"
                      stroke-width="5"
                      stroke-linecap="round"
                      :stroke-dasharray="2 * Math.PI * 34"
                      :stroke-dashoffset="2 * Math.PI * 34 * (1 - kpi.overallProgress / 100)"
                      transform="rotate(-90 40 40)"
                    />
                    <defs>
                      <linearGradient id="ringGradFs" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="var(--aurora-a)" />
                        <stop offset="100%" stop-color="var(--aurora-c)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span class="sp-ring-val">{{ kpi.overallProgress }}%</span>
                </div>
                <div class="sp-ring-info">
                  <div class="sp-label">整体装配</div>
                  <div class="sp-counts">
                    <div class="sp-count-item">
                      <span class="sp-count-dot done"></span>
                      <span>{{ kpi.installedCount }}</span>
                      <span class="sp-count-unit">已装</span>
                    </div>
                    <div class="sp-count-item">
                      <span class="sp-count-dot rest"></span>
                      <span>{{ kpi.remainingCount }}</span>
                      <span class="sp-count-unit">剩余</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="loading" v-if="loading">
              <div class="spinner"></div>
              <div>正在加载 3D 模型...</div>
            </div>
          </div>

          <div class="sim-bar">
            <div class="sim-left">
              <button class="btn sim-primary" @click="toggleSimPlay">
                <span>{{ simPlaying ? '⏸' : '▶' }}</span>
                {{ simPlaying ? '暂停推演' : '播放推演' }}
              </button>
            </div>

            <div class="sim-mid">
              <div class="sim-scale">
                <span class="sim-mark">第 {{ simIndex }} 天</span>
                <b class="fw fs14">{{ simDateText }}</b>
              </div>

              <input
                class="sim-slider"
                type="range"
                :min="0"
                :max="SIM.days"
                v-model.number="simIndex"
              />
            </div>
          </div>
        </div>

        <!-- ✅ 右侧面板：窄版紧凑设计 -->
        <div class="side-panel">
          <!-- 整体进度：环形指标 -->
          <div class="sp-card sp-progress">
            <div class="sp-ring-row">
              <div class="sp-ring">
                <svg viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="var(--border)"
                    stroke-width="5"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="url(#ringGrad)"
                    stroke-width="5"
                    stroke-linecap="round"
                    :stroke-dasharray="2 * Math.PI * 34"
                    :stroke-dashoffset="2 * Math.PI * 34 * (1 - kpi.overallProgress / 100)"
                    transform="rotate(-90 40 40)"
                  />
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="var(--aurora-a)" />
                      <stop offset="100%" stop-color="var(--aurora-c)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span class="sp-ring-val">{{ kpi.overallProgress }}%</span>
              </div>
              <div class="sp-ring-info">
                <div class="sp-label">整体装配</div>
                <div class="sp-counts">
                  <div class="sp-count-item">
                    <span class="sp-count-dot done"></span>
                    <span>{{ kpi.installedCount }}</span>
                    <span class="sp-count-unit">已装</span>
                  </div>
                  <div class="sp-count-item">
                    <span class="sp-count-dot rest"></span>
                    <span>{{ kpi.remainingCount }}</span>
                    <span class="sp-count-unit">剩余</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 区域进度列表 -->
          <div class="sp-card sp-zones">
            <div class="sp-label mb6">区域进度</div>
            <div v-for="z in manufacturingZoneCards" :key="z.key" class="sp-zone-row">
              <span class="sp-zone-dot" :class="z.cls"></span>
              <span class="sp-zone-name">{{ z.name }}</span>
              <span class="sp-zone-val">{{ kpi.zones[z.key] }}%</span>
              <div class="sp-zone-bar">
                <i :class="z.cls" :style="{ width: kpi.zones[z.key] + '%' }"></i>
              </div>
            </div>
          </div>

          <!-- 选中分段 -->
          <div class="sp-card sp-selected">
            <div class="sp-label">选中总段</div>
            <template v-if="selected">
              <div class="sp-sel-id">{{ selected.id }}</div>
              <div class="sp-sel-grid">
                <div class="sp-sel-item">
                  <span class="sp-sel-k">区域</span>
                  <span class="sp-sel-v">{{ getZoneName(selected.zone) }}</span>
                </div>
                <div class="sp-sel-item">
                  <span class="sp-sel-k">进度</span>
                  <span class="sp-sel-v accent">{{ Math.round(selected.progress) }}%</span>
                </div>
                <div class="sp-sel-item">
                  <span class="sp-sel-k">状态</span>
                  <span
                    class="sp-sel-v"
                    :class="{
                      'st-done': selected.progress >= 80,
                      'st-wip': selected.progress >= 20 && selected.progress < 80,
                      'st-idle': selected.progress < 20,
                    }"
                  >
                    {{ getStatusText(selected.progress) }}
                  </span>
                </div>
              </div>
            </template>
            <div v-else class="sp-sel-empty">点击模型选择分段</div>
          </div>
        </div>
      </div>

      <!-- 里程碑时间线 + 4个指标（新组件） -->
      <ShipMilestonePanel class="mb20" :milestones="milestones" :extra-kpi="extraKpi" />
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { SEGMENT_LAYOUT } from './segmentLayout.js';
import ShipMilestonePanel from './ShipMilestonePanel.vue';

const MANUFACTURING_ZONES = {
  FORE: { subZones: ['FF1', 'FF2', 'FF3'] },
  FORE_MID: { subZones: ['FM1', 'FM2', 'FM3'] },
  MID: { subZones: ['MD1', 'MD2', 'MD3', 'MD4'], color: 0x10b981 },
  ENGINE: { subZones: ['ER1', 'ER2', 'ER3'] },
  AFT: { subZones: ['AF1', 'AF2', 'AF3'] },
  SUPERSTRUCTURE: { subZones: ['SS1', 'SS2', 'SS3'] },
};

const manufacturingZoneCards = [
  { key: 'FORE', tag: '艏', name: '船艏区域', cls: 'fore' },
  { key: 'FORE_MID', tag: '前', name: '前舷区域', cls: 'foreMid' },
  { key: 'MID', tag: '中', name: '中舷区域', cls: 'mid' },
  { key: 'ENGINE', tag: '机', name: '机舱区域', cls: 'engine' },
  { key: 'AFT', tag: '艉', name: '船艉区域', cls: 'aft' },
  { key: 'SUPERSTRUCTURE', tag: '上', name: '上层建筑', cls: 'super' },
];

const zoneKpiInit = () => Object.fromEntries(Object.keys(MANUFACTURING_ZONES).map((k) => [k, 0]));

const getManufacturingZoneKey = (cfg) => {
  const key = cfg?.mZone;
  if (key && MANUFACTURING_ZONES[key]) return key;
  const sub = cfg?.mSubZone;
  if (sub) {
    for (const [k, v] of Object.entries(MANUFACTURING_ZONES)) {
      if (Array.isArray(v?.subZones) && v.subZones.includes(sub)) return k;
    }
  }
  return null;
};

// ===================== 文本/指标 =====================
const shipTitle = 'JR0300';

const extraKpi = reactive({
  installRate: '2.8个/天',
  weldPassRate: '98.5%',
  onDuty: '156人',
  buildCycle: '532天',
});

const milestones = reactive([
  { key: 'm1', name: '开工仪式', date: '2024-01-15', status: 'done' },
  { key: 'm2', name: '龙骨铺设', date: '2024-03-20', status: 'done' },
  { key: 'm3', name: '主船体合拢', date: '2024-07-10', status: 'done' },
  { key: 'm4', name: '上层建筑搭载', date: '2024-09-01', status: 'current' },
  { key: 'm5', name: '下水仪式', date: '2025-03-15', status: 'todo' },
  { key: 'm6', name: '系泊试验', date: '2025-05-20', status: 'todo' },
  { key: 'm7', name: '交付使用', date: '2025-06-30', status: 'todo' },
]);

// ===================== 主题 =====================
const theme = ref('stellar'); // 'aurora' | 'deep' | 'stellar'
const themeClass = computed(() => {
  if (theme.value === 'aurora') return 'theme-aurora';
  if (theme.value === 'deep') return 'theme-deep';
  return 'theme-stellar';
});
function toggleTheme() {
  const themes = ['aurora', 'deep', 'stellar'];
  const i = themes.indexOf(theme.value);
  theme.value = themes[(i + 1) % themes.length];
}

// ===================== 颜色常量（完成=绿色） =====================
const COLORS_AURORA = {
  ZONE: {
    A: '#7aa7ff',
    B: '#5ce7c8',
    E: '#ffd089',
    F: '#ff86d6',
    S: '#b79bff',
    FORE: '#7aa7ff',
    FORE_MID: '#5ce7c8',
    MID: '#10b981',
    ENGINE: '#ffd089',
    AFT: '#ff86d6',
    SUPERSTRUCTURE: '#7dd3fc',
    DEFAULT: '#a7b3c7',
  },
  STATUS: {
    MISSING: '#ff6b8b',
    IN_PROGRESS_LIGHT: '#fff3c4',
    IN_PROGRESS_DEEP: '#f59e0b',
    DONE_GREEN: '#22c55e',
  },
};

const COLORS_DEEP = {
  ZONE: {
    A: '#3b82f6',
    B: '#10b981',
    E: '#f59e0b',
    F: '#ef4444',
    S: '#8b5cf6',
    FORE: '#3b82f6',
    FORE_MID: '#06b6d4',
    MID: '#10b981',
    ENGINE: '#f59e0b',
    AFT: '#ef4444',
    SUPERSTRUCTURE: '#8b5cf6',
    DEFAULT: '#94a3b8',
  },
  STATUS: {
    MISSING: '#ef4444',
    IN_PROGRESS_LIGHT: '#fff3c4',
    IN_PROGRESS_DEEP: '#d97706',
    DONE_GREEN: '#10b981',
  },
};

// ✅ 深灰主题：深底亮块，工业质感（你现在默认用它，但背景我已换成深蓝夜景）
const COLORS_STELLAR = {
  ZONE: {
    FORE: '#3B9EE8',
    FORE_MID: '#2DC8A0',
    MID: '#2DC8A0',
    ENGINE: '#F5A623',
    AFT: '#EF5566',
    SUPERSTRUCTURE: '#8B7FE8',
    DEFAULT: '#6BAFCF',
  },
  STATUS: {
    MISSING: '#EF5566',
    IN_PROGRESS_LIGHT: '#FFE27A',
    IN_PROGRESS_DEEP: '#F5A623',
    DONE_GREEN: '#2DC8A0',
  },
};

let COLORS = COLORS_STELLAR;

// ===================== 阈值/发光/尺度 =====================
const THRESHOLDS = {
  MISSING: 20,
  DONE: 80,
};

const EMISSIVE = {
  BASE: 0.08,
  HOVER_BOOST: 0.25,
  HOVER_MAX: 0.4,
};

// ===================== 状态推演（3个月） =====================
const SIM = {
  days: 90,
  msPerDay: 260,
  stage2: 15,
  stage3: 60,
  stage4: 90,
};

const simEnabled = ref(true);
const simIndex = ref(0);
const simPlaying = ref(false);
let simTimer = 0;

const simStartDate = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

const simDateText = computed(() => {
  const d = new Date(simStartDate.getTime());
  d.setDate(d.getDate() + simIndex.value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
});

const simStageText = computed(() => {
  const t = simIndex.value;
  if (t <= 0) return '阶段1：全未开工';
  if (t < SIM.stage2) return '阶段1：全未开工';
  if (t < SIM.stage3) return '阶段2：出现进行中';
  if (t < SIM.stage4) return '阶段3：出现完成';
  return '阶段4：全完成';
});

function planForSegment(id) {
  const rnd = mulberry32(hashString('plan_' + id));
  const startDay = Math.floor(rnd() * 28);
  const duration = 18 + Math.floor(rnd() * 55);
  const endDay = Math.min(SIM.days, Math.max(startDay + 6, startDay + duration));
  return { startDay, endDay };
}

function progressAtDay(day, startDay, endDay) {
  if (day < startDay) return 0;
  if (day >= endDay) return 100;
  const span = Math.max(1, endDay - startDay);
  const r = (day - startDay) / span;
  return 20 + 80 * r;
}

function applySimulation(day) {
  if (!simEnabled.value) return;

  segmentGroups.forEach((g) => {
    const { planStartDay, planEndDay } = g.userData;
    g.userData.progress = progressAtDay(day, planStartDay, planEndDay);
  });

  updateViewAppearance();
  recomputeKpi();

  if (selected.value?.id && segmentGroups.has(selected.value.id)) {
    selected.value = { ...segmentGroups.get(selected.value.id).userData };
  }
}

function recomputeKpi() {
  let sum = 0;
  let count = 0;
  let installed = 0;

  segmentGroups.forEach((g) => {
    const p = g.userData.progress || 0;
    sum += p;
    count += 1;
    if (p >= THRESHOLDS.MISSING) installed += 1;
  });

  kpi.totalCount = count;
  kpi.overallProgress = count ? Math.round(sum / count) : 0;
  kpi.installedCount = installed;
  kpi.remainingCount = Math.max(0, count - installed);

  updateZoneProgress();
}

watch(simIndex, (v) => applySimulation(v));

function toggleSimPlay() {
  simPlaying.value = !simPlaying.value;
  if (simPlaying.value) {
    setView('progress');
    if (simTimer) window.clearInterval(simTimer);
    simTimer = window.setInterval(() => {
      if (simIndex.value >= SIM.days) simIndex.value = 0;
      else simIndex.value += 1;
    }, SIM.msPerDay);
  } else {
    if (simTimer) window.clearInterval(simTimer);
    simTimer = 0;
  }
}

function stepSim(delta) {
  simPlaying.value = false;
  if (simTimer) window.clearInterval(simTimer);
  simTimer = 0;
  simIndex.value = Math.min(SIM.days, Math.max(0, simIndex.value + delta));
}

const SHIP = {
  length: 180,
  width: 30.8,
  height: 13.5,
  scale: 0.05,
};

const MATERIAL_FLAGS = {
  opaque: true,
  opacity: 1.0,
};

// ===================== Vue 状态 =====================
const canvasRef = ref(null);
const canvasWrapRef = ref(null);
const viewerContainerRef = ref(null);

const loading = ref(true);
const currentView = ref('complete'); // complete | missing | progress
const selected = ref(null);

const kpi = reactive({
  totalCount: 0,
  overallProgress: 0,
  installedCount: 0,
  remainingCount: 0,
  zones: zoneKpiInit(),
});

const tooltip = reactive({
  show: false,
  x: 0,
  y: 0,
  title: '',
  zoneName: '',
  progress: 0,
  status: '',
});
const tooltipStyle = computed(() => ({ left: tooltip.x + 'px', top: tooltip.y + 'px' }));

// ===================== Three Runtime =====================
let scene, camera, renderer, controls;
let rafId = 0;
let resizeObserver = null;

const segmentGroups = new Map(); // id -> THREE.Group
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastHoveredGroup = null;

// ===================== 生命周期 =====================
onMounted(async () => {
  await nextTick();
  initThree();
  buildScene();
  bindEvents();
  startLoop();

  setTimeout(() => (loading.value = false), 150);
});

onBeforeUnmount(() => {
  unbindEvents();
  stopLoop();
  disposeThree();
  if (simTimer) window.clearInterval(simTimer);
  simTimer = 0;
});

// 主题切换：更新背景 + 重新上色
watch(theme, (t) => {
  if (t === 'aurora') {
    COLORS = COLORS_AURORA;
    if (scene) {
      scene.background = new THREE.Color(0xf4f7ff);
      if (scene.fog?.isFog) scene.fog.color.set(0xf4f7ff);
    }
  } else if (t === 'deep') {
    COLORS = COLORS_DEEP;
    if (scene) {
      scene.background = new THREE.Color(0x081428);
      if (scene.fog?.isFog) scene.fog.color.set(0x0b1730);
    }
  } else {
    COLORS = COLORS_STELLAR;
    // ✅ 方案A：深蓝夜景（默认）
    if (scene) {
      scene.background = new THREE.Color(0x0e1624);
      if (scene.fog?.isFog) scene.fog.color.set(0x162235);
    }
  }
  updateViewAppearance();
});

// ===================== Three 初始化 =====================
function initThree() {
  const canvas = canvasRef.value;
  const wrap = canvasWrapRef.value;
  if (!canvas || !wrap) return;

  scene = new THREE.Scene();

  // ✅ 方案A：深蓝夜景
  scene.background = new THREE.Color(0xf0f2f7);
  scene.fog = new THREE.Fog(0xf0f2f7, 1, 2); // near/far 由 updateFogAfterFrame 动态改

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearAlpha(0);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  // @ts-ignore
  if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.0;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI / 2;

  resizeObserver = new ResizeObserver(() => resizeToWrap());
  resizeObserver.observe(wrap);
  resizeToWrap();
}

function updateFogAfterFrame(maxDim) {
  if (!scene?.fog || !(scene.fog instanceof THREE.Fog)) return;

  const near = Math.max(220, maxDim * 0.75);
  const far = Math.max(near + 900, camera.far * 0.92);

  scene.fog.near = near;
  scene.fog.far = far;
}

function buildScene() {
  addLights();
  createEnvironment();
  createWaterPlane();
  createAllSegments();
  applySimulation(simIndex.value);

  frameAll(0.8);
  updateViewAppearance();
}

// ✅ 程序化环境贴图
function createEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(100, 32, 16);

  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x0e1624,
    side: THREE.BackSide,
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  envScene.add(new THREE.AmbientLight(0xaeb8c8, 0.28));
  const envLight = new THREE.DirectionalLight(0xeaf1ff, 0.55);
  envLight.position.set(1, 0.9, 1);
  envScene.add(envLight);

  const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;

  pmremGenerator.dispose();
}

// ===================== 灯光/水面 =====================
function addLights() {
  const toRemove = [];
  scene.traverse((o) => {
    if (o.isLight) toRemove.push(o);
  });
  toRemove.forEach((l) => scene.remove(l));

  const key = new THREE.DirectionalLight(0xeaf1ff, 1.15);
  key.position.set(80, 160, 120);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 800;
  key.shadow.camera.left = -40;
  key.shadow.camera.right = 40;
  key.shadow.camera.top = 40;
  key.shadow.camera.bottom = -40;
  key.shadow.bias = -0.001;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xb9c7d9, 0.28);
  fill.position.set(-120, 90, -80);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x6fa8ff, 0.42);
  rim.position.set(-60, 80, 160);
  scene.add(rim);

  const ambient = new THREE.AmbientLight(0x7f8ea8, 0.22);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x2a3f66, 0x070a12, 0.22);
  scene.add(hemi);
}

function createWaterPlane() {
  const scale = SHIP.scale;
  const L = SHIP.length * scale;
  const B = SHIP.width * scale;

  const geometry = new THREE.PlaneGeometry(L * 2, B * 3);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1b2536,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
    metalness: 0.25,
    roughness: 0.7,
    envMapIntensity: 0.22,
  });

  const water = new THREE.Mesh(geometry, material);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -SHIP.height * scale * 0.3;
  water.receiveShadow = true;
  water.renderOrder = -10;
  scene.add(water);

  const gridSize = Math.max(L, B) * 2.5;
  const gridHelper = new THREE.GridHelper(gridSize, 40, 0xc0c8d0, 0xd0d8e0);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.55; // ✅ 只保留一次
  scene.add(gridHelper);
}

// ===================== 稳定随机 =====================
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===================== 业务：进度生成 / KPI =====================
function genProgressSnapshot(segmentId) {
  const rnd = mulberry32(hashString(segmentId));
  const roll = rnd();

  let base;
  if (roll < 0.12) base = rnd() * 15;
  else if (roll < 0.55) base = 20 + rnd() * 55;
  else base = 80 + rnd() * 20;

  if (segmentId.startsWith('B')) base += 6;
  else if (segmentId.startsWith('A')) base += 2;
  else if (segmentId.startsWith('E')) base -= 3;
  else if (segmentId.startsWith('F')) base += 3;

  return Math.min(100, Math.max(0, base));
}

function createAllSegments() {
  segmentGroups.forEach((g) => scene.remove(g));
  segmentGroups.clear();

  let sumProgress = 0;
  let count = 0;
  let installedCount = 0;

  Object.keys(SEGMENT_LAYOUT).forEach((id) => {
    const cfg = SEGMENT_LAYOUT[id];
    if (!cfg) return;

    const { startDay, endDay } = planForSegment(id);
    const progress = simEnabled.value
      ? progressAtDay(simIndex.value, startDay, endDay)
      : genProgressSnapshot(id);

    if (progress >= THRESHOLDS.MISSING) installedCount++;

    sumProgress += progress;
    count++;

    const scale = SHIP.scale;
    const w = cfg.width * scale;
    const h = cfg.height * scale;
    const d = cfg.depth * scale;

    const x = cfg.x * scale;
    const y = cfg.y * scale;
    const z = cfg.z * scale;

    const group = new THREE.Group();
    group.position.set(x, y, z);

    const BASE_SHRINK = 0.992;
    const FILL_SHRINK = 0.985;

    const baseGeo = new THREE.BoxGeometry(w * BASE_SHRINK, h * BASE_SHRINK, d * BASE_SHRINK);
    const fillGeo = new THREE.BoxGeometry(w * FILL_SHRINK, h * FILL_SHRINK, d * FILL_SHRINK);

    const mZoneKey = getManufacturingZoneKey(cfg);
    const zoneColor = COLORS.ZONE[mZoneKey] || COLORS.ZONE[cfg.zone] || COLORS.ZONE.DEFAULT;

    const baseMat = new THREE.MeshStandardMaterial({
      color: zoneColor,
      emissive: zoneColor,
      emissiveIntensity: EMISSIVE.BASE,
      metalness: 0.3,
      roughness: 0.45,
      transparent: !MATERIAL_FLAGS.opaque,
      opacity: MATERIAL_FLAGS.opacity,
      depthTest: true,
      depthWrite: true,
      envMapIntensity: 0.6,
    });

    const fillMat = new THREE.MeshStandardMaterial({
      color: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissive: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissiveIntensity: EMISSIVE.BASE,
      metalness: 0.35,
      roughness: 0.35,
      transparent: !MATERIAL_FLAGS.opaque,
      opacity: MATERIAL_FLAGS.opacity,
      depthTest: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      envMapIntensity: 0.6,
    });

    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    fillMesh.visible = false;

    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    fillMesh.castShadow = true;
    fillMesh.receiveShadow = true;

    baseMesh.userData.__group = group;
    fillMesh.userData.__group = group;

    baseMesh.renderOrder = 1;
    fillMesh.renderOrder = 2;

    const edgeGeo = new THREE.EdgesGeometry(baseGeo, 15);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x3a3530,
      transparent: true,
      opacity: 0.12,
      depthTest: true,
    });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.renderOrder = 3;

    group.add(baseMesh);
    group.add(fillMesh);
    group.add(edgeLine);

    group.userData = {
      id,
      zone: cfg.zone,
      mZone: cfg.mZone,
      mSubZone: cfg.mSubZone,
      mZoneKey,
      progress,
      w,
      h,
      d,
      baseMesh,
      fillMesh,
      baseEmissiveIntensity: EMISSIVE.BASE,
      planStartDay: startDay,
      planEndDay: endDay,
    };

    scene.add(group);
    segmentGroups.set(id, group);
  });

  kpi.totalCount = count;
  kpi.overallProgress = count ? Math.round(sumProgress / count) : 0;
  kpi.installedCount = installedCount;
  kpi.remainingCount = Math.max(0, count - installedCount);

  updateZoneProgress();
}

function updateZoneProgress() {
  const stats = Object.fromEntries(
    Object.keys(MANUFACTURING_ZONES).map((k) => [k, { sum: 0, c: 0 }]),
  );

  segmentGroups.forEach((g) => {
    const { mZoneKey, progress } = g.userData || {};
    if (mZoneKey && stats[mZoneKey]) {
      stats[mZoneKey].sum += progress;
      stats[mZoneKey].c += 1;
    }
  });

  Object.keys(stats).forEach((z) => {
    kpi.zones[z] = stats[z].c ? Math.round(stats[z].sum / stats[z].c) : 0;
  });
}

// ===================== 上色/视图策略 =====================
function setGroupEmissive(group, intensity) {
  const { baseMesh, fillMesh } = group.userData;

  baseMesh.material.emissiveIntensity = intensity;
  fillMesh.material.emissiveIntensity = intensity;

  baseMesh.material.transparent = !MATERIAL_FLAGS.opaque;
  baseMesh.material.opacity = MATERIAL_FLAGS.opacity;
  fillMesh.material.transparent = !MATERIAL_FLAGS.opaque;
  fillMesh.material.opacity = MATERIAL_FLAGS.opacity;

  group.userData.baseEmissiveIntensity = intensity;
}

function applyZoneView(group) {
  const { zone, mZoneKey, baseMesh, fillMesh } = group.userData;
  const c = COLORS.ZONE[mZoneKey] || COLORS.ZONE[zone] || COLORS.ZONE.DEFAULT;

  baseMesh.visible = true;
  fillMesh.visible = false;

  baseMesh.material.color.set(c);
  baseMesh.material.emissive.set(c);
  setGroupEmissive(group, EMISSIVE.BASE);
}

function applyMissingView(group) {
  const { baseMesh, fillMesh } = group.userData;

  baseMesh.visible = true;
  fillMesh.visible = false;

  baseMesh.material.color.set(COLORS.STATUS.MISSING);
  baseMesh.material.emissive.set(COLORS.STATUS.MISSING);
  setGroupEmissive(group, EMISSIVE.BASE);
}

function applyProgressView(group) {
  const { progress, w, baseMesh, fillMesh } = group.userData;

  baseMesh.visible = true;
  fillMesh.visible = false;
  baseMesh.material.color.set(COLORS.STATUS.MISSING);
  baseMesh.material.emissive.set(COLORS.STATUS.MISSING);
  setGroupEmissive(group, EMISSIVE.BASE);

  if (progress >= THRESHOLDS.DONE) {
    baseMesh.material.color.set(COLORS.STATUS.DONE_GREEN);
    baseMesh.material.emissive.set(COLORS.STATUS.DONE_GREEN);
    fillMesh.visible = false;
    setGroupEmissive(group, EMISSIVE.BASE);
    return;
  }

  if (progress >= THRESHOLDS.MISSING) {
    baseMesh.material.color.set(COLORS.STATUS.IN_PROGRESS_LIGHT);
    baseMesh.material.emissive.set(COLORS.STATUS.IN_PROGRESS_LIGHT);

    fillMesh.visible = true;
    fillMesh.material.color.set(COLORS.STATUS.IN_PROGRESS_DEEP);
    fillMesh.material.emissive.set(COLORS.STATUS.IN_PROGRESS_DEEP);

    const frac = Math.min(0.999, Math.max(0.001, progress / 100));
    fillMesh.scale.set(frac, 1, 1);
    fillMesh.position.set(-w * 0.5 + w * frac * 0.5, 0, 0);

    setGroupEmissive(group, EMISSIVE.BASE);
  }
}

function setView(v) {
  currentView.value = v;
  if (v === 'complete' && simPlaying.value) {
    simPlaying.value = false;
    if (simTimer) window.clearInterval(simTimer);
    simTimer = 0;
    simIndex.value = 0;
    applySimulation(0);
  }
  updateViewAppearance();
}

function updateViewAppearance() {
  clearHover();

  segmentGroups.forEach((g) => {
    const { progress } = g.userData;

    if (currentView.value === 'complete') {
      g.visible = true;
      applyZoneView(g);
      return;
    }

    if (currentView.value === 'missing') {
      g.visible = progress < THRESHOLDS.MISSING;
      if (g.visible) applyMissingView(g);
      return;
    }

    if (currentView.value === 'progress') {
      g.visible = true;
      applyProgressView(g);
    }
  });
}

// ===================== 相机：框选/缩放 =====================
function frameAll(tight = 0.8) {
  const box = new THREE.Box3();
  segmentGroups.forEach((g) => g.visible && box.expandByObject(g));
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  const fov = (camera.fov * Math.PI) / 180;
  const dist = maxDim / 2 / Math.tan(fov / 2);
  const desired = dist * tight;

  const dir = new THREE.Vector3(1, 0.55, 1).normalize();
  controls.target.copy(center);
  camera.position.copy(center.clone().add(dir.multiplyScalar(desired)));

  camera.near = Math.max(0.2, maxDim / 20);
  camera.far = Math.max(200, desired * 15);
  camera.updateProjectionMatrix();

  controls.minDistance = Math.max(0.8, maxDim * 0.12);
  controls.maxDistance = Math.max(50, maxDim * 30);
  controls.update();

  // ✅ 修复：只传 maxDim
  updateFogAfterFrame(maxDim);
}

function setCameraDistance(newDistance) {
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target.clone().add(dir.multiplyScalar(newDistance)));
  controls.update();
}

function zoomIn() {
  const d = camera.position.distanceTo(controls.target);
  setCameraDistance(Math.max(controls.minDistance, d * 0.85));
}
function zoomOut() {
  const d = camera.position.distanceTo(controls.target);
  setCameraDistance(Math.min(controls.maxDistance, d * 1.15));
}
function resetView() {
  frameAll(0.8);
}

const isFullscreen = ref(false);
function toggleFullscreen() {
  const el = viewerContainerRef.value;
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen().then(() => {
      isFullscreen.value = true;
    });
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    });
  }
}
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

// ===================== 交互（hover/click） =====================
function bindEvents() {
  window.addEventListener('keydown', onKeyDown);
  const el = canvasWrapRef.value;
  if (!el) return;

  el.addEventListener('mousemove', onMouseMove, { passive: true });
  el.addEventListener('mouseleave', onMouseLeave, { passive: true });
  el.addEventListener('click', onClick);
  document.addEventListener('fullscreenchange', onFullscreenChange);
}

function unbindEvents() {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  window.removeEventListener('keydown', onKeyDown);
  const el = canvasWrapRef.value;

  if (el) {
    el.removeEventListener('mousemove', onMouseMove);
    el.removeEventListener('mouseleave', onMouseLeave);
    el.removeEventListener('click', onClick);
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

function onKeyDown(e) {
  if (e.key === '1') setView('complete');
  if (e.key === '2') setView('progress');
  if (e.key === 'r' || e.key === 'R' || e.key === '0') resetView();
  if (e.key === '+' || e.key === '=') zoomIn();
  if (e.key === '-' || e.key === '_') zoomOut();
}

function getPickables() {
  const arr = [];
  segmentGroups.forEach((g) => {
    if (!g.visible) return;
    const { baseMesh, fillMesh } = g.userData;
    if (baseMesh.visible) arr.push(baseMesh);
    if (fillMesh.visible) arr.push(fillMesh);
  });
  return arr;
}

function onMouseMove(e) {
  const wrap = canvasWrapRef.value;
  if (!wrap) return;

  const rect = wrap.getBoundingClientRect();
  mouse.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(mouse, camera);

  const hit = raycaster.intersectObjects(getPickables(), false);
  if (!hit.length) {
    tooltip.show = false;
    clearHover();
    return;
  }

  const obj = hit[0].object;
  const group = obj?.userData?.__group;
  if (!group) return;

  if (group !== lastHoveredGroup) {
    clearHover();
    lastHoveredGroup = group;
    setGroupEmissive(
      group,
      Math.min(
        EMISSIVE.HOVER_MAX,
        (group.userData.baseEmissiveIntensity || EMISSIVE.BASE) + EMISSIVE.HOVER_BOOST,
      ),
    );
  }

  const d = group.userData;
  tooltip.title = d.id;
  tooltip.zoneName = getZoneName(d.zone);
  tooltip.progress = Math.round(d.progress);
  tooltip.status = getStatusText(d.progress);
  tooltip.show = true;

  const offsetX = 10;
  const offsetY = 10;
  const pad = 12;
  const tipW = 240;
  const tipH = 110;

  let x = e.clientX + offsetX;
  let y = e.clientY + offsetY;

  const maxX = window.innerWidth - tipW - pad;
  const maxY = window.innerHeight - tipH - pad;

  x = Math.max(pad, Math.min(maxX, x));
  y = Math.max(pad, Math.min(maxY, y));

  tooltip.x = x;
  tooltip.y = y;
}

function onMouseLeave() {
  tooltip.show = false;
  clearHover();
}

function clearHover() {
  if (lastHoveredGroup) {
    setGroupEmissive(
      lastHoveredGroup,
      lastHoveredGroup.userData.baseEmissiveIntensity || EMISSIVE.BASE,
    );
    lastHoveredGroup = null;
  }
}

/**
 * ✅ 修复点：点击选中不要“跳相机距离”
 * - 默认：只选中 + 视角中心对齐（不改变缩放）
 * - 你如果后面想做“Shift 点击才对齐/聚焦”，也很容易加
 */
function onClick(e) {
  if (!lastHoveredGroup) return;
  selected.value = { ...lastHoveredGroup.userData };
  focusGroup(lastHoveredGroup); // ✅ 现在不会跳远/回缩放
}

/**
 * ✅ 修复后的 focusGroup：
 * - 保持相机与target的相对offset不变（缩放不会回去）
 * - 只平移 target 到被选中分段中心
 */
function focusGroup(group) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());

  // 关键：保持当前 zoom（offset 不变）
  const offset = camera.position.clone().sub(controls.target);

  controls.target.copy(center);
  camera.position.copy(center.clone().add(offset));

  camera.updateProjectionMatrix();
  controls.update();
}

// ===================== 渲染循环 / resize / dispose =====================
function startLoop() {
  const loop = () => {
    rafId = requestAnimationFrame(loop);
    controls?.update();
    renderer?.render(scene, camera);
  };
  loop();
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

function resizeToWrap() {
  const wrap = canvasWrapRef.value;
  if (!wrap || !renderer || !camera) return;

  const rect = wrap.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function disposeThree() {
  try {
    segmentGroups.forEach((g) => {
      g.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.();
          obj.material?.dispose?.();
        }
      });
    });
    renderer?.dispose?.();
    controls?.dispose?.();
  } catch {}
}

// ===================== helpers =====================
function getZoneName(zone) {
  return (
    { A: '船艏区域', B: '船底区域', E: '机舱区域', F: '船艉区域', S: '舷侧区域' }[zone] || zone
  );
}
function getStatusText(p) {
  if (p < THRESHOLDS.MISSING) return '未开工';
  if (p < THRESHOLDS.DONE) return '进行中';
  return '已完工';
}

// ===================== 对外暴露 =====================
defineExpose({
  shipTitle,
  milestones,
  extraKpi,
  canvasRef,
  canvasWrapRef,
  viewerContainerRef,
  loading,
  currentView,
  selected,
  tooltip,
  tooltipStyle,
  kpi,
  setView,
  zoomIn,
  zoomOut,
  resetView,
  isFullscreen,
  toggleFullscreen,
  theme,
  toggleTheme,
});
</script>

<style scoped>
/* =========================================================
   ✅ 主题变量：淡炫彩（aurora） + 深海蓝（deep）
   - 背景/卡片仍随主题切换
   - ✅ 船体“示例色块”（图例 dot / 右侧 tag / mini-bar）固定使用深色模式配色
========================================================= */

/* 默认兜底 + aurora 基准 */
.page {
  --bg-0: #eef1f4;
  --bg-1: #e1e6eb;

  /* 冷钢铁：冷灰 + 钢蓝 */
  --card-bg: rgba(246, 248, 250, 0.88);
  --card-bg-strong: rgba(240, 244, 248, 0.94);
  --border: rgba(60, 76, 92, 0.22);

  --text-0: #17212b;
  --text-1: #243140;
  --text-2: rgba(36, 49, 64, 1);

  /* 冷钢铁点缀色 */
  --aurora-a: #5f7b96;
  --aurora-b: #4f8ea6;
  --aurora-c: #8aa1b4;
  --aurora-d: #44607a;
  --aurora-e: #6f7f8f;
  --aurora-f: #7ea0bc;

  --ok: #22c55e;
  --warn: #f59e0b;
  --bad: #fb7185;

  --shadow: 0 18px 44px rgba(15, 23, 42, 0.1);
  --shadow-soft: 0 12px 28px rgba(15, 23, 42, 0.08);

  /* 炫彩更浓 */
  --grad-aurora: linear-gradient(
    120deg,
    rgba(95, 123, 150, 1),
    rgba(79, 142, 166, 1),
    rgba(138, 161, 180, 1),
    rgba(68, 96, 122, 1)
  );

  --grad-aurora-strong: linear-gradient(
    120deg,
    rgba(95, 123, 150, 0.92),
    rgba(79, 142, 166, 0.82),
    rgba(138, 161, 180, 0.82),
    rgba(68, 96, 122, 0.86)
  );

  /* =========================================================
     ✅ 固定“船体示例色块”深色配色（不随主题切换）
     - 图例 dot：A/B/E
     - 右侧 tag：FORE/FORE_MID/MID/ENGINE/AFT/SUPERSTRUCTURE
     - mini-bar：对应渐变
  ========================================================= */
  --zone-a: #3b82f6; /* A 船艏 */
  --zone-b: #10b981; /* B 船底 */
  --zone-e: #f59e0b; /* E 机舱 */

  --mz-fore: #3b82f6;
  --mz-foreMid: #06b6d4;
  --mz-mid: #10b981;
  --mz-engine: #f59e0b;
  --mz-aft: #ef4444;
  --mz-super: #8b5cf6;

  height: 100%;
  padding: 18px;
  color: var(--text-0);
  overflow: auto;
}

/* ====== 淡炫彩主题 ====== */
.theme-aurora {
  background:
    radial-gradient(980px 520px at 16% 0%, rgba(79, 142, 166, 0.32), transparent 62%),
    radial-gradient(920px 520px at 92% 8%, rgba(95, 123, 150, 0.28), transparent 58%),
    radial-gradient(860px 520px at 62% 96%, rgba(138, 161, 180, 0.22), transparent 62%),
    linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 100%);
}

/* ====== 白底 + 深灰3D 主题（默认） ====== */
.theme-stellar {
  --bg-0: #f5f5f7;
  --bg-1: #eeeef0;

  --card-bg: rgba(255, 255, 255, 0.82);
  --card-bg-strong: rgba(255, 255, 255, 0.92);
  --border: rgba(0, 0, 0, 0.06);

  --text-0: #1d1d1f;
  --text-1: #48484a;
  --text-2: rgba(72, 72, 74, 0.7);

  --aurora-a: #9e7b38;
  --aurora-b: #4a8ba8;
  --aurora-c: #3d8e6e;
  --aurora-d: #9e7b38;

  --ok: #34a06c;
  --warn: #b8922e;
  --bad: #c45050;

  --shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-soft: 0 1px 6px rgba(0, 0, 0, 0.04);

  --grad-aurora: linear-gradient(
    120deg,
    rgba(158, 123, 56, 0.25),
    rgba(74, 139, 168, 0.18),
    rgba(61, 142, 110, 0.15),
    rgba(158, 123, 56, 0.1)
  );

  --grad-aurora-strong: linear-gradient(
    120deg,
    rgba(158, 123, 56, 1),
    rgba(74, 139, 168, 0.8),
    rgba(61, 142, 110, 0.75),
    rgba(158, 123, 56, 0.85)
  );

  --mz-fore: #4a8ba8;
  --mz-foreMid: #3d8e6e;
  --mz-mid: #34a06c;
  --mz-engine: #b8922e;
  --mz-aft: #c45050;
  --mz-super: #7a7e8a;

  background: linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 100%);
}
.theme-stellar .btn {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.theme-stellar .btn.active {
  background: #fff;
  border-color: rgba(158, 123, 56, 0.4);
  color: #9e7b38;
  box-shadow: 0 1px 6px rgba(158, 123, 56, 0.12);
}
.theme-stellar .sp-card,
.theme-stellar .card,
.theme-stellar .mini {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.theme-stellar .viewer-container {
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}
.theme-stellar .viewer-header {
  background: rgba(255, 255, 255, 0.8);
}
.theme-stellar .sim-bar {
  background: rgba(255, 255, 255, 0.85);
}
.theme-stellar .canvas-wrap {
  background: transparent;
}
.theme-stellar .viewer-hint {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0, 0, 0, 0.06);
  color: #8a8a8e;
}
.theme-stellar .bar,
.theme-stellar .mini-bar,
.theme-stellar .sp-zone-bar {
  background: rgba(0, 0, 0, 0.05);
}
.theme-stellar .sp-zone-row {
  border-bottom-color: rgba(0, 0, 0, 0.04);
}
.theme-stellar .sim-slider {
  accent-color: #9e7b38;
}
.theme-stellar .sim-primary {
  background: #fff;
}
.theme-stellar .sim-primary::before {
  background: linear-gradient(120deg, rgba(158, 123, 56, 0.08), rgba(74, 139, 168, 0.05));
}
.theme-stellar .loading {
  background: rgba(245, 245, 247, 0.9);
  color: #1d1d1f;
}

/* ====== 深海蓝炫彩主题 ====== */
.theme-deep {
  --bg-0: #0e141b;
  --bg-1: #0a1117;

  --card-bg: rgba(14, 20, 26, 0.65);
  --card-bg-strong: rgba(16, 24, 32, 0.78);
  --border: rgba(130, 150, 170, 0.2);

  --text-0: #e6edf5;
  --text-1: #c7d3e0;
  --text-2: rgba(214, 223, 233, 1);

  --shadow: 0 18px 44px rgba(0, 0, 0, 0.45);
  --shadow-soft: 0 12px 28px rgba(0, 0, 0, 0.34);

  --grad-aurora: linear-gradient(
    120deg,
    rgba(68, 96, 122, 0.5),
    rgba(79, 142, 166, 0.34),
    rgba(138, 161, 180, 0.3),
    rgba(95, 123, 150, 0.38)
  );

  --grad-aurora-strong: linear-gradient(
    120deg,
    rgba(68, 96, 122, 1),
    rgba(79, 142, 166, 1),
    rgba(138, 161, 180, 1),
    rgba(95, 123, 150, 1)
  );

  background:
    radial-gradient(1100px 520px at 20% 0%, rgba(68, 96, 122, 0.28), transparent 62%),
    radial-gradient(900px 520px at 92% 8%, rgba(79, 142, 166, 0.22), transparent 55%),
    radial-gradient(860px 540px at 60% 96%, rgba(138, 161, 180, 0.18), transparent 58%),
    linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 100%);
}

.dashboard {
  max-width: 1800px;
  margin: 0 auto;
}

/* =========================================================
   Header
========================================================= */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 18px 20px;
  border-radius: 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  margin-bottom: 14px;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}
.header::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--grad-aurora);
  opacity: 0.55;
  filter: blur(18px);
  z-index: 0;
}
.header > * {
  position: relative;
  z-index: 1;
}

.h1 {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.2px;
  color: var(--text-0);
}

.sub {
  color: var(--text-2);
  font-size: 13px;
  /* margin-left:20px */
}
.sub b {
  /* background: var(--grad-aurora-strong); */
  -webkit-background-clip: text;
  background-clip: text;
  color: #409eff;
  font-weight: 900;

  /* font-size: 20px; */
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.time {
  color: var(--text-2);
  font-size: 13px;
}

/* 主题切换按钮 */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.16);
  color: var(--text-1);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}
.theme-deep .theme-toggle {
  background: rgba(0, 0, 0, 0.22);
}
.theme-toggle:hover {
  transform: translateY(-1px);
  border-color: rgba(106, 167, 255, 0.55);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
}
.t-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--grad-aurora-strong);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.22);
}
.theme-deep .t-dot {
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.28);
}
.t-split {
  opacity: 0.6;
}

/* =========================================================
   Section：里程碑 + KPI
========================================================= */
.section {
  padding: 14px 16px 16px;
  border-radius: 14px;
  background: var(--card-bg-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
  margin-bottom: 14px;
  backdrop-filter: blur(10px);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.section-title {
  /* font-size: 14px; */
  font-weight: 900;
  color: var(--text-0);
}
.legend {
  display: flex;
  gap: 14px;
  color: var(--text-2);
  font-size: 12px;
}
.lg {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}
/* ✅ 图例示例固定深色配色 */
.dot.a {
  background: var(--zone-a);
}
.dot.b {
  background: var(--zone-b);
}
.dot.e {
  background: var(--zone-e);
}

.milestone-wrap {
  position: relative;
  margin-top: 10px;
}
.milestone-scroll {
  display: flex;
  gap: 14px;
  padding: 10px 2px 8px;
  overflow-x: auto;
}
.milestone-scroll::-webkit-scrollbar {
  height: 8px;
}
.milestone-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.28);
  border-radius: 99px;
}
.theme-deep .milestone-scroll::-webkit-scrollbar-thumb {
  background: rgba(226, 232, 240, 0.16);
}

.milestone {
  position: relative;
  /* width: 160px;
  min-width: 160px; */
  padding: 14px 12px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(10px);
  flex: 1;
}
.theme-deep .milestone {
  background: rgba(10, 20, 40, 0.55);
}
.milestone.done {
  border-color: rgba(34, 197, 94, 0.55);
  box-shadow: 0 12px 22px rgba(34, 197, 94, 0.14);
}
.milestone.current {
  border-color: rgba(245, 158, 11, 0.65);
  box-shadow: 0 12px 22px rgba(245, 158, 11, 0.16);
}
.milestone.todo {
  opacity: 0.9;
}

.badge {
  position: absolute;
  top: -9px;
  right: 10px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.24);
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.95), rgba(104, 240, 209, 0.85));
}
.badge.current {
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.28);
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.95), rgba(255, 211, 122, 0.85));
}
.m-name {
  font-weight: 900;
  color: var(--text-0);
  font-size: 13px;
}
.m-date {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-2);
}

.kpi-row {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.kpi-card {
  padding: 14px 14px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(10px);
}
.theme-deep .kpi-card {
  background: rgba(10, 20, 40, 0.55);
}
.kpi-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-2);
  font-size: 12px;
}
.ico {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid var(--border);
}
.kpi-value {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 900;
  background: linear-gradient(90deg, var(--aurora-a), var(--aurora-b), var(--aurora-d));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* =========================================================
   Main：3D + 右侧
========================================================= */
.main-content {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 14px;
  min-height: 600px;
}

.viewer-container {
  position: relative;
  border-radius: 14px;
  background: var(--card-bg-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 610px;
  backdrop-filter: blur(10px);
}

/* ✅ 双行 header：toolbar + sim-bar */
.viewer-header {
  padding: 15px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(255, 255, 255, 0.3);
}
.theme-deep .viewer-header {
  background: rgba(0, 0, 0, 0.18);
}

.viewer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.viewer-title {
  font-weight: 900;
  color: var(--text-0);
  font-size: 16px;
  align-items: flex-end;
}

/* 控件区 */
.view-controls {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
}
.divider {
  width: 1px;
  height: 22px;
  background: var(--border);
  margin: 0 4px;
  opacity: 0.9;
}

.btn {
  padding: 8px 10px;
  font-size: 12px;
  border-radius: 25px;
  border: none;
  background: rgba(255, 255, 255, 0.78);
  color: var(--text-1);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
  box-shadow: 1px 2px 3px rgb(15 23 42 / 19%);
  backdrop-filter: blur(10px);
}
.theme-deep .btn {
  background: rgba(0, 0, 0, 0.18);
}
.btn:hover {
  transform: translateY(-1px);
  border-color: rgba(106, 167, 255, 0.55);
  box-shadow: 1px 2px 3px rgb(15 23 42 / 19%);
}
.btn.active {
  color: var(--text-0);
  border-color: rgba(106, 167, 255, 1);
  background: rgba(255, 255, 255, 0.88);
  position: relative;
  overflow: hidden;
  font-weight: 500;
}
.theme-deep .btn.active {
  background: rgba(0, 0, 0, 0.24);
}
.btn.active::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--grad-aurora);
  filter: blur(10px);
  z-index: -1;
}
.btn.active > * {
  position: relative;
  z-index: 1;
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.56);
}
.theme-deep .btn.ghost {
  background: rgba(0, 0, 0, 0.16);
}

/* 缩放区 */
.zoom-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}
.zoom {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  font-size: 18px;
  color: var(--text-1);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
}
.theme-deep .zoom {
  background: rgba(0, 0, 0, 0.18);
}

/* ✅ 推演工具栏：sim-bar */
.sim-bar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 0px 0px 14px 14px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(10px);
}
.theme-deep .sim-bar {
  background: rgba(0, 0, 0, 0.18);
}

.sim-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sim-primary {
  position: relative;
  overflow: hidden;
  color: var(--text-0);
  border-color: rgba(106, 167, 255, 0.45);
}
.sim-primary::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--grad-aurora-strong);
  opacity: 0.4;
  filter: blur(10px);
  z-index: 0;
}
.sim-primary > * {
  position: relative;
  z-index: 1;
}

.sim-ico {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  margin-right: 6px;
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid var(--border);
}

.sim-step {
  width: 40px;
  padding: 8px 0;
  text-align: center;
}

.sim-mid {
  display: flex;
  flex-direction: column;
  /* gap: 6px; */
  min-width: 260px;
}
.sim-scale {
  display: flex;
  justify-content: space-between;
  color: var(--text-2);
  font-size: 12px;
  padding: 0 5px;
}
.sim-slider {
  width: 100%;
  accent-color: #916aff;
}
.theme-deep .sim-slider {
  accent-color: #916aff;
}

.sim-right {
  display: flex;
  justify-content: flex-end;
}
.sim-date {
  font-size: 12px;
  color: var(--text-2);
  white-space: nowrap;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.45);
}
.theme-deep .sim-date {
  background: rgba(0, 0, 0, 0.16);
  border-color: rgba(226, 232, 240, 0.18);
}
.sim-date b {
  color: var(--text-0);
}
.sim-stage {
  margin-left: 8px;
  opacity: 0.85;
}

/* Canvas 区 */
.canvas-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  background: rgba(255, 255, 255, 0.14);
}
.theme-deep .canvas-wrap {
  background: rgba(0, 0, 0, 0.08);
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}
.fullscreen-btn {
  position: absolute;
  top: 70px;
  right: 8px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.fullscreen-btn:hover {
  opacity: 1;
}
.fs-progress-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
  pointer-events: none;
}
.theme-deep .fs-progress-overlay {
  background: rgba(10, 20, 40, 0.75);
}
canvas:active {
  cursor: grabbing;
}

.viewer-hint {
  position: absolute;
  left: 12px;
  bottom: 12px;
  font-size: 12px;
  color: var(--text-2);
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border);
  border-radius: 10px;
  pointer-events: none;
  backdrop-filter: blur(10px);
}
.theme-deep .viewer-hint {
  background: rgba(0, 0, 0, 0.26);
}

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
  background: rgba(244, 247, 255, 0.78);
  color: var(--text-1);
}
.theme-deep .loading {
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-0);
}
.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(106, 167, 255, 0.22);
  border-top: 3px solid rgba(106, 167, 255, 0.9);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ✅ tooltip：更像产品浮层 + 更“近” */
.tooltip {
  position: fixed;
  min-width: 240px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(106, 167, 255, 0.3);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.12s,
    transform 0.12s;
  transform: translateY(4px);
  z-index: 9999;
  backdrop-filter: blur(12px);
}
.theme-deep .tooltip {
  background: rgba(10, 20, 40, 0.82);
  border-color: rgba(59, 130, 246, 0.25);
}
.tooltip.show {
  opacity: 1;
  transform: translateY(0);
}
.tooltip-title {
  font-weight: 900;
  color: var(--text-0);
  margin-bottom: 6px;
  font-size: 13px;
}
.tooltip-content {
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.6;
}

/* =========================================================
   Right control panel
========================================================= */
.control-panel {
  border-radius: 14px;
  background: var(--card-bg-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 600px;
  backdrop-filter: blur(10px);
}

.card {
  border-radius: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(10px);
}
.theme-deep .card {
  background: rgba(10, 20, 40, 0.55);
}
.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-2);
  font-size: 12px;
}
.card-title b {
  /* background: var(--grad-aurora-strong); */
  -webkit-background-clip: text;
  background-clip: text;
  color: #409eff;
  font-weight: 900;
  font-size: 16px;
}

.big {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 900;
  background: var(--grad-aurora-strong);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 0.2px;
}
.bar {
  margin-top: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.24);
  overflow: hidden;
}
.theme-deep .bar {
  background: rgba(226, 232, 240, 0.1);
}
.fill {
  height: 100%;
  background: var(--grad-aurora-strong);
  box-shadow: 0 12px 22px rgba(106, 167, 255, 0.18);
}

.stats {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  color: var(--text-2);
  font-size: 14px;
}

.grid2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.mini {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(10px);
}
.theme-deep .mini {
  background: rgba(10, 20, 40, 0.55);
}
.mini-top {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  font-size: 12px;
}
.tag {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
  color: #fff;
}

/* 旧的 a/b/e/f 可保留（如果别处用到） */
.tag.a {
  background: var(--zone-a);
}
.tag.b {
  background: var(--zone-b);
}
.tag.e {
  background: var(--zone-e);
}
.tag.f {
  background: #8b5cf6;
}

/* ✅ 制造区域 tag 固定深色配色 */
.tag.fore {
  background: var(--mz-fore);
}
.tag.foreMid {
  background: var(--mz-foreMid);
}
.tag.mid {
  background: var(--mz-mid);
}
.tag.engine {
  background: var(--mz-engine);
}
.tag.aft {
  background: var(--mz-aft);
}
.tag.super {
  background: var(--mz-super);
}

.mini-val {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 900;
  color: var(--text-0);
}
.mini-bar {
  margin-top: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.24);
  overflow: hidden;
}
.theme-deep .mini-bar {
  background: rgba(226, 232, 240, 0.1);
}
.mini-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
}

/* ✅ 制造区域 mini-bar 固定深色渐变 */
.mini-bar i.fore {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.92), rgba(6, 182, 212, 0.78));
}
.mini-bar i.foreMid {
  background: linear-gradient(90deg, rgba(6, 182, 212, 0.9), rgba(16, 185, 129, 0.78));
}
.mini-bar i.mid {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.9), rgba(34, 197, 94, 0.76));
}
.mini-bar i.engine {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.92), rgba(251, 191, 36, 0.76));
}
.mini-bar i.aft {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.92), rgba(244, 63, 94, 0.76));
}
.mini-bar i.super {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.76));
}

/* 旧的 a/b/e/f（如别处用到） */
.mini-bar i.a {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.92), rgba(125, 211, 252, 0.78));
}
.mini-bar i.b {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.9), rgba(34, 197, 94, 0.76));
}
.mini-bar i.e {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.92), rgba(251, 191, 36, 0.76));
}
.mini-bar i.f {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.76));
}

.sel {
  margin-top: 8px;
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.8;
}
.empty {
  margin-top: 8px;
  color: rgba(148, 163, 184, 0.9);
  font-size: 12px;
}
.theme-deep .empty {
  color: rgba(226, 232, 240, 0.55);
}

/* =========================================================
   Side Panel（右侧窄面板）
========================================================= */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 610px;
  overflow: hidden;
}
.side-panel::-webkit-scrollbar {
  width: 4px;
}
.side-panel::-webkit-scrollbar-thumb {
  background: rgba(120, 100, 75, 0.2);
  border-radius: 99px;
}

.sp-card {
  border-radius: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  background: var(--card-bg);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

/* 整体进度 + 选中分段：固定高度 */
.sp-progress {
  flex-shrink: 0;
}
.sp-selected {
  flex-shrink: 0;
}

/* 区域进度：自适应撑满剩余空间 */
.sp-zones {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.sp-zones::-webkit-scrollbar {
  width: 3px;
}
.sp-zones::-webkit-scrollbar-thumb {
  background: rgba(120, 100, 75, 0.2);
  border-radius: 99px;
}

.sp-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-2);
}
.mb6 {
  margin-bottom: 6px;
}

/* --- 环形进度 --- */
.sp-ring-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.sp-ring {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}
.sp-ring svg {
  width: 100%;
  height: 100%;
}
.sp-ring-val {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 900;
  color: var(--text-0);
}
.sp-ring-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sp-counts {
  display: flex;
  gap: 12px;
}
.sp-count-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-0);
}
.sp-count-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.sp-count-dot.done {
  background: var(--ok);
}
.sp-count-dot.rest {
  background: var(--border);
}
.sp-count-unit {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-2);
}

/* --- 区域进度列表 --- */
.sp-zone-row {
  display: grid;
  grid-template-columns: 8px 1fr 36px 50px;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(120, 100, 75, 0.06);
}
.sp-zone-row:last-child {
  border-bottom: none;
}

.sp-zone-dot {
  width: 8px;
  height: 8px;
  border-radius: 3px;
}
.sp-zone-dot.fore {
  background: var(--mz-fore);
}
.sp-zone-dot.foreMid {
  background: var(--mz-foreMid);
}
.sp-zone-dot.mid {
  background: var(--mz-mid);
}
.sp-zone-dot.engine {
  background: var(--mz-engine);
}
.sp-zone-dot.aft {
  background: var(--mz-aft);
}
.sp-zone-dot.super {
  background: var(--mz-super);
}

.sp-zone-name {
  font-size: 12px;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sp-zone-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-0);
  text-align: right;
}
.sp-zone-bar {
  height: 4px;
  border-radius: 99px;
  background: rgba(120, 100, 75, 0.1);
  overflow: hidden;
}
.sp-zone-bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
}
.sp-zone-bar i.fore {
  background: var(--mz-fore);
}
.sp-zone-bar i.foreMid {
  background: var(--mz-foreMid);
}
.sp-zone-bar i.mid {
  background: var(--mz-mid);
}
.sp-zone-bar i.engine {
  background: var(--mz-engine);
}
.sp-zone-bar i.aft {
  background: var(--mz-aft);
}
.sp-zone-bar i.super {
  background: var(--mz-super);
}

/* --- 选中分段 --- */
.sp-sel-id {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 900;
  color: var(--text-0);
  letter-spacing: 0.5px;
}
.sp-sel-grid {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sp-sel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.sp-sel-k {
  color: var(--text-2);
}
.sp-sel-v {
  font-weight: 600;
  color: var(--text-0);
}
.sp-sel-v.accent {
  color: var(--warn);
}
.sp-sel-v.st-done {
  color: var(--ok);
}
.sp-sel-v.st-wip {
  color: var(--warn);
}
.sp-sel-v.st-idle {
  color: var(--bad);
}
.sp-sel-empty {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-2);
  opacity: 0.7;
}

/* =========================================================
   通用小工具（你原来用到的 mb20 / mb10 等）
========================================================= */
.mb20 {
  margin-bottom: 20px;
}
.mb15 {
  margin-bottom: 15px;
}
.mb10 {
  margin-bottom: 10px;
}
</style>
