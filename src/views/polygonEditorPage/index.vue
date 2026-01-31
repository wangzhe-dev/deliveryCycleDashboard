<template>
  <div class="polygon-editor-page" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 全屏按钮 -->
    <div class="fullscreen-btn-wrap" v-if="!isFullscreen">
      <el-button :icon="FullScreen" size="small" @click="enterFullscreen">全屏</el-button>
    </div>
    <div class="fullscreen-exit-btn" v-else>
      <el-button :icon="CloseBold" size="small" circle @click="exitFullscreen" />
    </div>

    <div class="editor-wrap">
      <div
        class="card editor-card"
        ref="editorCardRef"
        @keydown.capture="onKeyDown"
        @keyup.capture="onKeyUp"
        tabindex="0"
      >
        <!-- 参数面板 -->
        <div class="bg-#ebeef5 p10 pb10">
          <div class="row-between">
            <div class="row-start">
              <label class="fs12 mr10">
                <div class="mr3 mb5">栅格单位(m)</div>
                <el-input
                  type="number"
                  min="0.01"
                  step="0.01"
                  v-model.number="gridUnitM"
                  size="small"
                  style="width: 100px"
                />
              </label>

              <label class="fs12 mr10">
                <div class="mr3 mb5">缩放(px/m)</div>
                <el-input
                  type="number"
                  min="10"
                  step="10"
                  v-model.number="pxPerM"
                  @change="redraw"
                  size="small"
                  style="width: 100px"
                />
              </label>

              <label class="fs12 mr10">
                <div class="mr3 mb5">吸附精度(m)</div>
                <el-input
                  type="number"
                  min="0"
                  step="0.01"
                  v-model.number="snapM"
                  @change="redraw"
                  size="small"
                  style="width: 100px"
                />
              </label>

              <label class="fs12 mr10">
                <div class="mr3 mb5">图形旋转</div>
                <el-button :icon="RefreshRight" size="small" @click="applyRotate(10)">
                  顺时针
                </el-button>
                <el-button :icon="RefreshLeft" size="small" @click="applyRotate(-10)">
                  逆时针
                </el-button>
              </label>

              <label class="fs12">
                <div class="mr3 mb5">图形缩放</div>
                <el-button :icon="ZoomIn" size="small" @click="applyScale(1.1)">放大</el-button>
                <el-button :icon="ZoomOut" size="small" @click="applyScale(1 / 1.1)">
                  缩小
                </el-button>
              </label>
            </div>

            <div class="row-start" style="gap: 8px">
              <el-button @click="reset" type="danger" size="small">清空</el-button>
              <el-button
                @click="closePolygon"
                :disabled="points.length < 3 || isClosed"
                size="small"
                type="primary"
              >
                闭合图形
              </el-button>
              <el-button type="success" @click="handleSave" size="small">保存</el-button>
            </div>
          </div>
        </div>

        <div class="row-start fs12">
          <el-checkbox
            v-model="linkScaleOnGridChange"
            label="修改栅格单位时缩放图形"
            size="small"
          />
          <el-checkbox v-model="showEdgeLabels" label="边长标注" size="small" />
          <el-checkbox v-model="showAngleLabels" label="角度标注" size="small" />
          <el-checkbox v-model="showPivot" label="显示中心点图标" size="small" />
        </div>

        <!-- 画布区 -->
        <div class="canvas-wrap" ref="wrapRef" @contextmenu.prevent>
          <canvas
            ref="canvasRef"
            @mousedown="onMouseDown"
            @click="onClick"
            @dblclick="closePolygon"
            @mousemove="onMove"
            @mouseleave="onMouseLeave"
          ></canvas>
          <div class="mode-badge" v-if="overlayHint">{{ overlayHint }}</div>
          <!-- 信息面板 -->
          <div class="info-panel">
            <div style="border-bottom: 1px solid #dedede" class="fs16 pb5 mb5 row-between">
              <div class="fw">点位信息</div>
              <div class="row-between fs12">
                <div class="mr20">
                  数量:
                  <b>{{ points.length }}</b>
                </div>
                <div>
                  状态:
                  <b :class="isClosed ? 'color-green' : 'color-red'">
                    {{ isClosed ? '已闭合' : '未闭合' }}
                  </b>
                </div>
              </div>
            </div>

            <!-- 新增点 -->
            <div class="points">
              <div class="pt add-pt">
                <div class="pt-row">
                  <div class="pt-add-fields fs12">
                    <label>
                      X：
                      <el-input
                        type="number"
                        step="0.01"
                        v-model.number="newPoint.x"
                        @keydown.stop
                        size="small"
                        :min="0"
                      />
                    </label>
                    <label>
                      Y：
                      <el-input
                        type="number"
                        step="0.01"
                        v-model.number="newPoint.y"
                        @keydown.stop
                        size="small"
                        :min="0"
                      />
                    </label>
                    <label>
                      <el-button
                        type="primary"
                        :icon="Plus"
                        @click="addPointAtEnd(newPoint.x, newPoint.y)"
                        size="small"
                      >
                        新增点
                      </el-button>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- 点列表 -->
            <div style="height: calc(100% - 140px); overflow-y: auto">
              <div
                class="pt cursor-pointer"
                v-for="(p, i) in points"
                :key="i"
                :class="{ selected: i === selectedIndex }"
              >
                <div class="fs12" @click="selectedIndex = i">
                  <div class="row-between">
                    <div class="mb10 fw">#{{ i + 1 }}</div>
                  </div>
                  <div class="pt-edit-fields fs12">
                    <label class="row-start">
                      X：
                      <el-input
                        type="number"
                        step="0.01"
                        v-model.number="points[i].x"
                        @input="onPointInput(i)"
                        @keydown.stop
                        size="small"
                      />
                    </label>
                    <label class="row-start">
                      Y：
                      <el-input
                        type="number"
                        step="0.01"
                        v-model.number="points[i].y"
                        @input="onPointInput(i)"
                        @keydown.stop
                        size="small"
                      />
                    </label>
                    <el-button
                      size="small"
                      :icon="Delete"
                      type="danger"
                      @click="deletePoint(i)"
                    ></el-button>
                  </div>
                </div>
                <div v-if="edgeLengths[i] !== undefined" class="pt-edge">
                  <div class="row-start">
                    <div class="mr20">
                      长度:
                      <b>{{ edgeLengths[i].toFixed(2) }} m</b>
                    </div>
                    <div v-if="showAngleLabels && vertexAngles[i] !== undefined">
                      角度:
                      <b>{{ vertexAngles[i].toFixed(2) }}°</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="fs12 pt5 pb5 color-#4b5563" style="border-top: 1px solid #dedede">
              *提示：单击=加点；拖动背景=平移；Alt=旋转；Ctrl/⌘=缩放；双击闭合；右键撤销；Shift
              关闭吸附；选点后按 Delete 删除
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  CloseBold,
  Delete,
  FullScreen,
  Plus,
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
} from '@element-plus/icons-vue';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';

/** ===== 全屏 ===== */
const isFullscreen = ref(false);
const pageRef = ref(null);

function enterFullscreen() {
  isFullscreen.value = true;
  nextTick(() => {
    handleResize();
    focusEditor();
  });
}
function exitFullscreen() {
  isFullscreen.value = false;
  nextTick(() => handleResize());
}

/** ===== 颜色变量（统一管理） ===== */
const colors = reactive({
  bgTop: '#0e1624',
  bgBottom: '#0b1220',
  bgStripe: 'rgba(111, 168, 255, 0.03)',
  text: '#cbd5e1',
  labelStroke: 'rgba(11, 18, 32, 0.90)',
  gridFine: 'rgba(117, 128, 147, 0.18)',
  gridCoarse: 'rgba(117, 128, 147, 0.34)',
  polygonStroke: '#6fa8ff',
  polygonFill: '#6fa8ff',
  fogCenter: 'rgba(30, 58, 138, 0.10)',
  fogEdge: 'rgba(0, 0, 0, 0.42)',
  fogHorizon: 'rgba(14, 22, 36, 0.14)',
});

/** ===== 画布 / DPR / 尺寸 ===== */
const editorCardRef = ref(null);
const wrapRef = ref(null);
const canvasRef = ref(null);
const ctx = ref(null);
const dpr = ref(1);
const canvasW = ref(0);
const canvasH = ref(0);
let ro;
let contextMenuEl = null;

/** ===== 参数（单位：米） ===== */
const pxPerM = ref(10);
const gridUnitM = ref(1);
const snapM = ref(1);
const linkScaleOnGridChange = ref(true);
const lastGridUnitM = ref(gridUnitM.value);

/** ===== UI 开关 ===== */
const showEdgeLabels = ref(true);
const showAngleLabels = ref(true);
const showPivot = ref(false);

/** ===== 数据状态 ===== */
const points = reactive([]);
const isClosed = ref(false);
const mousePos = reactive({ x: 0, y: 0 });
const draggingIndex = ref(-1);
const draggingWhole = ref(false);
const rotatingWhole = ref(false);
const scalingWhole = ref(false);
const dragStart = reactive({ x: 0, y: 0 });
const dragStartScreen = reactive({ x: 0, y: 0 });
let backupPoints = [];
const hoverIndex = ref(-1);
const selectedIndex = ref(-1);
const isShiftDown = ref(false);
const overlayHint = ref('');

/** ===== 量测 ===== */
const edgeLengths = computed(() => {
  const n = points.length;
  if (!n) return [];
  const arr = [];
  for (let i = 0; i < n; i++) {
    const a = points[i],
      b = points[(i + 1) % n];
    if (i === n - 1 && !isClosed.value) break;
    arr.push(dist(a, b));
  }
  return arr;
});
const vertexAngles = computed(() => {
  const n = points.length;
  if (n < 3) return [];
  const arr = new Array(n);
  for (let i = 0; i < n; i++) {
    if (!isClosed.value && (i === 0 || i === n - 1)) continue;
    const prev = points[(i - 1 + n) % n],
      curr = points[i],
      next = points[(i + 1) % n];
    arr[i] = angleAt(prev, curr, next);
  }
  return arr;
});

/** ===== 栅格单位变化时的等比例缩放 ===== */
watch(gridUnitM, (nv, ov) => {
  if (nv <= 0) return;
  if (linkScaleOnGridChange.value && points.length) {
    const center = getCentroid(points);
    backupPoints = points.map((p) => ({ x: p.x, y: p.y }));
    const s = nv / (ov || nv);
    applyTransform(points, center, 0, s);
    redraw();
  }
  lastGridUnitM.value = nv;
});

function getCurrentPivot() {
  return getCentroid(points);
}

/** ===== 交互 ===== */
function isEditableTarget(e) {
  const el = e.target;
  return !!(el && el.closest && el.closest('input, textarea, [contenteditable="true"], select'));
}
function reset() {
  points.splice(0, points.length);
  isClosed.value = false;
  draggingIndex.value = -1;
  draggingWhole.value = false;
  rotatingWhole.value = false;
  scalingWhole.value = false;
  hoverIndex.value = -1;
  selectedIndex.value = -1;
  overlayHint.value = '';
  redraw();
}
function closePolygon() {
  if (points.length >= 3) {
    isClosed.value = true;
    redraw();
  }
}
function onMove(e) {
  const { x, y } = toCanvasCoords(e);
  mousePos.x = x;
  mousePos.y = y;
  hoverIndex.value = hitTestPoint(e);

  if (draggingIndex.value >= 0) {
    const i = draggingIndex.value;
    const p = applySnap({ x, y });
    points[i].x = p.x;
    points[i].y = p.y;
  } else if (rotatingWhole.value) {
    const c = getCurrentPivot();
    const a0 = Math.atan2(dragStart.y - c.y, dragStart.x - c.x);
    const a1 = Math.atan2(y - c.y, x - c.x);
    const d = a1 - a0;
    overlayHint.value = `旋转 ${((d * 180) / Math.PI).toFixed(2)}°`;
    applyTransform(points, c, d, 1);
  } else if (scalingWhole.value) {
    const c = getCurrentPivot();
    const d0 = Math.hypot(dragStart.x - c.x, dragStart.y - c.y);
    const d1 = Math.hypot(x - c.x, y - c.y);
    let s = d0 === 0 ? 1 : d1 / d0;
    if (!isShiftDown.value && snapM.value > 0) s = Math.max(0.02, Math.round(s / 0.02) * 0.02);
    overlayHint.value = `缩放 ×${s.toFixed(2)}`;
    applyTransform(points, c, 0, s);
  } else if (draggingWhole.value) {
    let dx = x - dragStart.x,
      dy = y - dragStart.y;
    if (!isShiftDown.value && snapM.value > 0) {
      dx = Math.round(dx / snapM.value) * snapM.value;
      dy = Math.round(dy / snapM.value) * snapM.value;
    }
    for (let i = 0; i < points.length; i++) {
      points[i].x = backupPoints[i].x + dx;
      points[i].y = backupPoints[i].y + dy;
    }
    overlayHint.value = `位移 (${dx.toFixed(2)}, ${dy.toFixed(2)}) m`;
  }
  redraw();
}
function onMouseLeave() {
  hoverIndex.value = -1;
  draggingIndex.value = -1;
  draggingWhole.value = false;
  rotatingWhole.value = false;
  scalingWhole.value = false;
  overlayHint.value = '';
}
function onMouseDown(e) {
  if (e.button === 2) return;
  const idx = hitTestPoint(e);
  const { x, y } = toCanvasCoords(e);
  dragStart.x = x;
  dragStart.y = y;
  dragStartScreen.x = e.clientX;
  dragStartScreen.y = e.clientY;

  const wantRotate = e.altKey;
  const wantScale = e.ctrlKey || e.metaKey;

  if (idx >= 0) {
    draggingIndex.value = idx;
    selectedIndex.value = idx;
    window.addEventListener('mouseup', onMouseUp, { once: true });
    overlayHint.value = '';
    return;
  }
  if (points.length) {
    backupPoints = points.map((p) => ({ x: p.x, y: p.y }));
    if (wantRotate) rotatingWhole.value = true;
    else if (wantScale) scalingWhole.value = true;
    else draggingWhole.value = true;
    window.addEventListener('mouseup', onMouseUpWhole, { once: true });
  }
}
function onMouseUp() {
  draggingIndex.value = -1;
}
function onMouseUpWhole() {
  draggingWhole.value = false;
  rotatingWhole.value = false;
  scalingWhole.value = false;
  overlayHint.value = '';
}
function onClick(e) {
  const idx = hitTestPoint(e);
  if (idx >= 0) {
    selectedIndex.value = idx;
    return;
  }
  if (isClosed.value) return;
  const movedPx = Math.hypot(e.clientX - dragStartScreen.x, e.clientY - dragStartScreen.y);
  if (movedPx > 4) return;
  const { x, y } = toCanvasCoords(e);
  const p = applySnap({ x, y });
  points.push(p);
  selectedIndex.value = points.length - 1;
  redraw();
}
function onKeyDown(e) {
  if (e.key === 'Shift') isShiftDown.value = true;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (isEditableTarget(e)) return;
    if (selectedIndex.value >= 0) {
      deletePoint(selectedIndex.value);
      e.preventDefault();
    }
  }
  if (e.key === 'Escape' && isFullscreen.value) {
    exitFullscreen();
  }
}
function onKeyUp(e) {
  if (e.key === 'Shift') isShiftDown.value = false;
}

/** ===== 面板：新增/编辑/删除 ===== */
const newPoint = reactive({ x: 0, y: 0 });
function addPointAtEnd(x, y) {
  if (!isFinite(x) || !isFinite(y)) return;
  points.push({ x: +x, y: +y });
  selectedIndex.value = points.length - 1;
  redraw();
}
function onPointInput(i) {
  if (i < 0 || i >= points.length) return;
  const p = points[i];
  if (!isFinite(p.x) || !isFinite(p.y)) return;
  redraw();
}
function deletePoint(i) {
  if (i < 0 || i >= points.length) return;
  points.splice(i, 1);
  if (points.length < 3) isClosed.value = false;
  selectedIndex.value = points.length ? Math.min(i, points.length - 1) : -1;
  redraw();
}

function focusEditor() {
  if (editorCardRef.value) editorCardRef.value.focus();
}

function handleSave() {
  const payload = buildPayload();
  console.log('保存数据：', payload);
  // TODO: 根据业务需求调用接口保存
}

/** ===== 数学与工具 ===== */
function toCanvasCoords(e) {
  const rect = canvasRef.value.getBoundingClientRect();
  const xPx = e.clientX - rect.left,
    yPx = e.clientY - rect.top;
  return { x: xPx / pxPerM.value, y: yPx / pxPerM.value };
}
function applySnap(pt) {
  if (isShiftDown.value || snapM.value === 0) return pt;
  return {
    x: Math.round(pt.x / snapM.value) * snapM.value,
    y: Math.round(pt.y / snapM.value) * snapM.value,
  };
}
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function angleAt(a, b, c) {
  const abx = a.x - b.x,
    aby = a.y - b.y,
    cbx = c.x - b.x,
    cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag1 = Math.hypot(abx, aby),
    mag2 = Math.hypot(cbx, cby);
  if (!mag1 || !mag2) return 0;
  let cos = dot / (mag1 * mag2);
  cos = Math.min(1, Math.max(-1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}
function getCentroid(pts) {
  if (!pts.length) return { x: 0, y: 0 };
  let sx = 0,
    sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
}
function applyTransform(pts, center, theta, scale) {
  const s = Math.sin(theta),
    c = Math.cos(theta);
  for (let i = 0; i < pts.length; i++) {
    const dx = backupPoints[i].x - center.x;
    const dy = backupPoints[i].y - center.y;
    const x = dx * c - dy * s;
    const y = dx * s + dy * c;
    pts[i].x = center.x + x * scale;
    pts[i].y = center.y + y * scale;
  }
}

/** ===== 绘制 ===== */
function setupHiDPICanvas() {
  const canvas = canvasRef.value;
  const wrap = wrapRef.value;
  if (!canvas || !wrap) return;

  const rect = wrap.getBoundingClientRect();
  canvasW.value = Math.max(1, Math.floor(rect.width));
  canvasH.value = Math.max(1, Math.floor(rect.height));

  dpr.value = window.devicePixelRatio || 1;

  canvas.width = Math.floor(canvasW.value * dpr.value);
  canvas.height = Math.floor(canvasH.value * dpr.value);
  canvas.style.width = `${canvasW.value}px`;
  canvas.style.height = `${canvasH.value}px`;

  const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  ctx.value = context;
  ctx.value.setTransform(dpr.value, 0, 0, dpr.value, 0, 0);
}
function clearAll() {
  if (!ctx.value) return;
  ctx.value.save();
  ctx.value.setTransform(dpr.value, 0, 0, dpr.value, 0, 0);
  ctx.value.clearRect(0, 0, canvasW.value, canvasH.value);
  ctx.value.restore();
}
function drawGrid() {
  const c = ctx.value;
  if (!c) return;
  clearAll();

  c.save();
  const base = c.createLinearGradient(0, 0, 0, canvasH.value);
  base.addColorStop(0, colors.bgTop);
  base.addColorStop(1, colors.bgBottom);
  c.fillStyle = base;
  c.fillRect(0, 0, canvasW.value, canvasH.value);

  const horizon = c.createLinearGradient(0, 0, 0, canvasH.value * 0.55);
  horizon.addColorStop(0, colors.fogHorizon);
  horizon.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = horizon;
  c.fillRect(0, 0, canvasW.value, canvasH.value * 0.55);

  const cx = canvasW.value * 0.55;
  const cy = canvasH.value * 0.55;
  const r0 = Math.min(canvasW.value, canvasH.value) * 0.1;
  const r1 = Math.min(canvasW.value, canvasH.value) * 0.85;
  const centerGlow = c.createRadialGradient(cx, cy, r0, cx, cy, r1);
  centerGlow.addColorStop(0, colors.fogCenter);
  centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = centerGlow;
  c.fillRect(0, 0, canvasW.value, canvasH.value);

  const vignette = c.createRadialGradient(
    canvasW.value * 0.5,
    canvasH.value * 0.5,
    Math.min(canvasW.value, canvasH.value) * 0.15,
    canvasW.value * 0.5,
    canvasH.value * 0.5,
    Math.max(canvasW.value, canvasH.value) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, colors.fogEdge);
  c.fillStyle = vignette;
  c.fillRect(0, 0, canvasW.value, canvasH.value);
  c.restore();

  c.save();
  c.strokeStyle = colors.bgStripe;
  c.lineWidth = 1 / dpr.value;
  c.beginPath();
  const stripeGap = 60;
  for (let x = -canvasH.value; x < canvasW.value + canvasH.value; x += stripeGap) {
    c.moveTo(x, 0);
    c.lineTo(x + canvasH.value, canvasH.value);
  }
  c.stroke();
  c.restore();

  const stepPx = gridUnitM.value * pxPerM.value;
  c.save();
  c.lineWidth = 1 / dpr.value;
  c.strokeStyle = colors.gridFine;
  c.beginPath();
  for (let x = 0; x <= canvasW.value + 0.5; x += stepPx) {
    c.moveTo(x, 0);
    c.lineTo(x, canvasH.value);
  }
  for (let y = 0; y <= canvasH.value + 0.5; y += stepPx) {
    c.moveTo(0, y);
    c.lineTo(canvasW.value, y);
  }
  c.stroke();
  c.restore();

  const coarse = stepPx * 5;
  c.save();
  c.lineWidth = 2 / dpr.value;
  c.strokeStyle = colors.gridCoarse;
  c.beginPath();
  for (let x = 0; x <= canvasW.value + 0.5; x += coarse) {
    c.moveTo(x, 0);
    c.lineTo(x, canvasH.value);
  }
  for (let y = 0; y <= canvasH.value + 0.5; y += coarse) {
    c.moveTo(0, y);
    c.lineTo(canvasW.value, y);
  }
  c.stroke();
  c.restore();

  c.save();
  c.fillStyle = colors.text;
  const labelFontPx = 10;
  c.font = `${labelFontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  for (let x = 0; x <= canvasW.value; x += coarse) {
    const val = x / pxPerM.value;
    const isZero = Math.abs(val) < 1e-6;
    const text = isZero ? '0 m' : String(Math.round(val));
    c.fillText(text, x + 4, labelFontPx + 1);
  }
  for (let y = 0; y <= canvasH.value; y += coarse) {
    const val = y / pxPerM.value;
    const isZero = Math.abs(val) < 1e-6;
    const text = isZero ? '0 m' : String(Math.round(val));
    c.fillText(text, 4, Math.max(labelFontPx + 1, y - 4));
  }
  c.restore();
}
function drawPolygon() {
  const c = ctx.value;
  if (!c || !points.length) return;

  c.save();
  c.strokeStyle = colors.polygonStroke;
  c.lineWidth = 2 / dpr.value;
  c.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = p.x * pxPerM.value,
      y = p.y * pxPerM.value;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  if (isClosed.value) c.closePath();
  c.stroke();

  if (isClosed.value) {
    c.globalAlpha = 0.25;
    c.fillStyle = colors.polygonFill;
    c.fill();
  }
  c.restore();

  c.save();
  for (let i = 0; i < points.length; i++)
    drawHandle(points[i], i === hoverIndex.value, i === selectedIndex.value);
  c.restore();

  if (!isClosed.value && points.length) {
    const last = points[points.length - 1];
    c.save();
    c.setLineDash([6, 6]);
    c.strokeStyle = '#0ea5e9';
    c.lineWidth = 1.5 / dpr.value;
    c.beginPath();
    c.moveTo(last.x * pxPerM.value, last.y * pxPerM.value);
    c.lineTo(mousePos.x * pxPerM.value, mousePos.y * pxPerM.value);
    c.stroke();
    c.restore();
  }

  if (showEdgeLabels.value) drawEdgeLengthLabels();
  if (showAngleLabels.value) drawAngleLabels();
  if (showPivot.value && points.length) drawPivotMarker(getCurrentPivot());

  if (overlayHint.value) {
    c.save();
    c.globalAlpha = 0.9;
    c.fillStyle = colors.text;
    c.font = `${12}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    c.fillText(overlayHint.value, 12, 20);
    c.restore();
  }
}
function drawHandle(p, hover = false, selected = false) {
  const c = ctx.value;
  const r = selected ? 6 : hover ? 5 : 4;
  const x = p.x * pxPerM.value,
    y = p.y * pxPerM.value;
  c.beginPath();
  c.fillStyle = selected ? '#10b981' : hover ? '#ef4444' : '#e2e8f0';
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
function drawLabel(x, y, text) {
  const c = ctx.value;
  c.save();
  c.font = `${12}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 2 / dpr.value;
  c.strokeStyle = colors.labelStroke;
  c.strokeText(text, x, y);
  c.fillStyle = colors.text;
  c.fillText(text, x, y);
  c.restore();
}
function drawPivotMarker(p) {
  const c = ctx.value;
  const x = p.x * pxPerM.value,
    y = p.y * pxPerM.value;
  c.save();
  c.strokeStyle = '#f59e0b';
  c.lineWidth = 2 / dpr.value;
  c.beginPath();
  c.arc(x, y, 14, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.moveTo(x - 18, y);
  c.lineTo(x + 18, y);
  c.moveTo(x, y - 18);
  c.lineTo(x, y + 18);
  c.stroke();
  c.beginPath();
  c.arc(x, y, 22, -Math.PI * 0.2, Math.PI * 0.9);
  c.stroke();
  const ah = 6,
    ax = x + 22 * Math.cos(Math.PI * 0.9),
    ay = y + 22 * Math.sin(Math.PI * 0.9);
  c.beginPath();
  c.moveTo(ax, ay);
  c.lineTo(ax - ah, ay - ah);
  c.lineTo(ax + ah * 0.3, ay - ah * 1.3);
  c.closePath();
  c.fillStyle = '#f59e0b';
  c.fill();
  c.restore();
}
function drawEdgeLengthLabels() {
  if (!points.length) return;
  const n = points.length;
  const upTo = isClosed.value ? n : n - 1;
  for (let i = 0; i < upTo; i++) {
    const a = points[i],
      b = points[(i + 1) % n];
    const midx = ((a.x + b.x) / 2) * pxPerM.value;
    const midy = ((a.y + b.y) / 2) * pxPerM.value;
    const len = dist(a, b);
    drawLabel(midx, midy - 10, `${len.toFixed(2)} m`);
  }
}
function drawAngleLabels() {
  const n = points.length;
  if (n < 3) return;
  for (let i = 0; i < n; i++) {
    if (!isClosed.value && (i === 0 || i === n - 1)) continue;
    const p = points[i];
    const ang = vertexAngles.value[i];
    if (ang == null) continue;
    drawLabel(p.x * pxPerM.value, p.y * pxPerM.value - 18, `${ang.toFixed(2)}°`);
  }
}
function redraw() {
  if (!ctx.value) return;
  drawGrid();
  drawPolygon();
}

/** ===== 命中测试 ===== */
function hitTestPoint(e) {
  const { x, y } = toCanvasCoords(e);
  const tolPx = 8;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dx = (p.x - x) * pxPerM.value,
      dy = (p.y - y) * pxPerM.value;
    if (dx * dx + dy * dy <= tolPx * tolPx) return i;
  }
  return -1;
}

/** ===== 导出 / 保存 ===== */
function buildPayload() {
  return {
    points: points.map((p) => ({ x: +Number(p.x).toFixed(2), y: +Number(p.y).toFixed(2) })),
    isClosed: isClosed.value,
    settings: {
      gridUnitM: +Number(gridUnitM.value).toFixed(2),
      pxPerM: +Number(pxPerM.value).toFixed(2),
      snapM: +Number(snapM.value).toFixed(2),
      linkScaleOnGridChange: linkScaleOnGridChange.value,
      showPivot: showPivot.value,
    },
  };
}

/** ===== 尺寸监听 / 初始化 ===== */
function handleResize() {
  if (!canvasRef.value || !wrapRef.value) return;
  setupHiDPICanvas();
  redraw();
}

const onCanvasContextMenu = (e) => {
  e.preventDefault();
  if (isClosed.value) return;
  if (points.length) {
    points.pop();
    if (selectedIndex.value >= points.length) selectedIndex.value = points.length - 1;
    redraw();
  }
};

function bindCanvasContextMenu() {
  if (!canvasRef.value || contextMenuEl) return;
  contextMenuEl = canvasRef.value;
  contextMenuEl.addEventListener('contextmenu', onCanvasContextMenu);
}

function unbindCanvasContextMenu() {
  if (contextMenuEl) {
    contextMenuEl.removeEventListener('contextmenu', onCanvasContextMenu);
    contextMenuEl = null;
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  nextTick(() => {
    setupHiDPICanvas();
    bindCanvasContextMenu();
    ro = new ResizeObserver(() => handleResize());
    if (wrapRef.value) ro.observe(wrapRef.value);
    redraw();
    focusEditor();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  unbindCanvasContextMenu();
  if (ro) {
    ro.disconnect();
    ro = null;
  }
});

/** ===== 工具栏：旋转/缩放按钮 ===== */
function applyRotate(deg) {
  if (!points.length) return;
  const center = getCurrentPivot();
  backupPoints = points.map((p) => ({ x: p.x, y: p.y }));
  const rad = (deg * Math.PI) / 180;
  applyTransform(points, center, rad, 1);
  overlayHint.value = `旋转 ${deg.toFixed(2)}°`;
  redraw();
}
function applyScale(f) {
  if (!points.length || !isFinite(f) || f <= 0) return;
  const center = getCurrentPivot();
  backupPoints = points.map((p) => ({ x: p.x, y: p.y }));
  applyTransform(points, center, 0, f);
  overlayHint.value = `缩放 ×${Number(f).toFixed(2)}`;
  redraw();
}
</script>

<style scoped>
.polygon-editor-page {
  height: 100%;
  width: 100%;
  position: relative;
  background: #f1f5f9;
}

.polygon-editor-page.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #f1f5f9;
}

.fullscreen-btn-wrap {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.fullscreen-exit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.editor-wrap {
  height: 100%;
}

.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  outline: none;
  border-radius: 0;
}

.bg-\#ebeef5 {
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.96),
    rgba(241, 245, 249, 0.92)
  ) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.bg-\#ebeef5 .row-between {
  align-items: flex-end;
}
.bg-\#ebeef5 label {
  padding: 6px 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
}
.bg-\#ebeef5 label:hover {
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.row-start.fs12 {
  padding: 8px 10px;
  gap: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(248, 250, 252, 0.72);
}

.canvas-wrap {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 360px;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: 14px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 -1px 0 rgba(0, 0, 0, 0.18) inset,
    0 6px 18px rgba(2, 6, 23, 0.22);
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.info-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: 380px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.12);
  backdrop-filter: blur(10px);
}

.info-panel .fw {
  color: #0f172a;
  letter-spacing: 0.2px;
}

.info-panel .fs16 {
  font-weight: 800;
  color: #0f172a;
}

.info-panel > div[style*='overflow-y'] {
  padding-right: 4px;
}
.info-panel > div[style*='overflow-y']::-webkit-scrollbar {
  width: 8px;
}
.info-panel > div[style*='overflow-y']::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.45);
  border-radius: 999px;
}

.pt {
  padding: 10px 10px;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  margin-bottom: 10px;
  transition: 0.15s ease;
}

.pt:hover {
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.pt.selected {
  border-color: rgba(16, 185, 129, 0.65);
  box-shadow:
    0 0 0 3px rgba(16, 185, 129, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
  background: rgba(236, 253, 245, 0.55);
}

.pt.add-pt {
  border-style: dashed;
  background: rgba(255, 255, 255, 0.72);
}

.pt-add-fields,
.pt-edit-fields {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: end;
  color: #475569;
}

.pt-add-fields label,
.pt-edit-fields label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pt-add-fields :deep(.el-input),
.pt-edit-fields :deep(.el-input) {
  width: 100%;
}

.pt :deep(.el-button--danger) {
  border-radius: 10px;
}

.pt-edge {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(148, 163, 184, 0.35);
  font-size: 12px;
  color: #475569;
}

.mode-badge {
  position: absolute;
  right: 420px;
  bottom: 12px;
  padding: 6px 10px;
  font-size: 12px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(2, 6, 23, 0.08);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

@media (max-width: 1180px) {
  .info-panel {
    width: 340px;
  }
}
@media (max-width: 980px) {
  .info-panel {
    position: static;
    width: auto;
    margin: 10px;
    height: auto;
  }
  .canvas-wrap {
    height: auto;
    min-height: 520px;
  }
}
</style>
