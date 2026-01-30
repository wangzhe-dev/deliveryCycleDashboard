<template>
  <div class="h-full p20">
    <!-- 搜索区域 -->
    <div>
      <WsllSearchForm
        :columns="searchColumns"
        :search-param="searchForm"
        :search="handleSearch"
        :reset="handleReset"
        label-width="90px"
        :search-col="{ xs: 2, sm: 2, md: 2, lg: 3, xl: 4 }"
        class="mb10"
      />
    </div>

    <!-- 顶部：左侧视图切换 + 右侧新增按钮 -->
    <div class="row-between header-row mb10">
      <div class="row-start" style="gap: 10px">
        <el-radio-group v-model="viewMode">
          <el-radio-button label="kanban">看板视图</el-radio-button>
          <el-radio-button label="table">表格视图</el-radio-button>
        </el-radio-group>
      </div>

      <div class="row-start" style="gap: 10px">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增</el-button>
        <el-button type="success" :icon="Monitor" @click="goSpaceBoard">多场地任务制作</el-button>
        <el-button type="warning" :icon="Histogram" @click="goMultiDayBoard">场地多天任务制作</el-button>
      </div>
    </div>

    <!-- 看板视图：无分页，自动充满高度 -->
    <div v-if="viewMode === 'kanban'" class="table-parent kanban-parent" style="height: calc(100% - 140px)">
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
                <div v-for="day in days" :key="day.key" class="day-cell" :class="{ weekend: day.isWeekend }">
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
                      <div class="tooltip-row">计划：{{ formatDate(task.planStart) }} ~ {{ formatDate(task.planFinish) }}</div>
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
                          {{ fixtureNameMap[task.fixtureCode] || task.fixtureCode || '' }} | {{ task.responsibleName }}
                        </span>
                        <span v-else>{{ task.segmentNo }}</span>
                      </div>

                      <div class="task-meta fs12">
                        <span>{{ formatDate(task.planStart) }} ~ {{ formatDate(task.planFinish) }}</span>
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
                          <span class="status-dot" :class="'status-dot--' + (task.status ?? 'default')"></span>
                          <span class="status-text">
                            {{ statusOptions.find((opt) => opt.value === task.status)?.label ?? '未知状态' }}
                          </span>
                        </div>

                        <!-- 操作 icon：编辑 / 地形 / 删除 -->
                        <div class="task-actions">
                          <el-icon class="task-action-icon" @click.stop="handleEdit(task)"><Edit /></el-icon>
                          <el-icon class="task-action-icon" @click.stop="openGeo(task)"><Location /></el-icon>
                          <el-icon class="task-action-icon danger" @click.stop="handleDelete(task)"><Delete /></el-icon>
                        </div>
                      </div>
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /content -->
    </div>

    <!-- 表格视图：有分页 -->
    <div v-else class="table-parent table-parent--table" style="height: calc(100% - 140px)">
      <div class="table-wrapper">
        <vxe-table
          ref="tableRef"
          height="100%"
          border
          :loading="loading"
          :data="tableListData"
          align="center"
          row-id="id"
          :column-config="{ resizable: true }"
          :tree-config="{ childrenField: 'children', showLine: true, showRootLine: false }"
        >
          <vxe-column type="seq" width="100" fixed="left" title="序号" tree-node />
          <vxe-column field="segmentName" title="分段名称" min-width="200">
            <template #default="{ row }">
              <span v-if="row.__isVessel">{{ `${row.typeName}(${row.segments?.length || 0})` }}</span>
              <span v-else>{{ row.segmentName }}</span>
            </template>
          </vxe-column>
          <vxe-column field="segmentNo" title="分段编码" min-width="180">
            <template #default="{ row }">
              <span v-if="row.__isVessel">{{ row.typeCode }}</span>
              <span v-else>{{ row.segmentNo }}</span>
            </template>
          </vxe-column>
          <vxe-column field="responsibleName" title="负责人" min-width="120" />
          <vxe-column field="planStart" title="计划开始时间" min-width="180" />
          <vxe-column field="planFinish" title="计划完成时间" min-width="180" />
          <vxe-column field="status" title="状态" min-width="110">
            <template #default="{ row }">
              <span v-if="row.__isVessel"></span>
              <el-tag
                v-else
                :type="
                  (row.status === 0 && 'warning') ||
                  (row.status === 3 && 'success') ||
                  (row.status === 4 && 'info') ||
                  'primary'
                "
              >
                {{ statusOptions.find((opt) => opt.value === row.status)?.label ?? row.status ?? '' }}
              </el-tag>
            </template>
          </vxe-column>
          <vxe-column title="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button v-if="!row.__isVessel" link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
              <el-button v-if="!row.__isVessel" link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
              <el-button v-if="!row.__isVessel" link type="primary" icon="Edit" @click="openGeo(row)">地形</el-button>
            </template>
          </vxe-column>
        </vxe-table>
      </div>

      <!-- 表格视图专用分页 -->
      <div class="pagination-wrapper">
        <vxe-pager
          background
          :current-page="pageable.current"
          :page-size="pageable.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pageable.total"
          @page-change="onPageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <AEDialog ref="aeDialogRef" :status-options="statusOptions" :site-options="siteOptions" @refresh="refreshList" />

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
import { getCurrentInstance, onMounted, onUpdated, provide, reactive, ref, computed, nextTick, watch } from 'vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import { Edit, Delete, Location, Monitor, Histogram } from '@element-plus/icons-vue';

import AEDialog from './AEDialog.vue';
import calendarHeader from './components/CalendarHeader.vue';
import PolygonEditor from '@/views/curvedSurface/polygonEditor/index.vue';
import WsllSearchForm from '@/components/WsllSearchForm';

import {
  segmentTaskDelete,
  segmentTaskList,
  fetchVenueList,
  segmentTaskDetail,
  segmentTaskUpdate,
  fetchShipList,
  curvedSegment,
} from './services';

const { proxy } = getCurrentInstance() || {};
const router = useRouter();

// ---------- 视图切换 ----------
const viewMode = ref('kanban'); // 'kanban' | 'table'

// ---------- 查询 & 下拉 ----------
const tableData = ref([]);       // 看板视图用的数据
const tableListData = ref([]);   // 表格视图用的数据（树形）
const loading = ref(false);
const pageable = reactive({ current: 1, size: 20, total: 0 });

const enumMap = ref(new Map());
const shipOptions = ref([]);
provide('enumMap', enumMap);

const setEnumMap = (key, data) => {
  const next = new Map(enumMap.value);
  next.set(key, data);
  enumMap.value = next;
};

setEnumMap('projectNumber', shipOptions.value);

const getCurrentMonthRange = () => [
  dayjs().startOf('month').format('YYYY-MM-DD'),
  dayjs().endOf('month').format('YYYY-MM-DD'),
];

const searchForm = reactive({
  segmentName: '',
  segmentNo: '',
  responsibleName: '',
  siteId: '',
  status: '',
  planStartRange: getCurrentMonthRange(),
  planFinishRange: [],
  projectNumber: '',
});

const loadShipOptions = async () => {
  try {
    const res = await fetchShipList();
    const list = Array.isArray(res?.data) ? res.data : [];
    shipOptions.value = list;
    setEnumMap('projectNumber', shipOptions.value);
  } catch (err) {
    console.error('获取船号列表失败', err);
    shipOptions.value = [];
    setEnumMap('projectNumber', shipOptions.value);
  }
};
loadShipOptions();

const searchColumns = [
  {
    label: '船号',
    prop: 'projectNumber',
    search: {
      el: 'select',
      key: 'projectNumber',
      defaultValue: 'W0283',
      props: { placeholder: '请选择船号', clearable: true, filterable: true },
      enum: () => shipOptions.value,
    },
  },
  {
    label: '分段名称',
    prop: 'segmentName',
    search: { el: 'input', key: 'segmentName', props: { placeholder: '输入名称', clearable: true } },
  },
  {
    label: '分段编码',
    prop: 'segmentNo',
    search: { el: 'input', key: 'segmentNo', props: { placeholder: '输入编码', clearable: true } },
  },
  {
    label: '负责人',
    prop: 'responsibleName',
    search: { el: 'input', key: 'responsibleName', props: { placeholder: '输入负责人', clearable: true } },
  },
  {
    label: '计划场地',
    prop: 'siteId',
    fieldNames: { label: 'label', value: 'value' },
    search: { el: 'select', key: 'siteId', props: { filterable: true, placeholder: '选择场地' } },
  },
  {
    label: '状态',
    prop: 'status',
    fieldNames: { label: 'label', value: 'value' },
    search: { el: 'select', key: 'status', props: { placeholder: '选择状态' } },
  },
  {
    label: '计划开始',
    prop: 'planStartRange',
    search: {
      el: 'date-picker',
      key: 'planStartRange',
      props: {
        type: 'daterange',
        unlinkPanels: true,
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        clearable: true,
      },
    },
  },
  {
    label: '计划完成',
    prop: 'planFinishRange',
    search: {
      el: 'date-picker',
      key: 'planFinishRange',
      props: {
        type: 'daterange',
        unlinkPanels: true,
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        clearable: true,
      },
    },
  },
];

const statusOptions = [
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
];
enumMap.value.set('status', statusOptions);

const formatDate = (val) => {
  if (!val) return '-';
  const d = dayjs(val);
  return d.isValid() ? d.format('YY/MM/DD') : val;
};

const siteOptions = ref([]);
const fixtureNameMap = reactive({});

const graphJson = ref({});
const geoDialog = ref(false);
const current = ref({});
const tableRef = ref(null);
const aeDialogRef = ref(null);
const polygonEditor = ref(null);

// ---------- 时间轴相关：日期范围 & days ----------
const startDate = ref(''); // 'YYYY-MM-DD'
const endDate = ref('');   // 'YYYY-MM-DD'
const cellWidth = 180;

const loadFixtureNames = async () => {
  try {
    const res = await curvedSegment();
    const list = res?.data || [];
    list.forEach((item) => {
      if (item.fixtureCode) {
        fixtureNameMap[item.fixtureCode] = item.fixtureName || item.fixtureCode;
      }
    });
  } catch (e) {
    // ignore
  }
};

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

// ---------- 接口数据 -> 表格视图数据结构 ----------
const hydrateRecord = (record, markAsParent = false) => {
  if (!record) return record;
  const next = {
    ...record,
    segmentNo: record.segmentNo ?? record.segmentCode ?? record.refSegmentNo ?? '',
    segmentName: record.segmentName ?? record.segmentNameCn ?? record.vesselType ?? record.typeName ?? '',
    vesselType: record.vesselType ?? record.typeName ?? record.modelType ?? '',
    responsibleName: record.responsibleName ?? record.responsible ?? '',
    planStart: record.planStart ?? record.planStartTime ?? '',
    planFinish: record.planFinish ?? record.planFinishTime ?? '',
  };
  if (markAsParent) {
    const vesselLabel = record.typeName || record.vesselType || record.segmentName || '';
    if (vesselLabel) {
      next.segmentName = vesselLabel;
      next.segmentNo = vesselLabel;
    }
    next.__isVessel = true;
    const childList = Array.isArray(record.segments) ? record.segments : [];
    next.segments = childList;
    next.children = childList.map((item) => hydrateRecord(item));
    if (!next.id) next.id = vesselLabel || `vessel-${Math.random().toString(36).slice(2)}`;
  } else if (!next.id) {
    next.id = record.id ?? `${next.segmentNo}-${Math.random().toString(36).slice(2)}`;
  }
  return next;
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
    const res = await segmentTaskList({
      pageNum: pageable.current,
      pageSize: pageable.size,
      ...searchForm,
    });
    const data = res?.data || {};
    const records = Array.isArray(data.records) ? data.records : [];

    // ✅ 每次查询成功后刷新随机进度
    progressMap.value = new Map();

    // 计算时间范围
    computeDateRange(records);
    // 看板视图数据
    tableData.value = buildScheduleTableData(records);
    // 表格视图数据
    tableListData.value = records.map((item) => hydrateRecord(item, true));

    pageable.total = data.total || 0;
  } catch (error) {
    proxy?.showError?.(error?.message || '获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

const onPageChange = ({ currentPage, pageSize }) => {
  pageable.current = currentPage;
  pageable.size = pageSize;
  fetchList();
};

const handleSearch = () => {
  pageable.current = 1;
  tableData.value = [];
  tableListData.value = [];
  fetchList();
};

const handleReset = () => {
  Object.assign(searchForm, {
    segmentName: '',
    segmentNo: '',
    responsibleName: '',
    siteId: '',
    status: '',
    planStartRange: getCurrentMonthRange(),
    planFinishRange: [],
    projectNumber: '',
  });
  pageable.current = 1;
  fetchList();
};

const loadSiteOptions = async () => {
  try {
    const res = await fetchVenueList();
    const list = res?.data || [];
    siteOptions.value = list.map((item) => ({ label: item.venueName, value: `${item.id}` }));
    enumMap.value.set('siteId', siteOptions.value);
  } catch (error) {
    proxy?.showError?.(error?.message || '获取场地列表失败');
  }
};

// ---------- 新增 / 编辑 / 删除 / 地形 ----------
const handleAdd = () => {
  aeDialogRef.value?.resetForm?.();
  aeDialogRef.value?.openDialog('add');
};

const goSpaceBoard = () => {
  router.push('/zl/curvedSurface/space/curvedSurface/spaceLayout');
};
const goMultiDayBoard = () => {
  router.push('/zl/curvedSurface/space/curvedSurface/venueForSeveralDays');
};

const handleEdit = async (row) => {
  if (!row?.id) {
    proxy?.showError?.('缺少任务 ID，无法编辑');
    return;
  }
  try {
    const res = await segmentTaskDetail({ id: row.id });
    const detail = res?.data || {};
    aeDialogRef.value?.openDialog('edit', detail);
  } catch (error) {
    proxy?.showError?.(error?.message || '获取任务详情失败');
  }
};

const handleDelete = (row) => {
  proxy?.$modal
    ?.confirm(`确认删除【${row.segmentName || row.segmentNo}】吗？`)
    .then(async () => {
      const res = await segmentTaskDelete({ id: row.id });
      proxy?.responseMsg(res).then(() => fetchList());
    })
    .catch(() => {});
};

const refreshList = (info) => {
  if (info?.mode !== 'add') {
    fetchList();
  } else {
    pageable.current = 1;
    fetchList();
  }
};

const openGeo = async (row) => {
  const res = await segmentTaskDetail({ id: row.id });
  current.value = res.data;
  graphJson.value = current.value.graphJson ? JSON.parse(current.value.graphJson) : {};
  geoDialog.value = true;
};

const saveGeo = async (val) => {
  current.value.graphJson = JSON.stringify(val);
  await segmentTaskUpdate(current.value);
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
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
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
const rowRefs = ref([]);      // 右侧每行 DOM

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
  loadSiteOptions();
  fetchList();
  loadFixtureNames();
  nextTick(() => {
    initHeaderScrollEl();
    syncRowHeights();
  });
});

// 视图切换：切回看板时重新初始化滚动相关 DOM
watch(viewMode, (val) => {
  if (val === 'kanban') {
    nextTick(() => {
      initHeaderScrollEl();
      syncRowHeights();
    });
  }
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

.table-wrapper {
  flex: 1;
  min-height: 0;
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

/* 分页（表格视图下使用） */
.pagination-wrapper {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
