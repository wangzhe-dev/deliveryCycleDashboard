<template>
  <div class="h-full p20">
    <!-- 顶部：右侧新增按钮 -->
    <div class="row-between header-row mb10">
      <div class="row-start" style="gap: 10px">
        <el-button type="warning" :icon="Histogram" @click="goMultiDayBoard">
          场地多天任务制作
        </el-button>
      </div>
    </div>

    <!-- 看板视图：无分页，自动充满高度 -->
    <div class="table-parent kanban-parent" style="height: calc(100% - 140px)">
      <div class="content">
        <!-- 表头：左“船型” + 右时间轴 -->
        <div class="table-header">
          <div class="fixed-col fixed-header">船型</div>
          <div class="header-main">
            <calendarHeader
              ref="headerRef"
              :start-date="startDate"
              :end-date="endDate"
              :cell-width="cellWidth"
            />
          </div>
        </div>

        <!-- 表格主体：左侧固定船型列 + 右侧日期网格 -->
        <div class="table-content">
          <!-- 左侧固定列：船型名称（不允许单独滚动，通过 JS 跟随右侧） -->
          <div class="fixed-col content-fixed" ref="fixedColRef" @wheel="handleFixedColWheel">
            <div
              v-for="(item, rowIndex) in tableData"
              :key="item.lineName || item.id || rowIndex"
              class="line-cell"
              :ref="(el) => (lineCellRefs[rowIndex] = el)"
            >
              {{ item.lineName }}
            </div>
          </div>

          <!-- 右侧可滚动内容 -->
          <div class="content-main" ref="contentMainRef" @scroll="handleContentScroll">
            <div class="table-rows">
              <div
                v-for="(item, rowIndex) in tableData"
                :key="item.lineName || item.id || rowIndex"
                class="table-row"
                :ref="(el) => (rowRefs[rowIndex] = el)"
              >
                <div
                  v-for="day in days"
                  :key="day.key"
                  class="day-cell"
                  :class="{ weekend: day.isWeekend }"
                >
                  <!-- 每天的分段任务卡片（开始 ~ 结束期间，每天都有） -->
                  <el-tooltip
                    v-for="(task, tIndex) in taskMap[item.lineName]?.[day.dateStr] || []"
                    :key="(task.id || task.segmentNo || 't') + '-' + tIndex"
                    placement="right"
                    effect="dark"
                    popper-class="task-tooltip"
                  >
                    <!-- Tooltip：只展示信息，不展示操作 -->
                    <template #content>
                      <div class="tooltip-title">{{ task.segmentNo }} - {{ task.segmentName }}</div>
                      <div class="tooltip-row">船型：{{ task.vesselTypeName }}</div>
                      <div class="tooltip-row">责任人：{{ task.responsibleName || '' }}</div>
                      <div class="tooltip-row">
                        计划：{{ formatDate(task.planStart) }} ~ {{ formatDate(task.planFinish) }}
                      </div>
                      <div class="tooltip-row">
                        胎架：{{ fixtureNameMap[task.fixtureCode] || task.fixtureCode || '' }}
                      </div>
                      <div class="tooltip-row">
                        状态：
                        {{
                          statusOptions.find((opt) => opt.value === task.status)?.label ??
                          task.status ??
                          ''
                        }}
                      </div>
                    </template>

                    <!-- 卡片：颜色=分段号，底部一行 状态 + 操作 icon -->
                    <div :class="['task-pill', getTaskClass(task)]" :style="getTaskStyle(task)">
                      <div
                        class="task-mode"
                        v-if="Number(task.isAuto) === 1"
                        :class="Number(task.isAuto) === 1 ? 'task-mode--auto' : 'task-mode--manual'"
                      >
                        {{ Number(task.isAuto) === 1 ? 'APS' : '' }}
                      </div>

                      <div class="task-title fs14 mb5">{{ task.segmentName }}</div>

                      <div class="task-meta fs12 mb5">
                        <span v-if="task.responsibleName || task.fixtureCode">
                          {{ fixtureNameMap[task.fixtureCode] || task.fixtureCode || '' }} |
                          {{ task.responsibleName }}
                        </span>
                        <span v-else>{{ task.segmentNo }}</span>
                      </div>

                      <div class="task-meta fs12">
                        <span>
                          {{ formatDate(task.planStart) }} ~ {{ formatDate(task.planFinish) }}
                        </span>
                      </div>

                      <!-- ✅ 进行中：随机进度条（一次查询周期内固定） -->
                      <div v-if="Number(task.status) === 1" class="task-progress">
                        <el-progress
                          class="task-progress__bar"
                          :percentage="getTaskProgress(task)"
                          :stroke-width="6"
                          :show-text="false"
                        />
                        <div class="task-progress__txt">{{ getTaskProgress(task) }}%</div>
                      </div>

                      <!-- 底部：状态 + 操作按钮一排 -->
                      <div class="task-footer">
                        <!-- 状态：小圆点 + 文本 -->
                        <div class="task-status">
                          <span
                            class="status-dot"
                            :class="'status-dot--' + (task.status ?? 'default')"
                          ></span>
                          <span class="status-text">
                            {{
                              statusOptions.find((opt) => opt.value === task.status)?.label ??
                              '未知状态'
                            }}
                          </span>
                        </div>

                        <!-- 操作 icon：地形 -->
                        <div class="task-actions">
                          <el-icon class="task-action-icon" @click.stop="openGeo(task)">
                            <Location />
                          </el-icon>
                        </div>
                      </div>
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- /content -->
    </div>

    <!-- 地形编辑 -->
    <PolygonEditor
      ref="polygonEditor"
      v-model="geoDialog"
      title="场地地形编辑"
      @save="saveGeo"
      :data="graphJson"
    />
  </div>
</template>

<script setup name="CurvedSurfaceTaskList">
import { Histogram, Location } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { computed, getCurrentInstance, nextTick, onMounted, onUpdated, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import calendarHeader from './components/CalendarHeader.vue';
import taskListData from './mock';
import PolygonEditor from './polygonEditor.vue';

const { proxy } = getCurrentInstance() || {};
const router = useRouter();

// ---------- 查询 ----------
const tableData = ref([]); // 看板视图用的数据
const loading = ref(false);

const statusOptions = [
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
];

const formatDate = (val) => {
  if (!val) return '-';
  const d = dayjs(val);
  return d.isValid() ? d.format('YY/MM/DD') : val;
};

const fixtureNameMap = reactive({});

const graphJson = ref({});
const geoDialog = ref(false);
const current = ref({});
const polygonEditor = ref(null);

// ---------- 时间轴相关：日期范围 & days ----------
const startDate = ref(''); // 'YYYY-MM-DD'
const endDate = ref(''); // 'YYYY-MM-DD'
const cellWidth = 180;

// 提取日期部分
const extractDate = (val) => (val ? String(val).slice(0, 10) : '');

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = String(str).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatYMD(d) {
  if (!(d instanceof Date)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 根据接口 records 计算全局时间范围（最早 planStart / planFinish ~ 最晚）
const computeDateRange = (records) => {
  let minDate = null;
  let maxDate = null;

  records.forEach((vessel) => {
    (vessel.segments || []).forEach((seg) => {
      const sStr = extractDate(seg.planStart);
      const eStr = extractDate(seg.planFinish);
      const s = parseYMD(sStr);
      const e = parseYMD(eStr);

      if (s) {
        if (!minDate || s < minDate) minDate = s;
        if (!maxDate || s > maxDate) maxDate = s;
      }
      if (e) {
        if (!minDate || e < minDate) minDate = e;
        if (!maxDate || e > maxDate) maxDate = e;
      }
    });
  });

  if (minDate && maxDate) {
    startDate.value = formatYMD(minDate);
    endDate.value = formatYMD(maxDate);
  } else {
    // 没有计划日期时，给一个默认区间：今天前 7 天 ~ 后 21 天
    const today = new Date();
    const dStart = new Date(today);
    dStart.setDate(today.getDate() - 7);
    const dEnd = new Date(today);
    dEnd.setDate(today.getDate() + 21);
    startDate.value = formatYMD(dStart);
    endDate.value = formatYMD(dEnd);
  }
};

// 生成日列表（用于右侧网格）
const days = computed(() => {
  const start = parseYMD(startDate.value);
  const end = parseYMD(endDate.value);
  if (!start || !end || start > end) return [];

  const res = [];
  let cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    const dateStr = formatYMD(cur);
    const weekIndex = cur.getDay();
    const isWeekend = weekIndex === 0 || weekIndex === 6;
    res.push({ key: dateStr, dateStr, weekIndex, isWeekend });
    cur = new Date(y, m - 1, d + 1);
  }
  return res;
});

// tableData => 快速查找 map：{ lineName: { '2025-11-05': [task, ...], ... } }
const taskMap = computed(() => {
  const map = {};
  (tableData.value || []).forEach((line) => {
    const lineName = line.lineName;
    const lineMap = {};
    (line.list || []).forEach((dayItem) => {
      lineMap[dayItem.date] = dayItem.list || [];
    });
    map[lineName] = lineMap;
  });
  return map;
});

// ---------- 接口数据 -> 看板时间轴数据结构 ----------
const buildScheduleTableData = (records) => {
  return (records || []).map((vessel) => {
    const segList = Array.isArray(vessel.segments) ? vessel.segments : [];
    const dateMap = new Map();

    segList.forEach((seg) => {
      const startStr = extractDate(seg.planStart);
      const endStr = extractDate(seg.planFinish);

      const startDateObj = parseYMD(startStr);
      let endDateObj = parseYMD(endStr) || startDateObj;

      if (!startDateObj) return;

      if (!endDateObj || endDateObj < startDateObj) {
        endDateObj = startDateObj;
      }

      const taskBase = {
        id: seg.id,
        segmentNo: seg.segmentNo,
        segmentName: seg.segmentName,
        status: seg.status,
        planStart: extractDate(seg.planStart),
        planFinish: extractDate(seg.planFinish),
        graphJson: seg.graphJson,
        fixtureCode: seg.fixtureCode,
        responsibleName: seg.responsibleName,
        responsibleCode: seg.responsibleCode,
        vesselTypeName: vessel.typeName,
        parentVesselId: vessel.id,
        isAuto: seg.isAuto,
      };

      let cur = new Date(startDateObj);
      while (cur <= endDateObj) {
        const dateKey = formatYMD(cur);
        if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
        dateMap.get(dateKey).push(taskBase);

        const y = cur.getFullYear();
        const m = cur.getMonth() + 1;
        const d = cur.getDate();
        cur = new Date(y, m - 1, d + 1);
      }
    });

    const list = Array.from(dateMap.entries()).map(([date, tasks]) => ({ date, list: tasks }));

    const segCount = vessel.segmentCount ?? segList.length ?? 0;
    const lineName = segCount ? `${vessel.typeName}（${segCount}）` : vessel.typeName;

    return { id: vessel.id, lineName, raw: vessel, list };
  });
};

// ---------- 进行中：随机进度（一次查询周期内固定） ----------
const progressMap = ref(new Map());
const getTaskProgress = (task) => {
  if (Number(task?.status) !== 1) return 0;
  const key = String(task?.id ?? task?.segmentNo ?? '');
  if (!key) return 0;

  const m = progressMap.value;
  if (m.has(key)) return m.get(key);

  // 10~95，避免太假（0 或 100）
  const pct = Math.floor(10 + Math.random() * 86);
  m.set(key, pct);
  return pct;
};

// ---------- 列表查询 ----------
const fetchList = async () => {
  loading.value = true;
  try {
    const records = taskListData || [];

    // ✅ 每次查询成功后刷新随机进度
    progressMap.value = new Map();

    // 计算时间范围
    computeDateRange(records);
    // 看板视图数据
    tableData.value = buildScheduleTableData(records);
  } catch (error) {
    proxy?.showError?.(error?.message || '获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

// ---------- 地形 ----------
const goMultiDayBoard = () => {
  router.push({
    name: 'VenueForSeveralDays',
  });
};

const openGeo = async (row) => {
  current.value = row || {};
  graphJson.value = current.value?.graphJson ? JSON.parse(current.value.graphJson) : {};
  geoDialog.value = true;
};

const saveGeo = async (val) => {
  current.value.graphJson = JSON.stringify(val);
  proxy?.showSuccess?.('操作成功');
};

// ---------- 分段颜色（看板视图用） ----------
const segmentColorPalette = [
  '#42a5f5',
  '#66bb6a',
  '#ffca28',
  '#ab47bc',
  '#26a69a',
  '#ffa726',
  '#8d6e63',
  '#29b6f6',
  '#9ccc65',
  '#ff7043',
  '#5c6bc0',
];

const segmentColorMap = ref(new Map());

const getSegmentColor = (task) => {
  const key = task.segmentNo || task.id || '';
  if (!key) return '#eaeaea';

  if (segmentColorMap.value.has(key)) return segmentColorMap.value.get(key);

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const idx = hash % segmentColorPalette.length;
  const color = segmentColorPalette[idx];
  segmentColorMap.value.set(key, color);
  return color;
};

const hexToRgba = (hex, alpha = 0.18) => {
  if (!hex) return `rgba(234, 234, 234, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((ch) => ch + ch)
      .join('');
  if (c.length !== 6) return `rgba(234, 234, 234, ${alpha})`;
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getTaskStyle = (task) => {
  const segColor = getSegmentColor(task);
  return {
    borderLeftColor: segColor,
    backgroundColor: hexToRgba(segColor, 0.18),
  };
};

const getTaskClass = (task) => {
  switch (task.status) {
    case 0:
      return 'task-pill--create';
    case 1:
      return 'task-pill--published';
    case 2:
      return 'task-pill--running';
    case 3:
      return 'task-pill--finished';
    case 4:
      return 'task-pill--canceled';
    default:
      return 'task-pill--default';
  }
};

// ---------- 行高同步 & 滚动同步（看板视图） ----------
const lineCellRefs = ref([]); // 左侧每行 DOM
const rowRefs = ref([]); // 右侧每行 DOM

const syncRowHeights = () => {
  nextTick(() => {
    const rows = rowRefs.value || [];
    const lefts = lineCellRefs.value || [];
    rows.forEach((rowEl, index) => {
      const h = rowEl?.offsetHeight || 0;
      const leftCell = lefts[index];
      if (leftCell && h) {
        leftCell.style.height = h + 'px';
      }
    });
  });
};

onUpdated(syncRowHeights);

const headerRef = ref(null);
const contentMainRef = ref(null);
const headerScrollEl = ref(null);
const fixedColRef = ref(null);

const initHeaderScrollEl = () => {
  const comp = headerRef.value;
  headerScrollEl.value = comp?.$el?.querySelector?.('.calendar-scroll') || null;
};

const handleContentScroll = () => {
  const contentEl = contentMainRef.value;
  if (!contentEl) return;

  if (!headerScrollEl.value && headerRef.value) initHeaderScrollEl();

  // 横向：表头时间轴跟随内容滚动
  if (headerScrollEl.value) headerScrollEl.value.scrollLeft = contentEl.scrollLeft;

  // 纵向：左侧固定列跟随
  if (fixedColRef.value) fixedColRef.value.scrollTop = contentEl.scrollTop;
};

// 左侧列滚轮事件：不让它自己滚，把滚动量转移到右侧 content-main 上
const handleFixedColWheel = (event) => {
  if (!contentMainRef.value) return;
  contentMainRef.value.scrollTop += event.deltaY || 0;
  contentMainRef.value.scrollLeft += event.deltaX || 0;
  event.preventDefault();
};

// ---------- 生命周期 ----------
onMounted(() => {
  fetchList();
  nextTick(() => {
    initHeaderScrollEl();
    syncRowHeights();
  });
});
</script>

<style scoped>
.header-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
}

.table-parent {
  display: flex;
  flex-direction: column;
}

/* 看板视图：主内容区域占满剩余高度 */
.kanban-parent .content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 表头 / 表体布局（看板视图） */
.table-header {
  flex-shrink: 0;
  display: flex;
}

.table-content {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

/* 左侧固定列：船型 */
.fixed-col {
  flex: 0 0 150px;
  max-width: 260px;
  overflow: hidden;
}

.content-fixed {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  background: #f4f9ff;
}
.content-fixed::-webkit-scrollbar {
  display: none;
}

.fixed-header {
  background: #409eff;
  font-size: 14px;
  font-weight: bold;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
}

/* 左侧每行船型单元格 */
.line-cell {
  min-height: 40px;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
  box-sizing: border-box;
  font-size: 14px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  font-weight: 500;
}

/* 右侧区域（看板） */
.header-main,
.content-main {
  flex: 1;
  min-width: 0;
}

.content-main {
  overflow: auto; /* 唯一可见滚动条 */
}

/* 内容行 */
.table-rows {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: flex;
}

/* 日期单元格 */
.day-cell {
  flex: 0 0 auto;
  box-sizing: border-box;
  border-bottom: 1px solid #ebeef5;
  border-left: 1px solid #ebeef5;
  min-height: 40px;
  padding: 2px 4px;
  width: 180px;
}

.day-cell.weekend {
  background: #fafafa;
}

/* 任务块基础样式（看板卡片） */
.task-pill {
  position: relative;
  padding: 6px 8px;
  margin: 4px 0 8px 0px;
  border-radius: 6px;
  font-size: 12px;
  box-sizing: border-box;
  cursor: pointer;
  border-left: 3px solid transparent; /* 颜色由内联 style 控制 */
}

/* 文本 */
.task-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.task-meta {
  font-size: 11px;
  line-height: 1.4;
}

/* ✅ 进行中进度条 */
.task-progress {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-progress__bar {
  flex: 1;
  min-width: 0;
}

.task-progress__txt {
  font-size: 11px;
  color: #606266;
  white-space: nowrap;
}

:deep(.task-progress .el-progress) {
  width: 100%;
}

/* 底部：状态 + 操作一排 */
.task-footer {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* 状态块 */
.task-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--0 {
  background: #909399;
}
.status-dot--1 {
  background: #409eff;
}
.status-dot--2 {
  background: #e6a23c;
}
.status-dot--3 {
  background: #67c23a;
}
.status-dot--4 {
  background: #f56c6c;
}
.status-dot--default {
  background: #c0c4cc;
}

.status-text {
  color: #606266;
  font-size: 11px;
}

/* 操作 icon */
.task-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.task-action-icon {
  font-size: 14px;
  cursor: pointer;
  color: #606266;
  transition: color 0.15s;
}

.task-action-icon:hover {
  color: #409eff;
}

.task-action-icon.danger:hover {
  color: #f56c6c;
}

.task-mode {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  line-height: 1;
  color: #fff;
  pointer-events: none;
  transform: scale(0.8);
}

.task-mode--auto {
  background: #0679dc;
}

.task-mode--manual {
  background: #0679dc;
}

/* tooltip 样式 */
:deep(.task-tooltip) {
  font-size: 12px;
  line-height: 1.5;
}

:deep(.task-tooltip .tooltip-title) {
  font-weight: 600;
  margin-bottom: 4px;
  white-space: nowrap;
}

:deep(.task-tooltip .tooltip-row) {
  white-space: nowrap;
}
</style>
