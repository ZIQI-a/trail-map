import type {
  ItineraryIntensity,
  ItineraryItemDto,
  LocationArrangeMode,
  SchedulePreferenceCode,
} from "../types/mapWorkbench";

export type TravelServiceType = "hotel" | "lunch" | "rest";

export const SCHEDULE_INTENSITY_OPTIONS: Array<{
  label: string;
  value: ItineraryIntensity;
}> = [
  { label: "轻松", value: "relaxed" },
  { label: "标准", value: "standard" },
  { label: "紧凑", value: "compact" },
];

export const SCHEDULE_PREFERENCE_OPTIONS: Array<{
  color: string;
  label: string;
  value: SchedulePreferenceCode;
}> = [
  { label: "本地美食", value: "local_food", color: "green" },
  { label: "夜游安排", value: "night_tour", color: "gold" },
  { label: "地铁优先", value: "subway_first", color: "blue" },
  { label: "亲子友好", value: "family_friendly", color: "purple" },
];

export const LOCATION_MODE_OPTIONS: Array<{
  label: string;
  value: LocationArrangeMode;
}> = [
  { label: "系统推荐", value: "recommended" },
  { label: "用户自定义", value: "manual" },
  { label: "不安排", value: "none" },
];

const INTENSITY_LABEL_MAP: Record<ItineraryIntensity, string> = {
  compact: "紧凑",
  relaxed: "轻松",
  standard: "标准",
};

const LOCATION_MODE_LABEL_MAP: Record<LocationArrangeMode, string> = {
  manual: "用户自定义",
  none: "不安排",
  recommended: "系统推荐",
};

const GENERATED_ITEM_TYPE_LABEL_MAP: Record<
  ItineraryItemDto["itemType"],
  string
> = {
  hotel: "住宿安排",
  lunch: "用餐安排",
  rest: "休息安排",
  spot: "景点安排",
};

const GENERATED_SERVICE_TYPE_MAP: Record<
  ItineraryItemDto["itemType"],
  TravelServiceType
> = {
  hotel: "hotel",
  lunch: "lunch",
  rest: "rest",
  spot: "lunch",
};

const TRAVEL_SERVICE_SYMBOL_MAP: Record<TravelServiceType, string> = {
  hotel: "#icon-jiudianzhusu",
  lunch: "#icon-wucan",
  rest: "#icon-xiuxiqu",
};

/**
 * 将行程强度枚举转换为展示文案。
 */
export function getScheduleIntensityLabel(value: ItineraryIntensity) {
  return INTENSITY_LABEL_MAP[value] ?? value;
}

/**
 * 将地点安排模式转换为摘要文案，手动模式优先展示用户输入名称。
 */
export function getLocationModeLabel(
  mode: LocationArrangeMode,
  manualName = "",
) {
  return mode === "manual"
    ? manualName || LOCATION_MODE_LABEL_MAP.manual
    : LOCATION_MODE_LABEL_MAP[mode] ?? mode;
}

/**
 * 将完整行程生成节点类型转换为中文说明。
 */
export function resolveGeneratedItemTypeLabel(
  itemType: ItineraryItemDto["itemType"],
) {
  return GENERATED_ITEM_TYPE_LABEL_MAP[itemType] ?? "行程安排";
}

/**
 * 将完整行程生成节点类型归一到服务图标类型。
 */
export function resolveGeneratedServiceType(
  itemType: ItineraryItemDto["itemType"],
) {
  return GENERATED_SERVICE_TYPE_MAP[itemType] ?? "lunch";
}

/**
 * 将服务类型映射到阿里字体 symbol id。
 */
export function resolveTravelServiceSymbolId(type: TravelServiceType) {
  return TRAVEL_SERVICE_SYMBOL_MAP[type] ?? TRAVEL_SERVICE_SYMBOL_MAP.lunch;
}
