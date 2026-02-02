<template>
  <Teleport to="body">
    <Transition name="stats-fade">
      <div
        v-if="innerVisible"
        class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click.self="close"
        @keydown.escape="close"
      >
        <!-- loading overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 z-10 flex items-center justify-center bg-white/60"
        >
          <svg class="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        </div>

        <div class="stats-wrap">
          <!-- 头部：标题 + chips + 关闭按钮 -->
          <div class="flex items-start justify-between gap-4 mb-3.5">
            <div class="flex flex-col gap-1">
              <div class="text-xl font-bold text-slate-900">
                曲面分段 · 周转率 &amp; 利用率
              </div>
              <div class="text-[13px] text-gray-500">
                按 <b>周 / 月</b> 统计当前场地任务的周转率、空闲面积与场地利用率。
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="flex gap-2">
                <button
                  v-for="t in [{ key: 'week', label: '按周统计' }, { key: 'month', label: '按月统计' }]"
                  :key="t.key"
                  class="px-3 py-1 rounded-full text-xs border cursor-pointer transition-all duration-150"
                  :class="currentViewType === t.key
                    ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-sky-50 text-blue-700 shadow-[0_0_18px_rgba(129,140,248,0.45)]'
                    : 'border-transparent bg-blue-50/90 text-gray-500 hover:border-indigo-400/60'"
                  @click="handleViewTypeClick(t.key)"
                >
                  {{ t.label }}
                </button>
              </div>

              <button
                class="w-[30px] h-[30px] rounded-full border border-slate-300/60 bg-slate-50 text-gray-500 text-lg flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-blue-100 hover:border-orange-500 hover:text-red-700"
                @click="close"
                title="关闭"
              >
                ×
              </button>
            </div>
          </div>

          <!-- 概览指标 -->
          <div v-if="summary" class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 mb-4">
            <div class="metric-card">
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

          <!-- 表格区块 -->
          <div class="flex-1 min-h-0 flex flex-col">
            <div class="flex flex-col gap-1 mb-1.5">
              <div class="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 before:content-[''] before:w-1 before:h-[18px] before:rounded-full before:bg-gradient-to-b before:from-indigo-600 before:to-sky-500">
                周 / 月周期明细
              </div>
              <div class="text-xs text-gray-500">
                按周期查看完工面积、在制面积以及场地利用情况，可一眼看出波峰波谷。
              </div>
            </div>

            <div class="flex-1 min-h-0 overflow-auto mt-1 rounded-xl bg-slate-50/90 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)] scrollbar-hide">
              <table v-if="rows.length" class="w-full border-collapse text-xs">
                <thead class="bg-gradient-to-r from-blue-500/[0.16] to-emerald-500/[0.12]">
                  <tr>
                    <th class="sticky top-0 z-[1] min-w-[140px] px-2.5 py-[7px] border-b border-slate-200/90 text-left text-slate-900 whitespace-nowrap">周期</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-slate-200/90 text-right text-slate-900 whitespace-nowrap">完工面积(㎡)</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-slate-200/90 text-right text-slate-900 whitespace-nowrap">期初在制(㎡)</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-slate-200/90 text-right text-slate-900 whitespace-nowrap">期末在制(㎡)</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-slate-200/90 text-right text-slate-900 whitespace-nowrap">平均在制(㎡)</th>
                    <th class="sticky top-0 z-[1] min-w-[150px] px-2.5 py-[7px] border-b border-slate-200/90 text-right text-slate-900 whitespace-nowrap">周转率</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-slate-200/90 text-right text-slate-900 whitespace-nowrap">平均空闲面积(㎡)</th>
                    <th class="sticky top-0 z-[1] min-w-[150px] px-2.5 py-[7px] border-b border-slate-200/90 text-right text-slate-900 whitespace-nowrap">场地利用率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in rows"
                    :key="row.label"
                    class="odd:bg-white even:bg-gray-50 hover:bg-sky-50 transition-colors"
                  >
                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-left bg-gradient-to-r from-gray-50 to-blue-50/60 border-r border-r-slate-200/90">
                      <div class="font-semibold">{{ row.label }}</div>
                      <div class="text-[11px] text-gray-500">
                        {{ formatDate(row.start) }} ~
                        {{ formatDate(addDays(row.end, -1)) }}
                      </div>
                    </td>

                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-right tabular-nums">
                      {{ formatNumber(row.doneArea, 1) }}
                    </td>
                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-right tabular-nums">
                      {{ formatNumber(row.wipStart, 1) }}
                    </td>
                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-right tabular-nums">
                      {{ formatNumber(row.wipEnd, 1) }}
                    </td>
                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-right tabular-nums">
                      {{ formatNumber(row.wipAvg, 1) }}
                    </td>

                    <!-- 周转率 -->
                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-right tabular-nums">
                      <div class="inline-flex items-center gap-1.5">
                        <div
                          v-if="row.turnover !== null && !isNaN(row.turnover)"
                          class="w-[60px] h-[7px] rounded-full bg-slate-300/25 overflow-hidden shrink-0"
                          :title="`周转率：${formatNumber(row.turnover, 2)}`"
                        >
                          <div
                            class="h-full rounded-full"
                            :class="getTurnoverBarClass(row)"
                            :style="{ width: (getTurnoverRatio(row) * 100 || 0) + '%' }"
                          ></div>
                        </div>
                        <span v-if="row.turnover !== null" class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-slate-300/70 bg-white text-slate-900">
                          {{ formatNumber(row.turnover, 2) }}
                        </span>
                        <span v-else class="text-gray-500">-</span>
                      </div>
                    </td>

                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-right tabular-nums">
                      {{ formatNumber(row.idleAvg, 1) }}
                    </td>

                    <!-- 场地利用率 -->
                    <td class="px-2.5 py-[7px] border-b border-slate-200/90 text-right tabular-nums">
                      <div class="inline-flex items-center gap-1.5">
                        <div
                          v-if="row.utilization !== null && !isNaN(row.utilization)"
                          class="w-[60px] h-[7px] rounded-full bg-slate-300/25 overflow-hidden shrink-0"
                          :title="`场地利用率：${formatPercent(row.utilization)}`"
                        >
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500"
                            :style="{ width: (getUtilizationRatio(row) * 100 || 0) + '%' }"
                          ></div>
                        </div>
                        <span>{{ formatPercent(row.utilization) }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="p-5 text-center text-gray-500">暂无数据</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  viewType: { type: String, default: 'week' },
  summary: { type: Object, default: null },
  periodStats: { type: Array, default: () => [] },
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

const turnoverStats = computed(() => {
  const vals = rows.value
    .map((r) =>
      r.turnover === null || r.turnover === undefined ? null : Number(r.turnover)
    )
    .filter((v) => v !== null && !isNaN(v));
  if (!vals.length) return { min: null, span: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || Math.abs(max) || 1;
  return { min, span };
});

const getTurnoverRatio = (row) => {
  const v = row.turnover === null || row.turnover === undefined ? null : Number(row.turnover);
  if (v === null || isNaN(v)) return 0;
  const { min, span } = turnoverStats.value;
  if (min === null) return 0;
  const ratio = (v - min) / span;
  return Math.max(0.08, Math.min(1, ratio));
};

const utilizationStats = computed(() => {
  const vals = rows.value
    .map((r) =>
      r.utilization === null || r.utilization === undefined ? null : Number(r.utilization)
    )
    .filter((v) => v !== null && !isNaN(v));
  if (!vals.length) return { min: null, span: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || Math.abs(max) || 1;
  return { min, span };
});

const getUtilizationRatio = (row) => {
  const v = row.utilization === null || row.utilization === undefined ? null : Number(row.utilization);
  if (v === null || isNaN(v)) return 0;
  const { min, span } = utilizationStats.value;
  if (min === null) return 0;
  const ratio = (v - min) / span;
  return Math.max(0.08, Math.min(1, ratio));
};

const getTurnoverBarClass = (row) => {
  const v = row.turnover === null || row.turnover === undefined ? null : Number(row.turnover);
  if (v === null || isNaN(v)) return '';
  if (currentViewType.value === 'week') {
    if (v < 0.5) return 'bg-gradient-to-r from-sky-500 to-indigo-500';
    if (v <= 1.2) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    return 'bg-gradient-to-r from-orange-500 to-red-500';
  } else {
    if (v < 1) return 'bg-gradient-to-r from-sky-500 to-indigo-500';
    if (v <= 3) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    return 'bg-gradient-to-r from-orange-500 to-red-500';
  }
};
</script>

<style scoped>
.stats-wrap {
  background: radial-gradient(circle at top left, #eff6ff, #ffffff 40%, #f2f2ff);
  color: #111827;
  border-radius: 18px;
  padding: 18px 22px 16px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  width: calc(100vw - 40px);
  height: calc(100vh - 40px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.metric-card {
  position: relative;
  background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 45%, #f2f6ff 100%);
  border-radius: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(181, 188, 249, 0.7);
  box-shadow:
    0 10px 22px rgba(129, 140, 248, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
  overflow: hidden;
}
.metric-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.25), transparent 55%);
  opacity: 0.7;
  pointer-events: none;
}
.metric-label {
  position: relative;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
}
.metric-value {
  position: relative;
  margin-top: 4px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}
.metric-subvalue {
  position: relative;
  margin-top: 2px;
  font-size: 12px;
  color: #4b5563;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.stats-fade-enter-active,
.stats-fade-leave-active {
  transition: opacity 0.2s ease;
}
.stats-fade-enter-from,
.stats-fade-leave-to {
  opacity: 0;
}
</style>
