import {
  AimOutlined,
  BankOutlined,
  CameraOutlined,
  CloseOutlined,
  CompassOutlined,
  DownOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  HomeOutlined,
  PictureOutlined,
  SearchOutlined,
  StarOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Input, Popover } from "antd";
import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppTopHeader } from "../../common";
import type { AppUserDto } from "../../../types/auth";
import type {
  SpotTag,
  SpotTagCode,
  TravelCity,
} from "../../../types/mapWorkbench";
import styles from "./WorkbenchHeader.module.css";

export type ActiveSpotFilter = "all" | SpotTagCode;
type CityBrowseMode = "province" | "city";

interface CityGroup {
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

const HOT_CITY_NAMES = [
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

const INITIAL_BOUNDARIES = [
  "阿",
  "芭",
  "擦",
  "搭",
  "蛾",
  "发",
  "噶",
  "哈",
  "击",
  "喀",
  "垃",
  "妈",
  "拿",
  "哦",
  "啪",
  "期",
  "然",
  "撒",
  "塌",
  "挖",
  "昔",
  "压",
  "匝",
];

const INITIAL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface WorkbenchHeaderProps {
  cities: TravelCity[];
  selectedCityId?: number;
  cityName: string;
  tags: SpotTag[];
  searchKeyword: string;
  activeFilter: ActiveSpotFilter;
  currentUser?: AppUserDto;
  onCityChange: (cityId: number) => void;
  onSearchKeywordChange: (keyword: string) => void;
  onActiveFilterChange: (filter: ActiveSpotFilter) => void;
  onAuthClick: () => void;
  onLocateCurrentPosition: () => void;
  onFavoritesClick: () => void;
  onTripsClick: () => void;
  onLogout: () => void;
  locatingCurrentPosition?: boolean;
}

// WorkbenchHeader 负责顶部品牌、搜索、城市和分类筛选区域。
export function WorkbenchHeader({
  cities,
  selectedCityId,
  cityName,
  tags,
  searchKeyword,
  activeFilter,
  currentUser,
  onCityChange,
  onSearchKeywordChange,
  onActiveFilterChange,
  onAuthClick,
  onLocateCurrentPosition,
  onFavoritesClick,
  onTripsClick,
  onLogout,
  locatingCurrentPosition = false,
}: WorkbenchHeaderProps) {
  const [cityPanelOpen, setCityPanelOpen] = useState(false);
  const [cityBrowseMode, setCityBrowseMode] =
    useState<CityBrowseMode>("province");
  const [citySearchKeyword, setCitySearchKeyword] = useState("");
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});
  const currentCity = cities.find((city) => city.id === selectedCityId);
  const filterOptions: Array<{
    label: string;
    icon: ReactNode;
    value: ActiveSpotFilter;
  }> = [
    { label: "全部", icon: <AimOutlined />, value: "all" },
    ...tags.map((tag) => ({
      label: tag.name,
      icon: getFilterIcon(tag.code),
      value: tag.code,
    })),
  ];
  const hotCities = useMemo(
    () => buildHotCities(cities, selectedCityId),
    [cities, selectedCityId],
  );
  const groupedCities = useMemo(
    () =>
      buildCityGroups(cities, cityBrowseMode, citySearchKeyword, selectedCityId),
    [cities, cityBrowseMode, citySearchKeyword, selectedCityId],
  );
  const availableInitials = useMemo(
    () =>
      cityBrowseMode === "city" ? resolveAvailableInitials(groupedCities) : [],
    [cityBrowseMode, groupedCities],
  );
  const quickActions = [
    {
      label: "我的位置",
      icon: <EnvironmentOutlined />,
      onClick: onLocateCurrentPosition,
    },
    { label: "路线规划", icon: <CompassOutlined />, onClick: onTripsClick },
    { label: "收藏夹", icon: <HeartOutlined />, onClick: onFavoritesClick },
  ];

  return (
    <header className={styles.topBar}>
      <AppTopHeader
        centerSlot={
          <div className={styles.centerControls}>
            <Input
              className={styles.searchBox}
              aria-label="搜索城市、景点或美食"
              value={searchKeyword}
              prefix={<SearchOutlined />}
              placeholder="搜索城市 / 景点 / 美食"
              allowClear
              onChange={(event) => onSearchKeywordChange(event.target.value)}
            />

            <Popover
              trigger="click"
              placement="bottomLeft"
              open={cityPanelOpen}
              overlayClassName={styles.cityPopover}
              content={
                <div className={styles.cityPanel}>
                  <div className={styles.cityPanelHeader}>
                    <div className={styles.cityPanelTitle}>
                      当前城市：{currentCity?.name ?? cityName}
                    </div>
                    <button
                      className={styles.cityPanelClose}
                      type="button"
                      aria-label="关闭城市面板"
                      onClick={() => setCityPanelOpen(false)}
                    >
                      <CloseOutlined />
                    </button>
                  </div>

                  <div className={styles.hotCityRow}>
                    <span className={styles.hotCityLabel}>全国</span>
                    <div className={styles.hotCityList}>
                      {hotCities.map((city) => (
                        <button
                          className={`${styles.hotCityButton} ${
                            city.active ? styles.hotCityButtonActive : ""
                          }`}
                          type="button"
                          key={city.id}
                          onClick={() =>
                            handleSelectCity(city.id, onCityChange, setCityPanelOpen)
                          }
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.cityPanelToolbar}>
                    <div className={styles.cityPanelTabs} aria-label="城市浏览模式">
                      <button
                        className={`${styles.cityPanelTab} ${
                          cityBrowseMode === "province"
                            ? styles.cityPanelTabActive
                            : ""
                        }`}
                        type="button"
                        onClick={() => setCityBrowseMode("province")}
                      >
                        按省份
                      </button>
                      <button
                        className={`${styles.cityPanelTab} ${
                          cityBrowseMode === "city"
                            ? styles.cityPanelTabActive
                            : ""
                        }`}
                        type="button"
                        onClick={() => setCityBrowseMode("city")}
                      >
                        按城市
                      </button>
                    </div>

                    <Input
                      className={styles.cityPanelSearch}
                      value={citySearchKeyword}
                      prefix={<SearchOutlined />}
                      placeholder="请输入城市"
                      allowClear
                      onChange={(event) =>
                        setCitySearchKeyword(event.target.value)
                      }
                    />
                  </div>

                  {cityBrowseMode === "city" ? (
                    <div className={styles.letterRail}>
                      {availableInitials.map((letter) => (
                        <button
                          className={styles.letterButton}
                          type="button"
                          key={letter}
                          onClick={() =>
                            scrollToCityGroup(letter, groupRefs.current)
                          }
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.cityGroupList}>
                    {groupedCities.length ? (
                      groupedCities.map((group) => (
                        <section
                          className={styles.cityGroupSection}
                          key={group.key}
                          ref={(node) => {
                            if (group.initial) {
                              groupRefs.current[group.initial] = node;
                            }
                          }}
                        >
                          <div className={styles.cityGroupTitle}>
                            {group.label}
                          </div>
                          <div className={styles.cityGroupItems}>
                            {group.items.map((item) => (
                              <button
                                className={`${styles.cityGroupItem} ${
                                  item.active ? styles.cityGroupItemActive : ""
                                }`}
                                type="button"
                                key={item.key}
                                onClick={() => {
                                  if (item.cityId) {
                                    handleSelectCity(
                                      item.cityId,
                                      onCityChange,
                                      setCityPanelOpen,
                                    );
                                  }
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </section>
                      ))
                    ) : (
                      <div className={styles.cityEmpty}>未找到匹配城市</div>
                    )}
                  </div>
                </div>
              }
              onOpenChange={(open) => setCityPanelOpen(open)}
            >
              <button className={styles.cityTrigger} type="button">
                <span className={styles.cityTriggerText}>
                  {currentCity?.name ?? cityName}
                </span>
                <DownOutlined className={styles.cityTriggerArrow} />
              </button>
            </Popover>
          </div>
        }
        currentUser={currentUser}
        onAuthClick={onAuthClick}
        onLogout={onLogout}
        rightSlot={
          <div className={styles.actionGroup} aria-label="快捷操作">
            {quickActions.map((action) => (
              <Button
                className={styles.actionButton}
                icon={action.icon}
                key={action.label}
                loading={
                  action.label === "我的位置" ? locatingCurrentPosition : false
                }
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        }
        surface="workbench"
      />

      <nav className={styles.filterRail} aria-label="景点分类筛选">
        <div className={styles.filterGroup}>
          {filterOptions.map((option) => (
            <button
              className={`${styles.filterButton} ${
                activeFilter === option.value ? styles.filterButtonActive : ""
              }`}
              type="button"
              key={option.value}
              aria-pressed={activeFilter === option.value}
              onClick={() =>
                onActiveSpotFilterChange(option.value, onActiveFilterChange)
              }
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

function onActiveSpotFilterChange(
  value: ActiveSpotFilter,
  onActiveFilterChange: (filter: ActiveSpotFilter) => void,
) {
  onActiveFilterChange(value);
}

/**
 * 热门城市使用固定产品顺序，只展示当前列表里真实可选的城市。
 */
function buildHotCities(cities: TravelCity[], selectedCityId?: number) {
  const cityMap = new Map(cities.map((city) => [normalizeName(city.name), city]));
  const hotCities = HOT_CITY_NAMES.map((name) => cityMap.get(normalizeName(name)))
    .filter((city): city is TravelCity => Boolean(city))
    .map((city) => ({
      id: city.id,
      name: city.name,
      active: city.id === selectedCityId,
    }));

  if (
    selectedCityId &&
    !hotCities.some((city) => city.id === selectedCityId)
  ) {
    const currentCity = cities.find((city) => city.id === selectedCityId);
    if (currentCity) {
      hotCities.push({
        id: currentCity.id,
        name: currentCity.name,
        active: true,
      });
    }
  }

  return hotCities;
}

/**
 * 按“省份”或“城市”生成分组数据，供弹层列表和字母索引共用。
 */
function buildCityGroups(
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
 * 省份模式按省名首字母分桶，每行展示“省份：城市列表”。
 */
function buildProvinceGroups(
  cities: TravelCity[],
  keyword: string,
  selectedCityId?: number,
): CityGroup[] {
  const provinceMap = new Map<string, TravelCity[]>();
  cities.forEach((city) => {
    if (!matchesCityKeyword(city, keyword)) {
      return;
    }
    const provinceCities = provinceMap.get(city.provinceName) ?? [];
    provinceCities.push(city);
    provinceMap.set(city.provinceName, provinceCities);
  });

  return [...provinceMap.entries()]
    .sort(([left], [right]) => compareByChineseInitial(left, right))
    .map(([provinceName, provinceCities]) => ({
      key: provinceName,
      label: `${provinceName}：`,
      items: provinceCities
        .slice()
        .sort((left, right) => compareByChineseInitial(left.name, right.name))
        .map((city) => ({
          key: `${city.id}`,
          label: city.name,
          cityId: city.id,
          active: city.id === selectedCityId,
        })),
    }));
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
        label: city.name,
        cityId: city.id,
        active: city.id === selectedCityId,
      });
      groupedMap.set(initial, items);
    });

  return buildOrderedGroups(groupedMap);
}

/**
 * 统一把字母分桶转成有序分组，保证 A-Z 顺序稳定。
 */
function buildOrderedGroups(groupedMap: Map<string, CityGroup["items"]>) {
  return INITIAL_LETTERS.filter((letter) => groupedMap.has(letter)).map(
    (letter) => ({
      key: letter,
      label: `${letter}:`,
      initial: letter,
      items: groupedMap.get(letter) ?? [],
    }),
  );
}

/**
 * 搜索同时覆盖城市名、省份名和城市编码，减少大列表里纯浏览成本。
 */
function matchesCityKeyword(city: TravelCity, keyword: string) {
  const normalizedKeyword = normalizeSearchKeyword(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  return (
    normalizeSearchKeyword(city.name).includes(normalizedKeyword) ||
    normalizeSearchKeyword(city.provinceName).includes(normalizedKeyword) ||
    city.cityCode.toLowerCase().includes(normalizedKeyword)
  );
}

/**
 * 用中文首字母边界表估算拼音首字母，满足城市 A-Z 分组展示。
 */
function getChineseInitial(text: string) {
  const source = text.trim();
  if (!source) {
    return "A";
  }

  const firstChar = source[0].toUpperCase();
  if (/[A-Z]/.test(firstChar)) {
    return firstChar;
  }

  for (let index = INITIAL_BOUNDARIES.length - 1; index >= 0; index -= 1) {
    if (source.localeCompare(INITIAL_BOUNDARIES[index], "zh-CN") >= 0) {
      return INITIAL_LETTERS[index];
    }
  }

  return "A";
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
  return left.localeCompare(right, "zh-CN");
}

/**
 * 搜索关键字统一做去空格和小写处理，保证中英文匹配口径一致。
 */
function normalizeSearchKeyword(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/(市|省|特别行政区|自治区)$/u, "");
}

function resolveAvailableInitials(groups: CityGroup[]) {
  return groups
    .map((group) => group.initial)
    .filter((initial): initial is string => Boolean(initial));
}

function scrollToCityGroup(
  initial: string,
  refs: Record<string, HTMLElement | null>,
) {
  refs[initial]?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleSelectCity(
  cityId: number,
  onCityChange: (cityId: number) => void,
  setCityPanelOpen: (open: boolean) => void,
) {
  onCityChange(cityId);
  setCityPanelOpen(false);
}

function getFilterIcon(code: SpotTagCode) {
  switch (code) {
    case "first_visit":
      return <StarOutlined />;
    case "photo":
      return <CameraOutlined />;
    case "night_tour":
      return <ThunderboltOutlined />;
    case "family":
      return <TeamOutlined />;
    case "couple":
      return <HeartOutlined />;
    case "free":
      return <TagOutlined />;
    case "indoor":
      return <HomeOutlined />;
    case "rainy_day":
      return <PictureOutlined />;
    case "half_day":
      return <BankOutlined />;
    case "subway":
      return <EnvironmentOutlined />;
    default:
      return <AimOutlined />;
  }
}
