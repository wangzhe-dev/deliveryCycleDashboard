<template>
  <div class="mv-root" :class="{ 'mv-root--flat-left': flatLeft }">
    <div class="mv-info-tabs">
      <button
        class="mv-info-tab"
        :class="{ 'is-active': activeInfoTab === 'ASSEMBLY' }"
        type="button"
        @click="setInfoTab('ASSEMBLY')"
      >
        装配信息
      </button>
      <button
        class="mv-info-tab"
        :class="{ 'is-active': activeInfoTab === 'WELD' }"
        type="button"
        @click="setInfoTab('WELD')"
      >
        焊接工艺
      </button>
      <button
        class="mv-info-tab"
        :class="{ 'is-active': activeInfoTab === 'ALL' }"
        type="button"
        @click="setInfoTab('ALL')"
      >
        全部信息
      </button>
    </div>
    <div ref="hostRef" class="mv-host"></div>

    <!-- ✅ CAD 风格 baseline 尺寸（屏幕叠加绘制） -->
    <canvas ref="overlayRef" class="mv-overlay"></canvas>

    <!-- ✅ 右上角视角立方体 -->
    <OrientationMini
      preset="ship"
      ref="orientRef"
      :active-axis="activeAxis"
      :quaternion="cameraQuat"
      :show-center-marks="showCenterMarks"
      :center-color="centerColor"
      :center-axis-width="centerAxisWidth"
      @axis-click="onAxisClick"
    />

    <!-- tooltip -->
    <div v-if="tip.show" class="mv-tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
      <div class="mv-tip__t">{{ tip.title }}</div>
      <div class="mv-tip__s">{{ tip.sub }}</div>
    </div>

    <!-- ✅ 文案编辑器：点文案/标尺文字/尺寸文字 -> 修改 -->
    <div
      v-if="editor.show"
      class="mv-editor"
      :style="{ left: editor.x + 'px', top: editor.y + 'px' }"
      @pointerdown.stop
      @mousedown.stop
      @click.stop
    >
      <input
        ref="editorInputRef"
        v-model="editor.value"
        class="mv-editor__input"
        placeholder="回车保存，Esc取消；标尺/尺寸清空=自动值"
        @keydown.enter.prevent="confirmEdit"
        @keydown.esc.prevent="cancelEdit"
      />
      <button class="mv-editor__btn mv-editor__btn--ok" @click="confirmEdit">确定</button>
      <button class="mv-editor__btn" @click="cancelEdit">取消</button>
    </div>

    <!-- 状态层 -->
    <div v-if="loading" class="mv-toast">模型加载中…</div>
    <div v-if="errorMsg" class="mv-toast mv-toast--err">{{ errorMsg }}</div>
    <div v-if="!modelUrl" class="mv-empty">未配置 modelUrl（请在主页设置 glb/gltf/fbx 地址）</div>
  </div>
</template>

<script setup>
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue';
import OrientationMini from './OrientationMini.vue';
import { createBaselineDims } from './ThreeModelViewer.baseline.js';
import { createExplodeSelection } from './ThreeModelViewer.explode.js';
import { createInteraction } from './ThreeModelViewer.interaction.js';
import { createMarks } from './ThreeModelViewer.marks.js';
import { createRenderer } from './ThreeModelViewer.render.js';
import { clampInt } from './ThreeModelViewer.utils.js';

const props = defineProps({
  modelUrl: { type: String, default: '' },
  mode: { type: String, default: 'normal' }, // normal | wire
  explode: { type: Boolean, default: false },
  toolMode: { type: String, default: 'pick' }, // pick | measure | note
  selectedCode: { type: String, default: '' },
  explodeFactor: { type: Number, default: 0.18 },
  colorIsolated: { type: Boolean, default: false },
  activeGroupFilter: { type: String, default: '' },
  flatLeft: { type: Boolean, default: false },

  showCenterMarks: { type: Boolean, default: true },
  centerColor: { type: String, default: '#ef4444' },
  centerAxisWidth: { type: Number, default: 1 },

  notePointColor: { type: String, default: '#2563eb' },
  noteLabelColor: { type: String, default: '#1d4ed8' },
  notePointScale: { type: Number, default: 0.1 },
  noteLabelOffset: { type: Number, default: 1 },
  noteLineWidth: { type: Number, default: 0.5 },

  measurePointColor: { type: String, default: '#111111' },
  measureLineColor: { type: String, default: '#111111' },
  measureLabelColor: { type: String, default: '#111111' },
  measurePointScale: { type: Number, default: 0.04 },
  measureLineWidth: { type: Number, default: 0.12 },
  measureUnitScale: { type: Number, default: 1000 }, // m -> mm

  markFilter: { type: String, default: 'all' }, // all | dim | note

  // 颜色隔离时的面透明度
  colorIsolatedOpacity: { type: Number, default: 0.8 },
  // 原始模型（未隔离）时的面透明度
  baseOpacity: { type: Number, default: 1 },

  knownCodes: { type: Array, default: () => [] },
  showMeshLabels: { type: Boolean, default: false },
  meshLabelColor: { type: String, default: '#111827' },
  meshLabelSize: { type: Number, default: 12 },
  meshLabelMap: { type: Object, default: () => ({}) },

  // 外部传入：[{ materials_code, joint_part_partname_tb }]
  partNameMapList: { type: Array, default: () => [] },

  /** ✅ CAD 风格：模型最左基准 baseline 尺寸（屏幕 overlay） */
  showLeftDims: { type: Boolean, default: true },
  leftDimsUnitScale: { type: Number, default: 1000 }, // m->mm
  leftDimsDecimals: { type: Number, default: 0 },
  leftDimsColor: { type: String, default: '#111111' },
  leftDimsFontSize: { type: Number, default: 12 },
  leftDimsLineWidth: { type: Number, default: 1 },
  leftDimsArrowSize: { type: Number, default: 8 },
  leftDimsBaseOffsetPx: { type: Number, default: 18 },
  leftDimsLaneStepPx: { type: Number, default: 14 },
  leftDimsMaxCount: { type: Number, default: 120 },
  leftDimsMinSizeRatio: { type: Number, default: 0.002 },
  leftDimsAnchor: { type: String, default: 'top' }, // top | center | bottom
  leftDimsDatumX: { type: Number, default: NaN }, // 可选：强制 datumX（如 X=0）
  showLeftBaseline: { type: Boolean, default: true },
});

const emit = defineEmits([
  'picked',
  'note-added',
  'note-updated',
  'measure',
  'measure-updated',
  'hovered',
  'model-loaded',
  'update:markFilter',
  'update:showMeshLabels',
]);

const hostRef = ref(null);
const overlayRef = ref(null);
const loading = ref(false);
const errorMsg = ref('');

const tip = reactive({ show: false, x: 0, y: 0, title: '', sub: '' });

/** ✅ 编辑器状态 */
const editor = reactive({ show: false, x: 0, y: 0, value: '' });
const editorInputRef = ref(null);
let editingMarkId = null;
let editingApplyFn = null;
let editingBaselineKey = null;

/** ✅ mini cube */
const orientRef = ref(null);
const activeAxis = ref('');
const cameraQuat = ref([0, 0, 0, 1]);

let renderer = null;
let labelRenderer = null;
let scene = null;
let camera = null;
let controls = null;
let rafId = 0;

let rootGroup = null;
let raycaster = null;
let pointer = null;

const getRenderer = () => renderer;
const getLabelRenderer = () => labelRenderer;
const getScene = () => scene;
const getCamera = () => camera;
const getControls = () => controls;
const getRaycaster = () => raycaster;
const getPointer = () => pointer;
const getRafId = () => rafId;

const setRenderer = (v) => {
  renderer = v;
};
const setLabelRenderer = (v) => {
  labelRenderer = v;
};
const setScene = (v) => {
  scene = v;
};
const setCamera = (v) => {
  camera = v;
};
const setControls = (v) => {
  controls = v;
};
const setRaycaster = (v) => {
  raycaster = v;
};
const setPointer = (v) => {
  pointer = v;
};
const setRafId = (v) => {
  rafId = v;
};

const meshState = new Map(); // uuid -> snapshot
const meshByUuid = new Map(); // uuid -> mesh
const meshLabelStore = new Map(); // uuid -> { mesh, label, centerLocal }

const marksGroupRef = shallowRef(null); // note/measure 的点线 + hitbox
let meshLabelsGroup = null; // assembly mesh name labels

// ✅ 测量 pending：第一下点出来的 A 点（复用，不会残留）
const measurePendingRef = shallowRef(null); // { bind, marker, markerHit, code }
const measureIndexRef = ref(0);
const noteIndexRef = ref(0);
let resizeObserver = null;

const getMeasurePending = () => measurePendingRef.value;
const setMeasurePending = (v) => {
  measurePendingRef.value = v;
};
const getMeasureIndex = () => measureIndexRef.value;
const setMeasureIndex = (v) => {
  measureIndexRef.value = v;
};
const getNoteIndex = () => noteIndexRef.value;
const setNoteIndex = (v) => {
  noteIndexRef.value = v;
};

const markIdSeq = ref(1);
const markStore = new Map(); // id -> item

const innerSelectedCode = ref('');

function updateModelMetricsForView() {
  if (!rootGroup) return;
  let box = null;
  if (props.activeGroupFilter) box = getVisibleMeshBox(rootGroup);
  if (!box) box = new THREE.Box3().setFromObject(rootGroup);

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  modelMetrics.centerWorld.copy(center);
  modelMetrics.base = Math.max(size.x, size.y, size.z) || 1;
  modelMetrics.ready = true;
}

const activeInfoTab = computed(() => {
  const filter = props.markFilter || 'all';
  const showLabels = !!props.showMeshLabels;
  if (filter === 'dim' && !showLabels) return 'ASSEMBLY';
  if (filter === 'note' && !showLabels) return 'WELD';
  if (filter === 'none' && showLabels) return 'PART';
  if (filter === 'all' && showLabels) return 'ALL';
  if (filter === 'all') return 'ALL';
  if (showLabels) return 'PART';
  return 'ASSEMBLY';
});

const showLeftDimsByTab = computed(() => {
  return activeInfoTab.value === 'ASSEMBLY' || activeInfoTab.value === 'ALL';
});

function setInfoTab(tab) {
  if (tab === 'ASSEMBLY') {
    emit('update:markFilter', 'dim');
    emit('update:showMeshLabels', false);
    return;
  }
  if (tab === 'WELD') {
    emit('update:markFilter', 'note');
    emit('update:showMeshLabels', false);
    return;
  }
  if (tab === 'PART') {
    emit('update:markFilter', 'none');
    emit('update:showMeshLabels', true);
    return;
  }
  emit('update:markFilter', 'all');
  emit('update:showMeshLabels', true);
}

/** 颜色 */
const HIGHLIGHT_SELECTED = 0xd4a84b; // 选中亮金（深蓝底上高对比）
// ✅ 模型默认：深蓝夜景下偏亮的钢蓝
const BASE_TINT = 0x5a9fd4;

/** ✅ 点击选中：用 uuid 管理（不靠 code 匹配） */
let selectedUuids = new Set();
function setSelectedMesh(mesh) {
  selectedUuids.clear();
  if (mesh?.uuid) selectedUuids.add(mesh.uuid);
}
function clearSelectedMeshes() {
  selectedUuids.clear();
}

/** ✅ knownCodes：最长匹配 */
const sortedKnownCodes = computed(() => {
  const arr = (props.knownCodes || []).map(String).filter(Boolean);
  arr.sort((a, b) => b.length - a.length);
  return arr;
});

/** ✅ 爆炸用指标 */
const modelMetrics = {
  centerWorld: new THREE.Vector3(),
  base: 1,
  ready: false,
};

/** ✅ 标注尺寸基准 */
let markSizeBase = 0.02;
const UP = new THREE.Vector3(0, 1, 0);

const baseline = createBaselineDims({
  props,
  hostRef,
  overlayRef,
  getCamera: () => camera,
  getRootGroup: () => rootGroup,
  getGroupNameForMesh,
  getShowLeftDims: () => props.showLeftDims && showLeftDimsByTab.value,
  modelMetrics,
  getMarkSizeBase: () => markSizeBase,
  clampNumber,
  clampInt,
  normalizeColor,
});
const {
  resizeOverlayCanvas,
  drawLeftDimsOverlay,
  markLeftDimsDirty,
  hitLeftDimText,
  setLeftDimTextOverride,
} = baseline;

let updateBoundMarks = () => {};
const callUpdateBoundMarks = () => updateBoundMarks();

const explodeApi = createExplodeSelection({
  props,
  modelMetrics,
  meshState,
  meshByUuid,
  selectedUuids,
  innerSelectedCode,
  sortedKnownCodes,
  getRootGroup: () => rootGroup,
  getBaseOpacity,
  getColorIsolatedOpacity,
  BASE_TINT,
  HIGHLIGHT_SELECTED,
  updateBoundMarks: callUpdateBoundMarks,
  updateMeshLabels,
  markLeftDimsDirty,
  updateModelMetricsForView,
});

const {
  getMeshCode,
  cacheMeshState,
  restoreAll,
  applyAll,
  applySelectionOnly,
  applyMode,
  applyIsolation,
  applySelection,
  randomizeMeshColors,
  resetMeshColors,
  tintMeshToBaseBlue,
  getExplodeGroupKey,
  dumpExplodeGroups,
  highlightMeshOnly,
  showAllMeshes,
  showOnlyGroup,
  getShowOnlyGroupKey,
} = explodeApi;

const showAllMeshesGuarded = () => {
  if (!props.activeGroupFilter) showAllMeshes();
};

const marksApi = createMarks({
  CSS2DObject,
  markRaw,
  props,
  marksGroupRef,
  markStore,
  meshByUuid,
  modelMetrics,
  UP,
  getToolMode: () => props.toolMode,
  getMeasureUnitScale,
  getMeasureLineRadius,
  getNoteLeaderLineRadius,
  getNotePointColor,
  getMeasurePointColor,
  getMeasureLineColor,
  getNoteLabelColor,
  getMeasureLabelColor,
  getMeasureLabelFontSize,
  getMeasureArrowScale,
  getWorldUnitsPerPixelAt,
  getNotePointScale,
  getMeasurePointScale,
  getNoteLabelOffsetScale,
  getNoteMarkerSize,
  getMeasureMarkerSize,
  getHitboxSize,
  getMarkSizeBase: () => markSizeBase,
  getDefaultNoteLabelOffset,
  resolveNoteLabelOffset,
  makeBind,
  bindToWorld,
  setBindWorldPosition,
  getMeshCode,
  getBBoxCenterWorldSafe,
  getBBoxDeltaFromCenter,
  emit,
  getMeasurePending,
  setMeasurePending,
  getMeasureIndex,
  setMeasureIndex,
  getNoteIndex,
  setNoteIndex,
  getRootGroup: () => rootGroup,
  fitBox,
  markIdSeq,
});

updateBoundMarks = marksApi.updateBoundMarks;

const interactionApi = createInteraction({
  props,
  hostRef,
  tip,
  emit,
  markStore,
  meshByUuid,
  marksGroupRef,
  getRenderer,
  getCamera,
  getRaycaster,
  getPointer,
  getScene,
  getRootGroup: () => rootGroup,
  getDragThreshold,
  getMeshCode,
  getGroupNameForMesh,
  getPartNameForMesh: resolvePartNameForMesh,
  getPartTitleForMesh,
  isObjectVisibleDeep,
  makeBind,
  bindToWorld,
  setBindWorldPosition,
  resolveNoteLabelOffset,
  updateBoundMarks: callUpdateBoundMarks,
  clearMeasurePending: marksApi.clearMeasurePending,
  handleMeasureClick: marksApi.handleMeasureClick,
  handleNoteClick: marksApi.handleNoteClick,
  setControlsEnabled,
  openLeftDimEditor,
  openMarkEditorById,
  cancelEdit,
  hitLeftDimText,
  fitView,
  fitViewMesh,
  setSelectedMesh,
  applyAll,
  highlightMeshOnly,
  showAllMeshes: showAllMeshesGuarded,
  emitNoteUpdatedById: marksApi.emitNoteUpdatedById,
  emitMeasureUpdatedById: marksApi.emitMeasureUpdatedById,
  innerSelectedCode,
  editor,
});

const {
  handlePointerMove,
  handlePointerDown,
  handlePointerUp,
  handleDoubleClick,
  handlePointerLeave,
  handleKeydown,
  resetInteractionState,
} = interactionApi;

const renderApi = createRenderer({
  hostRef,
  overlayRef,
  orientRef,
  cameraQuat,
  activeAxis,
  onAxisClick,
  handlePointerMove,
  handlePointerDown,
  handlePointerUp,
  handleDoubleClick,
  handlePointerLeave,
  handleKeydown,
  resizeOverlayCanvas,
  drawLeftDimsOverlay,
  markLeftDimsDirty,
  updateBoundMarks: callUpdateBoundMarks,
  updateMeshLabels,
  getToolMode: () => props.toolMode,
  showAllMeshes: showAllMeshesGuarded,
  tickCameraAnim,
  syncOrientCube,
  setRenderer,
  setLabelRenderer,
  setScene,
  setCamera,
  setControls,
  setRaycaster,
  setPointer,
  setRafId,
  getRafId,
  getRenderer,
  getLabelRenderer,
  getScene,
  getCamera,
  getControls,
});

const { initThree, handleResize, resizeViewer, disposeRenderer } = renderApi;

function clampNumber(value, min, max, fallback = min) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}
function normalizeColor(value, fallback) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}
function getNotePointScale() {
  return clampNumber(props.notePointScale, 0.1, 3, 0.3);
}
function getMeasurePointScale() {
  return clampNumber(props.measurePointScale, 0.02, 3, 0.08);
}
function getNoteLabelOffsetScale() {
  return clampNumber(props.noteLabelOffset, 0.5, 3, 1);
}
function getNoteLineWidth() {
  return clampNumber(props.noteLineWidth, 0.5, 6, 0.5);
}
function getMeasureLineWidth() {
  return clampNumber(props.measureLineWidth, 0.08, 6, 0.12);
}
function getColorIsolatedOpacity() {
  return clampNumber(props.colorIsolatedOpacity, 0.2, 1, 0.8);
}
function getBaseOpacity() {
  return clampNumber(props.baseOpacity, 0.2, 1, 1);
}
function getNotePointColor() {
  return normalizeColor(props.notePointColor, '#2563eb');
}
function getMeasurePointColor() {
  return normalizeColor(props.measurePointColor, '#2563eb');
}
function getMeasureLineColor() {
  return normalizeColor(props.leftDimsColor, '#111111');
}
function getNoteLabelColor() {
  return normalizeColor(props.noteLabelColor, '#1d4ed8');
}
function getMeasureLabelColor() {
  return normalizeColor(props.leftDimsColor, '#111111');
}
function getMeshLabelColor() {
  return normalizeColor(props.meshLabelColor, '#111827');
}
function getMeshLabelSize() {
  return clampNumber(props.meshLabelSize, 10, 24, 12);
}
function getMeasureLabelFontSize() {
  return clampNumber(props.leftDimsFontSize, 10, 24, 12);
}
function getMeasureArrowScale() {
  const size = clampNumber(props.leftDimsArrowSize, 6, 18, 8);
  return size / 8;
}
function getWorldUnitsPerPixelAt(p) {
  if (!camera || !hostRef.value || !p) return 0;
  camera.updateMatrixWorld();
  const h = hostRef.value.clientHeight || 1;
  const vFov = camera.fov * (Math.PI / 180);
  const pCam = p.clone().applyMatrix4(camera.matrixWorldInverse);
  const depth = Math.max(0.001, -pCam.z);
  const worldHeight = 2 * depth * Math.tan(vFov / 2);
  return worldHeight / h;
}
function getMeasureLineRadius() {
  return Math.max(0.00008, markSizeBase * 0.035 * getMeasureLineWidth());
}
function getMeasureUnitScale() {
  return clampNumber(props.measureUnitScale, 0.001, 1000000, 1000);
}
function getNoteLeaderLineRadius() {
  return Math.max(markSizeBase * 0.08 * getNoteLineWidth(), 0.0002);
}
function getNoteMarkerSize() {
  return markSizeBase * 1.25 * getNotePointScale();
}
function getMeasureMarkerSize() {
  return markSizeBase * 0.6 * getMeasurePointScale();
}
function getHitboxSize(scale) {
  return Math.max(markSizeBase * 7 * scale, 0.02);
}
function getDragThreshold() {
  return Math.max(
    0.01,
    markSizeBase * 10 * Math.max(getNotePointScale(), getMeasurePointScale(), 1),
  );
}

let cachedPartNameList = null;
let cachedPartNameMap = new Map();
function getPartNameMap() {
  const list = props.partNameMapList || [];
  if (list === cachedPartNameList) return cachedPartNameMap;
  cachedPartNameList = list;
  cachedPartNameMap = new Map();
  list.forEach((it) => {
    const key =
      typeof it?.joint_part_partname_tb === 'string' ? it.joint_part_partname_tb.trim() : '';
    const val = typeof it?.joint_part_partname === 'string' ? it.joint_part_partname.trim() : '';
    if (key) cachedPartNameMap.set(key, val);
  });
  return cachedPartNameMap;
}

function resolvePartNameForMesh(mesh) {
  const root = rootGroup;
  const map = getPartNameMap();
  if (!mesh || !map.size) return '';
  let p = mesh;
  while (p && p !== root) {
    if (p.type === 'Group') {
      const groupName = typeof p?.name === 'string' ? p.name.trim() : '';
      if (groupName && map.has(groupName)) return map.get(groupName) || '';
    }
    p = p.parent;
  }
  p = mesh;
  while (p && p !== root) {
    const name = typeof p?.name === 'string' ? p.name.trim() : '';
    if (name && map.has(name)) return map.get(name) || '';
    p = p.parent;
  }
  return '';
}

function getPartTitleFromName(partName) {
  const s = String(partName || '').trim();
  if (!s) return '';
  const first = s.indexOf('-');
  if (first < 0) return s;
  const second = s.indexOf('-', first + 1);
  if (second < 0) return s;
  return s.slice(0, second);
}

function getPartTitleForMesh(mesh) {
  const partName = resolvePartNameForMesh(mesh);
  if (!partName) return '';
  return getPartTitleFromName(partName);
}

function getGroupNameForMesh(mesh) {
  const root = rootGroup;
  if (!mesh) return '';
  const normalizeSeg = (seg) => {
    if (!seg) return seg;
    const s = String(seg).trim();
    let m = s.match(/^([A-Za-z]+\d+[A-Za-z]?)([A-Za-z]\d+.*)$/);
    if (m) return m[1];
    m = s.match(/^([A-Za-z]+\d+[A-Za-z]?)[A-Za-z]+\d.*$/);
    if (m) return m[1];
    if (s.includes('_')) return s.split('_')[0];
    return s;
  };
  const getPrefixFromName = (raw) => {
    if (!raw) return '';
    const base = String(raw).split('/')[0].trim();
    if (!base) return '';
    const parts = base.split('-').filter(Boolean);
    if (parts.length < 2) return '';
    const a = parts[0];
    const b = normalizeSeg(parts[1]);
    return a && b ? `${a}-${b}` : '';
  };

  let p = mesh;
  while (p && p !== root) {
    const udName = typeof p.userData?.name === 'string' ? p.userData.name.trim() : '';
    const udPrefix = getPrefixFromName(udName);
    if (udPrefix) return udPrefix;
    const gname = typeof p.userData?.groupName === 'string' ? p.userData.groupName.trim() : '';
    const gPrefix = getPrefixFromName(gname);
    if (gPrefix) return gPrefix;
    if (p.type === 'Group' && p.name) {
      const namePrefix = getPrefixFromName(p.name);
      if (namePrefix) return namePrefix;
    }
    p = p.parent;
  }
  const namePrefix = getPrefixFromName(mesh.name || '');
  if (namePrefix) return namePrefix;
  const codePrefix = getPrefixFromName(getMeshCode(mesh) || '');
  if (codePrefix) return codePrefix;
  const key = getExplodeGroupKey ? getExplodeGroupKey(mesh) : '';
  if (key && key.includes(':')) return key.split(':')[1] || key;
  if (key) return key;
  return '';
}

function setControlsEnabled(on) {
  if (!controls) return;
  controls.enabled = !!on;
}

function ensureOverlayGroups() {
  if (!scene) return;
  if (!marksGroupRef.value) {
    marksGroupRef.value = markRaw(new THREE.Group());
    marksGroupRef.value.name = 'marksGroup';
    scene.add(marksGroupRef.value);
  }
  if (!meshLabelsGroup) {
    meshLabelsGroup = markRaw(new THREE.Group());
    meshLabelsGroup.name = 'meshLabelsGroup';
    scene.add(meshLabelsGroup);
  }
}

/** ✅ 同步相机姿态到 mini cube */
function syncOrientCube() {
  if (!camera) return;
  orientRef.value?.setQuaternion?.(camera.quaternion);
  cameraQuat.value = camera.quaternion.toArray();
}

/** 右上角视角按钮 */
function onAxisClick(a) {
  const k = a?.key || '';
  activeAxis.value = k;

  if (k === 'up' || k === 'top') return setView('top');
  if (k === 'down' || k === 'bottom') return setView('bottom');

  if (k === 'fore' || k === 'front') return setView('front');
  if (k === 'aft' || k === 'back') return setView('back');

  if (k === 'port' || k === 'left') return setView('left');
  if (k === 'starboard' || k === 'right') return setView('right');

  setView('iso');
}

function isObjectVisibleDeep(obj) {
  let cur = obj;
  while (cur) {
    if (cur.visible === false) return false;
    cur = cur.parent;
  }
  return true;
}

function getNoteLabelOffsetY() {
  return Math.max(markSizeBase * 6 * getNoteLabelOffsetScale(), 0.02);
}
function getDefaultNoteLabelOffset() {
  return new THREE.Vector3(0, getNoteLabelOffsetY(), 0);
}
function resolveNoteLabelOffset(it) {
  if (Array.isArray(it?.labelOffset) && it.labelOffset.length >= 3) {
    return new THREE.Vector3(it.labelOffset[0], it.labelOffset[1], it.labelOffset[2]);
  }
  return getDefaultNoteLabelOffset();
}

function getModelExt(url) {
  const clean = String(url || '')
    .split('#')[0]
    .split('?')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : '';
}
/** ---------- 绑定：world <-> mesh local ---------- */
function makeBind(mesh, worldPoint) {
  if (!mesh) return null;
  mesh.updateMatrixWorld(true);
  const local = mesh.worldToLocal(worldPoint.clone());
  return { meshUuid: mesh.uuid, local: local.toArray() };
}

function bindToWorld(bind) {
  if (bind?.world && Array.isArray(bind.world)) {
    return new THREE.Vector3(bind.world[0], bind.world[1], bind.world[2]);
  }
  if (!bind?.meshUuid) return null;
  const mesh = meshByUuid.get(bind.meshUuid);
  if (!mesh) return null;
  const pLocal = new THREE.Vector3().fromArray(bind.local || [0, 0, 0]);
  mesh.updateMatrixWorld(true);
  return mesh.localToWorld(pLocal);
}
function setBindWorldPosition(bind, worldPos) {
  if (bind && !bind.meshUuid) {
    bind.world = [worldPos.x, worldPos.y, worldPos.z];
    return;
  }
  if (!bind?.meshUuid || !worldPos) return;
  const mesh = meshByUuid.get(bind.meshUuid);
  if (!mesh) return;
  mesh.updateMatrixWorld(true);
  const local = mesh.worldToLocal(worldPos.clone());
  bind.local = [local.x, local.y, local.z];
}

function makeMeshLabel(text) {
  const el = document.createElement('div');
  el.className = 'mv-label mv-label--mesh';
  el.textContent = text;
  return el;
}

function applyMeshLabelStyle(labelObj) {
  if (!labelObj?.element) return;
  labelObj.element.style.color = getMeshLabelColor();
  labelObj.element.style.fontSize = `${getMeshLabelSize()}px`;
  setMeshLabelOutline(labelObj, !!props.activeGroupFilter);
}

function clearMeshLabels() {
  if (!meshLabelsGroup) return;
  for (const it of meshLabelStore.values()) {
    if (it?.label) disposeAndRemove(meshLabelsGroup, it.label);
  }
  meshLabelStore.clear();
}

function buildMeshLabels() {
  if (!meshLabelsGroup || !rootGroup) return;
  clearMeshLabels();
  if (!props.showMeshLabels && !props.activeGroupFilter) {
    meshLabelsGroup.visible = false;
    return;
  }
  meshLabelsGroup.visible = true;
  const labelMap = props.meshLabelMap || {};
  const seen = new Set();
  const groupAgg = new Map();

  const resolveLabelText = (mesh) => {
    if (!mesh) return '';
    if (props.activeGroupFilter) {
      return resolvePartNameForMesh(mesh) || '';
    }
    const name = mesh.name ? String(mesh.name) : '';
    const code = getMeshCode(mesh) || '';
    const originalName = mesh?.userData?.originalName ? String(mesh.userData.originalName) : '';
    const candidates = [originalName, name, code].filter(Boolean);
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(labelMap, key)) {
        return String(labelMap[key] ?? '').trim();
      }
    }
    return '';
  };

  rootGroup.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (obj.userData?.__mark) return;
    const text = resolveLabelText(obj);
    if (!text) return;

    const geo = obj.geometry;
    if (!geo) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (props.activeGroupFilter) {
      const worldBox = new THREE.Box3().setFromObject(obj);
      const cur = groupAgg.get(text);
      if (!cur) {
        groupAgg.set(text, { box: worldBox.clone(), mesh: obj, meshes: [obj] });
      } else {
        cur.box.union(worldBox);
        cur.meshes.push(obj);
      }
      return;
    }

    const box = geo.boundingBox || new THREE.Box3();
    const centerLocal = box.getCenter(new THREE.Vector3());
    const labelObj = markRaw(new CSS2DObject(makeMeshLabel(text)));
    labelObj.userData.__mark = true;
    applyMeshLabelStyle(labelObj);
    meshLabelsGroup.add(labelObj);

    meshLabelStore.set(obj.uuid, { mesh: obj, label: labelObj, centerLocal });
  });

  if (props.activeGroupFilter) {
    const toSuffix = (s) => {
      const str = String(s || '');
      const idx = str.lastIndexOf('-');
      return idx >= 0 ? str.slice(idx + 1) : str;
    };
    groupAgg.forEach((it, key) => {
      if (seen.has(key)) return;
      seen.add(key);
      const text = toSuffix(key);
      const centerWorld = it.box.getCenter(new THREE.Vector3());
      const labelObj = markRaw(new CSS2DObject(makeMeshLabel(text)));
      labelObj.userData.__mark = true;
      applyMeshLabelStyle(labelObj);
      meshLabelsGroup.add(labelObj);
      meshLabelStore.set(it.mesh.uuid, {
        mesh: it.mesh,
        label: labelObj,
        centerLocal: new THREE.Vector3(),
        centerWorld,
        groupMeshes: it.meshes || [],
      });
    });
  }

  updateMeshLabels();
}

function updateMeshLabels() {
  if (!meshLabelsGroup) return;
  meshLabelsGroup.visible = !!props.showMeshLabels || !!props.activeGroupFilter;
  if (!props.showMeshLabels && !props.activeGroupFilter) return;

  const color = getMeshLabelColor();
  const size = getMeshLabelSize();
  const outlineEnabled = !!props.activeGroupFilter;
  const zoomLimit = modelMetrics?.base ? modelMetrics.base * 0.6 : Infinity;
  const zoomDist = camera && controls ? camera.position.distanceTo(controls.target) : 0;
  const zoomVisible = props.activeGroupFilter ? true : zoomDist <= zoomLimit;

  for (const it of meshLabelStore.values()) {
    if (!it?.mesh || !it?.label) continue;
    let visible = isObjectVisibleDeep(it.mesh) && zoomVisible;
    if (!visible) {
      it.label.visible = false;
      continue;
    }
    let pos = null;
    if (Array.isArray(it.groupMeshes) && it.groupMeshes.length) {
      const box = getMeshesWorldBox(it.groupMeshes);
      if (!box) {
        it.label.visible = false;
        continue;
      }
      pos = box.getCenter(new THREE.Vector3());
      visible = zoomVisible;
    } else {
      pos = it.centerWorld ? it.centerWorld.clone() : it.mesh.localToWorld(it.centerLocal.clone());
    }
    if (!pos) continue;
    it.label.position.copy(pos);
    it.label.visible = true;
    setLabelColor(it.label, color);
    setLabelSize(it.label, size);
    setMeshLabelOutline(it.label, outlineEnabled);
  }
}

function setLabelColor(labelObj, color) {
  if (labelObj?.element) labelObj.element.style.color = color;
}
function setLabelSize(labelObj, sizePx) {
  if (labelObj?.element) labelObj.element.style.fontSize = `${sizePx}px`;
}
function setMeshLabelOutline(labelObj, enabled) {
  if (!labelObj?.element) return;
  labelObj.element.classList.toggle('mv-label--mesh-outline', !!enabled);
}

/** ---------- 点击编辑 ---------- */
function openMarkEditorById(id, ev, axis) {
  const it = markStore.get(id);
  if (!it) return;

  const rootRect = hostRef.value.getBoundingClientRect();
  editor.x = ev.clientX - rootRect.left + 8;
  editor.y = ev.clientY - rootRect.top + 8;

  editingMarkId = id;

  if (it.type === 'note') {
    editor.value = it.text ?? '';
    editingApplyFn = (newText) => {
      marksApi.updateNoteMeta(id, { text: String(newText ?? '') });
    };
  } else if (it.type === 'measure') {
    const current =
      it.customText && String(it.customText).trim()
        ? it.customText
        : it.label?.element?.textContent || '';
    editor.value = current;
    editingApplyFn = (newText) => {
      marksApi.updateMeasureMeta(id, { text: newText });
    };
  }

  editor.show = true;
  nextTick(() => {
    editorInputRef.value?.focus?.();
    editorInputRef.value?.select?.();
  });
}

function openLeftDimEditor(hit, ev) {
  if (!hit) return;
  const rootRect = hostRef.value.getBoundingClientRect();
  editor.x = ev.clientX - rootRect.left + 8;
  editor.y = ev.clientY - rootRect.top + 8;
  editor.value = hit.text || '';
  editingMarkId = null;
  editingBaselineKey = hit.key || null;
  editingApplyFn = (newText) => {
    const v = String(newText ?? '').trim();
    if (editingBaselineKey) setLeftDimTextOverride(editingBaselineKey, v);
  };
  editor.show = true;
  nextTick(() => {
    editorInputRef.value?.focus?.();
    editorInputRef.value?.select?.();
  });
}

function confirmEdit() {
  if (!editor.show) return;
  editingApplyFn && editingApplyFn(editor.value);
  if (typeof editingMarkId === 'number' && markStore.has(editingMarkId)) {
    marksApi.emitNoteUpdatedById(editingMarkId);
    marksApi.emitMeasureUpdatedById(editingMarkId);
  }
  editor.show = false;
  editingMarkId = null;
  editingApplyFn = null;
  editingBaselineKey = null;
}

function cancelEdit() {
  editor.show = false;
  editingMarkId = null;
  editingApplyFn = null;
  editingBaselineKey = null;
}

/** ---------- 视图 ---------- */
function fitView() {
  if (!rootGroup || !camera || !controls) return;
  const box = props.activeGroupFilter
    ? getVisibleMeshBox(rootGroup)
    : new THREE.Box3().setFromObject(rootGroup);
  if (!box) return;
  fitBox(box);
}
function fitViewMesh(mesh) {
  if (!mesh || !camera || !controls) return;
  const box = new THREE.Box3().setFromObject(mesh);
  fitBox(box);
}
function fitBox(box) {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fov = camera.fov * (Math.PI / 180);
  let camZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  camZ *= props.activeGroupFilter ? 1.2 : 1.6;

  const toPos = new THREE.Vector3(center.x + camZ, center.y + camZ * 0.6, center.z + camZ);
  animateCameraTo(toPos, center, 420);
}

function getVisibleMeshBox(group) {
  if (!group) return null;
  group.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let has = false;
  group.traverse((obj) => {
    if (!obj?.isMesh || !obj.visible) return;
    const geo = obj.geometry;
    if (!geo) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (!geo.boundingBox) return;
    const b = geo.boundingBox.clone();
    b.applyMatrix4(obj.matrixWorld);
    if (!has) {
      box.copy(b);
      has = true;
    } else {
      box.union(b);
    }
  });
  return has ? box : null;
}

function getMeshesWorldBox(meshes) {
  if (!Array.isArray(meshes) || !meshes.length) return null;
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  let has = false;
  meshes.forEach((mesh) => {
    if (!mesh?.isMesh || !mesh.visible) return;
    if (!isObjectVisibleDeep(mesh)) return;
    const geo = mesh.geometry;
    if (!geo) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    if (!geo.boundingBox) return;
    tmp.copy(geo.boundingBox);
    tmp.applyMatrix4(mesh.matrixWorld);
    if (!has) {
      box.copy(tmp);
      has = true;
    } else {
      box.union(tmp);
    }
  });
  return has ? box : null;
}

function getSceneCenterAndRadius() {
  const obj = rootGroup || scene;
  const box = props.activeGroupFilter
    ? getVisibleMeshBox(rootGroup) || new THREE.Box3().setFromObject(obj)
    : new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const radius = Math.max(size.x, size.y, size.z) * 0.6 || 1;
  return { center, radius };
}

function setView(preset = 'iso') {
  if (!camera || !controls) return;
  const { center, radius } = getSceneCenterAndRadius();
  const dist = radius * 2.2;

  const dir = new THREE.Vector3(1, 1, 1);
  if (preset === 'top') dir.set(0, 1, 0);
  else if (preset === 'bottom') dir.set(0, -1, 0);
  else if (preset === 'front') dir.set(0, 0, 1);
  else if (preset === 'back') dir.set(0, 0, -1);
  else if (preset === 'left') dir.set(-1, 0, 0);
  else if (preset === 'right') dir.set(1, 0, 0);

  dir.normalize();
  const toPos = center.clone().add(dir.multiplyScalar(dist));
  animateCameraTo(toPos, center, 420);
}

/** ---------- 相机动画 ---------- */
let camAnim = null;
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
function animateCameraTo(toPos, toTarget, dur = 420) {
  camAnim = {
    t0: performance.now(),
    dur,
    fromPos: camera.position.clone(),
    toPos: toPos.clone(),
    fromTarget: controls.target.clone(),
    toTarget: toTarget.clone(),
  };
}
function tickCameraAnim() {
  if (!camAnim || !camera || !controls) return;
  const now = performance.now();
  const t = Math.min(1, (now - camAnim.t0) / camAnim.dur);
  const k = easeOut(t);

  camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, k);
  controls.target.lerpVectors(camAnim.fromTarget, camAnim.toTarget, k);
  controls.update();

  if (t >= 1) camAnim = null;
}

/** ---------- dispose helper ---------- */
function disposeAndRemove(parent, obj) {
  if (!obj) return;
  parent.remove(obj);

  if (obj instanceof CSS2DObject) {
    if (obj.element && obj.element.parentNode) obj.element.parentNode.removeChild(obj.element);
    return;
  }

  if (obj.isGroup) {
    const kids = [...obj.children];
    kids.forEach((k) => disposeAndRemove(obj, k));
    return;
  }

  if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
  if (obj.material) {
    const m = obj.material;
    if (Array.isArray(m)) m.forEach((mm) => mm.dispose && mm.dispose());
    else m.dispose && m.dispose();
  }
}

/** ---------- BBox helpers ---------- */
function getVisibleBBoxCenterWorld() {
  if (!rootGroup) return null;

  const box = new THREE.Box3();
  let has = false;

  rootGroup.updateMatrixWorld(true);
  rootGroup.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (obj.userData?.__mark) return;
    if (!obj.visible) return;

    const geo = obj.geometry;
    if (!geo) return;
    if (!geo.boundingBox) geo.computeBoundingBox();

    const bb = geo.boundingBox.clone();
    bb.applyMatrix4(obj.matrixWorld);

    if (!has) {
      box.copy(bb);
      has = true;
    } else {
      box.union(bb);
    }
  });

  if (!has) return null;
  const center = new THREE.Vector3();
  box.getCenter(center);
  return center;
}

function getBBoxCenterWorldSafe() {
  const center = getVisibleBBoxCenterWorld();
  if (center) return center;
  if (modelMetrics?.centerWorld) return modelMetrics.centerWorld.clone();
  return new THREE.Vector3();
}

function getBBoxDeltaFromCenter(point) {
  if (!point) return null;
  const center = getBBoxCenterWorldSafe();
  return point.clone().sub(center);
}

function dumpNames(root) {
  if (!root) return;
  const rows = [];
  root.traverse((o) => {
    if (!o?.isMesh) return;
    rows.push({
      uuid: o.uuid,
      name: o.name,
      userData: o.userData,
      gltfExtensions: o.userData && o.userData.gltfExtensions,
    });
  });
  console.log('[ThreeModelViewer] Model Mesh Info');
  rows.forEach((row) => console.log(row));
}

/** ---------- 加载模型 ---------- */
async function loadModel(url) {
  if (!url || !scene) return;

  loading.value = true;
  errorMsg.value = '';
  tip.show = false;
  ensureOverlayGroups();
  cancelEdit();
  resetInteractionState();
  setControlsEnabled(true);
  marksApi.clearMeasurePending();

  try {
    // 清理旧模型
    if (rootGroup) {
      scene.remove(rootGroup);
      rootGroup.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry && obj.geometry.dispose && obj.geometry.dispose();
          if (obj.material) {
            const m = obj.material;
            if (Array.isArray(m)) m.forEach((mm) => mm.dispose && mm.dispose());
            else m.dispose && m.dispose();
          }
        }
      });
      rootGroup = null;
      meshState.clear();
      meshByUuid.clear();
      clearMeshLabels();
      marksApi.clearMarks();
      modelMetrics.ready = false;
      markStore.clear();
      clearSelectedMeshes();
      markIdSeq.value = 1;
      measureIndexRef.value = 0;
      noteIndexRef.value = 0;
    }

    const ext = getModelExt(url);
    if (ext === 'fbx') {
      const loader = new FBXLoader();
      rootGroup = await loader.loadAsync(url);
    } else {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      loader.setDRACOLoader(dracoLoader);
      const gltf = await loader.loadAsync(url);
      rootGroup = gltf.scene || new THREE.Group();
    }

    // 材质 clone + 默认淡蓝 + 缓存
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;

      if (obj.material) {
        if (Array.isArray(obj.material))
          obj.material = obj.material.map((m) => (m?.clone ? m.clone() : m));
        else if (obj.material.clone) obj.material = obj.material.clone();
      }

      tintMeshToBaseBlue(obj);
      cacheMeshState(obj);
    });

    scene.add(rootGroup);
    rootGroup.updateMatrixWorld(true);

    // modelMetrics（爆炸/尺寸用）
    const rootBox = new THREE.Box3().setFromObject(rootGroup);
    const rootSize = new THREE.Vector3();
    rootBox.getSize(rootSize);
    rootBox.getCenter(modelMetrics.centerWorld);
    modelMetrics.base = Math.max(rootSize.x, rootSize.y, rootSize.z) || 1;
    modelMetrics.ready = true;

    // 每个 mesh 包围盒中心（world）
    const tmpBox = new THREE.Box3();
    const tmpCenter = new THREE.Vector3();
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      const st = meshState.get(obj.uuid);
      if (!st) return;
      tmpBox.setFromObject(obj);
      tmpBox.getCenter(tmpCenter);
      st.centerWorld.copy(tmpCenter);
    });

    markSizeBase = THREE.MathUtils.clamp(modelMetrics.base * 0.003, 0.002, 50);
    buildMeshLabels();

    marksApi.applyMarkSizing();
    marksApi.applyMarkColors();

    dumpMeshList(rootGroup);

    /* ── 网格对齐模型底部 + XZ 居中 ── */
    if (scene) {
      const grid = scene.getObjectByName('__groundGrid');
      if (grid) {
        const rootBox = new THREE.Box3().setFromObject(rootGroup);
        const center = new THREE.Vector3();
        rootBox.getCenter(center);
        grid.position.set(center.x, rootBox.min.y - 0.01, center.z);
      }
    }

    fitView();
    applyAll();

    syncOrientCube();
    emit('model-loaded', { url });

    markLeftDimsDirty();
  } catch (e) {
    console.error(e);
    errorMsg.value = '模型加载失败：请检查 glb/gltf/fbx 地址 / 静态资源路径';
  } finally {
    loading.value = false;
  }
}

function dumpMeshList(group) {
  if (!group) return;
  const lines = [];
  const mapEntries = [];
  (props.partNameMapList || []).forEach((it) => {
    const name =
      typeof it?.joint_part_partname_tb === 'string' ? it.joint_part_partname_tb.trim() : '';
    const partName =
      typeof it?.joint_part_partname === 'string' ? it.joint_part_partname.trim() : '';
    if (name) mapEntries.push({ name, partName });
  });
  mapEntries.sort((a, b) => b.name.length - a.name.length);

  const groupSet = new Set();
  group.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (obj.userData?.__mark) return;
    const name = obj.name || '(no-name)';
    lines.push(name);
    const groupName = obj.parent?.name || '(no-group)';
    groupSet.add(groupName);
  });
  console.log('[ThreeModelViewer] Mesh Group | joint_part_partname');
  Array.from(groupSet).forEach((groupName) => {
    const hit = mapEntries.find((it) => it.name && it.name === groupName);
    const partName = hit?.partName || 'NoMatch';
    console.log(`${groupName} | ${partName}`);
  });
  const partNameSet = new Set(mapEntries.map((it) => it.partName).filter(Boolean));
  console.log('[ThreeModelViewer] joint_part_partname');
  Array.from(partNameSet).forEach((pn) => console.log(pn));
  const groupMap = new Map();
  partNameSet.forEach((pn) => {
    const s = String(pn);
    const idx = s.lastIndexOf('-');
    const key = idx > 0 ? s.slice(0, idx) : s;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(s);
  });
  const tree = Array.from(groupMap.entries()).map(([key, children]) => ({ key, children }));
  console.log('[ThreeModelViewer] joint_part_partname tree');
  console.log(tree);
  console.log(`[ThreeModelViewer] Mesh Group Count: ${groupSet.size}`);
}

function dumpMeshAndGroup(group) {
  if (!group) return;
  console.log('[ThreeModelViewer] Mesh & Group');
  const seen = new Set();
  group.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (obj.userData?.__mark) return;
    if (!obj.visible) return;
    const groupName = obj.parent?.name || '(no-group)';
    if (seen.has(groupName)) return;
    seen.add(groupName);
    console.log(groupName);
  });
}

function dumpMeshAndGroupByCode(code) {
  if (!code) return;
  if (!rootGroup) return;
  const key = String(code || '').trim();
  if (!key) return;
  console.log(`[ThreeModelViewer] Mesh & Group (groupKey:${key})`);
  const seen = new Set();
  rootGroup.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (obj.userData?.__mark) return;
    const groupKey = getShowOnlyGroupKey ? getShowOnlyGroupKey(obj) : '';
    if (groupKey !== key) return;
    const groupName = obj.parent?.name || '(no-group)';
    const meshName = obj.name || '(no-name)';
    const id = `${groupName}::${meshName}`;
    if (seen.has(id)) return;
    seen.add(id);
    console.log(groupName, meshName);
  });
}

function dumpMeshGroups() {
  if (!rootGroup) return;
  const groups = [];
  rootGroup.traverse((obj) => {
    if (!obj || obj.userData?.__mark) return;
    if (obj.type !== 'Group') return;
    const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : '(no-name)';
    groups.push({ name, uuid: obj.uuid });
  });
  console.log('[ThreeModelViewer] Model Groups');
  groups.forEach((g) => {
    console.log(`${g.name} (${g.uuid})`);
  });
}

/** 对外暴露 */
function selectByCode(code) {
  clearSelectedMeshes();
  innerSelectedCode.value = code || '';
  applyAll();
}

defineExpose({
  fitView,
  focusNote: marksApi.focusNote,
  focusMeasure: marksApi.focusMeasure,
  resizeViewer,
  setView,
  selectByCode,
  showOnlyGroup,
  showAllMeshes,
  clearMarks: marksApi.clearMarks,
  randomizeMeshColors,
  resetMeshColors,
  addNoteFromData: marksApi.addNoteFromData,
  addMeasureFromData: marksApi.addMeasureFromData,
  updateNoteMeta: marksApi.updateNoteMeta,
  updateMeasureMeta: marksApi.updateMeasureMeta,
  updateNotePositionByDelta: marksApi.updateNotePositionByDelta,
  updateMeasurePositionByDelta: marksApi.updateMeasurePositionByDelta,
  updateMeasurePointByDelta: marksApi.updateMeasurePointByDelta,
  removeMarkById: marksApi.removeMarkById,
  getMeasureBaseCenterWorld: marksApi.getMeasureBaseCenterWorld,
  getMeasureWorldPoints: marksApi.getMeasureWorldPoints,
  dumpMeshAndGroupByCode,
  dumpMeshGroups,
});

/** 生命周期 */
onMounted(() => {
  initThree();
  ensureOverlayGroups();
  if (window.ResizeObserver && hostRef.value) {
    resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(hostRef.value);
  }
  innerSelectedCode.value = props.selectedCode || '';
  if (props.modelUrl) loadModel(props.modelUrl);
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  disposeRenderer();

  if (meshLabelsGroup) {
    clearMeshLabels();
    getScene()?.remove(meshLabelsGroup);
    meshLabelsGroup = null;
  }
  if (marksGroupRef.value) {
    marksApi.clearMarks();
    getScene()?.remove(marksGroupRef.value);
    marksGroupRef.value = null;
  }
  rootGroup = null;
});

/** watch：url / selected / mode / isolate / explodeFactor / toolMode */
watch(
  () => props.modelUrl,
  (u) => {
    if (u) loadModel(u);
  },
);

watch(
  () => props.selectedCode,
  (c) => {
    clearSelectedMeshes();
    innerSelectedCode.value = c || '';
    if (!rootGroup) return;
    applyAll();
  },
);

watch(
  () => [props.mode, props.explode, props.explodeFactor],
  () => {
    if (!rootGroup) return;
    applyAll();
  },
);

watch(
  () => props.toolMode,
  (m) => {
    if (m !== 'measure') marksApi.clearMeasurePending();
  },
);

watch(
  () => [
    props.notePointScale,
    props.noteLabelOffset,
    props.measurePointScale,
    props.measureLineWidth,
    props.leftDimsArrowSize,
  ],
  () => {
    marksApi.applyMarkSizing();
    callUpdateBoundMarks();
  },
);

watch(
  () => [
    props.notePointColor,
    props.noteLabelColor,
    props.measurePointColor,
    props.measureLineColor,
    props.measureLabelColor,
    props.leftDimsColor,
    props.leftDimsFontSize,
  ],
  () => {
    marksApi.applyMarkColors();
  },
);

watch(
  () => props.showMeshLabels,
  () => {
    buildMeshLabels();
  },
);

watch(
  () => [props.meshLabelColor, props.meshLabelSize],
  () => {
    updateMeshLabels();
  },
);

watch(
  () => props.meshLabelMap,
  () => {
    buildMeshLabels();
  },
  { deep: true },
);

watch(
  () => props.activeGroupFilter,
  () => {
    buildMeshLabels();
    if (rootGroup) applyAll();
    if (props.activeGroupFilter) dumpMeshAndGroup(rootGroup);
  },
);

/** ✅ baseline dims cache 相关 watch */
watch(
  () => props.showLeftDims,
  () => markLeftDimsDirty(),
);
watch(
  () => [
    props.leftDimsUnitScale,
    props.leftDimsDatumX,
    props.leftDimsMaxCount,
    props.leftDimsMinSizeRatio,
    props.leftDimsAnchor,
  ],
  () => markLeftDimsDirty(),
);
</script>

<style scoped>
.mv-root {
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fb;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
}
.mv-root--flat-left {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.mv-info-tabs {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 9;
  display: inline-flex;
  gap: 6px;
  padding: 5px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
.mv-info-tab {
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-shadow: none;
  transition: color 0.2s, background 0.2s;
}
.mv-info-tab:hover {
  color: #1e293b;
  background: rgba(0, 0, 0, 0.04);
}
.mv-info-tab.is-active {
  background: linear-gradient(180deg, #d4722a 0%, #b5622a 100%);
  color: #ffffff;
  box-shadow:
    0 4px 12px rgba(181, 98, 42, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.mv-host {
  position: absolute;
  inset: 0;
}

/* ✅ CAD overlay */
.mv-overlay {
  position: absolute;
  inset: 0;
  z-index: 7; /* 在模型之上、tooltip(8)之下 */
  pointer-events: none;
}

/* tooltip */
.mv-tip {
  position: absolute;
  z-index: 8;
  min-width: 140px;
  max-width: 280px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(8, 16, 32, 0.95);
  border: 1px solid rgba(56, 130, 220, 0.25);
  color: #e0ecff;
  font-size: 12px;
  pointer-events: none;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.5);
}
.mv-tip__t {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 2px;
}
.mv-tip__s {
  color: rgba(248, 250, 252, 0.72);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ✅ label（CSS2D）蓝色风格 */
:deep(.mv-label) {
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.9);
  color: #1e293b;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  user-select: none;
}
:deep(.mv-label--axis) {
  padding: 1px 4px;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 900;
  font-size: 11px;
  border: 1px solid rgba(37, 99, 235, 0.5);
}
:deep(.mv-label--mesh) {
  background: transparent;
  border: none;
  padding: 0;
  border-radius: 0;
  font-weight: 500;
  letter-spacing: 0.2px;
  opacity: 0.85;
  color: rgba(30, 41, 59, 0.9);
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}
:deep(.mv-label--mesh.mv-label--mesh-outline) {
  text-shadow:
    0 0 4px rgba(255, 255, 255, 0.9),
    0 0 8px rgba(255, 255, 255, 0.6);
}

/* ✅ 编辑器 */
.mv-editor {
  position: absolute;
  z-index: 9;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(8, 16, 32, 0.95);
  border: 1px solid rgba(56, 130, 220, 0.3);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}
.mv-editor__input {
  width: 200px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(56, 130, 220, 0.3);
  outline: none;
  padding: 0 10px;
  font-size: 12px;
  color: #e0ecff;
  background: rgba(10, 22, 40, 0.6);
}
.mv-editor__input:focus {
  border-color: rgba(56, 130, 220, 0.6);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.2);
}
.mv-editor__btn {
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(56, 130, 220, 0.2);
  background: rgba(10, 22, 40, 0.7);
  color: #c8deff;
  font-size: 12px;
  cursor: pointer;
}
.mv-editor__btn--ok {
  border-color: rgba(29, 78, 216, 0.6);
  background: rgba(29, 78, 216, 0.25);
  color: #e0ecff;
  font-weight: 800;
}

/* 状态层 */
.mv-toast {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 7;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(8, 16, 32, 0.92);
  border: 1px solid rgba(56, 130, 220, 0.2);
  font-size: 12px;
  color: #c8deff;
}
.mv-toast--err {
  color: #fca5a5;
  border-color: rgba(220, 56, 56, 0.35);
  background: rgba(60, 10, 10, 0.85);
}
.mv-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(180, 210, 255, 0.6);
  font-size: 12px;
  z-index: 6;
  text-align: center;
  padding: 16px;
}
</style>
