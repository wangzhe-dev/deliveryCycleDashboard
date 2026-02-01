<template>
  <div class="orient" :style="wrapStyle">
    <div class="orient__axes">
      <div class="center-mini" title="坐标中心">
        <div ref="centerHost" class="center-host"></div>
      </div>
      <button
        v-for="(a, idx) in axes"
        :key="a.key || idx"
        type="button"
        class="axes-row"
        :title="a.title || a.label"
        @click="emitAxis(a)"
      >
        <span class="dot" :style="{ background: a.color || '#9ca3af' }"></span>
        <span class="txt">{{ a.label }}</span>
      </button>
    </div>

    <div class="orient__mini">
      <button type="button" class="mini-box" :title="cubeTitle" @click="emitCube">
        <div ref="miniHost" class="mini-host" @click.stop @pointerdown.stop></div>
        <div class="mini-label">{{ cubeText }}</div>
      </button>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  axes: {
    type: Array,
    default: () => [
      { key: 'up', label: '俯视', title: '上方向', color: '#64748b' },
      { key: 'down', label: '底视', title: '下方向', color: '#64748b' },
      { key: 'fore', label: '正视', title: '前方向', color: '#2563eb' },
      { key: 'aft', label: '后视', title: '后方向', color: '#2563eb' },
      { key: 'port', label: '左视', title: '左舷方向', color: '#f59e0b' },
      { key: 'starboard', label: '右视', title: '右舷方向', color: '#f59e0b' },
    ],
  },
  cubeText: { type: String, default: 'ISO/BOX' },
  cubeTitle: { type: String, default: '视角导航' },

  // three：Y-Up（three默认）  ship：Z-Up（X前、Y左、Z上）
  preset: { type: String, default: 'ship' }, // 'three' | 'ship'

  quaternion: { type: [Object, Array], default: null },
  activeAxis: { type: String, default: '' },

  axisFaceMap: { type: Object, default: null },
  showCenterMarks: { type: Boolean, default: true },
  centerColor: { type: String, default: '#ef4444' },
  centerAxisWidth: { type: Number, default: 1 },

  top: { type: [Number, String], default: 10 },
  right: { type: [Number, String], default: 10 },
  width: { type: [Number, String], default: '100%' },
  height: { type: [Number, String], default: 110 },
  translucent: { type: Boolean, default: true },
});

const emit = defineEmits(['axis-click', 'cube-click']);
const px = (v) => (typeof v === 'number' ? `${v}px` : v);

const wrapStyle = computed(() => ({
  width: px(props.width),
}));

function emitAxis(a) {
  emit('axis-click', a);
}
function emitCube() {
  emit('cube-click');
}

// BoxGeometry materialIndex：0:+X 1:-X 2:+Y 3:-Y 4:+Z 5:-Z
const PRESET = {
  three: {
    labels: ['STBD', 'PORT', 'UP', 'DOWN', 'FORE', 'AFT'],
    map: {
      up: 2,
      down: 3,
      top: 2,
      bottom: 3,
      fore: 4,
      aft: 5,
      front: 4,
      back: 5,
      port: 1,
      starboard: 0,
      left: 1,
      right: 0,
    },
  },
  ship: {
    // Up=+Z，Fore=+X，Port=+Y
    labels: ['FORE', 'AFT', 'PORT', 'STBD', 'UP', 'DOWN'],
    map: {
      up: 4,
      down: 5,
      top: 4,
      bottom: 5,
      fore: 0,
      aft: 1,
      front: 0,
      back: 1,
      port: 2,
      starboard: 3,
      left: 2,
      right: 3,
    },
  },
};

const presetCfg = computed(() => PRESET[props.preset] || PRESET.ship);

const faceMap = computed(() => {
  const base = { ...(presetCfg.value.map || {}) };
  const extra = props.axisFaceMap && typeof props.axisFaceMap === 'object' ? props.axisFaceMap : {};
  return Object.assign(base, extra);
});

// -------------------- mini three --------------------
const miniHost = ref(null);
const centerHost = ref(null);

let renderer = null;
let scene = null;
let camera = null;
let cubeMesh = null;
let thickFrame = null; // ✅ 加粗外框（Mesh）
let rafId = 0;
let ro = null;
let centerRenderer = null;
let centerScene = null;
let centerCamera = null;
let centerGroup = null;
let centerBall = null;
let centerAxes = null;
let centerRo = null;

const faceMats = [];
const highlightTint = new THREE.Color('#fbbf24');
const normalTint = new THREE.Color('#ffffff');

function makeFaceTexture(text, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  // ✅ 去掉箭头：只保留文字
  ctx.fillStyle = fg;
  ctx.font = 'bold 56px system-ui, -apple-system, Segoe UI, Roboto';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function buildMini() {
  const el = miniHost.value;
  if (!el) return;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // canvas CSS 100%
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  el.innerHTML = '';
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);
  camera.position.set(3.15, 3.15, 3.15);
  camera.lookAt(0, 0, 0);

  faceMats.length = 0;

  const labels = presetCfg.value.labels || PRESET.ship.labels;
  const bgs = ['#e2e5eb', '#d1d5db', '#e2e5eb', '#d1d5db', '#e2e5eb', '#d1d5db'];

  for (let i = 0; i < 6; i++) {
    const tex = makeFaceTexture(labels[i], bgs[i], '#1f2937');
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    mat.color.copy(normalTint);
    faceMats.push(mat);
  }

  const geo = new THREE.BoxGeometry(1, 1, 1);
  cubeMesh = new THREE.Mesh(geo, faceMats);

  // ✅ cube 稍微收一点，避免贴边裁切
  cubeMesh.scale.setScalar(0.86);
  cubeMesh.renderOrder = 1;
  scene.add(cubeMesh);

  // ✅ 加粗外框：用 BoxGeometry + BackSide 做一个“外壳框”
  // 原理：一个略大一点的盒子，只渲染背面 + 透明度，让边缘看起来更粗更明显
  const frameGeo = new THREE.BoxGeometry(1, 1, 1);
  const frameMat = new THREE.MeshBasicMaterial({
    color: 0x9ca3af,
    transparent: true,
    opacity: 0.9,
    side: THREE.BackSide,
    depthWrite: false,
  });

  thickFrame = new THREE.Mesh(frameGeo, frameMat);
  // ✅ 比 cube 大一圈，让“框线”更大
  thickFrame.scale.setScalar(0.98);
  thickFrame.renderOrder = 1;
  scene.add(thickFrame);

  renderer.domElement.addEventListener('pointerdown', onPickFace, { passive: false });

  ro = new ResizeObserver(() => resizeToHost());
  ro.observe(el);
  resizeToHost();

  tick();
  applyQuaternion(props.quaternion);
  applyHighlight(props.activeAxis);
}

function buildCenterMini() {
  const el = centerHost.value;
  if (!el) return;

  centerRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  centerRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  centerRenderer.domElement.style.display = 'block';
  centerRenderer.domElement.style.width = '100%';
  centerRenderer.domElement.style.height = '100%';

  el.innerHTML = '';
  el.appendChild(centerRenderer.domElement);

  centerScene = new THREE.Scene();
  centerCamera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  centerCamera.position.set(2.3, 2.3, 2.3);
  centerCamera.lookAt(0, 0, 0);

  buildCenterMarks(centerScene);
  applyCenterVisibility();

  centerRo = new ResizeObserver(() => resizeCenterToHost());
  centerRo.observe(el);
  resizeCenterToHost();
  applyQuaternion(props.quaternion);
}

function buildCenterMarks(targetScene) {
  if (!targetScene) return;

  const axisLen = 0.96;
  const axisRad = Math.max(0.045 * (Number(props.centerAxisWidth) || 1), 0.0155);
  const arrowLen = Math.max(axisRad * 6, 0.155);
  const axisPos = axisLen / 2;
  const axisEnd = axisLen;

  centerGroup = new THREE.Group();
  centerGroup.userData.__centerMarks = true;

  const matX = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    depthTest: false,
    depthWrite: false,
  });
  const matY = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    depthTest: false,
    depthWrite: false,
  });
  const matZ = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    depthTest: false,
    depthWrite: false,
  });

  const x = new THREE.Mesh(
    new THREE.CylinderGeometry(axisRad, axisRad, axisLen, 10, 1, true),
    matX,
  );
  const y = new THREE.Mesh(
    new THREE.CylinderGeometry(axisRad, axisRad, axisLen, 10, 1, true),
    matY,
  );
  const z = new THREE.Mesh(
    new THREE.CylinderGeometry(axisRad, axisRad, axisLen, 10, 1, true),
    matZ,
  );

  const xArrow = new THREE.Mesh(new THREE.ConeGeometry(axisRad * 2.2, arrowLen, 10, 1), matX);
  const yArrow = new THREE.Mesh(new THREE.ConeGeometry(axisRad * 2.2, arrowLen, 10, 1), matY);
  const zArrow = new THREE.Mesh(new THREE.ConeGeometry(axisRad * 2.2, arrowLen, 10, 1), matZ);

  x.rotation.z = Math.PI / 2;
  z.rotation.x = Math.PI / 2;
  x.position.set(axisPos, 0, 0);
  y.position.set(0, axisPos, 0);
  z.position.set(0, 0, axisPos);

  xArrow.rotation.z = -Math.PI / 2;
  zArrow.rotation.x = Math.PI / 2;

  xArrow.position.set(axisEnd + arrowLen / 2, 0, 0);
  yArrow.position.set(0, axisEnd + arrowLen / 2, 0);
  zArrow.position.set(0, 0, axisEnd + arrowLen / 2);

  const xLabel = makeAxisLabel('X', '#ef4444');
  const yLabel = makeAxisLabel('Y', '#22c55e');
  const zLabel = makeAxisLabel('Z', '#3b82f6');
  const labelOffset = axisEnd + arrowLen + axisRad * 1.6;
  xLabel.position.set(labelOffset, 0, 0);
  yLabel.position.set(0, labelOffset, 0);
  zLabel.position.set(0, 0, labelOffset);

  centerAxes = { x, y, z, xArrow, yArrow, zArrow, xLabel, yLabel, zLabel };
  centerGroup.add(x, y, z, xArrow, yArrow, zArrow, xLabel, yLabel, zLabel);

  const ballMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthTest: false,
    depthWrite: false,
  });
  const ballOutlineMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthTest: false,
    depthWrite: false,
  });
  const ballR = Math.max(axisRad * 1.8, 0.05);
  centerBall = new THREE.Mesh(new THREE.SphereGeometry(ballR, 12, 12), ballMat);
  centerGroup.add(centerBall);

  centerGroup.scale.setScalar(0.82);
  centerGroup.renderOrder = 10;
  x.renderOrder = 10;
  y.renderOrder = 10;
  z.renderOrder = 10;
  centerBall.renderOrder = 10;
  targetScene.add(centerGroup);
}

function applyCenterVisibility() {
  if (!centerGroup) return;
  centerGroup.visible = true;
}

function applyCenterStyle() {
  if (!centerGroup || !centerBall) return;
  const axisRad = Math.max(0.045 * (Number(props.centerAxisWidth) || 1), 0.0155);
  const axisLen = 0.96;
  const arrowLen = Math.max(axisRad * 6, 0.155);
  const axisPos = axisLen / 2;
  const axisEnd = axisLen;

  if (centerAxes?.x) {
    centerAxes.x.geometry.dispose();
    centerAxes.x.geometry = new THREE.CylinderGeometry(axisRad, axisRad, axisLen, 10, 1, true);
    centerAxes.x.position.set(axisPos, 0, 0);
  }
  if (centerAxes?.y) {
    centerAxes.y.geometry.dispose();
    centerAxes.y.geometry = new THREE.CylinderGeometry(axisRad, axisRad, axisLen, 10, 1, true);
    centerAxes.y.position.set(0, axisPos, 0);
  }
  if (centerAxes?.z) {
    centerAxes.z.geometry.dispose();
    centerAxes.z.geometry = new THREE.CylinderGeometry(axisRad, axisRad, axisLen, 10, 1, true);
    centerAxes.z.position.set(0, 0, axisPos);
  }
  if (centerAxes?.xArrow) {
    centerAxes.xArrow.geometry.dispose();
    centerAxes.xArrow.geometry = new THREE.ConeGeometry(axisRad * 2.2, arrowLen, 10, 1);
    centerAxes.xArrow.position.set(axisEnd + arrowLen / 2, 0, 0);
  }
  if (centerAxes?.yArrow) {
    centerAxes.yArrow.geometry.dispose();
    centerAxes.yArrow.geometry = new THREE.ConeGeometry(axisRad * 2.2, arrowLen, 10, 1);
    centerAxes.yArrow.position.set(0, axisEnd + arrowLen / 2, 0);
  }
  if (centerAxes?.zArrow) {
    centerAxes.zArrow.geometry.dispose();
    centerAxes.zArrow.geometry = new THREE.ConeGeometry(axisRad * 2.2, arrowLen, 10, 1);
    centerAxes.zArrow.position.set(0, 0, axisEnd + arrowLen / 2);
  }
  if (centerAxes?.xLabel && centerAxes?.yLabel && centerAxes?.zLabel) {
    const labelOffset = axisEnd + arrowLen + axisRad * 1.6;
    centerAxes.xLabel.position.set(labelOffset, 0, 0);
    centerAxes.yLabel.position.set(0, labelOffset, 0);
    centerAxes.zLabel.position.set(0, 0, labelOffset);
  }
  const ballR = Math.max(axisRad * 1.8, 0.05);
  centerBall.geometry.dispose();
  centerBall.geometry = new THREE.SphereGeometry(ballR, 12, 12);
}

function makeAxisLabel(text, color) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = color;
  ctx.font = 'bold 72px system-ui, -apple-system, Segoe UI, Roboto';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(0.36);
  return sprite;
}

function resizeToHost() {
  if (!renderer || !miniHost.value) return;
  const w = Math.max(40, miniHost.value.clientWidth || 0);
  const h = Math.max(40, miniHost.value.clientHeight || 0);
  const size = Math.max(40, Math.min(w, h));
  renderer.setSize(size, size, false);
  if (camera) {
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
}

function resizeCenterToHost() {
  if (!centerRenderer || !centerHost.value) return;
  const w = Math.max(28, centerHost.value.clientWidth || 0);
  const h = Math.max(28, centerHost.value.clientHeight || 0);
  const size = Math.max(28, Math.min(w, h));
  centerRenderer.setSize(size, size, false);
  if (centerCamera) {
    centerCamera.aspect = 1;
    centerCamera.updateProjectionMatrix();
  }
}

function applyQuaternion(q) {
  if (!q) return;

  let x = 0,
    y = 0,
    z = 0,
    w = 1;
  if (Array.isArray(q) && q.length >= 4) [x, y, z, w] = q;
  else if (q && typeof q === 'object') {
    x = q.x ?? q._x ?? 0;
    y = q.y ?? q._y ?? 0;
    z = q.z ?? q._z ?? 0;
    w = q.w ?? q._w ?? 1;
  }

  // ✅ cube 和外框一起转
  const quat = new THREE.Quaternion(x, y, z, w);
  if (cubeMesh) cubeMesh.quaternion.copy(quat);
  if (thickFrame && cubeMesh) thickFrame.quaternion.copy(cubeMesh.quaternion);
  if (centerGroup) {
    const inv = quat.clone().invert();
    centerGroup.quaternion.copy(inv);
  }
}

function applyHighlight(axisKey) {
  const idx = faceMap.value?.[axisKey];
  for (let i = 0; i < faceMats.length; i++) {
    const m = faceMats[i];
    if (!m) continue;
    m.color.copy(i === idx ? highlightTint : normalTint);
    m.needsUpdate = true;
  }
}

function tick() {
  rafId = requestAnimationFrame(tick);
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (centerRenderer && centerScene && centerCamera)
    centerRenderer.render(centerScene, centerCamera);
}

function disposeMini() {
  cancelAnimationFrame(rafId);
  rafId = 0;

  try {
    ro?.disconnect?.();
  } catch (e) {}
  ro = null;

  if (renderer?.domElement) renderer.domElement.removeEventListener('pointerdown', onPickFace);

  try {
    cubeMesh?.geometry?.dispose?.();
    thickFrame?.geometry?.dispose?.();
    thickFrame?.material?.dispose?.();

    faceMats.forEach((m) => {
      if (m?.map) m.map.dispose?.();
      m?.dispose?.();
    });
    renderer?.dispose?.();
  } catch (e) {}

  renderer = null;
  scene = null;
  camera = null;
  cubeMesh = null;
  thickFrame = null;
  faceMats.length = 0;
}

function disposeCenterMini() {
  try {
    centerRo?.disconnect?.();
  } catch (e) {}
  centerRo = null;

  try {
    centerGroup?.traverse?.((obj) => {
      if (obj?.geometry?.dispose) obj.geometry.dispose();
      if (obj?.material?.dispose) obj.material.dispose();
    });
    centerRenderer?.dispose?.();
  } catch (e) {}

  centerRenderer = null;
  centerScene = null;
  centerCamera = null;
  centerGroup = null;
  centerBall = null;
  centerAxes = null;
}
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pickKeyByFaceIndex(materialIndex) {
  const map = faceMap.value || {};
  const candidates = Object.keys(map).filter((k) => map[k] === materialIndex);
  if (!candidates.length) return '';

  const axisKeys = new Set((props.axes || []).map((a) => a?.key).filter(Boolean));
  const hit = candidates.find((k) => axisKeys.has(k));
  return hit || candidates[0];
}

function onPickFace(ev) {
  if (!renderer || !cubeMesh || !camera) return;

  ev.preventDefault?.();
  ev.stopPropagation?.();
  ev.stopImmediatePropagation?.();

  const rect = renderer.domElement.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  const y = (ev.clientY - rect.top) / rect.height;
  ndc.set(x * 2 - 1, -(y * 2 - 1));

  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(cubeMesh, false);
  if (!hits.length) return;

  const mi = hits[0].face?.materialIndex;
  if (mi == null) return;

  const key = pickKeyByFaceIndex(mi);
  if (!key) return;

  const axisObj = (props.axes || []).find((a) => a?.key === key) || { key, label: key, title: key };

  emit('axis-click', axisObj);
}

function setQuaternion(q) {
  applyQuaternion(q);
}
defineExpose({ setQuaternion });

watch(
  () => props.quaternion,
  (q) => applyQuaternion(q),
  { deep: true, immediate: true },
);
watch(
  () => props.activeAxis,
  (k) => applyHighlight(k),
  { immediate: true },
);
watch(
  () => props.showCenterMarks,
  () => applyCenterVisibility(),
  { immediate: true },
);
watch(
  () => [props.centerColor, props.centerAxisWidth],
  () => applyCenterStyle(),
  { immediate: true },
);

watch(
  () => props.preset,
  () => {
    disposeMini();
    requestAnimationFrame(() => buildMini());
  },
);

onMounted(buildMini);
onMounted(buildCenterMini);
onBeforeUnmount(() => {
  disposeMini();
  disposeCenterMini();
});
</script>

<style scoped>
.orient {
  position: absolute;
  z-index: 6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  box-sizing: border-box;
  bottom: 0;
}

.orient__axes {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #111827;
  align-items: center;
  flex-wrap: nowrap;
}

.center-mini {
  width: 118px;
  height: 118px;
  border-radius: 10px;
  background: transparent;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  align-self: center;
}

.center-host {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: visible;
}

.axes-row {
  display: flex;
  gap: 2px;
  align-items: center;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.axes-row:hover {
  /* background: #f8fafc;
  border-color: #e5e7eb; */
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.txt {
  color: #1f2937 !important;
  font-weight: 600;
}

.orient__mini {
  display: grid;
  place-items: center;
}

.mini-box {
  width: 90px;
  height: 90px;
  box-sizing: border-box;
  padding: 6px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  position: relative;
  display: grid;
  place-items: center;
}

.mini-box:hover {
  background: rgba(255, 255, 255, 0.08);
}

.mini-host {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.mini-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  font-size: 11px;
  font-weight: 800;
  color: #374151;
  text-align: center;
  pointer-events: none;
  opacity: 0.85;
}
</style>
