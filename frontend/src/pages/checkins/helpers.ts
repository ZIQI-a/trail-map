import type { SpotType } from "../../types/mapWorkbench";
import {
  CHECKIN_DATE_FILTER_DAYS,
  SPOT_TYPE_LABEL_MAP,
  type CheckinDateFilter,
} from "./types";

/**
 * 将页面日期筛选项转换为后端需要的最近天数参数。
 */
export function resolveCheckedInWithinDays(dateFilter: CheckinDateFilter) {
  if (dateFilter === "all") {
    return undefined;
  }
  return CHECKIN_DATE_FILTER_DAYS[dateFilter];
}

/**
 * 将景点类型枚举转换为足迹卡片上的中文标签。
 */
export function resolveSpotTypeLabel(type: SpotType) {
  return SPOT_TYPE_LABEL_MAP[type] ?? "景点";
}

/**
 * 格式化完整打卡时间，非法时间直接返回原始值方便排查数据问题。
 */
export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 格式化时间轴节点日期，只展示月日以减少列表占用空间。
 */
export function formatDayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "足迹";
  }
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
