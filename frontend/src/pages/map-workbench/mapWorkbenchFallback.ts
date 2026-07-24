import type { TravelCity } from "../../types/mapWorkbench";

/**
 * 后端城市接口不可用时用于初始化百度底图，不替代真实业务数据。
 */
export const DEFAULT_MAP_CITY: TravelCity = {
  id: 1,
  name: "成都市",
  provinceName: "四川省",
  cityCode: "510100",
  center: {
    lng: 104.066541,
    lat: 30.572269,
  },
  mapZoom: 11,
  description: "城市数据恢复后将自动加载完整旅游资料。",
  recommendDays: 3,
};
