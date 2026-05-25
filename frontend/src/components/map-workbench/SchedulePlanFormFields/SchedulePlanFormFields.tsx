import {
  ApartmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  SmileOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Switch,
} from "antd";
import { useState, type ReactNode } from "react";
import {
  getLocationModeLabel,
  getScheduleIntensityLabel,
  LOCATION_MODE_OPTIONS,
  SCHEDULE_INTENSITY_OPTIONS,
  SCHEDULE_PREFERENCE_OPTIONS,
} from "../../../config/schedulePlan";
import type {
  LocationArrangeMode,
  RouteLocation,
  SchedulePlanConfig,
  SchedulePreferenceCode,
  TravelSpot,
} from "../../../types/mapWorkbench";
import {
  buildTimeOptions,
  resolveDateRangeValue,
  syncTripDateRangeByPicker,
} from "../../../utils/map-workbench/schedulePlanTime";
import styles from "./SchedulePlanFormFields.module.css";

const { RangePicker } = DatePicker;

interface SchedulePlanFormFieldsProps {
  value: SchedulePlanConfig;
  cityName: string;
  tripSpots: TravelSpot[];
  currentStep: number;
  onChange: (value: SchedulePlanConfig) => void;
  onRemoveSpot: (spotId: number) => void;
  hotelOptions?: LocationSuggestionOption[];
  lunchOptions?: LocationSuggestionOption[];
  restOptions?: LocationSuggestionOption[];
  onHotelNameChange?: (value: string) => void;
  onLunchPlaceNameChange?: (value: string) => void;
  onRestPlaceNameChange?: (value: string) => void;
  onHotelSelect?: (option: LocationSuggestionValue) => void;
  onLunchSelect?: (option: LocationSuggestionValue) => void;
  onRestSelect?: (option: LocationSuggestionValue) => void;
}

interface LocationSuggestionOption {
  value: string;
  label: ReactNode;
  location: RouteLocation;
}

type LocationSuggestionValue = RouteLocation;

const timeOptions = buildTimeOptions();

/**
 * SchedulePlanFormFields 负责完整行程三步配置：行程信息、偏好设置、生成确认。
 */
export function SchedulePlanFormFields({
  value,
  cityName,
  tripSpots,
  currentStep,
  onChange,
  onRemoveSpot,
  hotelOptions,
  lunchOptions,
  restOptions,
  onHotelNameChange,
  onLunchPlaceNameChange,
  onRestPlaceNameChange,
  onHotelSelect,
  onLunchSelect,
  onRestSelect,
}: SchedulePlanFormFieldsProps) {
  return (
    <div className={styles.formShell}>
      <StepRail currentStep={currentStep} />
      {currentStep === 0 ? (
        <TripInfoStep
          value={value}
          cityName={cityName}
          tripSpots={tripSpots}
          onChange={onChange}
          onRemoveSpot={onRemoveSpot}
          hotelOptions={hotelOptions}
          lunchOptions={lunchOptions}
          restOptions={restOptions}
          onHotelNameChange={onHotelNameChange}
          onLunchPlaceNameChange={onLunchPlaceNameChange}
          onRestPlaceNameChange={onRestPlaceNameChange}
          onHotelSelect={onHotelSelect}
          onLunchSelect={onLunchSelect}
          onRestSelect={onRestSelect}
        />
      ) : null}
      {currentStep === 1 ? (
        <PreferenceStep value={value} onChange={onChange} />
      ) : null}
      {currentStep === 2 ? (
        <ConfirmStep value={value} cityName={cityName} tripSpots={tripSpots} />
      ) : null}
    </div>
  );
}

/**
 * 展示完整行程配置步骤，帮助用户理解当前编辑阶段。
 */
function StepRail({ currentStep }: { currentStep: number }) {
  const steps = ["行程信息", "偏好设置", "生成结果"];

  return (
    <div className={styles.stepRail} aria-label="完整行程配置步骤">
      {steps.map((step, index) => (
        <div
          className={styles.stepItem}
          data-active={currentStep === index}
          data-done={currentStep > index}
          key={step}
        >
          <span>
            {currentStep > index ? <CheckCircleOutlined /> : index + 1}
          </span>
          <strong>{step}</strong>
        </div>
      ))}
    </div>
  );
}

/**
 * 行程信息步骤以总览面板承载可编辑信息，包含基础信息、景点、住宿、用餐和概览。
 */
function TripInfoStep({
  value,
  cityName,
  tripSpots,
  onChange,
  onRemoveSpot,
  hotelOptions,
  lunchOptions,
  restOptions,
  onHotelNameChange,
  onLunchPlaceNameChange,
  onRestPlaceNameChange,
  onHotelSelect,
  onLunchSelect,
  onRestSelect,
}: Pick<
  SchedulePlanFormFieldsProps,
  | "value"
  | "cityName"
  | "tripSpots"
  | "onChange"
  | "onRemoveSpot"
  | "hotelOptions"
  | "lunchOptions"
  | "restOptions"
  | "onHotelNameChange"
  | "onLunchPlaceNameChange"
  | "onRestPlaceNameChange"
  | "onHotelSelect"
  | "onLunchSelect"
  | "onRestSelect"
>) {
  const [showAllSpots, setShowAllSpots] = useState(false);

  return (
    <div className={styles.stepContent}>
      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <strong>基本信息</strong>
        </header>

        <div className={styles.basicGrid}>
          <div className={`${styles.infoCard} ${styles.summaryCard}`}>
            <span className={styles.label}>
              <EnvironmentOutlined />
              目的地
            </span>
            <strong>{cityName}</strong>
          </div>
          <label
            className={`${styles.field} ${styles.infoCard} ${styles.dateField}`}
          >
            <span className={styles.label}>
              <CalendarOutlined />
              出行日期
            </span>
            <RangePicker
              className={styles.dateRangePicker}
              value={resolveDateRangeValue(
                value.tripStartDate,
                value.tripEndDate,
              )}
              format="YYYY-MM-DD"
              allowClear={false}
              onChange={(dates) =>
                onChange(syncTripDateRangeByPicker(value, dates))
              }
            />
          </label>
          <div className={`${styles.infoCard} ${styles.summaryCard}`}>
            <span className={styles.label}>
              <ApartmentOutlined />
              行程天数
            </span>
            <strong>{value.tripDays} 天</strong>
          </div>
          <label className={`${styles.field} ${styles.infoCard}`}>
            <span className={styles.label}>
              <TeamOutlined />
              出行人数
            </span>
            <InputNumber
              min={1}
              max={20}
              value={value.travelerCount}
              addonAfter="人"
              onChange={(nextValue) =>
                onChange({ ...value, travelerCount: Number(nextValue) || 1 })
              }
            />
          </label>
        </div>
      </section>

      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <div className={styles.selectedHeaderTitle}>
            <strong>已选景点</strong>
            <button
              className={styles.viewAllButton}
              type="button"
              onClick={() => setShowAllSpots((current) => !current)}
            >
              {showAllSpots ? "收起" : "查看全部"}
            </button>
          </div>
          <span>已选 {tripSpots.length} 个景点</span>
        </header>
        <div
          className={`${styles.selectedSpotList} ${
            showAllSpots ? styles.selectedSpotListExpanded : ""
          }`}
        >
          {tripSpots.map((spot) => (
            <article className={styles.selectedSpotCard} key={spot.id}>
              <button
                className={styles.removeSpotButton}
                type="button"
                aria-label={`删除${spot.name}`}
                onClick={() => onRemoveSpot(spot.id)}
              >
                ×
              </button>
              <span style={{ backgroundImage: `url(${spot.coverUrl})` }} />
              <strong>{spot.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.twoColumn}>
        <StaySection
          value={value}
          onChange={onChange}
          hotelOptions={hotelOptions}
          onHotelNameChange={onHotelNameChange}
          onHotelSelect={onHotelSelect}
        />
        <MealSection
          value={value}
          onChange={onChange}
          lunchOptions={lunchOptions}
          restOptions={restOptions}
          onLunchPlaceNameChange={onLunchPlaceNameChange}
          onRestPlaceNameChange={onRestPlaceNameChange}
          onLunchSelect={onLunchSelect}
          onRestSelect={onRestSelect}
        />
      </section>
    </div>
  );
}

/**
 * 住宿安排区负责酒店推荐、自定义酒店和每日返回酒店配置。
 */
function StaySection({
  value,
  onChange,
  hotelOptions,
  onHotelNameChange,
  onHotelSelect,
}: Pick<
  SchedulePlanFormFieldsProps,
  "value" | "onChange" | "hotelOptions" | "onHotelNameChange" | "onHotelSelect"
>) {
  return (
    <section className={styles.group}>
      <header className={styles.groupHeader}>
        <strong>住宿安排</strong>
        <span>可推荐酒店区域，也可以手动输入酒店名称。</span>
      </header>
      <LocationModeTabs
        value={value.hotelMode}
        onChange={(hotelMode) => onChange({ ...value, hotelMode })}
      />
      <StableLocationSlot
        mode={value.hotelMode}
        label="酒店名称"
        value={value.hotelName}
        options={hotelOptions}
        placeholder="例如：如家酒店"
        recommendedTitle="推荐住宿区域"
        recommendedText="系统会优先选择交通便利、靠近主要景点的酒店区域。"
        noneText="本次完整行程不会追加住宿节点。"
        onChange={(hotelName) => {
          onHotelNameChange?.(hotelName);
          if (!onHotelNameChange) {
            onChange({ ...value, hotelName, hotelLocation: undefined });
          }
        }}
        onSelect={onHotelSelect}
      />
      <div className={styles.switchCard}>
        <div>
          <strong>每日返回酒店</strong>
          <span>开启后每天收尾会补充返回酒店节点。</span>
        </div>
        <Switch
          checked={value.returnToHotel}
          disabled={value.hotelMode === "none"}
          onChange={(returnToHotel) => onChange({ ...value, returnToHotel })}
        />
      </div>
    </section>
  );
}

/**
 * 用餐安排区负责午餐和休息地点的推荐、自定义或不安排设置。
 */
function MealSection({
  value,
  onChange,
  lunchOptions,
  restOptions,
  onLunchPlaceNameChange,
  onRestPlaceNameChange,
  onLunchSelect,
  onRestSelect,
}: Pick<
  SchedulePlanFormFieldsProps,
  | "value"
  | "onChange"
  | "lunchOptions"
  | "restOptions"
  | "onLunchPlaceNameChange"
  | "onRestPlaceNameChange"
  | "onLunchSelect"
  | "onRestSelect"
>) {
  return (
    <section className={styles.group}>
      <header className={styles.groupHeader}>
        <strong>用餐安排</strong>
      </header>
      <LocationModeTabs
        label="午餐"
        value={value.lunchMode}
        onChange={(lunchMode) => onChange({ ...value, lunchMode })}
      />
      <StableLocationSlot
        mode={value.lunchMode}
        label="午餐地点名称"
        value={value.lunchPlaceName}
        options={lunchOptions}
        placeholder="例如：大悦城"
        recommendedTitle="景点附近午餐"
        recommendedText="系统会结合当天路线，在景点附近补充午餐地点。"
        noneText="本次完整行程不会安排午餐节点。"
        onChange={(lunchPlaceName) => {
          onLunchPlaceNameChange?.(lunchPlaceName);
          if (!onLunchPlaceNameChange) {
            onChange({ ...value, lunchPlaceName, lunchLocation: undefined });
          }
        }}
        onSelect={onLunchSelect}
      />
      <LocationModeTabs
        label="休息"
        value={value.restMode}
        onChange={(restMode) => onChange({ ...value, restMode })}
      />
      <StableLocationSlot
        mode={value.restMode}
        label="休息地点名称"
        value={value.restPlaceName}
        options={restOptions}
        placeholder="例如：万象城"
        recommendedTitle="路线中段休息"
        recommendedText="系统会在行程较长时补充适合停留的休息地点。"
        noneText="本次完整行程不会安排休息节点。"
        onChange={(restPlaceName) => {
          onRestPlaceNameChange?.(restPlaceName);
          if (!onRestPlaceNameChange) {
            onChange({ ...value, restPlaceName, restLocation: undefined });
          }
        }}
        onSelect={onRestSelect}
      />
    </section>
  );
}

/**
 * 行程偏好设置步骤负责影响生成策略的强度、时间和偏好标签。
 */
function PreferenceStep({
  value,
  onChange,
}: Pick<SchedulePlanFormFieldsProps, "value" | "onChange">) {
  return (
    <div className={styles.stepContent}>
      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <strong>行程偏好</strong>
          <span>这些设置会影响每天的时间边界和行程节奏。</span>
        </header>
        <div className={styles.preferenceGrid}>
          <label className={styles.field}>
            <span className={styles.label}>
              <SmileOutlined />
              游玩强度
            </span>
            <ChipGroup
              options={SCHEDULE_INTENSITY_OPTIONS}
              value={value.intensity}
              onChange={(intensity) => onChange({ ...value, intensity })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              <ClockCircleOutlined />
              每日出发时间
            </span>
            <Select
              value={value.dailyStartTime}
              options={timeOptions}
              onChange={(dailyStartTime) =>
                onChange({ ...value, dailyStartTime })
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>
              <ClockCircleOutlined />
              每日结束时间
            </span>
            <Select
              value={value.dailyEndTime}
              options={timeOptions}
              onChange={(dailyEndTime) => onChange({ ...value, dailyEndTime })}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>
            <CoffeeOutlined />
            出行偏好
          </span>
          <Select
            mode="multiple"
            allowClear
            value={value.preferenceTags}
            options={SCHEDULE_PREFERENCE_OPTIONS}
            placeholder="可选：本地美食、夜游安排、地铁优先等"
            onChange={(preferenceTags) =>
              onChange({
                ...value,
                preferenceTags: preferenceTags as SchedulePreferenceCode[],
              })
            }
          />
        </label>
        <div className={styles.switchRow}>
          <div className={styles.switchCard}>
            <div>
              <strong>安排午餐时段</strong>
              <span>规划时预留中午用餐时间。</span>
            </div>
            <Switch
              checked={value.includeLunchBreak}
              onChange={(includeLunchBreak) =>
                onChange({ ...value, includeLunchBreak })
              }
            />
          </div>
          <div className={styles.switchCard}>
            <div>
              <strong>考虑夜游</strong>
              <span>适合夜间景点会尽量放到晚上。</span>
            </div>
            <Switch
              checked={value.includeNightTour}
              onChange={(includeNightTour) =>
                onChange({ ...value, includeNightTour })
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * 生成确认步骤汇总用户配置，避免提交前遗漏关键行程信息。
 */
function ConfirmStep({
  value,
  cityName,
  tripSpots,
}: Pick<SchedulePlanFormFieldsProps, "value" | "cityName" | "tripSpots">) {
  return (
    <div className={styles.stepContent}>
      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <strong>确认配置</strong>
          <span>确认无误后点击“生成完整行程”。</span>
        </header>
        <div className={styles.confirmGrid}>
          <SummaryBox
            icon={<EnvironmentOutlined />}
            label="目的地"
            value={cityName}
          />
          <SummaryBox
            icon={<CalendarOutlined />}
            label="出行日期"
            value={`${value.tripStartDate || "未填写"} 至 ${value.tripEndDate || "未填写"}`}
          />
          <SummaryBox
            icon={<ApartmentOutlined />}
            label="行程天数"
            value={`${value.tripDays} 天`}
          />
          <SummaryBox
            icon={<TeamOutlined />}
            label="出行人数"
            value={`${value.travelerCount} 人`}
          />
          <SummaryBox
            icon={<ClockCircleOutlined />}
            label="作息时间"
            value={`${value.dailyStartTime} - ${value.dailyEndTime}`}
          />
          <SummaryBox
            icon={<SmileOutlined />}
            label="游玩强度"
            value={getScheduleIntensityLabel(value.intensity)}
          />
          <SummaryBox
            icon={<HomeOutlined />}
            label="住宿安排"
            value={getLocationModeLabel(value.hotelMode, value.hotelName)}
          />
          <SummaryBox
            icon={<CoffeeOutlined />}
            label="午餐安排"
            value={getLocationModeLabel(value.lunchMode, value.lunchPlaceName)}
          />
        </div>
        <div className={styles.confirmSpotLine}>
          <strong>已选景点</strong>
          <span>{tripSpots.map((spot) => spot.name).join("、")}</span>
        </div>
      </section>
    </div>
  );
}

/**
 * SummaryBox 统一展示单个配置摘要项，保证确认页和总览指标视觉一致。
 */
function SummaryBox({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.summaryBox}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/**
 * LocationModeTabs 统一三种地点安排方式，减少住宿、午餐、休息区重复代码。
 */
function LocationModeTabs({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: LocationArrangeMode;
  onChange: (value: LocationArrangeMode) => void;
}) {
  return (
    <div className={styles.modeRow}>
      {label ? <span>{label}</span> : null}
      <ChipGroup
        options={LOCATION_MODE_OPTIONS}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * LocationInput 提供地点名称输入和候选地点选择，选择后回填经纬度信息。
 */
function LocationInput({
  label,
  value,
  placeholder,
  options,
  onChange,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options?: LocationSuggestionOption[];
  onChange: (value: string) => void;
  onSelect?: (option: LocationSuggestionValue) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        <EnvironmentOutlined />
        {label}
      </span>
      <AutoComplete
        value={value}
        options={options}
        popupMatchSelectWidth
        onChange={onChange}
        onSelect={(_, option) =>
          onSelect?.((option as LocationSuggestionOption).location)
        }
      >
        <Input
          placeholder={placeholder}
          allowClear
          onChange={(event) => onChange(event.target.value)}
        />
      </AutoComplete>
      <span className={styles.fieldHint}>
        优先联想靠近已选景点的地点，连锁店建议继续输入商圈或景区名缩小范围。
      </span>
    </label>
  );
}

/**
 * StableLocationSlot 保持推荐、手动、不安排三种状态占用一致高度，避免切换时布局跳动。
 */
function StableLocationSlot({
  mode,
  label,
  value,
  options,
  placeholder,
  recommendedTitle,
  recommendedText,
  noneText,
  onChange,
  onSelect,
}: {
  mode: LocationArrangeMode;
  label: string;
  value: string;
  options?: LocationSuggestionOption[];
  placeholder: string;
  recommendedTitle: string;
  recommendedText: string;
  noneText: string;
  onChange: (value: string) => void;
  onSelect?: (option: LocationSuggestionValue) => void;
}) {
  if (mode === "manual") {
    return (
      <div className={styles.locationSlot}>
        <LocationInput
          label={label}
          value={value}
          options={options}
          placeholder={placeholder}
          onChange={onChange}
          onSelect={onSelect}
        />
      </div>
    );
  }

  return (
    <div className={styles.locationSlot}>
      <div className={styles.recommendBox} data-muted={mode === "none"}>
        <EnvironmentOutlined />
        <div>
          <strong>
            {mode === "recommended" ? recommendedTitle : "不安排"}
          </strong>
          <span>{mode === "recommended" ? recommendedText : noneText}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ChipGroup 渲染轻量选项组，用于强度、模式等低成本单选场景。
 */
function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.chipGroup}>
      {options.map((option) => (
        <button
          className={value === option.value ? styles.chipActive : styles.chip}
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
