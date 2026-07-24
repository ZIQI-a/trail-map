import TinyPinyin from "tiny-pinyin";
import type { TravelCity } from "../../../types/mapWorkbench";

export type CityBrowseMode = "province" | "city";

export interface CityGroup {
  key: string;
  label: string;
  initial?: string;
  items: Array<{
    key: string;
    label: string;
    cityId?: number;
    active?: boolean;
  }>;
}

const INITIAL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const QUICK_CITY_NAMES = [
  "北京",
  "天津",
  "沈阳",
  "大连",
  "上海",
  "南京",
  "苏州",
  "杭州",
  "青岛",
  "郑州",
  "武汉",
  "长沙",
  "广州",
  "深圳",
  "重庆",
  "成都",
  "西安",
  "香港",
  "澳门",
];
const AUTONOMOUS_REGION_SHORT_NAMES: Record<string, string> = {
  内蒙古自治区: "内蒙古",
  广西壮族自治区: "广西",
  西藏自治区: "西藏",
  宁夏回族自治区: "宁夏",
  新疆维吾尔自治区: "新疆",
};
const REGION_PINYIN_OVERRIDES: Record<string, string> = {
  重庆: "chongqing",
  厦门: "xiamen",
};
const ETHNIC_GROUP_SUFFIXES = [
  "维吾尔族",
  "哈萨克族",
  "朝鲜族",
  "蒙古族",
  "土家族",
  "柯尔克孜族",
  "傈僳族",
  "纳西族",
  "布依族",
  "达斡尔族",
  "鄂温克族",
  "鄂伦春族",
  "壮族",
  "回族",
  "藏族",
  "苗族",
  "彝族",
  "侗族",
  "瑶族",
  "白族",
  "哈尼族",
  "傣族",
  "黎族",
  "佤族",
  "畲族",
  "羌族",
  "土族",
  "水族",
];

/**
 * 快捷区保留固定产品名单，但只展示后端当前返回的已启用城市。
 */
export function buildQuickCities(
  cities: TravelCity[],
  selectedCityId?: number,
) {
  const cityMap = new Map(
    cities.map((city) => [getShortRegionName(city.name), city]),
  );
  return QUICK_CITY_NAMES.map((name) => cityMap.get(name))
    .filter((city): city is TravelCity => Boolean(city))
    .map((city) => ({
      id: city.id,
      name: getShortRegionName(city.name),
      active: city.id === selectedCityId,
    }));
}

/**
 * 按“省份”或“城市”生成分组数据，供弹层列表和字母索引共用。
 */
export function buildCityGroups(
  cities: TravelCity[],
  mode: CityBrowseMode,
  keyword: string,
  selectedCityId?: number,
) {
  return mode === "province"
    ? buildProvinceGroups(cities, keyword, selectedCityId)
    : buildAlphaCityGroups(cities, keyword, selectedCityId);
}

/**
 * 获取当前分组可跳转的首字母，重复字母只保留第一个锚点。
 */
export function resolveAvailableInitials(groups: CityGroup[]) {
  return groups
    .map((group) => group.initial)
    .filter((initial): initial is string => Boolean(initial));
}

/**
 * 移除行政区划后缀和自治民族后缀，用于紧凑展示城市、省份简称。
 */
export function getShortRegionName(value: string) {
  const source = value.trim();
  const autonomousRegionName = AUTONOMOUS_REGION_SHORT_NAMES[source];
  if (autonomousRegionName) {
    return autonomousRegionName;
  }

  let shortName = source.replace(
    /(特别行政区|自治州|自治县|地区|林区|市|省|盟)$/u,
    "",
  );
  for (const ethnicGroup of ETHNIC_GROUP_SUFFIXES) {
    if (shortName.endsWith(ethnicGroup)) {
      shortName = shortName.slice(0, -ethnicGroup.length);
      break;
    }
  }
  return shortName || source;
}

/**
 * 滚动到省份或城市对应的首字母分组。
 */
export function scrollToCityGroup(
  initial: string,
  refs: Record<string, HTMLElement | null>,
) {
  refs[initial]?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * 省份模式排除与城市同级的直辖市和特别行政区，避免出现重复分组。
 */
function buildProvinceGroups(
  cities: TravelCity[],
  keyword: string,
  selectedCityId?: number,
): CityGroup[] {
  const provinceMap = new Map<string, TravelCity[]>();
  cities.forEach((city) => {
    if (isDirectAdminRegion(city) || !matchesCityKeyword(city, keyword)) {
      return;
    }
    const provinceCities = provinceMap.get(city.provinceName) ?? [];
    provinceCities.push(city);
    provinceMap.set(city.provinceName, provinceCities);
  });

  let previousInitial = "";
  return [...provinceMap.entries()]
    .sort(([left], [right]) => compareByChineseInitial(left, right))
    .map(([provinceName, provinceCities]) => {
      const initial = getChineseInitial(provinceName);
      const isFirstProvinceWithInitial = initial !== previousInitial;
      previousInitial = initial;
      return {
        key: provinceName,
        label: getShortRegionName(provinceName),
        initial: isFirstProvinceWithInitial ? initial : undefined,
        items: provinceCities
          .slice()
          .sort((left, right) =>
            compareByChineseInitial(left.name, right.name),
          )
          .map((city) => ({
            key: `${city.id}`,
            label: getShortRegionName(city.name),
            cityId: city.id,
            active: city.id === selectedCityId,
          })),
      };
    });
}

/**
 * 城市模式按城市首字母分桶，列表项直接可点击切换。
 */
function buildAlphaCityGroups(
  cities: TravelCity[],
  keyword: string,
  selectedCityId?: number,
): CityGroup[] {
  const groupedMap = new Map<string, CityGroup["items"]>();
  cities
    .filter((city) => matchesCityKeyword(city, keyword))
    .sort((left, right) => compareByChineseInitial(left.name, right.name))
    .forEach((city) => {
      const initial = getChineseInitial(city.name);
      const items = groupedMap.get(initial) ?? [];
      items.push({
        key: `${city.id}`,
        label: getShortRegionName(city.name),
        cityId: city.id,
        active: city.id === selectedCityId,
      });
      groupedMap.set(initial, items);
    });

  return INITIAL_LETTERS.filter((letter) => groupedMap.has(letter)).map(
    (letter) => ({
      key: letter,
      label: letter,
      initial: letter,
      items: groupedMap.get(letter) ?? [],
    }),
  );
}

/**
 * 判断城市是否为不应进入省份分组的直辖市或特别行政区。
 */
function isDirectAdminRegion(city: TravelCity) {
  const provinceName = city.provinceName.trim();
  return (
    /(市|特别行政区)$/u.test(provinceName) &&
    getShortRegionName(city.name) === getShortRegionName(provinceName)
  );
}

/**
 * 搜索同时覆盖城市名、省份名、简称和城市编码。
 */
function matchesCityKeyword(city: TravelCity, keyword: string) {
  const normalizedKeyword = normalizeSearchKeyword(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  return (
    normalizeSearchKeyword(city.name).includes(normalizedKeyword) ||
    normalizeSearchKeyword(city.provinceName).includes(normalizedKeyword) ||
    normalizeSearchKeyword(getShortRegionName(city.name)).includes(
      normalizedKeyword,
    ) ||
    normalizeSearchKeyword(getShortRegionName(city.provinceName)).includes(
      normalizedKeyword,
    ) ||
    getSearchablePinyin(city.name).includes(normalizedKeyword) ||
    getSearchablePinyin(city.provinceName).includes(normalizedKeyword) ||
    city.cityCode.toLowerCase().includes(normalizedKeyword)
  );
}

/**
 * 使用拼音库读取真实首字母，避免中文排序规则导致字母分组错误。
 */
function getChineseInitial(text: string) {
  const source = getShortRegionName(text);
  if (!source) {
    return "A";
  }

  const initial = getSearchablePinyin(source)[0]?.toUpperCase() ?? "A";
  return /^[A-Z]$/u.test(initial) ? initial : "A";
}

/**
 * 统一中文名称排序，避免城市和省份展示顺序跳动。
 */
function compareByChineseInitial(left: string, right: string) {
  const leftInitial = getChineseInitial(left);
  const rightInitial = getChineseInitial(right);
  if (leftInitial !== rightInitial) {
    return leftInitial.localeCompare(rightInitial, "en");
  }
  return getSearchablePinyin(left).localeCompare(
    getSearchablePinyin(right),
    "en",
  );
}

/**
 * 搜索关键字统一做去空格和小写处理，保证中英文匹配口径一致。
 */
function normalizeSearchKeyword(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

/**
 * 将行政区名称转换为无声调连续拼音，支持字母关键字搜索和稳定排序。
 */
function getSearchablePinyin(value: string) {
  const shortName = getShortRegionName(value);
  return (
    REGION_PINYIN_OVERRIDES[shortName] ??
    TinyPinyin.convertToPinyin(shortName, "", true)
  ).toLowerCase();
}
