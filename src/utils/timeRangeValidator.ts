import dayjs from 'dayjs';

interface TimeRangeValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 验证班次时间范围的合理性
 * @param startTime 开始时间 (格式: HH:mm)
 * @param endTime 结束时间 (格式: HH:mm)
 * @param isStartNextDay 开始时间是否是次日
 * @param isEndNextDay 结束时间是否是次日
 * @returns TimeRangeValidationResult
 */
export const validateTimeRange = (
  startTime: string,
  endTime: string,
  isStartNextDay: boolean,
  isEndNextDay: boolean
): TimeRangeValidationResult => {
  // 转换为 dayjs 对象以便计算
  const start = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);

  // 1. 同一天的情况
  if (!isStartNextDay && !isEndNextDay) {
    if (start.isAfter(end)) {
      return {
        isValid: false,
        message: '同一天内，开始时间不能大于结束时间'
      };
    }
    return { isValid: true };
  }

  // 2. 都在次日的情况
  if (isStartNextDay && isEndNextDay) {
    if (start.isAfter(end)) {
      return {
        isValid: false,
        message: '次日时间范围内，开始时间不能大于结束时间'
      };
    }
    return { isValid: true };
  }

  // 3. 跨天的情况（开始时间是当天，结束时间是次日）
  if (!isStartNextDay && isEndNextDay) {
    // 如果结束时间大于开始时间，说明已经超过24小时
    if (end.isAfter(start)) {
      return {
        isValid: false,
        message: '跨天时间范围不能超过24小时'
      };
    }
    return { isValid: true };
  }

  // 4. 开始时间是次日，结束时间是当天的情况（这种情况应该是不允许的）
  if (isStartNextDay && !isEndNextDay) {
    return {
      isValid: false,
      message: '开始时间不能是次日而结束时间是当天'
    };
  }

  return { isValid: true };
};

/**
 * 检查给定时间是否在指定的时间范围内
 * @param timeToCheck 需要检查的时间 (格式: HH:mm)
 * @param rangeStartTime 范围开始时间 (格式: HH:mm)
 * @param rangeEndTime 范围结束时间 (格式: HH:mm)
 * @param isRangeStartNextDay 范围开始时间是否是次日
 * @param isRangeEndNextDay 范围结束时间是否是次日
 * @returns TimeRangeValidationResult
 */
export const isTimeInRange = (
  timeToCheck: string,
  rangeStartTime: string,
  rangeEndTime: string,
  isRangeStartNextDay: boolean,
  isRangeEndNextDay: boolean
): TimeRangeValidationResult => {
  // 首先验证时间范围是否有效
  const rangeValidation = validateTimeRange(
    rangeStartTime,
    rangeEndTime,
    isRangeStartNextDay,
    isRangeEndNextDay
  );

  if (!rangeValidation.isValid) {
    return {
      isValid: false,
      message: `时间范围无效：${rangeValidation.message}`
    };
  }

  // 转换为 dayjs 对象以便计算
  const checkTime = dayjs(`2000-01-01 ${timeToCheck}`);
  const rangeStart = dayjs(`2000-01-01 ${rangeStartTime}`);
  const rangeEnd = dayjs(`2000-01-01 ${rangeEndTime}`);

  // 处理跨天的情况
  if (isRangeEndNextDay) {
    // 如果检查时间在开始时间之后，或者在结束时间之前
    if (checkTime.isAfter(rangeStart) || checkTime.isBefore(rangeEnd)) {
      return { isValid: true };
    }
    return {
      isValid: false,
      message: '时间不在指定范围内'
    };
  }

  // 同一天的情况
  if (!isRangeStartNextDay && !isRangeEndNextDay) {
    if (checkTime.isAfter(rangeStart) && checkTime.isBefore(rangeEnd)) {
      return { isValid: true };
    }
    return {
      isValid: false,
      message: '时间不在指定范围内'
    };
  }

  // 都在次日的情况
  if (isRangeStartNextDay && isRangeEndNextDay) {
    if (checkTime.isAfter(rangeStart) && checkTime.isBefore(rangeEnd)) {
      return { isValid: true };
    }
    return {
      isValid: false,
      message: '时间不在指定范围内'
    };
  }

  return {
    isValid: false,
    message: '时间范围配置无效'
  };
}; 