<template>
  <div class="calendar-header">
    <div
      class="calendar-scroll"
      :style="{ '--cell-width': cellWidth + 'px' }"
    >
      <table class="calendar-table">
        <thead v-if="days.length">
          <!-- 行1：年 / 月 -->
          <tr class="row-month">
            <th
              v-for="m in months"
              :key="m.key"
              class="cell cell-month"
              :colspan="m.dayCount"
            >
              {{ m.year }}-{{ String(m.month).padStart(2, '0') }}
            </th>
          </tr>

          <!-- 行2：日 -->
          <tr class="row-day">
            <th
              v-for="d in days"
              :key="d.key"
              class="cell cell-day"
              :class="{ weekend: d.isWeekend }"
            >
              {{ d.month < 10 ? `0${d.month}` : d.month }}-{{ d.day }}
            </th>
          </tr>

          <!-- 行3：星期 -->
          <tr class="row-week">
            <th
              v-for="d in days"
              :key="d.key + '-w'"
              class="cell cell-week"
              :class="{ weekend: d.isWeekend }"
            >
              {{ d.weekLabel }}
            </th>
          </tr>
        </thead>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** 开始日期：'2025-01-15' / Date 对象 */
  startDate: {
    type: [String, Date],
    required: true,
  },
  /** 结束日期：'2026-02-05' / Date 对象 */
  endDate: {
    type: [String, Date],
    required: true,
  },
  /** 每个日期单元格宽度（px） */
  cellWidth: {
    type: Number,
    default: 40,
  },
});

/** 工具：把输入转成“零点”的 Date，避免时区抖动 */
function normalizeDate(val) {
  const d = val instanceof Date ? new Date(val) : new Date(String(val));
  // 防止非法日期
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 生成 [start, end] 之间的所有日期（含头尾） */
const days = computed(() => {
  const start = normalizeDate(props.startDate);
  const end = normalizeDate(props.endDate);
  if (!start || !end || start > end) return [];

  const result = [];
  // 简单防护，避免有人传入特别夸张的范围（比如 50 年）
  const maxDays = 366 * 10; // 超过 10 年就直接截断
  let i = 0;

  let cur = start;
  while (cur <= end && i < maxDays) {
    const year = cur.getFullYear();
    const month = cur.getMonth() + 1;
    const day = cur.getDate();
    const weekIndex = cur.getDay(); // 0=周日, 1=周一

    const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
    const isWeekend = weekIndex === 0 || weekIndex === 6;

    result.push({
      date: new Date(year, month - 1, day),
      key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year,
      month,
      day,
      weekIndex,
      weekLabel: weekMap[weekIndex],
      isWeekend,
    });

    // 下一天（直接加 1 天）
    cur = new Date(year, month - 1, day + 1);
    i++;
  }

  return result;
});

/** 根据 days 计算月份段，用来给年/月行做 colspan */
const months = computed(() => {
  const res = [];
  if (!days.value.length) return res;

  let currentYear = days.value[0].year;
  let currentMonth = days.value[0].month;
  let count = 0;

  for (const d of days.value) {
    if (d.year === currentYear && d.month === currentMonth) {
      count++;
    } else {
      res.push({
        key: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        year: currentYear,
        month: currentMonth,
        dayCount: count,
      });
      currentYear = d.year;
      currentMonth = d.month;
      count = 1;
    }
  }

  // 最后一个月补上
  res.push({
    key: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
    year: currentYear,
    month: currentMonth,
    dayCount: count,
  });

  return res;
});
</script>

<style scoped>
.calendar-header {
  width: 100%;
}

/* 横向区域：改成只裁剪，不自己滚动 */
.calendar-scroll {
  width: 100%;
  /* 关键修改：禁止表头自身横向滚动，只作为一个可裁剪容器 */
  overflow-x: hidden;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
}

.calendar-scroll::-webkit-scrollbar {
  display: none; /* Chrome / Edge / Safari */
}

/* 表格 */
.calendar-table {
  border-collapse: collapse;
  border-spacing: 0;
  width: auto;
  table-layout: fixed;
  font-size: 12px;
}

/* 通用单元格样式 */
.cell {
  border-left: 1px solid hsl(var(--border));
  border-bottom: 1px solid hsl(var(--border));
  padding: 4px 0;
  text-align: center;
  white-space: nowrap;
  min-width: var(--cell-width, 40px);
  box-sizing: border-box;
}

/* 年/月行 */
.row-month .cell-month {
  background-color: hsl(var(--muted));
  font-weight: 600;
}

/* 日行 */
.row-day .cell-day {
  background-color: hsl(var(--background));
}

/* 星期行 */
.row-week .cell-week {
  background-color: hsl(var(--background));
}

/* 周末高亮（淡一点） */
.weekend {
  background-color: hsl(var(--secondary) / 0.25);
  color: hsl(var(--foreground));
}
</style>
