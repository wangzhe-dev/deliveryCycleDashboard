// ============================== 甘特图数据工具类 ===============================

import moment from 'moment';
import { BG_COLOR_MAP, FIXED_LANE_ORDER, STAGE_COLOR_MAP } from './ganttConstants';

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
    findDetailsByIdListV2,
  } = refs;

  selectId.value = selectId.value || id;
  tableData.value = [];
  dateArr.value = [];
  expandRowKeys.value = [];

  const startTime = queryParams.date?.[0] ? moment(queryParams.date[0]).valueOf() : null;
  const endTime = queryParams.date?.[1] ? moment(queryParams.date[1]).valueOf() : null;

  try {
    const { data } = await findDetailsByIdListV2({
      detailIdList: [id],
      ...queryParams,
      startTime,
      endTime,
    });

    sourcData.value = data?.[0]?.productProcessVOList || [];
    loadStrategy.value = data?.[0]?.loadStrategy;

    startDay.value = null;
    endDay.value = null;
    dayStar.value = null;

    findEarliestAndLatestTime(sourcData.value, { startDay, endDay });
    dayStar.value = generateDateArray(startDay.value, endDay.value)[0];

    await asyncBatchExecute(sourcData.value, 10, async (processItem, pIndex) => {
      initProcessRow(processItem, pIndex, dayStar.value);
    });
    nextTick(() => {
      dateArr.value = generateDateArray(startDay.value, endDay.value);
      tableData.value = sourcData.value;
      rowWidth.value = dateArr.value.length * 449.99;
      
      emit('getDateArr', dateArr.value);
    });
  } finally {
    // loading.value = false;
  }
}

export async function asyncBatchExecute(list, batchSize, handler) {
  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize);
    await Promise.all(batch.map((item, index) => handler(item, i + index)));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
// ============================== 初始化数据 ===============================
export function initProcessRow(item, index, baseDay) {
  item.unid = `${index}-${moment().valueOf()}`; // 使用唯一的 unid
  item.block = null;

  // 计算开始和结束时间
  const obj = calculateRange(item.startTime, item.endTime, baseDay);
  const planObj = calculateRange(
    item.startTime,
    moment(item.planEndtime).format('YYYY-MM-DD') + ' 23:59:00',
    baseDay,
  );

  item.leftPx = obj.leftPx;
  item.widthPx = obj.widthPx;
  item.planLeftPx = planObj.leftPx + planObj.widthPx;

  // 处理子阶段
  item.children.forEach((subItem, subIndex) => {
    initChildStage(subItem, index, subIndex, item.planEndtime, baseDay);
  });
}

// ============================== 初始化子阶段 ===============================
export function initChildStage(j, pIndex, jIndex, planEndtime, baseDay) {
  j.unid = `${pIndex}-${moment().valueOf()}-${jIndex}`; // 为每个子阶段添加唯一的ID
  delete j.children; // 删除无用的 children 数据

  generateStageAndInsertLanes(j, planEndtime, baseDay);
  fillLaneWorkTime(j, baseDay);
}

// ============================== 生成阶段并插入产线数据 ===============================
export function generateStageAndInsertLanes(j, planEndtime, baseDay) {
  const stages = [
    { name: '下料', start: j.xlStartTime, end: j.xlEndTime },
    { name: '小组', start: j.xzStartTime, end: j.xzEndTime },
    { name: '大组', start: j.dzStartTime, end: j.dzEndTime },
  ];

  j.stageArr = stages.map((s) => {
    const range = calculateRange(s.start, s.end, baseDay);
    return {
      name: s.name,
      leftPx: range.leftPx,
      widthPx: range.widthPx,
      bgColor: getStageColor(s.name, planEndtime < s.end),
      workColor: getWorkColor(s.name, planEndtime < s.end),
      startTime: s.start,
      endTime: s.end,
    };
  });

  // 固定产线顺序并初始化数据
  j.laneList = FIXED_LANE_ORDER.map((item) => ({ ...item, workTime: [], overTime: [] }));

  // 处理换产逻辑
  const changeovers = [];
  const [xl, xz, dz] = j.stageArr;
  if (moment(xz?.xzStartTime).isAfter(xl?.xlEndTime)) {
    const range = calculateRange(xl.xlEndTime, xz.xzStartTime, baseDay);
    changeovers.push({ index: 2, ds: 'XLXZ', range });
  }
  if (moment(dz?.dzStartTime).isAfter(xz?.xzEndTime)) {
    const range = calculateRange(xz.xzEndTime, dz.dzStartTime, baseDay);
    changeovers.push({ index: 6, ds: 'XZDZ', range });
  }

  // 插入换产数据
  changeovers.forEach((ch) => {
    j.laneList.splice(ch.index, 0, {
      type: '换产',
      ds: ch.ds,
      workTime: [{ leftPx: ch.range.leftPx, widthPx: ch.range.widthPx, bgColor: '#ffa500' }],
      overTime: [],
    });
  });

  // 对阶段进行排序
  const typeOrder = ['下料', '换产', '小组', '换产', '大组'];
  j.laneMatrix = typeOrder.map((type) => j.laneList.filter((l) => l.type === type));
}

// ============================== 填充工作时间 ===============================
export function fillLaneWorkTime(j, baseDay) {
  j.dateList.forEach((w) => {
    if (w.workTime && w.type !== '换产时间') {
      w.workTime.forEach((ww) => {
        const lane = j.laneList.find(
          (l) => l.type === w.type && w.productionLineCode.includes(l.ds),
        );
        if (!lane) return;

        const range = calculateRange(ww.startTime, ww.endTime, baseDay);
        lane.workTime.push({
          leftPx: range.leftPx,
          widthPx: range.widthPx,
          productionLineCode: w.productionLineCode,
          productionLineName: w.productionLineName,
          st: moment(ww.startTime).format('YYYY-MM-DD HH:mm'),
          et: moment(ww.endTime).format('YYYY-MM-DD HH:mm'),
          bgColor: BG_COLOR_MAP[w.productionLineCode] || '',
        });

        lane.fixedRhythm = w.fixedRhythm;
        lane.productionLineCode = w.productionLineCode;
        lane.productionLineName = w.productionLineName;

        if (ww.overTime?.length) {
          ww.overTime.forEach((over) => {
            const overRange = calculateRange(over.startTime, over.endTime, baseDay);
            lane.overTime.push({
              leftPx: overRange.leftPx,
              widthPx: overRange.widthPx,
              startTime: moment(over.startTime).format('YYYY-MM-DD HH:mm'),
              endTime: moment(over.endTime).format('YYYY-MM-DD HH:mm'),
            });
          });
        }
      });
    }
  });
}

// ============================== 获取工作颜色 ===============================
export function getWorkColor(stageName, isDelayed) {
  if (!isDelayed) {
    if (stageName === '小组') return 'blue';
    if (stageName === '大组') return '#f8b606';
    return 'green';
  }
  return 'red';
}

// ============================== 获取阶段颜色 ===============================
export function getStageColor(stageName, isDelayed) {
  const stage = STAGE_COLOR_MAP[stageName];
  return isDelayed ? stage?.late : stage?.onTime;
}
  
export function calculateRange(start, end, base) {
  const PIXELS_PER_DAY = 450;
  const HOURS_PER_SEGMENT = 4;
  const SECONDS_PER_SEGMENT = HOURS_PER_SEGMENT * 3600;
  const PIXELS_PER_SEGMENT = PIXELS_PER_DAY / 6;

  const startTime = new Date(start);
  const endTime = new Date(end);
  const baseTime = new Date(base);
  baseTime.setHours(0, 0, 0, 0);

  const startOffset = (startTime - baseTime) / 1000;
  const endOffset = (endTime - baseTime) / 1000;

  const leftPx = (startOffset / SECONDS_PER_SEGMENT) * PIXELS_PER_SEGMENT;
  const widthPx = ((endOffset - startOffset) / SECONDS_PER_SEGMENT) * PIXELS_PER_SEGMENT;

  return {
    leftPx,
    widthPx,
    totalSeconds: endOffset - startOffset,
    totalHours: (endOffset - startOffset) / 3600,
  };
}

export function findEarliestAndLatestTime(arr, { startDay, endDay }) {
  if (!Array.isArray(arr) || arr.length === 0) return;

  const getTime = (time) => moment(time).valueOf();
  const getEnd = (t) => moment(moment(t.planEndtime).format('YYYY-MM-DD') + ' 23:59:00').valueOf();

  const startTimes = arr.map((i) => getTime(i.startTime));
  const planEndTimes = arr.map((i) => getEnd(i));
  const endTimes = arr.map((i) => getTime(i.endTime));

  startDay.value = moment(Math.min(...startTimes, ...planEndTimes)).format('YYYY-MM-DD HH:mm');
  endDay.value = moment(Math.max(...endTimes, ...planEndTimes)).format('YYYY-MM-DD HH:mm');
}
//根据返回的数据，计算表头开始日期-结束日期的集合
function generateDateArray(startDateStr, endDateStr) {
  console.log(startDateStr, endDateStr);
  if (!startDateStr || !endDateStr) {
    return [];
  }
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const dateArray = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // 格式化日期为 YYYY-MM-DD
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以需要+1
    const day = String(currentDate.getDate()).padStart(2, '0');
    dateArray.push(`${year}-${month}-${day}`);

    // 增加一天
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}

// 获取指定日期的开始时间戳
export function calculateTimeFromLeft(leftPx, dayStr) {
  const PIXELS_PER_DAY = 450; // 一天对应的像素宽
  const MINUTES_PER_DAY = 24 * 60; // 1440分钟
  const minutesPerPixel = MINUTES_PER_DAY / PIXELS_PER_DAY;

  const offsetMinutes = leftPx * minutesPerPixel;
  return moment(dayStr).startOf('day').add(offsetMinutes, 'minutes').format('HH:mm');
}

export function calcOverTimes(val) {
  const xzStart = val.startTime;
  const xlEnd = val.endTime;
  if (!xlEnd || !xzStart) return '--';
  const start = moment(xzStart).format('YYYY-MM-DD HH:mm:ss');
  const end = moment(xlEnd).format('YYYY-MM-DD HH:mm:ss');
  const diffMin = moment(xlEnd).diff(moment(xzStart), 'minutes');
  if (diffMin <= 0) return '0小时0分钟';
  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  return `休息时长：${start}~${end} <br/> 休息耗时：${hours}小时${minutes}分钟`;
}
