<template>
  <div class="page" :class="themeClass" style="overflow: auto">
    <div class="dashboard">
      <div class="main-content mb20">
        <div class="viewer-container">
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
                <button
                  class="btn"
                  :class="{ active: currentView === 'missing' }"
                  @click="setView('missing')"
                >
                  未开工分段
                </button>
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

          <div ref="canvasWrapRef" class="canvas-wrap" @contextmenu.prevent>
            <canvas ref="canvasRef"></canvas>
            <div class="viewer-hint">左键旋转 · 右键平移 · 滚轮缩放</div>

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

        <div>
          <div class="card mb10">
            <div class="card-title">
              <span class="fs16 fw">整体装配进度</span>
            </div>
            <div class="big">{{ kpi.overallProgress }}%</div>
            <div class="bar">
              <div class="fill" :style="{ width: kpi.overallProgress + '%' }"></div>
            </div>
            <div class="stats">
              <span>已安装: {{ kpi.installedCount }} 个</span>
              <span>剩余: {{ kpi.remainingCount }} 个</span>
            </div>
          </div>

          <div class="grid2">
            <div v-for="z in manufacturingZoneCards" :key="z.key" class="mini">
              <div class="mini-top">
                <span class="tag" :class="z.cls">{{ z.tag }}</span>
                <span class="fs14">{{ z.name }}</span>
              </div>
              <div class="mini-val">{{ kpi.zones[z.key] }}%</div>
              <div class="mini-bar">
                <i :class="z.cls" :style="{ width: kpi.zones[z.key] + '%' }"></i>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">
              <span class="fs16 fw">选中总段</span>
              <div v-if="selected" class="sel-line">
                <b>{{ selected.id }}</b>
              </div>
            </div>
            <div v-if="selected" class="sel">
              <div class="sel-line">区域：{{ getZoneName(selected.zone) }}</div>
              <div class="sel-line">进度：{{ Math.round(selected.progress) }}%</div>
              <div class="sel-line">状态：{{ getStatusText(selected.progress) }}</div>
            </div>
            <div v-else class="sel"></div>
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
  FORE: {
    // 船艏区域
    subZones: ['FF1', 'FF2', 'FF3'],
  },
  FORE_MID: {
    // 前舷区域
    subZones: ['FM1', 'FM2', 'FM3'],
  },
  MID: {
    // 中舷区域
    subZones: ['MD1', 'MD2', 'MD3', 'MD4'],
    color: 0x10b981,
  },
  ENGINE: {
    // 机舱区域
    subZones: ['ER1', 'ER2', 'ER3'],
  },
  AFT: {
    // 船艉区域
    subZones: ['AF1', 'AF2', 'AF3'],
  },
  SUPERSTRUCTURE: {
    // 上层建筑
    subZones: ['SS1', 'SS2', 'SS3'],
  },
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
const theme = ref('aurora'); // 'aurora' | 'deep'
const themeClass = computed(() => (theme.value === 'aurora' ? 'theme-aurora' : 'theme-deep'));
function toggleTheme() {
  theme.value = theme.value === 'aurora' ? 'deep' : 'aurora';
}

// ===================== 颜色常量（完成=绿色） =====================
const COLORS_AURORA = {
  ZONE: {
    A: '#7aa7ff',
    B: '#5ce7c8',
    E: '#ffd089',
    F: '#ff86d6',
    S: '#b79bff',
    // 制造区域（与 SEGMENT_LAYOUT.mZone 对齐）
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
    IN_PROGRESS_LIGHT: '#fff3c4', // 进行中底色：浅黄
    IN_PROGRESS_DEEP: '#f59e0b', // 进行中进度：深黄
    DONE_GREEN: '#22c55e', // 完成：绿色
  },
};

const COLORS_DEEP = {
  ZONE: {
    A: '#3b82f6',
    B: '#10b981',
    E: '#f59e0b',
    F: '#ef4444',
    S: '#8b5cf6',
    // 制造区域（与 SEGMENT_LAYOUT.mZone 对齐）
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

let COLORS = COLORS_DEEP;

// ===================== 阈值/发光/尺度 =====================
const THRESHOLDS = {
  MISSING: 20, // <20 未开工
  DONE: 80, // >=80 已完工（完成=绿色）
};

const EMISSIVE = {
  BASE: 0.05,
  HOVER_BOOST: 0.16,
  HOVER_MAX: 0.26,
};

// ===================== 状态推演（3个月） =====================
const SIM = {
  days: 90, // 约3个月
  msPerDay: 260, // 播放速度：每“天”260ms（你想更慢就调大）
  stage2: 15, // 第2阶段：开始出现进行中
  stage3: 60, // 第3阶段：开始出现完成
  stage4: 90, // 第4阶段：全完成
};

const simEnabled = ref(true); // 需要的话可做开关；这里默认启用
const simIndex = ref(0); // 0..90
const simPlaying = ref(false);
let simTimer = 0;

// 推演起点：今天 00:00（你也可以换成项目开工日）
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

// 给每个分段生成“计划开始/结束日”（确定性：同一个id每次一样）
function planForSegment(id) {
  const rnd = mulberry32(hashString('plan_' + id));
  const startDay = Math.floor(rnd() * 28); // 0..27 天内开始
  const duration = 18 + Math.floor(rnd() * 55); // 18..72 天工期
  const endDay = Math.min(SIM.days, Math.max(startDay + 6, startDay + duration));
  return { startDay, endDay };
}

// 推演日 -> 进度（核心）
// 规则：开工前=0；开工后立即到20（脱离“未开工”阈值），然后线性涨到100；结束后=100
function progressAtDay(day, startDay, endDay) {
  if (day < startDay) return 0;
  if (day >= endDay) return 100;
  const span = Math.max(1, endDay - startDay);
  const r = (day - startDay) / span; // 0..1
  return 20 + 80 * r;
}

function applySimulation(day) {
  if (!simEnabled.value) return;

  // 1) 更新每个分段 progress
  segmentGroups.forEach((g) => {
    const { planStartDay, planEndDay } = g.userData;
    g.userData.progress = progressAtDay(day, planStartDay, planEndDay);
  });

  // 2) 重新上色（会用到 progress）
  updateViewAppearance();

  // 3) 重新算KPI
  recomputeKpi();

  // 4) 如果当前有选中分段，同步它的progress显示
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
    if (simTimer) window.clearInterval(simTimer);
    simTimer = window.setInterval(() => {
      if (simIndex.value >= SIM.days) simIndex.value = 0;
      else simIndex.value += 1;
    }, SIM.msPerDay);
  } else {
    if (simTimer) window.clearInterval(simTimer);
    onBeforeUnmount;
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

// ✅ 让分段尽量不透明：减少透明排序导致的“抖动/闪”
const MATERIAL_FLAGS = {
  opaque: true,
  opacity: 1.0,
};

// ===================== Vue 状态 =====================
const canvasRef = ref(null);
const canvasWrapRef = ref(null);

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

const segmentGroups = new Map(); // id -> THREE.Group({baseMesh, fillMesh})
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
  //   startClock();
});

onBeforeUnmount(() => {
  unbindEvents();
  stopLoop();
  disposeThree();
  //   stopClock();
  if (simTimer) window.clearInterval(simTimer);
  simTimer = 0;
});

// 主题切换：更新背景 + 重新上色
watch(theme, (t) => {
  //   COLORS = t === 'aurora' ? COLORS_AURORA : COLORS_DEEP;
  if (scene) scene.background = new THREE.Color(t === 'aurora' ? 0xf4f7ff : 0x081428);
  updateViewAppearance();
});

// ===================== Three 初始化 =====================
function initThree() {
  const canvas = canvasRef.value;
  const wrap = canvasWrapRef.value;
  if (!canvas || !wrap) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f7ff);

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearAlpha(0);

  // 兼容不同 three 版本
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

function buildScene() {
  addLights();
  createWaterPlane();
  createAllSegments();
  applySimulation(simIndex.value);

  // ✅ 默认更大一点：tight 越小越“近”
  frameAll(0.8);

  updateViewAppearance();
}

// ===================== 灯光/水面 =====================
function addLights() {
  const main = new THREE.DirectionalLight(0xffffff, 0.95);
  main.position.set(60, 140, 80); // 确保光源位置合理
  scene.add(main);

  const ambient = new THREE.AmbientLight(0xffffff, 0.65); // 环境光强度调整
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0xdbeafe, 0.45);
  fill.position.set(-80, 100, -60); // 添加补充光源，避免阴影过深
  scene.add(fill);
}

function createWaterPlane() {
  const scale = SHIP.scale;
  const L = SHIP.length * scale;
  const B = SHIP.width * scale;

  const geometry = new THREE.PlaneGeometry(L * 1.6, B * 2.2);
  const material = new THREE.MeshPhongMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const water = new THREE.Mesh(geometry, material);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -SHIP.height * scale * 0.3;
  water.renderOrder = -10;
  scene.add(water);
}

// ===================== 稳定随机（保证刷新不乱跳） =====================
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
  if (roll < 0.12)
    base = rnd() * 15; // 未开始
  else if (roll < 0.55)
    base = 20 + rnd() * 55; // 进行中
  else base = 80 + rnd() * 20; // 完成

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

    // ✅ 避免“面重叠闪烁”：轻微 shrink + fill 用 polygonOffset
    const BASE_SHRINK = 0.992;
    const FILL_SHRINK = 0.985;

    const baseGeo = new THREE.BoxGeometry(w * BASE_SHRINK, h * BASE_SHRINK, d * BASE_SHRINK);
    const fillGeo = new THREE.BoxGeometry(w * FILL_SHRINK, h * FILL_SHRINK, d * FILL_SHRINK);

    const mZoneKey = getManufacturingZoneKey(cfg);
    const zoneColor = COLORS.ZONE[mZoneKey] || COLORS.ZONE[cfg.zone] || COLORS.ZONE.DEFAULT;

    const baseMat = new THREE.MeshPhongMaterial({
      color: zoneColor,
      emissive: zoneColor,
      emissiveIntensity: EMISSIVE.BASE,
      shininess: 40,
      transparent: !MATERIAL_FLAGS.opaque,
      opacity: MATERIAL_FLAGS.opacity,
      depthTest: true,
      depthWrite: true,
    });

    const fillMat = new THREE.MeshPhongMaterial({
      color: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissive: COLORS.STATUS.IN_PROGRESS_DEEP,
      emissiveIntensity: EMISSIVE.BASE,
      shininess: 40,
      transparent: !MATERIAL_FLAGS.opaque,
      opacity: MATERIAL_FLAGS.opacity,
      depthTest: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    fillMesh.visible = false;

    baseMesh.userData.__group = group;
    fillMesh.userData.__group = group;

    baseMesh.renderOrder = 1;
    fillMesh.renderOrder = 2;

    group.add(baseMesh);
    group.add(fillMesh);

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
      planStartDay: startDay, // ✅ 推演用
      planEndDay: endDay, // ✅ 推演用
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

  // 保证一致的材质处理
  baseMesh.material.transparent = !MATERIAL_FLAGS.opaque;
  baseMesh.material.opacity = MATERIAL_FLAGS.opacity;
  fillMesh.material.transparent = !MATERIAL_FLAGS.opaque;
  fillMesh.material.opacity = MATERIAL_FLAGS.opacity;

  group.userData.baseEmissiveIntensity = intensity; // 记录原始的发光强度
}

function applyZoneView(group) {
  const { zone, mZoneKey, baseMesh, fillMesh } = group.userData;
  const c = COLORS.ZONE[mZoneKey] || COLORS.ZONE[zone] || COLORS.ZONE.DEFAULT;

  baseMesh.visible = true;
  fillMesh.visible = false;

  baseMesh.material.color.set(c);
  baseMesh.material.emissive.set(c);
  setGroupEmissive(group, EMISSIVE.BASE); // 统一发光强度
}

function applyMissingView(group) {
  const { baseMesh, fillMesh } = group.userData;

  baseMesh.visible = true;
  fillMesh.visible = false;

  baseMesh.material.color.set(COLORS.STATUS.MISSING);
  baseMesh.material.emissive.set(COLORS.STATUS.MISSING);
  setGroupEmissive(group, EMISSIVE.BASE); // 统一发光强度
}

// ✅ progress：未开工红；进行中浅黄底+深黄填充；完成绿色
function applyProgressView(group) {
  const { progress, w, baseMesh, fillMesh } = group.userData;

  // 默认状态：未开工
  baseMesh.visible = true;
  fillMesh.visible = false;
  baseMesh.material.color.set(COLORS.STATUS.MISSING);
  baseMesh.material.emissive.set(COLORS.STATUS.MISSING);
  setGroupEmissive(group, EMISSIVE.BASE);

  if (progress >= THRESHOLDS.DONE) {
    // 完成：绿色
    baseMesh.material.color.set(COLORS.STATUS.DONE_GREEN);
    baseMesh.material.emissive.set(COLORS.STATUS.DONE_GREEN);
    fillMesh.visible = false; // 不显示填充
    setGroupEmissive(group, EMISSIVE.BASE);
    return;
  }

  if (progress >= THRESHOLDS.MISSING) {
    // 进行中：底色浅黄，填充深黄
    baseMesh.material.color.set(COLORS.STATUS.IN_PROGRESS_LIGHT);
    baseMesh.material.emissive.set(COLORS.STATUS.IN_PROGRESS_LIGHT);

    fillMesh.visible = true;
    fillMesh.material.color.set(COLORS.STATUS.IN_PROGRESS_DEEP);
    fillMesh.material.emissive.set(COLORS.STATUS.IN_PROGRESS_DEEP);

    const frac = Math.min(0.999, Math.max(0.001, progress / 100));

    // 填充从左到右增长：scale.x 和 position.x 偏移
    fillMesh.scale.set(frac, 1, 1);
    fillMesh.position.set(-w * 0.5 + w * frac * 0.5, 0, 0);

    setGroupEmissive(group, EMISSIVE.BASE);
  }
}

function setView(v) {
  currentView.value = v;
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

// ===================== 交互（hover/click） =====================
function bindEvents() {
  window.addEventListener('keydown', onKeyDown);
  const el = canvasWrapRef.value;
  if (!el) return;

  el.addEventListener('mousemove', onMouseMove, { passive: true });
  el.addEventListener('mouseleave', onMouseLeave, { passive: true });
  el.addEventListener('click', onClick);
}

function unbindEvents() {
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
  if (e.key === '2') setView('missing');
  if (e.key === '3') setView('progress');
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
    clearHover(); // 鼠标移开时清除高亮
    return;
  }

  const obj = hit[0].object;
  const group = obj?.userData?.__group;
  if (!group) return;

  if (group !== lastHoveredGroup) {
    clearHover(); // 清除上一个高亮
    lastHoveredGroup = group;
    setGroupEmissive(
      group,
      Math.min(
        EMISSIVE.HOVER_MAX,
        (group.userData.baseEmissiveIntensity || EMISSIVE.BASE) + EMISSIVE.HOVER_BOOST,
      ),
    ); // 鼠标悬停时增加发光强度
  }

  const d = group.userData;
  tooltip.title = d.id;
  tooltip.zoneName = getZoneName(d.zone);
  tooltip.progress = Math.round(d.progress);
  tooltip.status = getStatusText(d.progress);
  tooltip.show = true;

  // 使 tooltip 始终贴近鼠标
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
    // 恢复原始发光强度
    setGroupEmissive(
      lastHoveredGroup,
      lastHoveredGroup.userData.baseEmissiveIntensity || EMISSIVE.BASE,
    );
    lastHoveredGroup = null;
  }
}

function onClick() {
  if (!lastHoveredGroup) return;
  selected.value = { ...lastHoveredGroup.userData };
  focusGroup(lastHoveredGroup);
}

function focusGroup(group) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  const dir = camera.position.clone().sub(controls.target).normalize();
  controls.target.copy(center);
  camera.position.copy(
    center.clone().add(dir.multiplyScalar(Math.max(controls.minDistance, maxDim * 10))),
  );
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

// ===================== 时钟 =====================
// const currentDateText = ref('');
// let clockTimer = 0;

// function updateDateTime() {
//   const now = new Date();
//   const dateStr = now.toLocaleDateString('zh-CN', {
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//   });
//   const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
//   currentDateText.value = `${dateStr} ${timeStr}`;
// }

// function startClock() {
//   updateDateTime();
//   clockTimer = window.setInterval(updateDateTime, 60000);
// }
// function stopClock() {
//   if (clockTimer) window.clearInterval(clockTimer);
//   clockTimer = 0;
// }

// ===================== 对外暴露（可选） =====================
defineExpose({
  shipTitle,
  milestones,
  extraKpi,
  canvasRef,
  canvasWrapRef,
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
  //   currentDateText,
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
  grid-template-columns: 1fr 380px;
  gap: 14px;
  min-height: 600px;
}

.viewer-container {
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
