<template>
  <Teleport to="body">
    <Transition name="stats-fade">
      <div
        v-if="innerVisible"
        class="stats-theme fixed inset-0 z-[2000] flex items-center justify-center bg-foreground/10 backdrop-blur-sm"
        @click.self="close"
        @keydown.escape="close"
      >
        <!-- loading overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 z-10 flex items-center justify-center bg-card/70"
        >
          <svg class="h-8 w-8 animate-spin text-destructive" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        </div>

        <div class="stats-wrap">
          <!-- 头部：标题 + chips + 关闭按钮 -->
          <div class="flex items-start justify-between gap-4 mb-3.5">
            <div class="flex flex-col gap-1">
              <div class="text-xl font-bold text-foreground">
                曲面分段 · 周转率 &amp; 利用率
              </div>
              <div class="text-[13px] text-muted-foreground">
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
                    ? 'border-destructive/60 bg-destructive/10 text-destructive shadow-[0_0_18px_rgba(231,111,81,0.35)]'
                    : 'border-transparent bg-muted/70 text-muted-foreground hover:border-destructive/40'"
                  @click="handleViewTypeClick(t.key)"
                >
                  {{ t.label }}
                </button>
              </div>

              <button
                class="w-[30px] h-[30px] rounded-full border border-border bg-card text-muted-foreground text-lg flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive"
                @click="close"
                title="关闭"
              >
                ×
              </button>
            </div>
          </div>

          <!-- 概览指标 -->
          <div v-if="summary" class="stats-metric-container mb-4">
            <div class="metric-card">
              <div class="stats-metric-title">统计范围</div>
              <div class="metric-value">{{ summary.rangeLabel }}</div>
              <div class="metric-subvalue">
                任务时间 {{ summary.minDate }} ~ {{ summary.maxDate }}
              </div>
            </div>
            <div class="metric-card">
              <div class="stats-metric-title">平均周转率</div>
              <div class="metric-value">
                {{ formatNumber(summary.avgTurnover, 2) }}
              </div>
              <div class="metric-subvalue">完工面积 / 平均在制面积</div>
            </div>
            <div class="metric-card">
              <div class="stats-metric-title">平均空闲面积</div>
              <div class="metric-value">
                {{ formatNumber(summary.avgIdleArea, 1) }} ㎡
              </div>
              <div class="metric-subvalue">以在制面积近似为占用面积</div>
            </div>
            <div class="metric-card">
              <div class="stats-metric-title">平均场地利用率</div>
              <div class="metric-value">
                {{ formatPercent(summary.avgUtilization) }}
              </div>
              <div class="metric-subvalue">≈ 平均在制面积 / 场地总面积</div>
            </div>
          </div>

          <!-- 表格区块 -->
          <div class="flex-1 min-h-0 flex flex-col">
            <div class="flex flex-col gap-1 mb-1.5">
              <div class="inline-flex items-center gap-2 text-sm font-semibold text-foreground before:content-[''] before:w-1 before:h-[18px] before:rounded-full before:bg-gradient-to-b before:from-primary before:to-accent">
                周 / 月周期明细
              </div>
              <div class="text-xs text-muted-foreground">
                按周期查看完工面积、在制面积以及场地利用情况，可一眼看出波峰波谷。
              </div>
            </div>

            <div class="flex-1 min-h-0 overflow-auto mt-1 rounded-xl bg-muted/60 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] scrollbar-hide">
              <table v-if="rows.length" class="w-full border-collapse text-xs">
                <thead class="bg-gradient-to-r from-primary/15 to-secondary/25">
                  <tr>
                    <th class="sticky top-0 z-[1] min-w-[140px] px-2.5 py-[7px] border-b border-border text-left text-foreground whitespace-nowrap">周期</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-border text-right text-foreground whitespace-nowrap">完工面积(㎡)</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-border text-right text-foreground whitespace-nowrap">期初在制(㎡)</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-border text-right text-foreground whitespace-nowrap">期末在制(㎡)</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-border text-right text-foreground whitespace-nowrap">平均在制(㎡)</th>
                    <th class="sticky top-0 z-[1] min-w-[150px] px-2.5 py-[7px] border-b border-border text-right text-foreground whitespace-nowrap">周转率</th>
                    <th class="sticky top-0 z-[1] px-2.5 py-[7px] border-b border-border text-right text-foreground whitespace-nowrap">平均空闲面积(㎡)</th>
                    <th class="sticky top-0 z-[1] min-w-[150px] px-2.5 py-[7px] border-b border-border text-right text-foreground whitespace-nowrap">场地利用率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in rows"
                    :key="row.label"
                    class="odd:bg-card even:bg-muted/50 hover:bg-primary/5 transition-colors"
                  >
                    <td class="px-2.5 py-[7px] border-b border-border text-left bg-gradient-to-r from-muted/60 to-primary/5 border-r border-r-border">
                      <div class="font-semibold">{{ row.label }}</div>
                      <div class="text-[11px] text-muted-foreground">
                        {{ formatDate(row.start) }} ~
                        {{ formatDate(addDays(row.end, -1)) }}
                      </div>
                    </td>

                    <td class="px-2.5 py-[7px] border-b border-border text-right tabular-nums">
                      {{ formatNumber(row.doneArea, 1) }}
                    </td>
                    <td class="px-2.5 py-[7px] border-b border-border text-right tabular-nums">
                      {{ formatNumber(row.wipStart, 1) }}
                    </td>
                    <td class="px-2.5 py-[7px] border-b border-border text-right tabular-nums">
                      {{ formatNumber(row.wipEnd, 1) }}
                    </td>
                    <td class="px-2.5 py-[7px] border-b border-border text-right tabular-nums">
                      {{ formatNumber(row.wipAvg, 1) }}
                    </td>

                    <!-- 周转率 -->
                    <td class="px-2.5 py-[7px] border-b border-border text-right tabular-nums">
                      <div class="inline-flex items-center gap-1.5">
                        <div
                          v-if="row.turnover !== null && !isNaN(row.turnover)"
                          class="w-[60px] h-[7px] rounded-full bg-border/60 overflow-hidden shrink-0"
                          :title="`周转率：${formatNumber(row.turnover, 2)}`"
                        >
                          <div
                            class="h-full rounded-full"
                            :class="getTurnoverBarClass(row)"
                            :style="{ width: (getTurnoverRatio(row) * 100 || 0) + '%' }"
                          ></div>
                        </div>
                        <span v-if="row.turnover !== null" class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-border bg-card text-foreground">
                          {{ formatNumber(row.turnover, 2) }}
                        </span>
                        <span v-else class="text-muted-foreground">-</span>
                      </div>
                    </td>

                    <td class="px-2.5 py-[7px] border-b border-border text-right tabular-nums">
                      {{ formatNumber(row.idleAvg, 1) }}
                    </td>

                    <!-- 场地利用率 -->
                    <td class="px-2.5 py-[7px] border-b border-border text-right tabular-nums">
                      <div class="inline-flex items-center gap-1.5">
                        <div
                          v-if="row.utilization !== null && !isNaN(row.utilization)"
                          class="w-[60px] h-[7px] rounded-full bg-border/60 overflow-hidden shrink-0"
                          :title="`场地利用率：${formatPercent(row.utilization)}`"
                        >
                          <div
                            class="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                            :style="{ width: (getUtilizationRatio(row) * 100 || 0) + '%' }"
                          ></div>
                        </div>
                        <span>{{ formatPercent(row.utilization) }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="p-5 text-center text-muted-foreground">暂无数据</div>
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
    if (v < 0.5) return 'bg-gradient-to-r from-primary to-secondary';
    if (v <= 1.2) return 'bg-gradient-to-r from-secondary to-accent';
    return 'bg-gradient-to-r from-accent to-destructive';
  } else {
    if (v < 1) return 'bg-gradient-to-r from-primary to-secondary';
    if (v <= 3) return 'bg-gradient-to-r from-secondary to-accent';
    return 'bg-gradient-to-r from-accent to-destructive';
  }
};
</script>

<style scoped>
.stats-theme {
  --background: 0 0% 100%;
  --foreground: 197 37% 24%;
  --card: 0 0% 100%;
  --card-foreground: 197 37% 24%;
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
}

.stats-wrap {
  background: linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%);
  color: hsl(var(--foreground));
  border-radius: 18px;
  padding: 18px 22px 16px;
  border: 1px solid hsl(var(--border));
  box-shadow: 0 18px 40px rgba(38, 70, 83, 0.14);
  width: calc(100vw - 40px);
  height: calc(100vh - 40px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.stats-metric-container {
  overflow: auto;
  display: flex;
  gap: 16px;
  scroll-snap-type: x mandatory;
  width: 100%;
  padding: 2px 6px 10px;
}

.stats-metric-container:hover > .metric-card:not(:hover) {
  opacity: 0.25;
}

.metric-card {
  position: relative;
  flex: 1 1 220px;
  min-width: 220px;
  scroll-snap-align: start;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 14px;
  padding: 18px 16px;
  border: 1px solid rgba(38, 70, 83, 0.12);
  /* box-shadow: 0 10px 26px rgba(38, 70, 83, 0.18); */
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  overflow: hidden;
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}
.metric-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(231, 111, 81, 0.18), transparent 55%);
  opacity: 0.7;
  pointer-events: none;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(38, 70, 83, 0.2);
}

.stats-metric-title {
  position: relative;
  width: 100%;
  display: inline-block;
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  margin: 0 auto 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: hsl(var(--muted-foreground));
}
.metric-value {
  position: relative;
  margin-top: 0;
  font-size: 20px;
  font-weight: 600;
  color: hsl(var(--foreground));
  text-align: center;
}
.metric-subvalue {
  position: relative;
  margin-top: 6px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  text-align: center;
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
