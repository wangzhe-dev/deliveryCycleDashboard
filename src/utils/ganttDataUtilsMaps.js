// ============================== 甘特图数据工具类 ===============================
import moment from 'moment';

function calculateRange(start, end, base, opts = {}) {
  const { pxPerDay = 450, hoursPerSegment = 4 } = opts;

  const SECONDS_PER_SEGMENT = hoursPerSegment * 3600;
  // 24h / 4h = 6 段，因此每段像素 = pxPerDay / (24 / hoursPerSegment)
  const PIXELS_PER_SEGMENT = pxPerDay / (24 / hoursPerSegment);

  const startTime = moment(start).valueOf();
  const endTime = moment(end).valueOf();
  const baseTime = moment(base).startOf('day').valueOf();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return { leftPx: 0, widthPx: 0, totalSeconds: 0, totalHours: 0, st: undefined, et: undefined };
  }

  const startOffsetSec = (startTime - baseTime) / 1000;
  const durationSec = (endTime - startTime) / 1000;

  const leftPx = (startOffsetSec / SECONDS_PER_SEGMENT) * PIXELS_PER_SEGMENT;
  const widthPx = (durationSec / SECONDS_PER_SEGMENT) * PIXELS_PER_SEGMENT;

  return {
    leftPx,
    widthPx,
    totalSeconds: durationSec,
    totalHours: durationSec / 3600,
    st: moment(startTime).format('YYYY-MM-DD HH:mm'),
    et: moment(endTime).format('YYYY-MM-DD HH:mm'),
  };
}

function buildWorkRanges(dateList, baseDay, options = {}) {
  const { pxPerDay = 450 } = options;
  if (!Array.isArray(dateList) || !dateList.length) return [];
  // 颜色
  const COLOR_BY_TYPE = {
    work: 'green', // 绿色
    idle: 'rgb(250, 200, 88)', // 黄色
    rest: 'rgba(100, 100, 100, 0.5)', // 灰色
  };
  // idle 小于 3 分钟不生成
  const MIN_IDLE_MS = 3 * 60 * 1000;

  // 工具函数
  const toMs = (v) => (v == null ? NaN : moment(v).valueOf());

  const mergeIntervals = (intervals) => {
    const arr = (intervals || [])
      .map(([s, e]) => [toMs(s), toMs(e)])
      .filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e) && e > s)
      .sort((a, b) => a[0] - b[0]);

    if (!arr.length) return [];
    const res = [arr[0].slice()];
    for (let i = 1; i < arr.length; i++) {
      const [s, e] = arr[i];
      const last = res[res.length - 1];
      if (s <= last[1]) last[1] = Math.max(last[1], e);
      else res.push([s, e]);
    }
    return res;
  };

  const clipToWindow = (intervals, [ws, we]) => {
    const W = [toMs(ws), toMs(we)];
    if (!Number.isFinite(W[0]) || !Number.isFinite(W[1]) || W[1] <= W[0]) return [];
    const out = [];
    for (const [s, e] of intervals) {
      const cs = Math.max(W[0], s);
      const ce = Math.min(W[1], e);
      if (ce > cs) out.push([cs, ce]);
    }
    return out;
  };

  // baseSet(A) \ subSet(B) —— 两者都应是并集
  const subtractIntervals = (baseSet, subSet) => {
    const A = mergeIntervals(baseSet);
    const B = mergeIntervals(subSet);
    if (!A.length) return [];
    if (!B.length) return A.slice();

    const out = [];
    let j = 0;
    for (const [as, ae] of A) {
      let cur = as;
      while (j < B.length && B[j][1] <= cur) j++;
      let k = j;
      while (k < B.length && B[k][0] < ae) {
        const [bs, be] = B[k];
        if (bs > cur) out.push([cur, Math.min(bs, ae)]);
        cur = Math.max(cur, be);
        if (cur >= ae) break;
        k++;
      }
      if (cur < ae) out.push([cur, ae]);
    }
    return out;
  };

  const unionIntervals = (a, b) => mergeIntervals([...(a || []), ...(b || [])]);

  // 将区间转为像素段并附加颜色；对 idle 应用最小时长过滤
  const toRects = (intervals, type) => {
    const rects = [];
    for (const [s, e] of intervals) {
      // 仍然保留 idle < 3min 过滤的话就在这里判断
      const r = calculateRange(s, e, baseDay, { pxPerDay });
      if (r.widthPx > 0) {
        rects.push({
          type,
          color: COLOR_BY_TYPE[type],
          leftPx: r.leftPx,
          widthPx: r.widthPx,
          st: r.st,
          et: r.et,
        });
      }
    }
    return rects;
  };

  // —— 主流程：按“排班窗口”分组收集（严格匹配 calendarStartTime & calendarEndTime） —— //
  // 结构：Map<"calS|calE", { window:[calS,calE], work:[], rest:[] }>
  const windowMap = new Map();

  dateList.forEach((dayItem) => {
    const works = Array.isArray(dayItem.workTime) ? dayItem.workTime : [];
    works.forEach((w) => {
      const calS = toMs(w.calendarStartTime);
      const calE = toMs(w.calendarEndTime);
      if (!Number.isFinite(calS) || !Number.isFinite(calE) || calE <= calS) return;

      const key = `${calS}|${calE}`;
      if (!windowMap.has(key)) {
        windowMap.set(key, { window: [calS, calE], work: [], rest: [] });
      }
      const group = windowMap.get(key);

      // 归入“与该窗口相等”的工作段
      const s = toMs(w.startTime);
      const e = toMs(w.endTime);
      if (Number.isFinite(s) && Number.isFinite(e) && e > s) {
        group.work.push([s, e]);
      }

      // 归入该窗口的休息段（overTime 可能有多段）
      if (Array.isArray(w.overTime)) {
        for (const r of w.overTime) {
          const rs = toMs(r && r.startTime);
          const re = toMs(r && r.endTime);
          if (Number.isFinite(rs) && Number.isFinite(re) && re > rs) {
            group.rest.push([rs, re]);
          }
        }
      }
    });
  });

  // —— 对每个“窗口”独立计算：有效工作 / 休息 / 空闲 —— //
  const out = [];
  for (const { window, work, rest } of windowMap.values()) {
    const W = window;

    const workAll = mergeIntervals(work);
    const restAll = mergeIntervals(rest);

    const workInW = mergeIntervals(clipToWindow(workAll, W));
    const restInW = mergeIntervals(clipToWindow(restAll, W));

    // 有效工作 = 工作 - 休息（都限制在该窗口内）
    const workMinusRest = subtractIntervals(workInW, restInW);

    // 空闲 = 窗口 - (有效工作 ∪ 休息)
    const occupied = unionIntervals(workMinusRest, restInW);
    const idleInW = subtractIntervals([W], occupied);

    // 转像素段（idle < 3 分钟已过滤）
    out.push(...toRects(workMinusRest, 'work'));
    out.push(...toRects(restInW, 'rest'));
    out.push(...toRects(idleInW, 'idle'));
  }

  return out;
}

export async function getTableData({ id, queryParams, emit, refs }) {
  const {
    selectId,
    tableData,
    dateArr,
    expandRowKeys,
    sourcData,
    loadStrategy,
    startDay,
    endDay,
    dayStar,
    rowWidth,
    tableWidth,
    pxPerDay = 0,
    findProductionGanttVO,
  } = refs;

  selectId.value = selectId.value || id;
  tableData.value = [];
  dateArr.value = [];
  expandRowKeys.value = [];

  const startTime = queryParams?.date?.[0] ? moment(queryParams.date[0]).valueOf() : null;
  const endTime = queryParams?.date?.[1] ? moment(queryParams.date[1]).valueOf() : null;

  try {
    const { data } = await findProductionGanttVO({
      detailIdList: [id],
      ...queryParams,
      startTime,
      endTime,
    });

    // 1) 原始数据入参保持不变
    sourcData.value = data?.[0]?.ganttVOList || [];
    loadStrategy.value = data?.[0]?.loadStrategy;

    // 2) 计算表头时间范围与日期数组
    startDay.value = null;
    endDay.value = null;
    dayStar.value = null;

    findEarliestAndLatestTime(data?.[0], { startDay, endDay });
    dayStar.value = generateDateArray(startDay.value, endDay.value)[0];
    let ranges = [];
    // ③ 修改：在 nextTick 中补全 tableData（构建像素区间）
    nextTick(() => {
      dateArr.value = generateDateArray(startDay.value, endDay.value);
      // rowWidth.value = dateArr.value.length * 449.99;
      // 表头长度（按你的要求 +1）
      const headerLen = dateArr.value?.length || 0;

      // 计算每一天的像素宽度（可视宽度 / 表头长度）
      // 你有 tableWidth.value 的可视宽度
      pxPerDay.value = headerLen > 0 ? (tableWidth.value - 120) / headerLen : 450;

      // 如果仍需要整行总宽，可用动态 pxPerDay 计算
      rowWidth.value = dateArr.value.length * pxPerDay.value;

      for (let i = 0; i < sourcData.value.length; i++) {
        const element = sourcData.value[i];
        ranges.push({
          ...element,
          // 将产线编码附加到每个矩形，便于渲染阶段做差异化着色
          _rectsWork: buildWorkRanges(element.dateList, dayStar.value, {
            pxPerDay: pxPerDay.value,
          }).map((r) => ({
            ...r,
            productionLineCode: element.productionLineCode,
          })),
        });
      }
      tableData.value = ranges;
      emit('getDateArr', dateArr.value);
    });
  } finally {
    // loading 控制在外层
  }
}
// leftPx：从当天 00:00 开始的像素偏移
// dayStr：当天的任意时间/日期字符串（会取 startOf('day')）
// opts：{ pxPerDay, clamp, roundToMin }
//   - pxPerDay：一天对应的像素宽（默认 450）
//   - clamp：是否把时间夹取在 [00:00, 24:00] 之间（默认 true）
//   - roundToMin：按多少分钟取整（默认 1，建议 1/5/15）
export function calculateTimeFromLeft(leftPx, dayStr, opts = {}) {
  const { pxPerDay = 450, clamp = true, roundToMin = 1 } = opts;

  const MINUTES_PER_DAY = 24 * 60; // 1440
  const minutesPerPixel = MINUTES_PER_DAY / pxPerDay;

  const offsetMinutes = leftPx * minutesPerPixel;
  return moment(dayStr).startOf('day').add(offsetMinutes, 'minutes').format('HH:mm');
}
export function findEarliestAndLatestTime(arr, { startDay, endDay }) {
  if (!arr) return;
  startDay.value = moment(arr.planStartTime).format('YYYY-MM-DD HH:mm');
  endDay.value = moment(arr.planEndTime).format('YYYY-MM-DD HH:mm');
}

// 根据返回的数据，计算表头开始日期-结束日期的集合
function generateDateArray(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const dateArray = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dateArray.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateArray;
}
