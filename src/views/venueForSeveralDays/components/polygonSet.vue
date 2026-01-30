<template>
  <div class="preview-wrap">
    <div class="card topbar">
      <div class="topbar-row">
        <div class="meta-row">
          <span class="meta">
            单位:
            <b>{{ unit }}</b>
          </span>
          <span class="meta">
            网格:
            <b>{{ gridUnitM }} {{ unit }}</b>
          </span>
          <span class="meta">
            比例:
            <b>{{ pxPerM }}px/{{ unit }}</b>
          </span>
        </div>
        <div class="actions-row">
          <el-button size="small" @click="pre">
            <el-icon style="margin-right: 4px">
              <ArrowLeft />
            </el-icon>
            上一天
          </el-button>
          <span class="meta">
            <b>{{ date }}</b>
          </span>
          <el-button size="small" @click="next">
            <el-icon style="margin-right: 4px">
              <ArrowRight />
            </el-icon>
            下一天
          </el-button>
          <el-button type="primary" size="small" @click="onSave">
            <el-icon style="margin-right: 4px">
              <Check />
            </el-icon>
            保存
          </el-button>

          <!-- 删除（只有选中任务才可点） -->
          <el-button size="small" type="danger" :disabled="!activeTaskId" @click="onDelete">
            <el-icon style="margin-right: 4px">
              <Delete />
            </el-icon>
            删除
          </el-button>

          <el-button size="small" type="danger" plain @click="closePanel">
            <el-icon style="margin-right: 4px">
              <Close />
            </el-icon>
            关闭
          </el-button>
        </div>
      </div>
    </div>

    <div class="canvas-wrap-set" ref="wrapRef" @contextmenu.prevent>
      <canvas
        ref="canvasRef"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  onMounted,
  onBeforeUnmount,
  watch,
  defineProps,
  defineEmits,
  defineExpose,
} from 'vue';
import { Check, ArrowLeft, ArrowRight, Close, Delete } from '@element-plus/icons-vue';

const emit = defineEmits(['save', 'pre', 'next', 'close', 'update:data']);
const props = defineProps({
  data: { type: Object, required: true },
  siteId: { type: String, required: true },
  statusColorMap: {
    type: Object,
    default: () => ({
      0: { fill: 'rgba(249,115,22,0.6)' }, // orange
      1: { fill: 'rgba(14,165,233,0.6)' }, // sky
      2: { fill: 'rgba(34,197,94,0.6)' }, // green
    }),
  },
});

/** ===== 约定：场地左上角在世界坐标 (10,10) ===== */
const SITE_TOP_LEFT = { x: 10, y: 10 };

/** ===== Canvas / DPR ===== */
const wrapRef = ref(null);
const canvasRef = ref(null);
const ctx = ref(null);
const dpr = ref(1);
const canvasW = ref(0);
const canvasH = ref(0);
let ro;

/** 使用 requestAnimationFrame 合并重绘，防止频繁 redraw 卡顿 */
let redrawPending = false;
function scheduleRedraw() {
  if (redrawPending) return;
  redrawPending = true;
  requestAnimationFrame(() => {
    redrawPending = false;
    redraw();
  });
}

/** ===== 颜色 ===== */
const colors = reactive({
  bg: '#ffffff',
  text: '#333',
  gridFine: '#e9eef5',
  gridCoarse: '#d8dee6',
  siteFill: '#409eff50',
  siteStroke: '#409eff',
  taskFillFallback: '#94a3b8',
});

/** ===== 世界数据（米） ===== */
const unit = ref('m');
const gridUnitM = ref(1);
const pxPerM = ref(10);
const date = ref('');

/** ===== 模型 ===== */
const site = reactive({ points: [] });
/**
 * tasks:
 * - segmentId: 业务唯一键（画布唯一标识：选中/删除/变换都用它）
 * - id: 后端记录主键（已有数据才有，用于保存）
 *
 * 约定：
 *  - 接口中 tasks[*].points 是【相对场地左上角】的坐标
 *  - 组件内部 tasks[*].basePoints 是【世界坐标】（已经 + siteOrigin）
 */
const tasks = reactive([]); // [{id, segmentId, segmentName, segmentCode, status, basePoints:[...]}]
const tfx = reactive({}); // { [segmentId]: {dx, dy, theta} }
const isDirty = ref(false);
const deletedIdMap = reactive({}); // { [segmentId]: true }

/** 场地左上角（世界坐标），固定为 (10,10) */
const siteOrigin = reactive({ x: SITE_TOP_LEFT.x, y: SITE_TOP_LEFT.y });

/** ===== 交互状态 ===== */
const mode = ref('none'); // 'none' | 'move' | 'rotate'
const activeTaskId = ref(null); // 实际存的是 segmentId
const activeTaskRef = ref(null); // 当前选中的任务引用，避免拖拽中频繁 find

const dragStartWorld = reactive({ x: 0, y: 0 });
const dragStartTfx = reactive({ dx: 0, dy: 0, theta: 0 });
const rotateAnchor = reactive({ x: 0, y: 0 });

/** 拖动时用 requestAnimationFrame 节流 */
let dragFramePending = false;
let pendingWorldPoint = null;

/**
 * 一次拖拽过程中，记录“起始就重叠”的分段 id 集合，
 * 拖动时对这些 id 不做碰撞拦截，让叠在一起的块可以被顺利拖出来。
 */
let dragIgnoreIds = new Set();

/** ===== 初始化/载入 ===== */
function pickPoints(obj) {
  if (!obj) return [];
  if (Array.isArray(obj.points)) return obj.points;
  return [];
}

/** 计算多边形包围盒 */
function getPolyBounds(poly) {
  if (!poly || !poly.length) return null;
  let minX = poly[0].x;
  let maxX = poly[0].x;
  let minY = poly[0].y;
  let maxY = poly[0].y;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

/** 包围盒是否有重叠（快速剪枝用） */
function bboxOverlap(b1, b2) {
  if (!b1 || !b2) return false;
  return !(
    b1.maxX < b2.minX ||
    b2.maxX < b1.minX ||
    b1.maxY < b2.minY ||
    b2.maxY < b1.minY
  );
}

/** 外层包围盒是否完全包含内层（场地包含任务的快速检查） */
function bboxContains(outer, inner) {
  if (!outer || !inner) return false;
  return (
    inner.minX >= outer.minX &&
    inner.maxX <= outer.maxX &&
    inner.minY >= outer.minY &&
    inner.maxY <= outer.maxY
  );
}

/** 判断 candidate 是否与 existingTasks（用 basePoints）相交 */
function overlapsExisting(candidate, existingTasks) {
  for (const t of existingTasks) {
    if (!t.basePoints?.length) continue;
    if (polygonsIntersect(candidate, t.basePoints)) return true;
  }
  return false;
}

function pointsSignature(pts = []) {
  return (pts || [])
    .map((p) => `${+p.x},${+p.y}`)
    .sort()
    .join('|');
}
function isDuplicateCandidate(segmentId, segmentName, pts) {
  if (segmentId && tasks.some((t) => String(t.segmentId) === String(segmentId))) return true;
  const sign = `${segmentName || ''}__${pointsSignature(pts)}`;
  return tasks.some(
    (t) => `${t.segmentName || ''}__${pointsSignature(t.basePoints || [])}` === sign,
  );
}
function normalizeExternalTask(task = {}) {
  const pts = Array.isArray(task.points) ? task.points : [];
  return {
    segmentId: task.segmentId ?? task.id ?? task.segmentCode ?? task.segmentNo ?? Date.now(),
    segmentName: task.segmentName || task.name || task.segmentNo || `任务${tasks.length + 1}`,
    segmentCode: task.segmentCode || task.segmentNo || '',
    status: task.status ?? 0,
    // 外部拖拽任务这里仍默认 points 是世界坐标
    points: pts.map((p) => ({ x: +p.x, y: +p.y })),
    pointsAreWorld: true,
    projectNumber: task.projectNumber,
  };
}
function canAcceptExternalTask(rawTask) {
  if (!rawTask) return { ok: false, message: '拖拽数据无效' };
  const normalized = normalizeExternalTask(rawTask);
  if (!normalized.points.length) return { ok: false, message: '任务没有有效图形' };
  if (isDuplicateCandidate(normalized.segmentId, normalized.segmentName, normalized.points)) {
    return { ok: false, message: '该任务已存在，禁止重复添加' };
  }
  return { ok: true, task: normalized };
}

/**
 * 给“新拖进来的任务”找一个合适位置：
 * - 完全在 site 内
 * - 不与 existingTasks 重叠
 * 找不到就用原始位置
 */
function findNonOverlappingPlacement(basePoints, sitePoly, existingTasks) {
  if (!basePoints?.length || !sitePoly?.length) return basePoints;

  const siteBounds = getPolyBounds(sitePoly);
  const taskBounds = getPolyBounds(basePoints);
  if (!siteBounds || !taskBounds) return basePoints;

  const step = gridUnitM.value || 1; // 按网格步长扫描
  const padding = step; // 离边界留一点空隙

  const startX = siteBounds.minX + padding;
  const startY = siteBounds.minY + padding;
  const endX = siteBounds.maxX - taskBounds.width - padding;
  const endY = siteBounds.maxY - taskBounds.height - padding;

  // 简单行扫描：从左上到右下一格一格试
  for (let y = startY; y <= endY; y += step) {
    for (let x = startX; x <= endX; x += step) {
      const dx = x - taskBounds.minX;
      const dy = y - taskBounds.minY;
      const candidate = translatePoly(basePoints, { x: dx, y: dy });

      if (!polyInside(candidate, sitePoly)) continue;
      if (overlapsExisting(candidate, existingTasks)) continue;

      // 找到一个合适的位置
      return candidate;
    }
  }

  // 实在找不到就保持原位置
  return basePoints;
}

/**
 * 载入 props.data：
 * - site.points：接口给的是场地自身形状坐标（不要求从 0,0 开始）
 *   => 我们把它整体平移，使包围盒左上角变为 (10,10)
 * - tasks[*].points：接口给的是【相对场地左上角】的坐标
 *   => 画布上用 世界坐标 = 相对坐标 + (10,10)
 */
function loadFromProps(d) {
  // 元信息
  date.value = d?.date || '';
  const siteSettings = d?.site?.settings || {};
  gridUnitM.value = Number(siteSettings.gridUnitM ?? 1) || 1;
  pxPerM.value = Number(siteSettings.pxPerM ?? 10) || 10;
  unit.value = 'm';

  // ===== 1. 场地：平移到以 (10,10) 为包围盒左上角 =====
  const rawSitePts = pickPoints(d?.site).map((p) => ({ x: +p.x, y: +p.y }));
  const rawBounds = getPolyBounds(rawSitePts);

  if (rawBounds) {
    const offX = SITE_TOP_LEFT.x - rawBounds.minX;
    const offY = SITE_TOP_LEFT.y - rawBounds.minY;

    site.points = rawSitePts.map((p) => ({
      x: p.x + offX,
      y: p.y + offY,
    }));

    // 场地左上角世界坐标固定为 (10,10)
    siteOrigin.x = SITE_TOP_LEFT.x;
    siteOrigin.y = SITE_TOP_LEFT.y;
  } else {
    site.points = [];
    siteOrigin.x = SITE_TOP_LEFT.x;
    siteOrigin.y = SITE_TOP_LEFT.y;
  }

  // ===== 2. 任务：接口返回的是【相对场地左上角】的坐标 =====
  tasks.splice(0, tasks.length);

  for (let i = 0; i < (d?.tasks?.length || 0); i++) {
    const t = d.tasks[i];
    const ptsRaw = pickPoints(t);
    const segId = t.segmentId;
    if (segId == null) continue;

    // 被本地删除过的，不再渲染
    if (deletedIdMap[segId]) continue;

    // 相对坐标
    const relPoints = ptsRaw.map((p) => ({ x: +p.x, y: +p.y }));

    // ★ 转成世界坐标：相对 + 场地左上角
    let basePoints = relPoints.map((p) => ({
      x: p.x + siteOrigin.x,
      y: p.y + siteOrigin.y,
    }));

    const isNewTask = !t.id; // 没有 id 的，认为是新拖进来的任务

    if (isNewTask && site.points.length) {
      // 传入当前已经放好的任务（tasks 此时是之前 push 的任务）
      basePoints = findNonOverlappingPlacement(basePoints, site.points, tasks);
    }

    tasks.push({
      id: t.id, // 旧数据才有，新拖进来的为 undefined
      segmentId: segId,
      segmentName: t.segmentName || t.name,
      segmentCode: t.segmentCode || t.code,
      basePoints,
      status: t.status,
      projectNumber: t.projectNumber,
    });

    // 重置变换（key 用 segmentId）
    tfx[segId] = { dx: 0, dy: 0, theta: 0 };
  }

  setupHiDPICanvas();
  scheduleRedraw();
}

watch(
  () => props.data,
  (nv) => loadFromProps(nv),
  {
    immediate: true,
    deep: true,
    // 确保在 DOM 更新后再执行，避免初次挂载时 canvas 还没准备好
    flush: 'post',
  },
);

/** ===== 几何/工具 ===== */
function worldToScreen(pt) {
  return { x: pt.x * pxPerM.value, y: pt.y * pxPerM.value };
}
function screenToWorld(sp) {
  return { x: sp.x / pxPerM.value, y: sp.y / pxPerM.value };
}

function translatePoly(poly, off) {
  return poly.map((p) => ({ x: p.x + off.x, y: p.y + off.y }));
}
function rotatePoly(poly, center, theta) {
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  return poly.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * c - dy * s,
      y: center.y + dx * s + dy * c,
    };
  });
}
function applyTfx(poly, tf) {
  const cen = centroid(poly);
  const r = tf?.theta ? rotatePoly(poly, cen, tf.theta) : poly;
  const t = tf ? translatePoly(r, { x: tf.dx || 0, y: tf.dy || 0 }) : r;
  return t;
}
function centroid(pts) {
  if (!pts.length) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
}

// —— 点在多边形内（含边界）——
const EPS = 1e-9;
function pointInPolygon(pt, poly) {
  if (!poly?.length) return false;

  // 1）在任意一条边上
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j];
    const b = poly[i];
    if (onSeg(a, b, pt)) {
      return true;
    }
  }

  // 2）射线法
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

/** 先用包围盒做一次快速判断，再用 pointInPolygon 精确检查 */
function polyInside(poly, container) {
  if (!poly?.length || !container?.length) return false;
  const inner = getPolyBounds(poly);
  const outer = getPolyBounds(container);
  if (!inner || !outer) return false;
  // 包围盒都出界了，直接判定为 false
  if (!bboxContains(outer, inner)) return false;
  // 再逐点射线法，保证精度
  return poly.every((p) => pointInPolygon(p, container));
}

/** 线段相交判定（含共线重合） */
function cross(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function onSeg(a, b, p) {
  return (
    Math.abs(cross(a, b, p)) < EPS &&
    Math.min(a.x, b.x) - EPS <= p.x &&
    p.x <= Math.max(a.x, b.x) + EPS &&
    Math.min(a.y, b.y) - EPS <= p.y &&
    p.y <= Math.max(a.y, b.y) + EPS
  );
}
function segIntersect(a, b, c, d) {
  const c1 = cross(a, b, c);
  const c2 = cross(a, b, d);
  const c3 = cross(c, d, a);
  const c4 = cross(c, d, b);
  if (
    ((c1 > EPS && c2 < -EPS) || (c1 < -EPS && c2 > EPS)) &&
    ((c3 > EPS && c4 < -EPS) || (c3 < -EPS && c4 > EPS))
  )
    return true;
  if (onSeg(a, b, c) || onSeg(a, b, d) || onSeg(c, d, a) || onSeg(c, d, b)) return true;
  return false;
}

/** 多边形相交（边相交或包含）——修正了原来 polyB 取下一点时的下标 bug */
function polygonsIntersect(polyA, polyB) {
  if (!polyA?.length || !polyB?.length) return false;
  // 边-边相交
  for (let i = 0; i < polyA.length; i++) {
    const a1 = polyA[i];
    const a2 = polyA[(i + 1) % polyA.length];
    for (let j = 0; j < polyB.length; j++) {
      const b1 = polyB[j];
      const b2 = polyB[(j + 1) % polyB.length]; // 这里原来错误写成了 (i + 1)
      if (segIntersect(a1, a2, b1, b2)) return true;
    }
  }
  // 包含关系
  if (pointInPolygon(polyA[0], polyB)) return true;
  if (pointInPolygon(polyB[0], polyA)) return true;
  return false;
}

/** 计算任务在当前 tfx 下的实际多边形（用 segmentId） */
function movedPolyById(segmentId) {
  const t = tasks.find((x) => x.segmentId === segmentId);
  if (!t) return [];
  const tf = tfx[segmentId] || { dx: 0, dy: 0, theta: 0 };
  return applyTfx(t.basePoints, tf);
}

/** 候选多边形与其他任务是否相交 —— 加包围盒剪枝，减少多边形相交次数 */
function intersectsOthers(selfSegmentId, candidatePoly) {
  if (!candidatePoly?.length) return false;
  const candBounds = getPolyBounds(candidatePoly);
  if (!candBounds) return false;

  for (const t of tasks) {
    if (t.segmentId === selfSegmentId) continue;
    const other = movedPolyById(t.segmentId);
    if (!other.length) continue;

    const otherBounds = getPolyBounds(other);
    if (!bboxOverlap(candBounds, otherBounds)) continue;

    if (polygonsIntersect(candidatePoly, other)) return true;
  }
  return false;
}

/**
 * 拖拽专用的相交判断：
 * - 忽略 dragIgnoreIds 中记录的那些“起始就和我重叠”的分段
 */
function intersectsOthersForDrag(selfSegmentId, candidatePoly) {
  if (!candidatePoly?.length) return false;
  const candBounds = getPolyBounds(candidatePoly);
  if (!candBounds) return false;

  for (const t of tasks) {
    if (t.segmentId === selfSegmentId) continue;
    if (dragIgnoreIds.has(t.segmentId)) continue; // ⭐ 忽略起始就重叠的
    const other = movedPolyById(t.segmentId);
    if (!other.length) continue;

    const otherBounds = getPolyBounds(other);
    if (!bboxOverlap(candBounds, otherBounds)) continue;

    if (polygonsIntersect(candidatePoly, other)) return true;
  }
  return false;
}

/**
 * 计算当前选中任务，在拖拽起始时和哪些任务重叠，
 * 结果写入 dragIgnoreIds
 */
function computeDragIgnore(segId) {
  dragIgnoreIds.clear();
  const selfPoly = movedPolyById(segId);
  if (!selfPoly.length) return;

  for (const t of tasks) {
    if (t.segmentId === segId) continue;
    const other = movedPolyById(t.segmentId);
    if (!other.length) continue;
    if (polygonsIntersect(selfPoly, other)) {
      dragIgnoreIds.add(t.segmentId);
    }
  }
}

/** ===== 交互 ===== */
function hitTaskId(worldPt) {
  // 从上往下找，返回 segmentId
  for (let i = tasks.length - 1; i >= 0; i--) {
    const t = tasks[i];
    const moved = movedPolyById(t.segmentId);
    if (pointInPolygon(worldPt, moved)) return t.segmentId;
  }
  return null;
}
function toScreen(e) {
  const rect = canvasRef.value.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/** 在某个世界坐标 w 点下，应用拖动/旋转逻辑（节流后调用） */
function applyDragAtWorldPoint(w) {
  if (!activeTaskId.value || !activeTaskRef.value) return;
  const segId = activeTaskId.value;
  const baseTask = activeTaskRef.value;
  const base = baseTask.basePoints;
  const startTF = {
    dx: dragStartTfx.dx,
    dy: dragStartTfx.dy,
    theta: dragStartTfx.theta,
  };

  let candTF;
  if (mode.value === 'move') {
    const dx = w.x - dragStartWorld.x;
    const dy = w.y - dragStartWorld.y;
    candTF = { dx: startTF.dx + dx, dy: startTF.dy + dy, theta: startTF.theta };
  } else if (mode.value === 'rotate') {
    const a0 = Math.atan2(
      dragStartWorld.y - rotateAnchor.y,
      dragStartWorld.x - rotateAnchor.x,
    );
    const a1 = Math.atan2(w.y - rotateAnchor.y, w.x - rotateAnchor.x);
    const d = a1 - a0;
    candTF = { dx: startTF.dx, dy: startTF.dy, theta: startTF.theta + d };
  } else {
    return;
  }

  const moved = applyTfx(base, candTF);

  // 场地包含 + 碰撞检测判断是否合法（拖拽时用“忽略起始重叠”的版本）
  if (polyInside(moved, site.points) && !intersectsOthersForDrag(segId, moved)) {
    tfx[segId] = candTF;
    isDirty.value = true;
    scheduleRedraw();
  }
}

function onMouseDown(e) {
  const sp = toScreen(e);
  const w = screenToWorld(sp);

  const segId = hitTaskId(w);
  if (segId == null) {
    activeTaskId.value = null;
    activeTaskRef.value = null;
    dragIgnoreIds.clear();
    mode.value = 'none';
    scheduleRedraw();
    return;
  }
  activeTaskId.value = segId;
  activeTaskRef.value = tasks.find((x) => x.segmentId === segId) || null;

  const moved = movedPolyById(segId);
  const cen = centroid(moved);
  rotateAnchor.x = cen.x;
  rotateAnchor.y = cen.y;

  const tf = tfx[segId] || { dx: 0, dy: 0, theta: 0 };
  dragStartWorld.x = w.x;
  dragStartWorld.y = w.y;
  dragStartTfx.dx = tf.dx;
  dragStartTfx.dy = tf.dy;
  dragStartTfx.theta = tf.theta;

  // 计算一次“起始重叠”的分段集合
  computeDragIgnore(segId);

  mode.value = e.altKey ? 'rotate' : 'move';
  window.addEventListener('mouseup', onMouseUp, { once: true });
  scheduleRedraw();
}

function onMouseMove(e) {
  if (mode.value === 'none' || !activeTaskId.value || !activeTaskRef.value) return;
  e.preventDefault();

  const sp = toScreen(e);
  const w = screenToWorld(sp);

  // 记录“最后一次”的世界坐标
  pendingWorldPoint = w;

  if (!dragFramePending) {
    dragFramePending = true;
    requestAnimationFrame(() => {
      dragFramePending = false;

      if (
        !pendingWorldPoint ||
        mode.value === 'none' ||
        !activeTaskId.value ||
        !activeTaskRef.value
      ) {
        return;
      }

      applyDragAtWorldPoint(pendingWorldPoint);
      // 用完就丢弃，下一帧重新赋值
      pendingWorldPoint = null;
    });
  }
}

function onMouseUp() {
  mode.value = 'none';
  pendingWorldPoint = null;
  dragFramePending = false;
  dragIgnoreIds.clear();
}
function onMouseLeave() {
  mode.value = 'none';
  pendingWorldPoint = null;
  dragFramePending = false;
  dragIgnoreIds.clear();
}

/** ===== 删除 / 保存 ===== */
function buildClonedFromLocal() {
  const cloned = JSON.parse(JSON.stringify(props.data || {}));

  cloned.tasks = tasks.map((refTask) => {
    const segId = refTask.segmentId;
    const tf = tfx[segId] || { dx: 0, dy: 0, theta: 0 };

    // 世界坐标（已经包含拖动/旋转）
    const worldPts = applyTfx(refTask.basePoints, tf).map((p) => ({
      x: +p.x,
      y: +p.y,
    }));

    // ★ 保存时转换为【相对场地左上角】的坐标：world - siteOrigin
    const relativePts = worldPts.map((p) => ({
      x: p.x - siteOrigin.x,
      y: p.y - siteOrigin.y,
    }));

    return {
      id: refTask.id, // 旧数据有，新拖进来的没有
      segmentId: refTask.segmentId,
      segmentName: refTask.segmentName,
      segmentCode: refTask.segmentCode,
      status: refTask.status,
      points: relativePts,
      projectNumber: refTask.projectNumber,
    };
  });

  return cloned;
}

function onDelete() {
  if (!activeTaskId.value) return;
  const segId = activeTaskId.value;

  const idx = tasks.findIndex((t) => t.segmentId === segId);
  if (idx >= 0) tasks.splice(idx, 1);

  delete tfx[segId];
  activeTaskId.value = null;
  activeTaskRef.value = null;
  deletedIdMap[segId] = true;
  isDirty.value = true;
  scheduleRedraw();
}

function restoreDeletedSegment(segmentId) {
  if (!segmentId) return;
  delete deletedIdMap[segmentId];
}

function onSave() {
  const payload = buildClonedFromLocal();
  for (const k in deletedIdMap) {
    delete deletedIdMap[k];
  }
  isDirty.value = false;

  const segmentTasks = (payload.tasks || []).map((element) => {
    return {
      // ★ 接口只认相对坐标，这里已经是相对 site 左上角的点
      points: JSON.stringify(element.points),
      remark: '',
      segmentCode: element.segmentCode,
      segmentId: element.segmentId,
      segmentName: element.segmentName,
      siteId: props.siteId,
      status: element.status,
      id: element.id ? element.id : undefined,
      projectNumber: element.projectNumber,
    };
  });

  const data = [
    {
      segmentTasks,
      taskDate: new Date(payload.date).getTime(),
    },
  ];

  console.log('保存 payload(画布布局)：', payload);
  console.log('保存 data(接口参数)：', data);

  emit('save', data);
}

function pre() {
  emit('pre');
}
function next() {
  emit('next');
}
function closePanel() {
  emit('close');
}

/** ===== 对外暴露 ===== */
function getLocalTaskIds() {
  // 用 segmentId 做唯一校验
  return tasks.map((t) => t.segmentId);
}
function getLocalData() {
  return buildClonedFromLocal();
}
defineExpose({
  getLocalTaskIds,
  getLocalData,
  canAcceptExternalTask,
  restoreDeletedSegment,
});

/** ===== 绘制 ===== */
function setupHiDPICanvas() {
  const canvas = canvasRef.value;
  const wrap = wrapRef.value;
  if (!canvas || !wrap) return;

  const rect = wrap.getBoundingClientRect();
  const viewW = Math.max(1, Math.floor(rect.width));
  const viewH = Math.max(1, Math.floor(rect.height));

  let maxX = 0;
  let maxY = 0;

  const updateBounds = (pts) => {
    if (!pts || !pts.length) return;
    for (const p of pts) {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  };

  updateBounds(site.points);
  for (const t of tasks) {
    const tf = tfx[t.segmentId] || { dx: 0, dy: 0, theta: 0 };
    const moved = applyTfx(t.basePoints, tf);
    updateBounds(moved.length ? moved : t.basePoints);
  }

  const PADDING_M = gridUnitM.value * 2;
  const neededW = (maxX + PADDING_M) * pxPerM.value;
  const neededH = (maxY + PADDING_M) * pxPerM.value;

  canvasW.value = Math.max(viewW, Math.floor(neededW) || 1);
  canvasH.value = Math.max(viewH, Math.floor(neededH) || 1);

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
  const c = ctx.value;
  if (!c) return;
  c.save();
  c.setTransform(dpr.value, 0, 0, dpr.value, 0, 0);
  c.clearRect(0, 0, canvasW.value, canvasH.value);
  c.restore();
}
function drawGrid() {
  const c = ctx.value;
  if (!c) return;
  clearAll();

  c.save();
  c.fillStyle = colors.bg;
  c.fillRect(0, 0, canvasW.value, canvasH.value);
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

  const labelFontPx = 10;
  c.save();
  c.fillStyle = colors.text;
  c.font = `${labelFontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  for (let x = 0; x <= canvasW.value; x += coarse) {
    const v = x / pxPerM.value;
    const isZero = Math.abs(v) < 1e-6;
    const text = isZero ? `0 ${unit.value}` : String(Math.round(v));
    c.fillText(text, x + 4, labelFontPx + 1);
  }
  for (let y = 0; y <= canvasH.value; y += coarse) {
    const v = y / pxPerM.value;
    const isZero = Math.abs(v) < 1e-6;
    const text = isZero ? `0 ${unit.value}` : String(Math.round(v));
    c.fillText(text, 4, Math.max(labelFontPx + 1, y - 4));
  }
  c.restore();
}

/** 多边形填充 */
function fillPolygon(poly, fill) {
  const c = ctx.value;
  if (!c || !poly.length) return;
  c.save();
  c.beginPath();
  for (let i = 0; i < poly.length; i++) {
    const sp = worldToScreen(poly[i]);
    if (i === 0) c.moveTo(sp.x, sp.y);
    else c.lineTo(sp.x, sp.y);
  }
  c.closePath();
  c.globalAlpha = 0.85;
  c.fillStyle = fill;
  c.fill();
  c.globalAlpha = 1;
  c.restore();
}

/** 多边形描边（高亮选中用） */
function strokePolygon(poly, stroke, lineWidth = 2, dash = []) {
  const c = ctx.value;
  if (!c || !poly.length) return;
  c.save();
  c.beginPath();
  for (let i = 0; i < poly.length; i++) {
    const sp = worldToScreen(poly[i]);
    if (i === 0) c.moveTo(sp.x, sp.y);
    else c.lineTo(sp.x, sp.y);
  }
  c.closePath();
  c.setLineDash(dash);
  c.lineWidth = lineWidth;
  c.strokeStyle = stroke;
  c.stroke();
  c.restore();
}

/** 白色描边文字 */
function drawLabel(text, worldPt) {
  const c = ctx.value;
  if (!c || !text) return;
  const sp = worldToScreen(worldPt);
  c.save();
  const fontPx = 12;
  c.font = `${fontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  c.lineWidth = 3 / dpr.value;
  c.strokeStyle = '#ffffff';
  c.strokeText(text, sp.x, sp.y);
  c.fillStyle = '#111827';
  c.fillText(text, sp.x, sp.y);
  c.restore();
}

/** 选中任务的顶点提示 */
function drawVertices(poly, color) {
  const c = ctx.value;
  if (!c || !poly.length) return;
  const r = Math.max(2.5, 4 / dpr.value);
  c.save();
  c.lineWidth = 2 / dpr.value;
  for (const p of poly) {
    const sp = worldToScreen(p);
    c.beginPath();
    c.arc(sp.x, sp.y, r, 0, Math.PI * 2);
    c.fillStyle = '#ffffff';
    c.fill();
    c.strokeStyle = color || '#111827';
    c.stroke();
  }
  c.restore();
}

function redraw() {
  const c = ctx.value;
  if (!c) return;
  drawGrid();

  // 场地
  fillPolygon(site.points, colors.siteFill);

  // 任务（这里直接用 t.basePoints + tfx，避免在循环里再调 movedPolyById 做一次 tasks.find）
  for (const t of tasks) {
    const tf = tfx[t.segmentId] || { dx: 0, dy: 0, theta: 0 };
    const moved = applyTfx(t.basePoints, tf);
    const cfg = (props.statusColorMap && props.statusColorMap[t.status]) || {};
    const fill = cfg.fill || colors.taskFillFallback;

    fillPolygon(moved, fill);

    const cen = centroid(moved);
    drawLabel(t.segmentName, cen);

    const isActive = activeTaskId.value === t.segmentId;
    if (isActive) {
      const strokeColor = 'rgba(37,99,235,0.95)';
      strokePolygon(moved, strokeColor, 3 / dpr.value, [8, 4]);
      drawVertices(moved, strokeColor);
    }
  }
}

/** ===== 生命周期 ===== */
function handleResize() {
  setupHiDPICanvas();
  scheduleRedraw();
}

function handleKeyDown(e) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && activeTaskId.value) {
    e.preventDefault();
    onDelete();
  }
}

onMounted(() => {
  setupHiDPICanvas();
  ro = new ResizeObserver(() => handleResize());
  if (wrapRef.value) {
    ro.observe(wrapRef.value);
  }
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
  // 确保初次挂载有一帧绘制
  scheduleRedraw();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown);
  if (ro) ro.disconnect();
});
</script>

<style scoped>
.preview-wrap {
  height: 100%;
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.topbar {
  padding: 10px 12px;
}
.topbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.meta-row,
.actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.meta {
  font-size: 12px;
  color: #334155;
}
.actions-row .el-button {
  min-width: 76px;
}

/* 父容器滚动 */
.canvas-wrap-set {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  background: #fff;
  border: 1px solid #dedede;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: auto;
}

canvas {
  display: block;
  cursor: default;
  border-right: 1px solid #dedede;
  border-bottom: 1px solid #dedede;
}
</style>
