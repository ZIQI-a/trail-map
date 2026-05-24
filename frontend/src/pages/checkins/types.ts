import type { SpotType } from "../../types/mapWorkbench";

export type CheckinViewMode = "timeline" | "grid";

export type CheckinDateFilter = "all" | "7d" | "30d" | "365d";

// 日期筛选项到后端查询天数的映射，undefined 表示不限制时间范围。
export const CHECKIN_DATE_FILTER_DAYS: Record<
  Exclude<CheckinDateFilter, "all">,
  number
> = {
  "7d": 7,
  "30d": 30,
  "365d": 365,
};

// 景点类型中文文案映射，页面展示统一从这里取值。
export const SPOT_TYPE_LABEL_MAP: Partial<Record<SpotType, string>> = {
  history: "历史文化",
  nature: "自然风光",
  landmark: "城市地标",
  museum: "博物馆",
  food: "美食",
  night: "夜游",
  family: "亲子",
  business: "商圈",
};
