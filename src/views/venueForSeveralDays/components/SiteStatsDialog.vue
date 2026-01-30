<template>
  <el-dialog
    v-model="innerVisible"
    fullscreen
    :show-close="false"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    append-to-body
    destroy-on-close
    class="stats-dialog"
  >
    <div class="stats-wrap" v-loading="loading">
      <!-- 头部：标题 + chips（内容区标题） + 关闭按钮 -->
      <div class="stats-header">
        <div class="stats-header-left">
          <div class="stats-title">
            曲面分段 · 周转率 & 利用率
          </div>
          <div class="stats-subtitle">
            按 <b>周 / 月</b> 统计当前场地任务的周转率、空闲面积与场地利用率。
          </div>
        </div>

        <div class="stats-header-right">
          <div class="stats-controls">
            <div class="chips">
              <div
                class="chip"
                :class="{ active: currentViewType === 'week' }"
                @click="handleViewTypeClick('week')"
              >
                按周统计
              </div>
              <div
                class="chip"
                :class="{ active: currentViewType === 'month' }"
                @click="handleViewTypeClick('month')"
              >
                按月统计
              </div>
            </div>
          </div>

          <!-- 自定义关闭按钮 -->
          <button class="stats-close-btn" @click="close" title="关闭">
            ×
          </button>
        </div>
      </div>

      <!-- 概览指标 -->
      <div class="metrics-row" v-if="summary">
        <div class="metric-card metric-card-range">
          <div class="metric-label">统计范围</div>
          <div class="metric-value">{{ summary.rangeLabel }}</div>
          <div class="metric-subvalue">
            任务时间 {{ summary.minDate }} ~ {{ summary.maxDate }}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">平均周转率</div>
          <div class="metric-value">
            {{ formatNumber(summary.avgTurnover, 2) }}
          </div>
          <div class="metric-subvalue">完工面积 / 平均在制面积</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">平均空闲面积</div>
          <div class="metric-value">
            {{ formatNumber(summary.avgIdleArea, 1) }} ㎡
          </div>
          <div class="metric-subvalue">以在制面积近似为占用面积</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">平均场地利用率</div>
          <div class="metric-value">
            {{ formatPercent(summary.avgUtilization) }}
          </div>
          <div class="metric-subvalue">≈ 平均在制面积 / 场地总面积</div>
        </div>
      </div>

      <!-- 表格区块：标题 + 表格 -->
      <div class="table-section">
        <div class="table-section-header">
          <div class="table-section-title">
            周 / 月周期明细
          </div>
          <div class="table-section-subtitle">
            按周期查看完工面积、在制面积以及场地利用情况，可一眼看出波峰波谷。
          </div>
        </div>

        <!-- 周 / 月明细表 -->
        <div class="table-wrapper">
          <table v-if="rows.length">
            <thead>
              <tr>
                <th class="th-period">周期</th>
                <th>完工面积(㎡)</th>
                <th>期初在制(㎡)</th>
                <th>期末在制(㎡)</th>
                <th>平均在制(㎡)</th>
                <th class="th-turnover">周转率</th>
                <th>平均空闲面积(㎡)</th>
                <th class="th-util">场地利用率</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.label">
                <td class="td-period">
                  <div class="period-label">{{ row.label }}</div>
                  <div class="muted period-range">
                    {{ formatDate(row.start) }} ~
                    {{ formatDate(addDays(row.end, -1)) }}
                  </div>
                </td>

                <td class="td-num">
                  {{ formatNumber(row.doneArea, 1) }}
                </td>
                <td class="td-num">
                  {{ formatNumber(row.wipStart, 1) }}
                </td>
                <td class="td-num">
                  {{ formatNumber(row.wipEnd, 1) }}
                </td>
                <td class="td-num">
                  {{ formatNumber(row.wipAvg, 1) }}
                </td>

                <!-- 周转率：数字 + 小条形图（按区间自动配色） -->
                <td class="td-turnover">
                  <div class="metric-cell">
                    <div
                      v-if="row.turnover !== null && !isNaN(row.turnover)"
                      class="mini-bar mini-bar-turn"
                      :class="getTurnoverColorClass(row)"
                      :title="`周转率：${formatNumber(row.turnover, 2)}`"
                    >
                      <div
                        class="mini-bar-fill"
                        :style="{ width: (getTurnoverRatio(row) * 100 || 0) + '%' }"
                      ></div>
                    </div>
                    <span v-if="row.turnover !== null" class="pill pill-plain">
                      {{ formatNumber(row.turnover, 2) }}
                    </span>
                    <span v-else class="muted">-</span>
                  </div>
                </td>

                <td class="td-num">
                  {{ formatNumber(row.idleAvg, 1) }}
                </td>

                <!-- 场地利用率：数字 + 小条形图（颜色固定） -->
                <td class="td-util">
                  <div class="metric-cell">
                    <div
                      v-if="row.utilization !== null && !isNaN(row.utilization)"
                      class="mini-bar mini-bar-util"
                      :title="`场地利用率：${formatPercent(row.utilization)}`"
                    >
                      <div
                        class="mini-bar-fill"
                        :style="{ width: (getUtilizationRatio(row) * 100 || 0) + '%' }"
                      ></div>
                    </div>
                    <span>{{ formatPercent(row.utilization) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="muted no-data">暂无数据</div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // v-model 显示控制
  modelValue: { type: Boolean, default: false },
  // 加载中
  loading: { type: Boolean, default: false },
  // 周 / 月
  viewType: { type: String, default: 'week' }, // 'week' | 'month'
  // 汇总信息：{ avgTurnover, avgIdleArea, avgUtilization, minDate, maxDate, rangeLabel }
  summary: {
    type: Object,
    default: null,
  },
  // 周期明细数组：父组件已经 normalize 好
  periodStats: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'update:viewType']);

const innerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const currentViewType = computed(() => props.viewType || 'week');
const rows = computed(() => props.periodStats || []);

const close = () => {
  emit('update:modelValue', false);
};

const handleViewTypeClick = (type) => {
  if (currentViewType.value === type) return;
  emit('update:viewType', type);
};

const addDays = (date, n) => {
  const d = new Date(date);
  if (!Number.isFinite(d.getTime())) return d;
  d.setDate(d.getDate() + n);
  return d;
};

const formatNumber = (val, digits = 1) =>
  val === null || val === undefined || isNaN(val)
    ? '-'
    : Number(val).toFixed(digits);

const formatPercent = (val) =>
  val === null || val === undefined || isNaN(val)
    ? '-'
    : (val * 100).toFixed(1) + '%';

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (!Number.isFinite(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

/** ===== 小条形图：周转率 & 利用率相对值 ===== */

// 周转率整体范围（用于算长度）
const turnoverStats = computed(() => {
  const vals = rows.value
    .map((r) =>
      r.turnover === null || r.turnover === undefined
        ? null
        : Number(r.turnover)
    )
    .filter((v) => v !== null && !isNaN(v));
  if (!vals.length) return { min: null, span: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || Math.abs(max) || 1;
  return { min, span };
});

const getTurnoverRatio = (row) => {
  const v =
    row.turnover === null || row.turnover === undefined
      ? null
      : Number(row.turnover);
  if (v === null || isNaN(v)) return 0;
  const { min, span } = turnoverStats.value;
  if (min === null) return 0;
  const ratio = (v - min) / span;
  return Math.max(0.08, Math.min(1, ratio)); // 最小 8%，避免太细
};

// 利用率整体范围（用于算长度）
const utilizationStats = computed(() => {
  const vals = rows.value
    .map((r) =>
      r.utilization === null || r.utilization === undefined
        ? null
        : Number(r.utilization)
    )
    .filter((v) => v !== null && !isNaN(v));
  if (!vals.length) return { min: null, span: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || Math.abs(max) || 1;
  return { min, span };
});

const getUtilizationRatio = (row) => {
  const v =
    row.utilization === null || row.utilization === undefined
      ? null
      : Number(row.utilization);
  if (v === null || isNaN(v)) return 0;
  const { min, span } = utilizationStats.value;
  if (min === null) return 0;
  const ratio = (v - min) / span;
  return Math.max(0.08, Math.min(1, ratio));
};

/** ===== 周转率颜色分档：慢 / 正常 / 快 ===== */
const getTurnoverColorClass = (row) => {
  const v =
    row.turnover === null || row.turnover === undefined
      ? null
      : Number(row.turnover);
  if (v === null || isNaN(v)) return '';

  if (currentViewType.value === 'week') {
    // 按周：<0.5 慢，0.5~1.2 正常，>1.2 快
    if (v < 0.5) return 'mini-bar-turn-low';
    if (v <= 1.2) return 'mini-bar-turn-mid';
    return 'mini-bar-turn-high';
  } else {
    // 按月：<1 慢，1~3 正常，>3 快（可以按实际再微调）
    if (v < 1) return 'mini-bar-turn-low';
    if (v <= 3) return 'mini-bar-turn-mid';
    return 'mini-bar-turn-high';
  }
};
</script>

<style scoped>
/* 全屏弹窗：铺满视口，并去掉外边距与圆角，隐藏外层滚动条 */
.stats-dialog :deep(.el-dialog) {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100%;
  height: 100vh;
  border-radius: 0;
  overflow: hidden;
}

/* 去掉默认头部（标题栏 + 关闭按钮） */
.stats-dialog :deep(.el-dialog__header) {
  display: none;
  padding: 0;
}
:deep(.el-dialog__body){
  height: calc(100vh - 40px) !important;
}

/* 弹窗内容区域铺满，高度固定且不出现滚动条 */
.stats-dialog :deep(.el-dialog__body) {
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* 统计弹窗样式（浅色炫彩版），使用 flex 纵向布局 */
.stats-wrap {
  background: radial-gradient(circle at top left, #eff6ff, #ffffff 40%, #fdf2ff);
  color: #111827;
  border-radius: 18px;
  padding: 18px 22px 16px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  height: calc(100vh - 100px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 头部固定在上面 */
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 14px;
}

/* 左右部分拆开，右侧可同时放 chips 和 关闭按钮 */
.stats-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}
.stats-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}
.stats-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.stats-wrap .chips {
  display: flex;
  gap: 8px;
}
.stats-wrap .chip {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  background: rgba(239, 246, 255, 0.9);
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.18s ease-out;
}
.stats-wrap .chip:hover {
  border-color: rgba(129, 140, 248, 0.6);
}
.stats-wrap .chip.active {
  border-color: rgba(129, 140, 248, 0.95);
  background: radial-gradient(circle at top left, #eef2ff, #e0f2fe);
  color: #1d4ed8;
  box-shadow: 0 0 18px rgba(129, 140, 248, 0.45);
}

/* 自定义关闭按钮样式 */
.stats-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(248, 250, 252, 0.96);
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease-out;
}
.stats-close-btn:hover {
  background: #fee2e2;
  border-color: #f97316;
  color: #b91c1c;
}

/* 指标区 */
.stats-wrap .metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

/* 指标卡 */
.stats-wrap .metric-card {
  position: relative;
  background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 45%, #fdf2ff 100%);
  border-radius: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(129, 140, 248, 0.7);
  box-shadow:
    0 10px 22px rgba(129, 140, 248, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
  overflow: hidden;
}
.metric-card-range {
  grid-column: span 1;
}
.stats-wrap .metric-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at top right,
    rgba(59, 130, 246, 0.25),
    transparent 55%
  );
  opacity: 0.7;
  pointer-events: none;
}
.stats-wrap .metric-label {
  position: relative;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
}
.stats-wrap .metric-value {
  position: relative;
  margin-top: 4px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}
.stats-wrap .metric-subvalue {
  position: relative;
  margin-top: 2px;
  font-size: 12px;
  color: #4b5563;
}

/* 表格区块 */
.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.table-section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}
.table-section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.table-section-title::before {
  content: "";
  width: 4px;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(180deg, #4f46e5, #0ea5e9);
}
.table-section-subtitle {
  font-size: 12px;
  color: #6b7280;
}

/* 表格区域占满剩余空间，内部滚动但隐藏滚动条 */
.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 4px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.9);

  -ms-overflow-style: none; /* IE/Edge */
  scrollbar-width: none; /* Firefox */
}
.table-wrapper::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* 统计表格浅色样式 */
.stats-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.stats-wrap thead {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.16),
    rgba(16, 185, 129, 0.12)
  );
}
.stats-wrap thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}
.stats-wrap th,
.stats-wrap td {
  padding: 7px 10px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  text-align: right;
  color: #111827;
  white-space: nowrap;
}
.th-period {
  min-width: 140px;
}
.th-turnover,
.th-util {
  min-width: 150px;
}
.stats-wrap th:first-child,
.stats-wrap td:first-child {
  text-align: left;
}
.stats-wrap tbody tr:nth-child(odd) {
  background: #ffffff;
}
.stats-wrap tbody tr:nth-child(even) {
  background: #f9fafb;
}
.stats-wrap tbody tr:hover {
  background: #e0f2fe;
}

/* 周期列单独做成浅底 + 两行 */
.td-period {
  background: linear-gradient(90deg, #f9fafb, #eff6ff);
  border-right: 1px solid rgba(226, 232, 240, 0.9);
}
.period-label {
  font-weight: 600;
}
.period-range {
  font-size: 11px;
}

/* 数值列对齐感稍强一点 */
.td-num {
  font-variant-numeric: tabular-nums;
}

/* 周转率 / 利用率的小条形图单元 */
.metric-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.td-turnover,
.td-util {
  font-variant-numeric: tabular-nums;
}

.mini-bar {
  width: 60px;
  height: 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  overflow: hidden;
  flex-shrink: 0;
}
.mini-bar-fill {
  height: 100%;
  border-radius: inherit;
}

/* 周转率：按区间自动配色 */
/* 慢：蓝紫偏冷 */
.mini-bar-turn-low .mini-bar-fill {
  background: linear-gradient(90deg, #0ea5e9, #6366f1);
}
/* 正常：青绿健康 */
.mini-bar-turn-mid .mini-bar-fill {
  background: linear-gradient(90deg, #10b981, #22c55e);
}
/* 快：橙红偏热 */
.mini-bar-turn-high .mini-bar-fill {
  background: linear-gradient(90deg, #f97316, #ef4444);
}

/* 场地利用率：颜色固定一档 */
.mini-bar-util .mini-bar-fill {
  background: linear-gradient(90deg, #4f46e5, #0ea5e9, #22c55e);
}

/* pill 和 muted */
.stats-wrap .pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  color: #111827;
  background: #ffffff;
}
.pill-plain {
  border-color: rgba(148, 163, 184, 0.7);
  background: #ffffff;
  color: #111827;
}
.stats-wrap .muted {
  color: #6b7280;
}

/* 无数据 */
.no-data {
  padding: 20px;
  text-align: center;
}
</style>
<style>

</style>
