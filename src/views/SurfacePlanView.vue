<script setup lang="ts" name="CurvedSurfaceTaskList">
import { computed, getCurrentInstance, nextTick, onMounted, onUpdated, reactive, ref } from 'vue';
import calendarHeader from './taskList/components/CalendarHeader.vue';
import taskListData from './taskList/mock';

type TaskStatus = 0 | 1 | 2 | 3 | 4 | number;

interface SegmentTask {
  id?: string | number;
  segmentNo?: string;
  segmentName?: string;
  status?: TaskStatus;
  planStart?: string;
  planFinish?: string;
  graphJson?: string;
  fixtureCode?: string;
  responsibleName?: string;
  responsibleCode?: string;
  vesselTypeName?: string;
  parentVesselId?: string | number;
  isAuto?: number;
}

interface VesselRecord {
  id?: string | number;
  typeName?: string;
  segmentCount?: number;
  segments?: SegmentTask[];
}

interface ScheduleDay {
  date: string;
  list: SegmentTask[];
}

interface ScheduleLine {
  id?: string | number;
  lineName: string;
  raw: VesselRecord;
  list: ScheduleDay[];
}

const proxy = getCurrentInstance()?.proxy as any;

// ---------- 查询 ----------
const tableData = ref<ScheduleLine[]>([]); // 看板视图用的数据

const statusOptions = [
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
];

const formatDate = (val?: string | null) => {
  if (!val) return '-';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${String(y).slice(-2)}/${m}/${day}`;
};

const fixtureNameMap = reactive<Record<string, string>>({});

const graphJson = ref({});
const geoDialog = ref(false);
const current = ref<Record<string, any>>({});
const polygonEditor = ref(null);

// ---------- 时间轴相关：日期范围 & days ----------
const startDate = ref(''); // 'YYYY-MM-DD'
const endDate = ref(''); // 'YYYY-MM-DD'
const cellWidth = 180;

// 提取日期部分
const extractDate = (val: string) => (val ? String(val).slice(0, 10) : '');

function parseYMD(str: string) {
  if (!str) return null;
  const [y, m, d] = String(str).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatYMD(d: Date) {
  if (!(d instanceof Date)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 根据接口 records 计算全局时间范围（最早 planStart / planFinish ~ 最晚）
const computeDateRange = (records: VesselRecord[]) => {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  records.forEach((vessel) => {
    (vessel.segments || []).forEach((seg: any) => {
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

  const res: Array<{ key: string; dateStr: string; weekIndex: number; isWeekend: boolean }> = [];
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
  const map: Record<string, Record<string, SegmentTask[]>> = {};
  (tableData.value || []).forEach((line) => {
    const lineName = line.lineName;
    const lineMap: Record<string, SegmentTask[]> = {};
    (line.list || []).forEach((dayItem) => {
      lineMap[dayItem.date] = dayItem.list || [];
    });
    map[lineName] = lineMap;
  });
  return map;
});

// ---------- 接口数据 -> 看板时间轴数据结构 ----------
const buildScheduleTableData = (records: VesselRecord[]) => {
  return (records || []).map((vessel) => {
    const segList = Array.isArray(vessel.segments) ? vessel.segments : [];
    const dateMap = new Map<string, SegmentTask[]>();

    segList.forEach((seg: SegmentTask) => {
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
        dateMap.get(dateKey)!.push(taskBase);

        const y = cur.getFullYear();
        const m = cur.getMonth() + 1;
        const d = cur.getDate();
        cur = new Date(y, m - 1, d + 1);
      }
    });

    const list = Array.from(dateMap.entries()).map(([date, tasks]) => ({ date, list: tasks }));

    const segCount = vessel.segmentCount ?? segList.length ?? 0;
    const baseName = vessel.typeName ?? '未命名';
    const lineName = segCount ? `${baseName}（${segCount}）` : baseName;

    return { id: vessel.id, lineName, raw: vessel, list };
  });
};

const getStatusLabel = (val: TaskStatus) => {
  return statusOptions.find((opt) => opt.value === val)?.label ?? '未知状态';
};

const getTaskMeta = (task: SegmentTask) => {
  const parts: string[] = [];
  const fixtureCode = task.fixtureCode ?? '';
  if (fixtureCode) {
    parts.push(fixtureNameMap[fixtureCode] || fixtureCode);
  }
  if (task.responsibleName) parts.push(task.responsibleName);
  if (parts.length) return parts.join(' | ');
  return task.segmentNo ?? '';
};

const getTaskTitle = (task: SegmentTask) => {
  const fixtureCode = task.fixtureCode ?? '';
  const fixtureLabel = fixtureCode ? fixtureNameMap[fixtureCode] || fixtureCode : '';
  const lines = [
    `${task.segmentNo ?? ''} - ${task.segmentName ?? ''}`.trim(),
    `船型：${task.vesselTypeName ?? ''}`,
    `责任人：${task.responsibleName || ''}`,
    `计划：${formatDate(task.planStart)} ~ ${formatDate(task.planFinish)}`,
    `胎架：${fixtureLabel}`,
    `状态：${getStatusLabel(task.status)}`,
  ];
  return lines.filter(Boolean).join('\n');
};

const getStatusDotClass = (val?: TaskStatus) => {
  switch (val) {
    case 0:
      return 'bg-slate-400';
    case 1:
      return 'bg-amber-500';
    case 2:
      return 'bg-emerald-500';
    case 3:
      return 'bg-sky-500';
    case 4:
      return 'bg-rose-500';
    default:
      return 'bg-slate-300';
  }
};

// ---------- 进行中：随机进度（一次查询周期内固定） ----------
const progressMap = ref<Map<string, number>>(new Map());
const getTaskProgress = (task: SegmentTask) => {
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
  try {
    const records = (taskListData as VesselRecord[]) || [];

    // ✅ 每次查询成功后刷新随机进度
    progressMap.value = new Map();

    // 计算时间范围
    computeDateRange(records);
    // 看板视图数据
    tableData.value = buildScheduleTableData(records);
  } catch (error: any) {
    proxy?.showError?.(error?.message || '获取任务列表失败');
  } finally {
  }
};

// ---------- 地形 ----------
const openGeo = async (row: SegmentTask) => {
  current.value = row || {};
  graphJson.value = current.value?.graphJson ? JSON.parse(current.value.graphJson) : {};
  geoDialog.value = true;
};

const saveGeo = async (val: any) => {
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

const segmentColorMap = ref<Map<string, string>>(new Map());

const getSegmentColor = (task: SegmentTask) => {
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

const hexToRgba = (hex: string, alpha = 0.1) => {
  if (!hex) return `rgba(240, 240, 240, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((ch) => ch + ch)
      .join('');
  if (c.length !== 6) return `rgba(240, 240, 240, ${alpha})`;
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getTaskStyle = (task: SegmentTask) => {
  const segColor = getSegmentColor(task);
  return {
    borderLeftColor: segColor,
    backgroundColor: hexToRgba(segColor, 0.18),
  };
};

// ---------- 行高同步 & 滚动同步（看板视图） ----------
const lineCellRefs = ref<HTMLElement[]>([]); // 左侧每行 DOM
const rowRefs = ref<HTMLElement[]>([]); // 右侧每行 DOM

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

const headerRef = ref<any>(null);
const contentMainRef = ref<HTMLElement | null>(null);
const headerScrollEl = ref<HTMLElement | null>(null);
const fixedColRef = ref<HTMLElement | null>(null);

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
const handleFixedColWheel = (event: WheelEvent) => {
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

<template>
  <div class="flex h-full flex-col gap-4 bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 p-6 text-slate-800">
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
      <!-- 表头：左"船型" + 右时间轴 -->
      <div class="flex shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div class="flex w-[168px] shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-sm font-semibold tracking-wide text-slate-700">
          船型
        </div>
        <div class="min-w-0 flex-1 px-2 py-2">
          <calendarHeader
            ref="headerRef"
            :start-date="startDate"
            :end-date="endDate"
            :cell-width="cellWidth"
          />
        </div>
      </div>

      <!-- 表格主体：左侧固定船型列 + 右侧日期网格 -->
      <div class="flex min-h-0 flex-1 overflow-hidden">
        <!-- 左侧固定列 -->
        <div class="w-[168px] shrink-0 border-r border-slate-200 bg-slate-50/80">
          <div
            ref="fixedColRef"
            class="h-full overflow-y-auto px-2 py-2"
            @wheel="handleFixedColWheel"
          >
            <div
              v-for="(item, rowIndex) in tableData"
              :key="item.lineName || item.id || rowIndex"
              class="flex min-h-[40px] items-center border-b border-slate-100 px-3 text-sm font-medium text-slate-700 transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50 hover:text-indigo-700"
              :ref="(el) => (lineCellRefs[rowIndex] = el)"
            >
              {{ item.lineName }}
            </div>
            <div v-if="!tableData.length" class="px-2 py-8 text-sm text-slate-400">
              暂无船型
            </div>
          </div>
        </div>

        <!-- 右侧可滚动内容 -->
        <div ref="contentMainRef" class="min-w-0 flex-1 overflow-auto" @scroll="handleContentScroll">
          <div class="flex min-w-max flex-col">
            <div
              v-for="(item, rowIndex) in tableData"
              :key="item.lineName || item.id || rowIndex"
              class="flex min-h-[40px]"
              :ref="(el) => (rowRefs[rowIndex] = el)"
            >
              <div
                v-for="day in days"
                :key="day.key"
                class="relative shrink-0 border-b border-r border-slate-100 p-2 text-xs transition-colors"
                :class="
                  day.isWeekend
                    ? 'bg-violet-50/50 hover:bg-violet-50'
                    : rowIndex % 2 === 0
                      ? 'bg-white hover:bg-slate-50/80'
                      : 'bg-slate-50/40 hover:bg-slate-50'
                "
                :style="{ width: cellWidth + 'px' }"
              >
                <div
                  v-for="(task, tIndex) in taskMap[item.lineName]?.[day.dateStr] || []"
                  :key="(task.id || task.segmentNo || 't') + '-' + tIndex"
                  class="mb-2 last:mb-0"
                >
                  <div
                    class="rounded-lg border border-slate-200/80 border-l-4 bg-white p-2.5 shadow-sm transition hover:shadow-md"
                    :style="getTaskStyle(task)"
                    :title="getTaskTitle(task)"
                  >
                    <div
                      v-if="Number(task.isAuto) === 1"
                      class="mb-1 inline-flex h-5 items-center rounded-full bg-sky-50 px-2 text-[10px] font-semibold text-sky-600 ring-1 ring-sky-200/80"
                    >
                      APS
                    </div>

                    <div class="text-sm font-semibold leading-tight text-slate-800">
                      {{ task.segmentName }}
                    </div>

                    <div class="mt-1 text-[11px] text-slate-500">
                      {{ getTaskMeta(task) }}
                    </div>

                    <div class="mt-1 text-[11px] text-slate-400">
                      {{ formatDate(task.planStart) }} ~ {{ formatDate(task.planFinish) }}
                    </div>

                    <div v-if="Number(task.status) === 1" class="mt-2 flex items-center gap-2">
                      <div class="h-1.5 flex-1 rounded-full bg-slate-100">
                        <div
                          class="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                          :style="{ width: getTaskProgress(task) + '%' }"
                        ></div>
                      </div>
                      <div class="w-10 text-right text-[10px] text-slate-500">
                        {{ getTaskProgress(task) }}%
                      </div>
                    </div>

                    <div class="mt-2 flex items-center justify-between">
                      <div class="flex items-center gap-2 text-[11px] text-slate-500">
                        <span class="h-2 w-2 rounded-full" :class="getStatusDotClass(task.status)"></span>
                        {{ getStatusLabel(task.status) }}
                      </div>
                      <button
                        type="button"
                        class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 hover:shadow"
                        @click.stop="openGeo(task)"
                        aria-label="场地地形"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          class="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.6"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- <PolygonEditor
      ref="polygonEditor"
      v-model="geoDialog"
      title="场地地形编辑"
      @save="saveGeo"
      :data="graphJson"
    /> -->
  </div>
</template>
