import {
  AimOutlined,
  BankOutlined,
  CameraOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  HomeOutlined,
  LogoutOutlined,
  PictureOutlined,
  SearchOutlined,
  SmileOutlined,
  StarOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Input, Select } from "antd";
import type { ReactNode } from "react";
import type { AppUserDto } from "../../../types/auth";
import type {
  SpotTag,
  SpotTagCode,
  TravelCity,
} from "../../../types/mapWorkbench";
import styles from "./WorkbenchHeader.module.css";

export type ActiveSpotFilter = "all" | SpotTagCode;

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
  onLogout: () => void;
}

const quickActions = [
  { label: "我的位置", icon: <EnvironmentOutlined /> },
  { label: "路线规划", icon: <CompassOutlined /> },
  { label: "收藏夹", icon: <HeartOutlined /> },
];

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
  onLogout,
}: WorkbenchHeaderProps) {
  const filterOptions: Array<{ label: string; icon: ReactNode; value: ActiveSpotFilter }> = [
    { label: "全部", icon: <AimOutlined />, value: "all" },
    ...tags.map((tag) => ({ label: tag.name, icon: getFilterIcon(tag.code), value: tag.code })),
  ];
  const cityOptions = cities.map((city) => ({
    label: `${city.name} · ${city.provinceName}`,
    value: city.id,
  }));

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarMain}>
        <div className={styles.brandArea}>
          <img className={styles.brandLogo} src="/header_logo.png" alt="行迹旅图 TrailMap" />
        </div>

        <Input
          className={styles.searchBox}
          aria-label="搜索城市、景点或美食"
          value={searchKeyword}
          prefix={<SearchOutlined />}
          placeholder="搜索城市 / 景点 / 美食"
          allowClear
          onChange={(event) => onSearchKeywordChange(event.target.value)}
        />

        <Select
          className={styles.citySelect}
          aria-label="切换当前城市"
          value={selectedCityId}
          options={cityOptions}
          suffixIcon={<EnvironmentOutlined />}
          placeholder={cityName}
          onChange={onCityChange}
        />

        <div className={styles.actionGroup} aria-label="快捷操作">
          {quickActions.map((action) => (
            <Button className={styles.actionButton} icon={action.icon} key={action.label}>
              {action.label}
            </Button>
          ))}
          {currentUser ? (
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  {
                    key: "profile",
                    label: `${getUserTypeLabel(currentUser.userType)} · ${currentUser.username}`,
                    disabled: true,
                  },
                  {
                    key: "logout",
                    label: "退出登录",
                    icon: <LogoutOutlined />,
                    onClick: onLogout,
                  },
                ],
              }}
            >
              <button className={styles.userButton} type="button">
                <Avatar
                  className={styles.userAvatar}
                  size={36}
                  src={currentUser.avatarUrl || undefined}
                  icon={<SmileOutlined />}
                />
                <span>{currentUser.nickname}</span>
              </button>
            </Dropdown>
          ) : (
            <button className={styles.loginButton} type="button" onClick={onAuthClick}>
              <Avatar className={styles.userAvatar} size={34} icon={<SmileOutlined />} />
              <span>登录</span>
            </button>
          )}
        </div>
      </div>

      <nav className={styles.filterRail} aria-label="景点分类筛选">
        <div className={styles.filterGroup}>
          {filterOptions.map((option) => (
            <button
              className={`${styles.filterButton} ${activeFilter === option.value ? styles.filterButtonActive : ""}`}
              type="button"
              key={option.value}
              aria-pressed={activeFilter === option.value}
              onClick={() => onActiveSpotFilterChange(option.value, onActiveFilterChange)}
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

function getUserTypeLabel(userType: AppUserDto["userType"]) {
  switch (userType) {
    case "admin":
      return "管理员";
    case "member":
      return "会员";
    default:
      return "普通用户";
  }
}

function onActiveSpotFilterChange(
  value: ActiveSpotFilter,
  onActiveFilterChange: (filter: ActiveSpotFilter) => void,
) {
  onActiveFilterChange(value);
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
