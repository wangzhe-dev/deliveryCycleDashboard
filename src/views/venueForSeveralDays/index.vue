<template>
  <div class="venue-theme relative flex h-full flex-col overflow-hidden bg-background text-foreground">
    <!-- Toast -->
    <transition name="toast-fade">
      <div
        v-if="toastVisible"
        class="pointer-events-none fixed left-1/2 top-5 z-[9999] -translate-x-1/2"
      >
        <div
          class="pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur-sm ring-1"
          :class="{
            'bg-primary/10 text-foreground ring-primary/30': toastType === 'success',
            'bg-secondary/40 text-foreground ring-secondary/60': toastType === 'warning',
            'bg-destructive/10 text-destructive ring-destructive/30': toastType === 'error',
          }"
        >
          <svg v-if="toastType === 'success'" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
          <svg v-else-if="toastType === 'warning'" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
          <svg v-else class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          {{ toastMsg }}
        </div>
      </div>
    </transition>

    <!-- 内容区域 -->
    <div class="relative flex min-h-0 flex-1 gap-3 p-4">
      <!-- 左侧：分段任务列表 -->
      <Card class="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl">
        <!-- 标题区 -->
        <CardHeader class="flex-row items-center gap-2 space-y-0 border-b border-border px-4 py-3">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/40 text-foreground">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
          </div>
          <div>
            <div class="text-sm font-semibold text-foreground">分段任务</div>
            <div class="text-[11px] text-muted-foreground">拖拽至右侧场地编辑区</div>
          </div>
        </CardHeader>
        <!-- 任务卡片列表 -->
        <CardContent class="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3 pt-3">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="group grid grid-cols-[72px_1fr] items-center gap-2.5 rounded-xl border border-border bg-card p-1 transition-all duration-150"
            :class="task.status === 2
              ? 'cursor-not-allowed opacity-50 grayscale'
              : 'cursor-grab shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 active:cursor-grabbing active:shadow-sm active:translate-y-0'"
            :draggable="task.status !== 2"
            @dragstart="onTaskDragStart(task, $event)"
            @dragend="onTaskDragEnd"
          >
            <div class="flex h-[66px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-muted to-card">
              <ResponsivePolygon
                :points="task.points"
                :padding="0"
                :stroke="getStatusColor(task.status)"
                :strokeWidth="1"
                :fill="getStatusColor(task.status)"
                :showGrid="false"
                :showVertices="false"
              />
            </div>
            <div class="min-w-0 py-1 pr-2">
              <div class="truncate text-[13px] font-semibold text-foreground">{{ task.segmentName }}</div>
              <div class="mt-0.5 truncate text-[11px] text-muted-foreground">{{ task.range }}</div>
              <div class="mt-1">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset"
                  :class="{
                    'bg-secondary/40 text-foreground ring-secondary/60': task.status == 0,
                    'bg-primary/15 text-primary ring-primary/30': task.status == 1,
                    'bg-accent/25 text-foreground ring-accent/40': task.status == 2,
                  }"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="{
                    'bg-secondary': task.status == 0,
                    'bg-primary': task.status == 1,
                    'bg-accent': task.status == 2,
                  }"></span>
                  {{ task.status == 0 ? '未开工' : task.status == 1 ? '已开工' : task.status == 2 ? '已完成' : '' }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 右侧：日期卡片网格 -->
      <Card class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <!-- 工具栏 -->
        <CardHeader v-show="!setSite" class="flex-row items-center justify-between space-y-0 border-b border-border px-4 py-2.5">
          <div class="flex items-center gap-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/30 text-foreground">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
            </div>
            <span class="text-sm font-semibold text-foreground">场地任务信息</span>
          </div>
          <div class="flex items-center gap-1">
            <!-- 统计分析 -->
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
              @click="openStatsDialog"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5z" /></svg>
              统计分析
            </button>
            <div class="mx-0.5 h-3.5 w-px bg-border"></div>
            <!-- 开关组 -->
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition"
              :class="showTaskName ? 'bg-destructive/10 font-medium text-destructive' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="showTaskName = !showTaskName"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.2 48.2 0 0 0 5.887-.37c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
              分段信息
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition"
              :class="showGrid ? 'bg-destructive/10 font-medium text-destructive' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="showGrid = !showGrid"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-12.75m0 0A1.125 1.125 0 0 1 3.375 4.5h17.25m-17.25 0h7.5m-7.5 0v12.75m0 0h7.5m0 0v-12.75m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125V5.625m0 0A1.125 1.125 0 0 0 10.875 4.5m.375 1.125v12.75m0-12.75h7.5m-7.5 0v12.75m7.5-12.75a1.125 1.125 0 0 1 1.125 1.125v12.75M20.625 4.5h-7.5m7.5 0a1.125 1.125 0 0 1 1.125 1.125" /></svg>
              网格
            </button>
          </div>
        </CardHeader>

        <!-- 日期卡片 -->
        <CardContent class="min-h-0 flex-1 overflow-hidden p-3 pt-3">
          <div v-show="!setSite" class="h-full overflow-auto">
            <template v-if="datePanels.length">
              <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
                <div
                  v-for="panelDate in datePanels"
                  :key="panelDate.id"
                  class="group cursor-pointer rounded-xl border border-border bg-muted/70 transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-[0_12px_32px_rgba(38,70,83,0.14)]"
                  @click="chooseDateSite(panelDate)"
                >
                  <!-- 顶部：日期 + 占用率 -->
                  <div class="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                    <div class="flex items-center gap-1.5">
                      <svg class="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                      <span class="text-xs font-semibold text-foreground">{{ panelDate.date }}</span>
                    </div>
                    <span
                      class="rounded-md px-1.5 py-0.5 tabular-nums text-[10px] font-bold transition-colors duration-300"
                      :class="panelDate.siteSegmentRatio > 80
                        ? 'bg-destructive/10 text-destructive'
                        : panelDate.siteSegmentRatio > 50
                          ? 'bg-secondary/40 text-foreground'
                          : 'bg-primary/10 text-primary'"
                    >{{ panelDate.siteSegmentRatio }}%</span>
                  </div>
                  <!-- 占用率进度条 -->
                  <div class="px-3 pb-2">
                    <div class="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :class="panelDate.siteSegmentRatio > 80 ? 'bg-destructive' : panelDate.siteSegmentRatio > 50 ? 'bg-secondary' : 'bg-primary'"
                        :style="{ width: panelDate.siteSegmentRatio + '%' }"
                      />
                    </div>
                  </div>
                  <!-- 场地预览 -->
                  <div class="relative mx-2 mb-2 overflow-hidden rounded-lg border border-border bg-muted/70 transition-all duration-300 group-hover:shadow-[0_8px_18px_rgba(38,70,83,0.12)]">
                    <div class="aspect-[4/3] transition-transform duration-300 group-hover:scale-[0.98]">
                      <SiteCanvas
                        :site="panelDate.site"
                        :showGrid="showGrid"
                        :tasks="panelDate.tasks"
                        :showTaskName="showTaskName"
                        :gridPx="5"
                        gridColor="#dbe4e7"
                        :gridLineWidth="1"
                        :gridOpacity="0.35"
                        background="transparent"
                        bgFill="rgba(42, 157, 143, 0.16)"
                        bgStroke="#2a9d8f"
                        taskStrokeColor="#264653"
                        labelColor="#264653"
                        :padding="0"
                        :taskFillColorMap="STATUS_COLORS"
                      />
                    </div>
                    <!-- hover：右下角编辑图标 -->
                    <div class="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-destructive text-destructive-foreground opacity-0 shadow ring-1 ring-destructive/40 transition-all duration-150 group-hover:opacity-100">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                    </div>
                  </div>
                  <!-- 底部任务数 -->
                  <div class="flex items-center gap-1.5 border-t border-muted px-3 py-1.5">
                    <svg class="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0 4.179 2.25L12 17.25 2.25 12l4.179-2.25" /></svg>
                    <span class="text-[11px] text-muted-foreground">{{ panelDate.tasks?.length || 0 }} 个分段</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <svg class="h-10 w-10 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span class="text-xs">暂无场地数据</span>
            </div>
          </div>

          <div v-show="setSite" class="h-full">
            <polygonSet
              ref="polygonSetRef"
              :data="selectSite"
              @save="saveSite"
              @pre="goPrevDay"
              @next="goNextDay"
              @close="closeSetSite"
              :statusColorMap="STATUS_COLORS"
              :siteId="form.site"
            />
          </div>
        </CardContent>
      </Card>

      <div
        v-show="setSite"
        class="absolute inset-y-0 right-0 left-[292px] pointer-events-none z-10"
        :class="dragOver ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : ''"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDropToPolygonSet"
      ></div>
    </div>

    <!-- 场地统计弹窗 -->
    <SiteStatsDialog
      v-model="statsDialogVisible"
      :loading="statsLoading"
      :view-type="statsViewType"
      :summary="statsSummary"
      :period-stats="statsPeriodStats"
      @update:viewType="onStatsViewTypeChange"
    />
  </div>
</template>

<script setup>
import { Card, CardContent, CardHeader } from '@/components/ui';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import polygonSet from './components/polygonSet.vue';
import ResponsivePolygon from './components/ResponsivePolygon.vue';
import SiteCanvas from './components/SiteCanvas.vue';
import SiteStatsDialog from './components/SiteStatsDialog.vue';
import SegmentAreaAll from './SegmentAreaAllMock';
import taskList from './taskListMock';

/** ===== Toast（替代 ElMessage） ===== */
const toastVisible = ref(false);
const toastMsg = ref('');
const toastType = ref('success');
let toastTimer = null;

function showToast(msg, type = 'success', duration = 2500) {
  toastMsg.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, duration);
}

/** ===== 常量 & Mock 数据 ===== */
const DEFAULT_SITE_ID = 'site-1';
const form = reactive({
  site: DEFAULT_SITE_ID,
});
const DEFAULT_SITE = {
  points: [
    { x: 0, y: 0 },
    { x: 0, y: 100 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ],
  settings: { gridUnitM: 1, pxPerM: 5, snapM: 1 },
};
const STATUS_COLORS = {
  0: { fill: '#e9c46a', text: '#e9c46a' },
  1: { fill: '#2a9d8f', text: '#2a9d8f' },
  2: { fill: '#f4a261', text: '#f4a261' },
};
const getStatusColor = (status) => STATUS_COLORS[status]?.text || '#264653';

/** ===== 状态 ===== */
const tasks = ref([]);
const datePanels = ref([]);
const selectSite = ref({});
const setSite = ref(false);
const dragOver = ref(false);
const activePanelId = ref(null);
const polygonSetRef = ref(null);
const showGrid = ref(true);
const showTaskName = ref(true);
const router = useRouter();

/** ===== 统计弹窗 ===== */
const statsDialogVisible = ref(false);
const statsViewType = ref('week');
const statsLoading = ref(false);
const statsPeriodStats = ref([]);
const statsSummary = ref(null);

function clonePanel(panel) {
  return JSON.parse(JSON.stringify(panel || {}));
}

function parseJsonSafe(input, fallback) {
  if (input == null) return fallback;
  if (typeof input !== 'string') return input;
  try {
    return JSON.parse(input);
  } catch (err) {
    return fallback;
  }
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateSlash(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function addDays(dateStr, step) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d);
  next.setDate(next.getDate() + step);
  return formatDate(next);
}

function parsePointsFromGraphJson(graphJson) {
  if (!graphJson) return [];
  const parsed = parseJsonSafe(graphJson, null);
  const pts = Array.isArray(parsed?.points) ? parsed.points : Array.isArray(parsed) ? parsed : [];
  return pts
    .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

function parsePointsFromString(pointsStr) {
  if (!pointsStr) return [];
  const parsed = parseJsonSafe(pointsStr, []);
  const pts = Array.isArray(parsed) ? parsed : [];
  return pts
    .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

function normalizeTaskFromList(item) {
  const segmentName =
    item.segmentName || item.segmentNo || item.segmentCode || `任务${item.id || ''}`;
  const segmentCode = item.segmentNo || item.segmentCode || item.segmentName;
  return {
    ...item,
    segmentId: item.segmentId ?? item.id ?? item.segmentNo ?? item.segmentCode,
    segmentName,
    segmentCode,
    status: item.status ?? 0,
    range: `${formatDateSlash(item.planStart)} ~ ${formatDateSlash(item.planFinish)}`,
    points: parsePointsFromGraphJson(item.graphJson),
  };
}

function normalizePanelFromMock(item) {
  const site = parseJsonSafe(item.site, DEFAULT_SITE) || DEFAULT_SITE;
  const tasksList = Array.isArray(item.tasks) ? item.tasks : [];
  const tasks = tasksList.map((task) => ({
    ...task,
    segmentId: task.segmentId ?? task.id ?? task.code ?? task.name,
    segmentName: task.name || task.segmentName || task.code,
    segmentCode: task.code || task.segmentCode,
    status: task.status ?? 0,
    points: parsePointsFromString(task.points),
  }));
  return {
    id: item.id || `panel-${item.date}`,
    date: item.date,
    site,
    tasks,
    siteArea: Number(item.siteArea ?? 0),
    totalSegmentArea: Number(item.totalSegmentArea ?? 0),
    siteSegmentRatio: Number(item.siteSegmentRatio ?? 0),
  };
}

function polygonArea(points = []) {
  if (!Array.isArray(points) || points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(sum / 2);
}

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

function addDaysToDate(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getWeekLabel(date) {
  const year = date.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const dayOffset = (yearStart.getDay() + 6) % 7;
  const dayOfYear = Math.floor((date - yearStart) / 86400000) + 1;
  const weekNo = Math.ceil((dayOfYear + dayOffset) / 7);
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

function mean(values) {
  if (!values.length) return null;
  const total = values.reduce((sum, v) => sum + v, 0);
  return total / values.length;
}

function buildStatsForView(viewType) {
  const daily = datePanels.value
    .map((panel) => {
      const dateObj = toDate(panel.date);
      if (!dateObj) return null;
      const siteArea = Number(panel.siteArea ?? polygonArea(panel.site?.points || [])) || 0;
      const taskAreas = (panel.tasks || []).map((t) => polygonArea(t.points || []));
      const wipArea = taskAreas.reduce((sum, v) => sum + v, 0);
      const doneArea = (panel.tasks || [])
        .filter((t) => Number(t.status) === 2)
        .map((t) => polygonArea(t.points || []))
        .reduce((sum, v) => sum + v, 0);
      return { date: dateObj, dateStr: formatDate(dateObj), siteArea, wipArea, doneArea };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (!daily.length) return { periodStats: [], summary: null };

  const groups = new Map();
  daily.forEach((item) => {
    const periodStart = viewType === 'month' ? startOfMonth(item.date) : startOfWeek(item.date);
    const periodEnd = viewType === 'month'
      ? new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1)
      : addDaysToDate(periodStart, 7);
    const key = `${formatDate(periodStart)}_${viewType}`;
    if (!groups.has(key)) groups.set(key, { start: periodStart, end: periodEnd, items: [] });
    groups.get(key).items.push(item);
  });

  const periodStats = Array.from(groups.values())
    .sort((a, b) => a.start - b.start)
    .map((group) => {
      const items = group.items.sort((a, b) => a.date - b.date);
      const wipAreas = items.map((i) => i.wipArea);
      const doneAreas = items.map((i) => i.doneArea);
      const siteAreas = items.map((i) => i.siteArea).filter((v) => v > 0);
      const siteArea = mean(siteAreas) || 0;
      const wipAvg = mean(wipAreas) ?? 0;
      const doneArea = doneAreas.reduce((sum, v) => sum + v, 0);
      const wipStart = wipAreas[0] ?? 0;
      const wipEnd = wipAreas[wipAreas.length - 1] ?? 0;
      const idleAvg = siteArea > 0 ? Math.max(0, siteArea - wipAvg) : null;
      const utilization = siteArea > 0 ? wipAvg / siteArea : null;
      const turnover = wipAvg > 0 ? doneArea / wipAvg : null;
      const label = viewType === 'month'
        ? `${group.start.getFullYear()}-${String(group.start.getMonth() + 1).padStart(2, '0')}`
        : getWeekLabel(group.start);
      return { label, start: formatDate(group.start), end: formatDate(group.end), doneArea, wipStart, wipEnd, wipAvg, turnover, idleAvg, utilization };
    });

  const turnoverVals = periodStats.map((r) => (r.turnover == null || Number.isNaN(r.turnover) ? null : r.turnover)).filter((v) => v !== null);
  const idleVals = periodStats.map((r) => (r.idleAvg == null || Number.isNaN(r.idleAvg) ? null : r.idleAvg)).filter((v) => v !== null);
  const utilVals = periodStats.map((r) => (r.utilization == null || Number.isNaN(r.utilization) ? null : r.utilization)).filter((v) => v !== null);

  const summary = {
    avgTurnover: mean(turnoverVals),
    avgIdleArea: mean(idleVals),
    avgUtilization: mean(utilVals),
    minDate: daily[0]?.dateStr || '',
    maxDate: daily[daily.length - 1]?.dateStr || '',
    rangeLabel: viewType === 'week' ? '按周统计' : '按月统计',
  };

  return { periodStats, summary };
}

/** ===== 数据加载 ===== */
function loadMockData() {
  tasks.value = Array.isArray(taskList) ? taskList.map((task) => normalizeTaskFromList(task)) : [];
  datePanels.value = Array.isArray(SegmentAreaAll)
    ? SegmentAreaAll.map((panel) => normalizePanelFromMock(panel))
    : [];
}

function fetchPanelByDate(targetDate) {
  const panel = datePanels.value.find((item) => item.date === targetDate);
  if (!panel) {
    showToast('该日期暂无数据', 'warning');
    return null;
  }
  selectSite.value = clonePanel(panel);
  activePanelId.value = panel?.id ?? null;
  return panel;
}

onMounted(() => { loadMockData(); });
onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer);
});

function loadStatsData() {
  statsLoading.value = true;
  const { periodStats, summary } = buildStatsForView(statsViewType.value);
  statsPeriodStats.value = periodStats;
  statsSummary.value = summary;
  statsLoading.value = false;
}

function openStatsDialog() {
  if (!datePanels.value.length) {
    showToast('暂无统计数据', 'warning');
    return;
  }
  statsDialogVisible.value = true;
  loadStatsData();
}

function goBack() { router.back(); }

function onStatsViewTypeChange(type) {
  if (statsViewType.value === type) return;
  statsViewType.value = type;
  if (statsDialogVisible.value) loadStatsData();
}

/** ===== 拖拽与编辑弹层 ===== */
function showSetSite() { setSite.value = true; }
function closeSetSite() { setSite.value = false; dragOver.value = false; }

function chooseDateSite(panelDate) {
  selectSite.value = clonePanel(panelDate);
  activePanelId.value = panelDate?.id ?? null;
  showSetSite();
}

function adjustDay(step) {
  if (!selectSite.value?.date) {
    showToast('请选择日期后再切换', 'warning');
    return;
  }
  fetchPanelByDate(addDays(selectSite.value.date, step));
}

function goPrevDay() { adjustDay(-1); }
function goNextDay() { adjustDay(1); }

function onTaskDragStart(task, e) {
  if (task?.status === 2) { e.preventDefault(); return; }
  e.dataTransfer.setData('application/json', JSON.stringify({ ...task }));
  e.dataTransfer.effectAllowed = 'copy';
}
function onTaskDragEnd() { dragOver.value = false; }

function onDragOver(e) {
  if (!setSite.value) return;
  dragOver.value = true;
  e.dataTransfer.dropEffect = 'copy';
}
function onDragLeave() { dragOver.value = false; }

function onDropToPolygonSet(e) {
  dragOver.value = false;
  if (!setSite.value) return;
  try {
    const json = e.dataTransfer.getData('application/json');
    if (!json) return;
    const task = JSON.parse(json);
    const normalized = polygonSetRef.value?.canAcceptExternalTask(task);
    if (!normalized?.ok) {
      showToast(normalized?.message || '拖拽数据无效', 'error');
      return;
    }
    if (!Array.isArray(selectSite.value.tasks)) selectSite.value.tasks = [];
    const idx = selectSite.value.tasks.findIndex((t) => String(t.segmentId) === String(normalized.task.segmentId));
    if (idx !== -1) selectSite.value.tasks.splice(idx, 1);
    selectSite.value.tasks.push(normalized.task);
    polygonSetRef.value?.restoreDeletedSegment(normalized.task.segmentId);
    showToast('已添加到当前面板', 'success');
  } catch (err) {
    console.warn('解析拖拽任务失败：', err);
    showToast('拖拽数据无效', 'error');
  }
}

/* 保存 polygonSet */
function saveSite() {
  const localPanel = polygonSetRef.value?.getLocalData?.();
  if (!localPanel) {
    showToast('未获取到当前面板数据', 'error');
    return;
  }
  const nextPanel = clonePanel(localPanel);
  const idx = datePanels.value.findIndex((item) => item.date === nextPanel.date);
  if (idx >= 0) {
    const prev = datePanels.value[idx];
    nextPanel.siteSegmentRatio = prev?.siteSegmentRatio ?? nextPanel.siteSegmentRatio ?? 0;
    datePanels.value.splice(idx, 1, nextPanel);
  } else {
    nextPanel.siteSegmentRatio = nextPanel.siteSegmentRatio ?? 0;
    datePanels.value.push(nextPanel);
  }
  selectSite.value = clonePanel(nextPanel);
  activePanelId.value = nextPanel?.id ?? activePanelId.value;
  showToast('操作成功！', 'success');
  closeSetSite();
}
</script>

<style scoped>
.venue-theme {
  --background: 0 0% 100%;
  --foreground: 197 37% 24%;
  --card: 0 0% 100%;
  --card-foreground: 197 37% 24%;
  --popover: 0 0% 100%;
  --popover-foreground: 197 37% 24%;
  --primary: 173 58% 39%;
  --primary-foreground: 0 0% 100%;
  --secondary: 42 74% 66%;
  --secondary-foreground: 197 37% 24%;
  --muted: 0 0% 97%;
  --muted-foreground: 197 20% 35%;
  --accent: 27 87% 67%;
  --accent-foreground: 197 37% 24%;
  --destructive: 12 76% 61%;
  --destructive-foreground: 0 0% 100%;
  --border: 197 22% 85%;
  --input: 0 0% 100%;
  --ring: 173 58% 39%;
}

/* polygonSet 子组件撑满高度 */
.absolute > :deep(*) {
  height: 100%;
}

/* Toast 动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

</style>
