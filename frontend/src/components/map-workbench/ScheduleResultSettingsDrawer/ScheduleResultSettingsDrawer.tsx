import {
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  SmileOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Drawer,
  InputNumber,
  Select,
  Switch,
  Tag,
} from "antd";
import { useState, type ReactNode } from "react";
import {
  getScheduleIntensityLabel,
  resolveGeneratedItemTypeLabel,
  resolveGeneratedServiceType,
  resolveTravelServiceSymbolId,
  SCHEDULE_INTENSITY_OPTIONS,
  SCHEDULE_PREFERENCE_OPTIONS,
  type TravelServiceType,
} from "../../../config/schedulePlan";
import type {
  ItineraryItemDto,
  RoutePlanResponseDto,
  SchedulePlanConfig,
  SchedulePreferenceCode,
  TravelSpot,
} from "../../../types/mapWorkbench";
import {
  buildTimeOptions,
  formatMinutes,
  resolveDateRangeValue,
  syncTripDateRangeByPicker,
} from "../../../utils/map-workbench/schedulePlanTime";
import styles from "./ScheduleResultSettingsDrawer.module.css";

const { RangePicker } = DatePicker;

interface ScheduleResultSettingsDrawerProps {
  cityName: string;
  loading: boolean;
  open: boolean;
  routePlan?: RoutePlanResponseDto;
  tripSpots: TravelSpot[];
  value: SchedulePlanConfig;
  onChange: (value: SchedulePlanConfig) => void;
  onClose: () => void;
  onRegenerate: () => Promise<void> | void;
}

const timeOptions = buildTimeOptions();

/**
 * ScheduleResultSettingsDrawer 展示生成后的完整行程总览，并允许用户修改配置后重新生成。
 */
export function ScheduleResultSettingsDrawer({
  cityName,
  loading,
  open,
  routePlan,
  tripSpots,
  value,
  onChange,
  onClose,
  onRegenerate,
}: ScheduleResultSettingsDrawerProps) {
  const generatedItems = buildGeneratedArrangementItems(routePlan);
  const tripNightCount = Math.max(0, value.tripDays - 1);
  const [isEditing, setIsEditing] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleConfigChange = (nextValue: SchedulePlanConfig) => {
    setDirty(true);
    onChange(nextValue);
  };
  const handleClose = () => {
    setIsEditing(false);
    setDirty(false);
    onClose();
  };
  const handleRegenerate = async () => {
    setIsEditing(false);
    setDirty(false);
    await onRegenerate();
  };

  return (
    <Drawer
      className={styles.drawer}
      title="行程概览"
      open={open}
      placement="left"
      width={460}
      onClose={handleClose}
      extra={
        isEditing && dirty ? (
          <Button
            type="primary"
            size="large"
            icon={<EditOutlined />}
            loading={loading}
            onClick={handleRegenerate}
          >
            重新生成
          </Button>
        ) : null
      }
    >
      <div className={styles.shell}>
        <section className={styles.heroCard}>
          <div className={styles.heroTitle}>
            <div>
              <strong>
                {cityName} {value.tripDays} 天 {tripNightCount} 晚完整行程
              </strong>
            </div>
            <button
              className={styles.editButton}
              type="button"
              aria-label="编辑行程设置"
              data-active={isEditing}
              onClick={() => {
                setIsEditing((current) => !current);
                setDirty(false);
              }}
            >
              <EditOutlined />
            </button>
          </div>
          <div className={styles.heroMeta}>
            <MetaPill icon={<EnvironmentOutlined />} text={cityName} />
            <MetaPill
              icon={<CalendarOutlined />}
              text={`${value.tripStartDate} - ${value.tripEndDate}`}
            />
            <MetaPill
              icon={<ApartmentOutlined />}
              text={`${value.tripDays}天${tripNightCount}晚`}
            />
            <MetaPill
              icon={<TeamOutlined />}
              text={`${value.travelerCount}人`}
            />
          </div>
        </section>

        <section className={styles.sectionCard}>
          <SectionTitle
            title="已生成安排"
            extra={`${generatedItems.length} 个节点`}
          />
          <div className={styles.generatedList}>
            {generatedItems.length > 0 ? (
              generatedItems.map((item) => (
                <GeneratedArrangementCard item={item} key={item.key} />
              ))
            ) : (
              <div className={styles.emptyState}>
                当前行程未生成住宿、用餐或休息节点。
              </div>
            )}
          </div>
        </section>

        <section className={styles.sectionCard}>
          <SectionTitle title="基础信息" />
          {isEditing ? (
            <div className={styles.formGrid}>
              <label className={styles.formField}>
                <span>
                  <CalendarOutlined />
                  出行日期
                </span>
                <RangePicker
                  value={resolveDateRangeValue(
                    value.tripStartDate,
                    value.tripEndDate,
                  )}
                  allowClear={false}
                  format="YYYY-MM-DD"
                  onChange={(dates) =>
                    handleConfigChange(syncTripDateRangeByPicker(value, dates))
                  }
                />
              </label>
              <label className={styles.formField}>
                <span>
                  <TeamOutlined />
                  出行人数
                </span>
                <InputNumber
                  min={1}
                  max={20}
                  value={value.travelerCount}
                  addonAfter="人"
                  onChange={(travelerCount) =>
                    handleConfigChange({
                      ...value,
                      travelerCount: Number(travelerCount) || 1,
                    })
                  }
                />
              </label>
            </div>
          ) : (
            <div className={styles.readonlyGrid}>
              <ReadonlyItem
                icon={<CalendarOutlined />}
                label="出行日期"
                value={`${value.tripStartDate} - ${value.tripEndDate}`}
              />
              <ReadonlyItem
                icon={<TeamOutlined />}
                label="出行人数"
                value={`${value.travelerCount} 人`}
              />
            </div>
          )}
        </section>

        <section className={styles.sectionCard}>
          <SectionTitle title="节奏与偏好" />
          {isEditing ? (
            <div className={styles.preferenceGrid}>
              <label className={styles.formField}>
                <span>
                  <SmileOutlined />
                  游玩强度
                </span>
                <Select
                  value={value.intensity}
                  options={SCHEDULE_INTENSITY_OPTIONS}
                  onChange={(intensity) =>
                    handleConfigChange({ ...value, intensity })
                  }
                />
              </label>
              <label className={styles.formField}>
                <span>
                  <ClockCircleOutlined />
                  出发时间
                </span>
                <Select
                  value={value.dailyStartTime}
                  options={timeOptions}
                  onChange={(dailyStartTime) =>
                    handleConfigChange({ ...value, dailyStartTime })
                  }
                />
              </label>
              <label className={styles.formField}>
                <span>
                  <ClockCircleOutlined />
                  结束时间
                </span>
                <Select
                  value={value.dailyEndTime}
                  options={timeOptions}
                  onChange={(dailyEndTime) =>
                    handleConfigChange({ ...value, dailyEndTime })
                  }
                />
              </label>
            </div>
          ) : (
            <div className={styles.readonlyGrid}>
              <ReadonlyItem
                icon={<SmileOutlined />}
                label="游玩强度"
                value={getScheduleIntensityLabel(value.intensity)}
              />
              <ReadonlyItem
                icon={<ClockCircleOutlined />}
                label="每日时间"
                value={`${value.dailyStartTime} - ${value.dailyEndTime}`}
              />
            </div>
          )}
          <div className={styles.preferenceTags}>
            {SCHEDULE_PREFERENCE_OPTIONS.map((option) => {
              const active = value.preferenceTags.includes(option.value);
              if (!isEditing) {
                return active ? (
                  <Tag color={option.color} key={option.value}>
                    {option.label}
                  </Tag>
                ) : null;
              }
              return (
                <button
                  className={
                    active ? styles.preferenceTagActive : styles.preferenceTag
                  }
                  type="button"
                  key={option.value}
                  onClick={() =>
                    handleConfigChange({
                      ...value,
                      preferenceTags: togglePreferenceTag(
                        value.preferenceTags,
                        option.value,
                      ),
                    })
                  }
                >
                  {option.label}
                </button>
              );
            })}
            {!isEditing && value.preferenceTags.length === 0 ? (
              <span className={styles.readonlyEmpty}>暂无额外偏好</span>
            ) : null}
          </div>
          {isEditing ? (
            <div className={styles.switchGrid}>
              <SwitchCard
                title="安排午餐"
                description="保留中午用餐时间和地点"
                checked={value.includeLunchBreak}
                onChange={(includeLunchBreak) =>
                  handleConfigChange({ ...value, includeLunchBreak })
                }
              />
              <SwitchCard
                title="考虑夜游"
                description="适合夜间体验的景点会靠后"
                checked={value.includeNightTour}
                onChange={(includeNightTour) =>
                  handleConfigChange({ ...value, includeNightTour })
                }
              />
              <SwitchCard
                title="返回酒店"
                description="每天收尾追加返回酒店节点"
                checked={value.returnToHotel}
                onChange={(returnToHotel) =>
                  handleConfigChange({ ...value, returnToHotel })
                }
              />
            </div>
          ) : (
            <div className={styles.readonlyGrid}>
              <ReadonlyItem
                icon={<TravelServiceIcon type="lunch" />}
                label="午餐"
                value={value.includeLunchBreak ? "安排" : "不安排"}
              />
              <ReadonlyItem
                icon={<SmileOutlined />}
                label="夜游"
                value={value.includeNightTour ? "考虑" : "不考虑"}
              />
              <ReadonlyItem
                icon={<TravelServiceIcon type="hotel" />}
                label="返程"
                value={value.returnToHotel ? "返回酒店" : "不返回酒店"}
              />
            </div>
          )}
        </section>

        <section className={styles.sectionCard}>
          <SectionTitle title="行程概览" />
          <div className={styles.metricGrid}>
            <MetricItem
              icon={<EnvironmentOutlined />}
              label="景点"
              value={`${tripSpots.length}`}
            />
            <MetricItem
              icon={<TravelServiceIcon type="lunch" />}
              label="餐饮"
              value={`${countGeneratedItems(generatedItems, "lunch")}`}
            />
            <MetricItem
              icon={<TravelServiceIcon type="hotel" />}
              label="酒店"
              value={`${countGeneratedItems(generatedItems, "hotel")}`}
            />
            <MetricItem
              icon={<ClockCircleOutlined />}
              label="总时长"
              value={formatMinutes(routePlan?.totalTripDurationMinutes)}
            />
          </div>
        </section>
      </div>
    </Drawer>
  );
}

/**
 * MetaPill 展示顶部总览中的单个摘要标签。
 */
function MetaPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className={styles.metaPill}>
      {icon}
      {text}
    </span>
  );
}

/**
 * ReadonlyItem 用统一样式展示只读状态下的配置项。
 */
function ReadonlyItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.readonlyItem}>
      <span className={styles.readonlyItemIcon} aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/**
 * SectionTitle 统一抽屉中各信息块的标题和右侧辅助信息。
 */
function SectionTitle({ extra, title }: { extra?: string; title: string }) {
  return (
    <header className={styles.sectionTitle}>
      <strong>{title}</strong>
      {extra ? <span>{extra}</span> : null}
    </header>
  );
}

/**
 * GeneratedArrangementCard 展示后端生成出的午餐、休息和酒店具体地点。
 */
function GeneratedArrangementCard({
  item,
}: {
  item: GeneratedArrangementItem;
}) {
  return (
    <article className={styles.generatedCard} data-type={item.itemType}>
      <div className={styles.generatedIcon}>
        {resolveGeneratedIcon(item.itemType)}
      </div>
      <div>
        <div className={styles.generatedTitleRow}>
          <strong>{item.placeName}</strong>
          <Tag>{item.dayLabel}</Tag>
        </div>
        <span>{item.timeText}</span>
        <p>{item.note || item.typeLabel}</p>
      </div>
    </article>
  );
}

/**
 * SwitchCard 统一展示可开关的布尔配置项。
 */
function SwitchCard({
  checked,
  description,
  title,
  onChange,
}: {
  checked: boolean;
  description: string;
  title: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className={styles.switchCard}>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

/**
 * MetricItem 展示行程结果底部的单个统计数据。
 */
function MetricItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metricItem}>
      <span className={styles.metricItemIcon} aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/**
 * TravelServiceIcon 统一承接午餐、休息、住宿的阿里字体图标映射，避免页面散落业务图标判断。
 */
function TravelServiceIcon({ type }: { type: TravelServiceType }) {
  const symbolId = resolveTravelServiceSymbolId(type);
  return (
    <svg
      className={styles.serviceIcon}
      aria-hidden="true"
      viewBox="0 0 1024 1024"
    >
      <use href={symbolId} />
    </svg>
  );
}

interface GeneratedArrangementItem {
  dayLabel: string;
  itemType: ItineraryItemDto["itemType"];
  key: string;
  note?: string;
  placeName: string;
  timeText: string;
  typeLabel: string;
}

/**
 * 从完整行程结果中提取住宿、用餐和休息节点，避免设置抽屉继续展示泛化占位。
 */
function buildGeneratedArrangementItems(routePlan?: RoutePlanResponseDto) {
  if (!routePlan?.itineraryDays.length) {
    return [];
  }

  return routePlan.itineraryDays.flatMap((day) =>
    day.items
      .filter((item) => ["lunch", "rest", "hotel"].includes(item.itemType))
      .map((item) => ({
        dayLabel: `Day ${day.dayIndex}`,
        itemType: item.itemType,
        key: `${day.dayIndex}-${item.sequence}-${item.itemType}`,
        note: item.note,
        placeName: item.placeName || item.title,
        timeText: `${item.suggestedStartTime} - ${item.suggestedEndTime}`,
        typeLabel: resolveGeneratedItemTypeLabel(item.itemType),
      })),
  );
}

/**
 * 统计指定类型的生成节点数量，用于行程概览。
 */
function countGeneratedItems(
  items: GeneratedArrangementItem[],
  itemType: ItineraryItemDto["itemType"],
) {
  return items.filter((item) => item.itemType === itemType).length;
}

/**
 * 切换偏好标签选中态，保持配置更新逻辑纯函数化。
 */
function togglePreferenceTag(
  tags: SchedulePreferenceCode[],
  tag: SchedulePreferenceCode,
) {
  return tags.includes(tag)
    ? tags.filter((item) => item !== tag)
    : [...tags, tag];
}

/**
 * 将生成节点类型转换为视觉图标。
 */
function resolveGeneratedIcon(itemType: ItineraryItemDto["itemType"]) {
  return <TravelServiceIcon type={resolveGeneratedServiceType(itemType)} />;
}
