<template>
  <div class="board" style="position: relative">
    <!-- 内容区域：左侧任务列表（拖拽源） + 右侧日期卡网格 -->
    <div class="content-board">
      <!-- 左侧任务列表（仅拖拽，不提供删除） -->
      <div class="card aside">
        <div class="fs14 fw mb10">分段任务列表</div>
        <div class="aside-scroll">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-card"
            :class="{ 'is-completed': task.status === 2 }"
            :draggable="task.status !== 2"
            @dragstart="onTaskDragStart(task, $event)"
            @dragend="onTaskDragEnd"
          >
            <div class="thumb-wrap relative">
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
            <div class="task-meta">
              <div class="name-row fw fs14">{{ task.segmentName }}</div>
              <div class="row">{{ task.range }}</div>
              <div class="row">
                当前状态：
                <span class="fw" :style="{ color: getStatusColor(task.status) }">
                  {{
                    task.status == 0
                      ? '未开工'
                      : task.status == 1
                        ? '已开工'
                        : task.status == 2
                          ? '已完成'
                          : ''
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧日期卡网格（预览，点击打开编辑面） -->
      <div class="card flex1 main" v-if="!setSite">
        <div class="header-row row-between">
          <div class="fs14 fw mb10">场地任务信息</div>
          <div class="row-start">
            <el-button link type="primary" size="small" @click="openStatsDialog" class="mr10">
              <el-icon class="mr4"><PieChart /></el-icon>
              统计分析
            </el-button>
            <el-button link type="primary" size="small" @click="openRatioChart" class="mr10">
              <el-icon class="mr4"><Histogram /></el-icon>
              场地利用率
            </el-button>
            <el-checkbox v-model="showTaskName" size="small" style="margin-right: 10px !important">
              显示分段信息
            </el-checkbox>
            <el-checkbox v-model="showGrid" size="small" style="margin-right: 10px !important">
              显示网格
            </el-checkbox>
            <el-button link type="primary" size="small" @click="goBack">
              <el-icon class="mr4"><ArrowLeft /></el-icon>
              返回上一级
            </el-button>
          </div>
        </div>
        <div class="cards-container">
          <template v-if="datePanels.length">
            <div class="cards-wrap">
              <div
                v-for="panelDate in datePanels"
                :key="panelDate.id"
                class="mini-item"
                @click="chooseDateSite(panelDate)"
              >
                <div class="card-header fs12 cursor-pointer row-between pl5 pr10">
                  <div class="row-start w100%">
                    <div>{{ panelDate.date }}</div>
                    <div class="flex1 pl10 pr10">
                      <el-progress
                        :text-inside="true"
                        :stroke-width="10"
                        :percentage="panelDate.siteSegmentRatio"
                        color="#7d46ca"
                      ></el-progress>
                    </div>
                  </div>
                  <el-icon color="#409eff">
                    <full-screen />
                  </el-icon>
                </div>
                <div class="mini-card">
                  <SiteCanvas
                    :site="panelDate.site"
                    :showGrid="showGrid"
                    :tasks="panelDate.tasks"
                    :showTaskName="showTaskName"
                    :gridPx="5"
                    gridColor="#d0d7de"
                    :gridLineWidth="1"
                    :gridOpacity="0.5"
                    background="#fff"
                    :padding="0"
                    :taskFillColorMap="STATUS_COLORS"
                  />
                </div>
              </div>
            </div>
          </template>
          <div v-else class="empty-wrapper">
            <el-empty description="暂无数据" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 右侧覆盖层：polygonSet 编辑（接收拖拽；不遮挡左侧任务列表） -->
      <transition name="panel-slide">
        <div
          v-if="setSite"
          class="drag-host overlay-panel"
          :class="{ 'drag-host--over': dragOver }"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop.prevent="onDropToPolygonSet"
        >
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
      </transition>
    </div>

    <!-- 场地利用率图表弹窗 -->
    <el-dialog
      v-model="ratioDialogVisible"
      title="场地利用率"
      width="90%"
      append-to-body
      destroy-on-close
    >
      <div
        ref="ratioChartRef"
        style="width: 100%; height: 360px"
        v-loading="!datePanels.length"
      ></div>
      <template #footer>
        <el-button @click="ratioDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 场地统计弹窗（子组件） -->
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
import { ArrowLeft, Histogram, PieChart } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import polygonSet from './components/polygonSet.vue';
import ResponsivePolygon from './components/ResponsivePolygon.vue';
import SiteCanvas from './components/SiteCanvas.vue';
import SiteStatsDialog from './components/SiteStatsDialog.vue';
import SegmentAreaAll from './SegmentAreaAllMock';
import taskList from './taskListMock';

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
  0: { fill: '#FFD707', text: '#FFD707' },
  1: { fill: '#2388FF', text: '#2388FF' },
  2: { fill: 'green', text: 'green' },
};
const getStatusColor = (status) => STATUS_COLORS[status]?.text || '#475569';

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
const ratioDialogVisible = ref(false);
const ratioChartRef = ref(null);
let ratioChart = null;
const router = useRouter();

/** ===== 统计弹窗 ===== */
const statsDialogVisible = ref(false);
const statsViewType = ref('week'); // 'week' | 'month'
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
  const offset = (d.getDay() + 6) % 7; // Monday start
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
      return {
        date: dateObj,
        dateStr: formatDate(dateObj),
        siteArea,
        wipArea,
        doneArea,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (!daily.length) {
    return { periodStats: [], summary: null };
  }

  const groups = new Map();
  daily.forEach((item) => {
    const periodStart = viewType === 'month' ? startOfMonth(item.date) : startOfWeek(item.date);
    const periodEnd =
      viewType === 'month'
        ? new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1)
        : addDaysToDate(periodStart, 7);
    const key = `${formatDate(periodStart)}_${viewType}`;
    if (!groups.has(key)) {
      groups.set(key, {
        start: periodStart,
        end: periodEnd,
        items: [],
      });
    }
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
      const label =
        viewType === 'month'
          ? `${group.start.getFullYear()}-${String(group.start.getMonth() + 1).padStart(2, '0')}`
          : getWeekLabel(group.start);
      return {
        label,
        start: formatDate(group.start),
        end: formatDate(group.end),
        doneArea,
        wipStart,
        wipEnd,
        wipAvg,
        turnover,
        idleAvg,
        utilization,
      };
    });

  const turnoverVals = periodStats
    .map((r) => (r.turnover == null || Number.isNaN(r.turnover) ? null : r.turnover))
    .filter((v) => v !== null);
  const idleVals = periodStats
    .map((r) => (r.idleAvg == null || Number.isNaN(r.idleAvg) ? null : r.idleAvg))
    .filter((v) => v !== null);
  const utilVals = periodStats
    .map((r) => (r.utilization == null || Number.isNaN(r.utilization) ? null : r.utilization))
    .filter((v) => v !== null);

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
    ElMessage.warning('该日期暂无数据');
    return null;
  }
  selectSite.value = clonePanel(panel);
  activePanelId.value = panel?.id ?? null;
  return panel;
}

onMounted(() => {
  loadMockData();
});
onBeforeUnmount(() => {
  if (ratioChart) {
    ratioChart.dispose();
    ratioChart = null;
  }
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
    ElMessage.warning('暂无统计数据');
    return;
  }
  statsDialogVisible.value = true;
  loadStatsData();
}

function goBack() {
  router.back();
}

function onStatsViewTypeChange(type) {
  if (statsViewType.value === type) return;
  statsViewType.value = type;
  if (statsDialogVisible.value) {
    loadStatsData();
  }
}

/** ===== 拖拽与编辑弹层 ===== */

function showSetSite() {
  setSite.value = true;
}
function closeSetSite() {
  setSite.value = false;
  dragOver.value = false;
}

function chooseDateSite(panelDate) {
  selectSite.value = clonePanel(panelDate);
  activePanelId.value = panelDate?.id ?? null;
  showSetSite();
}

function adjustDay(step) {
  if (!selectSite.value?.date) {
    ElMessage.warning('请选择日期后再切换');
    return;
  }
  fetchPanelByDate(addDays(selectSite.value.date, step));
}

function goPrevDay() {
  adjustDay(-1);
}
function goNextDay() {
  adjustDay(1);
}

/** 左侧任务卡 dragstart：把任务对象写入 dataTransfer（仅用于拖拽，不删除源） */
function onTaskDragStart(task, e) {
  if (task?.status === 2) {
    e.preventDefault();
    return;
  }
  const payload = {
    ...task,
  };
  e.dataTransfer.setData('application/json', JSON.stringify(payload));
  e.dataTransfer.effectAllowed = 'copy';
}
function onTaskDragEnd() {
  dragOver.value = false;
}

/** 编辑面容器：dragover/leave/drop */
function onDragOver(e) {
  if (!setSite.value) return;
  dragOver.value = true;
  e.dataTransfer.dropEffect = 'copy';
}
function onDragLeave() {
  dragOver.value = false;
}

function onDropToPolygonSet(e) {
  dragOver.value = false;
  if (!setSite.value) return;

  try {
    const json = e.dataTransfer.getData('application/json');
    if (!json) return;
    const task = JSON.parse(json);
    const normalized = polygonSetRef.value?.canAcceptExternalTask(task);
    if (!normalized?.ok) {
      ElMessage.error(normalized?.message || '拖拽数据无效');
      return;
    }
    if (!Array.isArray(selectSite.value.tasks)) selectSite.value.tasks = [];
    const idx = selectSite.value.tasks.findIndex(
      (t) => String(t.segmentId) === String(normalized.task.segmentId),
    );
    if (idx !== -1) selectSite.value.tasks.splice(idx, 1);
    selectSite.value.tasks.push(normalized.task);
    polygonSetRef.value?.restoreDeletedSegment(normalized.task.segmentId);
    ElMessage.success('已添加到当前面板');
  } catch (err) {
    console.warn('解析拖拽任务失败：', err);
    ElMessage.error('拖拽数据无效');
  }
}

/** 场地利用率图表 */
function openRatioChart() {
  ratioDialogVisible.value = true;
  nextTick(() => renderRatioChart());
}

function renderRatioChart() {
  if (!ratioChartRef.value) return;
  if (ratioChart) ratioChart.dispose();
  ratioChart = echarts.init(ratioChartRef.value);
  const dates = datePanels.value.map((d) => d.date);
  const ratios = datePanels.value.map((d) => Number(d.siteSegmentRatio ?? 0));
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        interval: 0,
        formatter: (value) => {
          if (typeof value !== 'string') return value;
          const parts = value.split(/[-/]/);
          return parts.length >= 2 ? parts.slice(1).join('-') : value;
        },
      },
    },
    yAxis: {
      type: 'value',
      max: 100,
      min: 0,
      axisLabel: { formatter: '{value}%' },
    },
    dataZoom: [
      {
        type: 'slider',
        height: 16,
        bottom: 20,
        start: 0,
        end: 100,
      },
      { type: 'inside' },
    ],
    series: [
      {
        type: 'bar',
        data: ratios,
        itemStyle: { color: '#7d46ca' },
        label: {
          show: true,
          position: 'top',
          formatter: ({ value }) => `${value}%`,
        },
      },
    ],
  };
  ratioChart.setOption(option);
}

/* 保存 polygonSet */
function saveSite() {
  const localPanel = polygonSetRef.value?.getLocalData?.();
  if (!localPanel) {
    ElMessage.error('未获取到当前面板数据');
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
  ElMessage.success('操作成功！');
  closeSetSite();
}
</script>

<style scoped>
/* 整体容器 */
.board {
  height: 100%;
  width: 100%;
  padding: 10px;
}

/* 内容区域：左边任务列表 + 右边网格 */
.content-board {
  display: flex;
  gap: 10px;
  height: 100%;
  width: 100%;
  position: relative;
}

/* 左侧列表（拖拽源） */
.aside {
  width: 300px;
  flex-shrink: 0;
}
.aside-scroll {
  overflow-y: auto;
  height: calc(100% - 30px);
}
.task-card {
  display: grid;
  grid-template-columns: 88px 1fr;
  align-items: center;
  margin-bottom: 10px;
  background: #f8f9fc;
  cursor: grab;
  border-radius: 4px;
}
.task-card.is-completed {
  cursor: not-allowed;
  /* opacity: 0.6; */
}
.task-card.is-completed:hover {
  background: #eef2f7;
}
.task-card:active {
  cursor: grabbing;
}
.task-card.is-completed:active {
  cursor: not-allowed;
}
.thumb-wrap {
  width: 80px;
  height: 70px;
  padding: 4px;
  background: #dee3ed;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-right: 10px;
  border-radius: 4px;
}
.task-meta {
  font-size: 12px;
  color: #475569;
}
.name-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 2px;
}

/* 右侧网格预览 */
.main {
  padding: 10px;
}
.cards-container {
  overflow: auto;
  height: calc(100% - 40px);
}
.empty-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cards-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.mini-item {
  width: 200px;
  background: #f0f0f0;
  box-shadow: 3px 2px 3px 0px #d3cbcb;
}
.mini-card {
  width: 200px;
}
.card-header {
  font-weight: 500;
  line-height: 30px;
}

/* 覆盖层（接收拖拽） */
.drag-host {
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.drag-host--over {
  border: 2px dashed #60a5fa;
  box-shadow: 0 0 0 6px rgba(96, 165, 250, 0.15) inset;
  border-radius: 8px;
}
.overlay-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: calc(100% - 300px);
  height: 100%;
  background: rgba(248, 249, 252, 0.95);
  padding: 0px 10px;
  box-sizing: border-box;
  overflow: hidden;
}
.overlay-panel > :deep(*) {
  height: 100%;
}
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.panel-slide-enter-to,
.panel-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>

<style>
.el-progress-bar__outer {
  background-color: #c0c4cc !important;
}
.el-progress-bar__innerText {
  display: inline-block;
  vertical-align: middle;
  color: #fff;
  font-size: 10px;
  margin-top: -3px !important;
  margin-right: 5px !important;
}
</style>
