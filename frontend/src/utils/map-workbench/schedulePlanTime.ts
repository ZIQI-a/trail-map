import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { SchedulePlanConfig } from "../../types/mapWorkbench";

/**
 * 构造半小时粒度的每日出发/结束时间选项。
 */
export function buildTimeOptions() {
  const options: Array<{ label: string; value: string }> = [];

  for (let hour = 6; hour <= 23; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({ label: value, value });
    }
  }

  return options;
}

/**
 * 将配置中的字符串日期转换为 Ant Design RangePicker 可识别的 Dayjs 值。
 */
export function resolveDateRangeValue(
  tripStartDate: string,
  tripEndDate: string,
): [Dayjs, Dayjs] | null {
  if (!tripStartDate || !tripEndDate) {
    return null;
  }

  const startDate = dayjs(tripStartDate, "YYYY-MM-DD", true);
  const endDate = dayjs(tripEndDate, "YYYY-MM-DD", true);
  if (!startDate.isValid() || !endDate.isValid()) {
    return null;
  }

  return [startDate, endDate];
}

/**
 * 同步日期范围选择结果，并自动计算新的行程天数。
 */
export function syncTripDateRangeByPicker(
  value: SchedulePlanConfig,
  dates: [Dayjs | null, Dayjs | null] | null,
): SchedulePlanConfig {
  if (!dates?.[0] || !dates?.[1]) {
    return value;
  }

  const tripStartDate = dates[0].format("YYYY-MM-DD");
  const tripEndDate = dates[1].format("YYYY-MM-DD");
  return {
    ...value,
    tripStartDate,
    tripEndDate,
    tripDays: calculateTripDays(tripStartDate, tripEndDate),
  };
}

/**
 * 根据起止日期计算行程天数，非法日期兜底为 1 天。
 */
export function calculateTripDays(startDate: string, endDate: string) {
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 1;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((endTime - startTime) / dayMs) + 1);
}

/**
 * 将分钟数格式化为短文本，缺失时展示占位。
 */
export function formatMinutes(minutes?: number) {
  if (!minutes) {
    return "--";
  }
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return hours > 0 ? `${hours}h${restMinutes}m` : `${restMinutes}m`;
}
