<template>
  <div ref="pageRef" class="h-full w-full overflow-auto bg-zinc-50 text-foreground">
    <div
      ref="editorCardRef"
      tabindex="0"
      class="flex h-full flex-col gap-3 p-4 outline-none focus-visible:outline-none"
      @keydown.capture="onKeyDown"
      @keyup.capture="onKeyUp"
    >
      <!-- Settings Strip -->
      <div class="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
        <!-- Grid settings group -->
        <div class="flex h-8 items-center rounded-lg border border-zinc-200 bg-zinc-50/80 px-2">
          <svg viewBox="0 0 24 24" class="mr-2 h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18" /><path d="M8 17V9" /><path d="M13 17V5" /><path d="M18 17v-3" /></svg>
          <label class="flex items-center gap-1.5">
            <span class="text-[10px] text-zinc-400">栅格</span>
            <input type="number" min="0.01" step="0.01" v-model.number="gridUnitM" class="h-5 w-12 rounded border-0 bg-white px-1.5 text-center text-[11px] font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
          </label>
          <span class="mx-2 h-3.5 w-px bg-zinc-200"></span>
          <label class="flex items-center gap-1.5">
            <span class="text-[10px] text-zinc-400">缩放</span>
            <input type="number" min="10" step="10" v-model.number="pxPerM" @change="redraw" class="h-5 w-12 rounded border-0 bg-white px-1.5 text-center text-[11px] font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
          </label>
          <span class="mx-2 h-3.5 w-px bg-zinc-200"></span>
          <label class="flex items-center gap-1.5">
            <span class="text-[10px] text-zinc-400">吸附</span>
            <input type="number" min="0" step="0.01" v-model.number="snapM" @change="redraw" class="h-5 w-12 rounded border-0 bg-white px-1.5 text-center text-[11px] font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
          </label>
        </div>

        <!-- Transform group -->
        <div class="flex h-8 items-center rounded-lg border border-zinc-200 bg-zinc-50/80 px-1">
          <button class="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900 hover:shadow-sm active:scale-95" @click="applyRotate(-10)">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-8-8" /><path d="M12 4v4H8" /></svg>
            -10°
          </button>
          <button class="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900 hover:shadow-sm active:scale-95" @click="applyRotate(10)">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 8-8" /><path d="M12 4v4h4" /></svg>
            +10°
          </button>
          <span class="mx-0.5 h-4 w-px bg-zinc-200"></span>
          <button class="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-600 transition hover:bg-white hover:text-zinc-900 hover:shadow-sm active:scale-95" @click="applyScale(1 / 1.1)">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><circle cx="12" cy="12" r="9" /></svg>
          </button>
          <button class="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-600 transition hover:bg-white hover:text-zinc-900 hover:shadow-sm active:scale-95" @click="applyScale(1.1)">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /><circle cx="12" cy="12" r="9" /></svg>
          </button>
        </div>

        <!-- Add point group -->
        <div class="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2">
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 5v2" /><path d="M12 17v2" /><path d="M5 12h2" /><path d="M17 12h2" /></svg>
          <div class="relative">
            <span class="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-medium text-zinc-400">X</span>
            <input type="number" step="0.01" v-model.number="newPoint.x" @keydown.stop :min="0" class="h-5 w-14 rounded border-0 bg-white pl-4 pr-1 text-right text-[11px] font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
          </div>
          <div class="relative">
            <span class="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-medium text-zinc-400">Y</span>
            <input type="number" step="0.01" v-model.number="newPoint.y" @keydown.stop :min="0" class="h-5 w-14 rounded border-0 bg-white pl-4 pr-1 text-right text-[11px] font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
          </div>
          <button class="inline-flex h-5 items-center gap-1 rounded bg-zinc-900 px-2 text-[10px] font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-95" @click="addPointAtEnd(newPoint.x, newPoint.y)">
            <svg viewBox="0 0 24 24" class="h-2.5 w-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            新增
          </button>
        </div>

        <div class="ml-auto flex items-center gap-1.5">
          <div class="flex h-8 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-1">
            <button class="inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900 hover:shadow-sm" @click="toggleFullscreen">
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4" /></svg>
              {{ isFullscreen ? '退出专注' : '专注视图' }}
            </button>
            <span class="mx-0.5 h-4 w-px bg-zinc-200"></span>
            <button class="inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900 hover:shadow-sm" :class="{ 'opacity-40 pointer-events-none': points.length < 3 || isClosed }" :disabled="points.length < 3 || isClosed" @click="closePolygon">
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="5,3 19,3 19,21 5,21" /><polygon points="8,7 16,7 16,17 8,17" /></svg>
              闭合
            </button>
            <span class="mx-0.5 h-4 w-px bg-zinc-200"></span>
            <button class="inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600" @click="reset">
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M9 7l1-2h4l1 2" /><rect x="6" y="7" width="12" height="13" rx="2" /></svg>
              清空
            </button>
          </div>
          <button class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-[11px] font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-95" @click="handleSave">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h11l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><path d="M7 5v6h8" /><path d="M7 19v-6h10v6" /></svg>
            保存
          </button>
        </div>
      </div>

      <!-- Canvas + Point List -->
      <section class="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="relative flex min-h-0 flex-1 flex-col">
          <div class="relative flex-1 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
            <div ref="wrapRef" class="relative h-full w-full" @contextmenu.prevent>
              <canvas
                ref="canvasRef"
                class="block h-full w-full"
                @mousedown="onMouseDown"
                @click="onClick"
                @dblclick="closePolygon"
                @mousemove="onMove"
                @mouseleave="onMouseLeave"
              ></canvas>

              <div
                v-if="overlayHint"
                class="pointer-events-none absolute left-4 top-4 rounded-full bg-zinc-800/70 px-3 py-1 text-xs text-zinc-200 shadow ring-1 ring-white/[0.06]"
              >
                {{ overlayHint }}
              </div>

              <!-- Status & toggle overlay -->
              <div class="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-zinc-800/70 px-3 py-1.5 text-[11px] text-zinc-300 ring-1 ring-white/[0.06]">
                <span class="font-medium text-white">{{ points.length }}</span> 点
                <span
                  class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  :class="isClosed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-600/40 text-zinc-400'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="isClosed ? 'bg-emerald-400' : 'bg-zinc-500'"></span>
                  {{ isClosed ? '已闭合' : '未闭合' }}
                </span>
                <span class="h-3 w-px bg-zinc-600"></span>
                <label class="pointer-events-auto flex cursor-pointer items-center gap-1">
                  <input type="checkbox" v-model="showEdgeLabels" class="h-3 w-3 accent-sky-400" />
                  <span>边长</span>
                </label>
                <label class="pointer-events-auto flex cursor-pointer items-center gap-1">
                  <input type="checkbox" v-model="showAngleLabels" class="h-3 w-3 accent-sky-400" />
                  <span>角度</span>
                </label>
                <label class="pointer-events-auto flex cursor-pointer items-center gap-1">
                  <input type="checkbox" v-model="showPivot" class="h-3 w-3 accent-sky-400" />
                  <span>中心点</span>
                </label>
                <label class="pointer-events-auto flex cursor-pointer items-center gap-1">
                  <input type="checkbox" v-model="linkScaleOnGridChange" class="h-3 w-3 accent-sky-400" />
                  <span>联动缩放</span>
                </label>
              </div>

              <div class="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5 text-[11px] text-zinc-400" style="max-width: calc(100% - 24px)">
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  <span class="flex h-5 w-5 items-center justify-center rounded bg-zinc-700/60 ring-1 ring-white/[0.08]">
                    <svg viewBox="0 0 24 24" class="h-3 w-3 text-zinc-100" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="5" /><path d="M12 7v4" /></svg>
                  </span>
                  单击加点
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  拖动平移
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  <kbd class="rounded bg-zinc-700/60 px-1 py-px text-[9px] font-semibold text-zinc-100 ring-1 ring-white/[0.08]">Alt</kbd>
                  旋转
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  <kbd class="rounded bg-zinc-700/60 px-1 py-px text-[9px] font-semibold text-zinc-100 ring-1 ring-white/[0.08]">Ctrl/⌘</kbd>
                  缩放
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  <kbd class="rounded bg-zinc-700/60 px-1 py-px text-[9px] font-semibold text-zinc-100 ring-1 ring-white/[0.08]">Shift</kbd>
                  禁吸附
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  <kbd class="rounded bg-zinc-700/60 px-1 py-px text-[9px] font-semibold text-zinc-100 ring-1 ring-white/[0.08]">双击</kbd>
                  闭合
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  <kbd class="rounded bg-zinc-700/60 px-1 py-px text-[9px] font-semibold text-zinc-100 ring-1 ring-white/[0.08]">右键</kbd>
                  撤销
                </div>
                <div class="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 ring-1 ring-white/[0.05]">
                  <kbd class="rounded bg-zinc-700/60 px-1 py-px text-[9px] font-semibold text-zinc-100 ring-1 ring-white/[0.08]">Del</kbd>
                  删除
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Point List -->
        <aside class="flex min-h-0 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm lg:overflow-hidden">
          <div class="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
            <svg viewBox="0 0 24 24" class="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h6" /></svg>
            <span class="text-sm font-medium text-zinc-900">点列表</span>
          </div>
          <div class="flex-1 overflow-y-auto p-3">
            <div v-if="!points.length" class="py-8 text-center text-sm text-zinc-400">暂无点位</div>
            <div class="flex flex-col gap-2">
              <div
                v-for="(p, i) in points"
                :key="i"
                class="rounded-lg border px-3 py-2.5 transition"
                :class="
                  i === selectedIndex
                    ? 'border-emerald-500/60 bg-emerald-50'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                "
              >
                <div class="flex items-center justify-between">
                  <button type="button" class="text-sm font-semibold text-zinc-700" @click="selectedIndex = i">
                    #{{ i + 1 }}
                  </button>
                  <Button
                    variant="outline"
                    size="icon"
                    class="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                    @click="deletePoint(i)"
                  >
                    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M9 7l1-2h4l1 2" /><rect x="6" y="7" width="12" height="13" rx="2" /></svg>
                  </Button>
                </div>

                <div class="mt-2 grid grid-cols-2 gap-2" @click="selectedIndex = i">
                  <label class="flex flex-col gap-1 text-[11px] text-zinc-500">
                    <span>X</span>
                    <input type="number" step="0.01" v-model.number="points[i].x" @input="onPointInput(i)" @keydown.stop class="h-7 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                  </label>
                  <label class="flex flex-col gap-1 text-[11px] text-zinc-500">
                    <span>Y</span>
                    <input type="number" step="0.01" v-model.number="points[i].y" @input="onPointInput(i)" @keydown.stop class="h-7 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                  </label>
                </div>

                <div v-if="edgeLengths[i] !== undefined" class="mt-2 text-[11px] text-zinc-500">
                  <div class="flex items-center justify-between">
                    <span>长度</span>
                    <span class="text-zinc-700">{{ edgeLengths[i].toFixed(2) }} m</span>
                  </div>
                  <div v-if="showAngleLabels && vertexAngles[i] !== undefined" class="mt-0.5 flex items-center justify-between">
                    <span>角度</span>
                    <span class="text-zinc-700">{{ vertexAngles[i].toFixed(2) }}°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  </div>
</template>

<script setup>
import { Button } from '@/components/ui';
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

/** ===== 全屏 ===== */
const isFullscreen = ref(false);
const pageRef = ref(null);

function toggleFullscreen() {
  const el = pageRef.value;
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen().then(() => {
      isFullscreen.value = true;
      scheduleResize();
      nextTick(() => focusEditor());
    });
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
      scheduleResize();
    });
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  scheduleResize();
}

/** ===== 颜色变量（统一管理） ===== */
const colors = reactive({
  bgTop: '#1c1f24',
  bgBottom: '#0f1114',
  bgStripe: 'rgba(255, 255, 255, 0.02)',
  text: '#e2e8f0',
  labelStroke: 'rgba(0, 0, 0, 0.65)',
  gridFine: 'rgba(148, 163, 184, 0.12)',
  gridCoarse: 'rgba(148, 163, 184, 0.22)',
  polygonStroke: '#38bdf8',
  polygonFill: '#2563eb',
  fogCenter: 'rgba(255, 255, 255, 0.06)',
  fogEdge: 'rgba(0, 0, 0, 0.35)',
  fogHorizon: 'rgba(255, 255, 255, 0.03)',
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
    toggleFullscreen();
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
  c.fillStyle = selected ? '#10b981' : hover ? '#ef4444' : '#e5e7eb';
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

function scheduleResize() {
  nextTick(() => {
    handleResize();
    requestAnimationFrame(() => handleResize());
    setTimeout(handleResize, 80);
  });
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
  document.addEventListener('fullscreenchange', onFullscreenChange);
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
  document.removeEventListener('fullscreenchange', onFullscreenChange);
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
