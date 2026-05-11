import {
  ApartmentOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { Input, InputNumber, Segmented, Select, Switch } from "antd";
import type {
  ItineraryIntensity,
  LocationArrangeMode,
  SchedulePlanConfig,
  SchedulePreferenceCode,
} from "../../../types/mapWorkbench";
import styles from "./SchedulePlanFormFields.module.css";

interface SchedulePlanFormFieldsProps {
  value: SchedulePlanConfig;
  onChange: (value: SchedulePlanConfig) => void;
}

const timeOptions = buildTimeOptions();

const intensityOptions: Array<{ label: string; value: ItineraryIntensity }> = [
  { label: "轻松游", value: "relaxed" },
  { label: "标准版", value: "standard" },
  { label: "紧凑玩", value: "compact" },
];

const preferenceOptions: Array<{
  label: string;
  value: SchedulePreferenceCode;
}> = [
  { label: "本地美食", value: "local_food" },
  { label: "夜游安排", value: "night_tour" },
  { label: "地铁优先", value: "subway_first" },
  { label: "亲子友好", value: "family_friendly" },
];

const locationModeOptions: Array<{
  label: string;
  value: LocationArrangeMode;
}> = [
  { label: "系统推荐", value: "recommended" },
  { label: "手动选择", value: "manual" },
  { label: "不安排", value: "none" },
];

// SchedulePlanFormFields 负责渲染完整行程配置项，两处容器复用同一份表单内容。
export function SchedulePlanFormFields({
  value,
  onChange,
}: SchedulePlanFormFieldsProps) {
  return (
    <div className={styles.formShell}>
      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <strong>基础节奏</strong>
          <span>先决定天数和每天的时间边界。</span>
        </header>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>
              <ApartmentOutlined />
              行程天数
            </span>
            <InputNumber
              min={1}
              max={7}
              value={value.tripDays}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  tripDays: Number(nextValue) || 1,
                })
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              <ClockCircleOutlined />
              每天开始
            </span>
            <Select
              value={value.dailyStartTime}
              options={timeOptions}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  dailyStartTime: nextValue,
                })
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              <ClockCircleOutlined />
              每天结束
            </span>
            <Select
              value={value.dailyEndTime}
              options={timeOptions}
              onChange={(nextValue) =>
                onChange({
                  ...value,
                  dailyEndTime: nextValue,
                })
              }
            />
          </label>
        </div>
      </section>

      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <strong>游玩偏好</strong>
          <span>先用规则版驱动编排，偏好项后续再逐步接入后端。</span>
        </header>

        <label className={styles.field}>
          <span className={styles.label}>
            <SmileOutlined />
            行程强度
          </span>
          <Segmented
            block
            options={intensityOptions}
            value={value.intensity}
            onChange={(nextValue) =>
              onChange({
                ...value,
                intensity: nextValue as ItineraryIntensity,
              })
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            <CoffeeOutlined />
            出行偏好
          </span>
          <Select
            mode="multiple"
            allowClear
            value={value.preferenceTags}
            options={preferenceOptions}
            placeholder="可选：本地美食、夜游安排等"
            onChange={(nextValue) =>
              onChange({
                ...value,
                preferenceTags: nextValue as SchedulePreferenceCode[],
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
              onChange={(checked) =>
                onChange({
                  ...value,
                  includeLunchBreak: checked,
                })
              }
            />
          </div>

          <div className={styles.switchCard}>
            <div>
              <strong>考虑夜游</strong>
              <span>后续适合把夜间景点往晚上放。</span>
            </div>
            <Switch
              checked={value.includeNightTour}
              onChange={(checked) =>
                onChange({
                  ...value,
                  includeNightTour: checked,
                })
              }
            />
          </div>
        </div>
      </section>

      <section className={styles.group}>
        <header className={styles.groupHeader}>
          <strong>补充地点</strong>
          <span>午餐、休息、酒店支持手动输入名称或交给系统按附近景点推荐。</span>
        </header>

        <label className={styles.field}>
          <span className={styles.label}>
            <CoffeeOutlined />
            午餐地点
          </span>
          <Segmented
            block
            options={locationModeOptions}
            value={value.lunchMode}
            onChange={(nextValue) =>
              onChange({
                ...value,
                lunchMode: nextValue as LocationArrangeMode,
              })
            }
          />
        </label>

        {value.lunchMode === "manual" ? (
          <label className={styles.field}>
            <span className={styles.label}>
              <EnvironmentOutlined />
              午餐地点名称
            </span>
            <Input
              value={value.lunchPlaceName}
              placeholder="例如：大悦城"
              onChange={(event) =>
                onChange({
                  ...value,
                  lunchPlaceName: event.target.value,
                })
              }
            />
          </label>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>
            <ApartmentOutlined />
            休息地点
          </span>
          <Segmented
            block
            options={locationModeOptions}
            value={value.restMode}
            onChange={(nextValue) =>
              onChange({
                ...value,
                restMode: nextValue as LocationArrangeMode,
              })
            }
          />
        </label>

        {value.restMode === "manual" ? (
          <label className={styles.field}>
            <span className={styles.label}>
              <EnvironmentOutlined />
              休息地点名称
            </span>
            <Input
              value={value.restPlaceName}
              placeholder="例如：万象城"
              onChange={(event) =>
                onChange({
                  ...value,
                  restPlaceName: event.target.value,
                })
              }
            />
          </label>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>
            <HomeOutlined />
            酒店安排
          </span>
          <Segmented
            block
            options={locationModeOptions}
            value={value.hotelMode}
            onChange={(nextValue) =>
              onChange({
                ...value,
                hotelMode: nextValue as LocationArrangeMode,
              })
            }
          />
        </label>

        {value.hotelMode === "manual" ? (
          <label className={styles.field}>
            <span className={styles.label}>
              <EnvironmentOutlined />
              酒店名称
            </span>
            <Input
              value={value.hotelName}
              placeholder="例如：春熙路亚朵酒店"
              onChange={(event) =>
                onChange({
                  ...value,
                  hotelName: event.target.value,
                })
              }
            />
          </label>
        ) : null}

        <div className={styles.switchRow}>
          <div className={styles.switchCard}>
            <div>
              <strong>每日返回酒店</strong>
              <span>开启后会在每天收尾时补一个酒店节点。</span>
            </div>
            <Switch
              checked={value.returnToHotel}
              onChange={(checked) =>
                onChange({
                  ...value,
                  returnToHotel: checked,
                })
              }
              disabled={value.hotelMode === "none"}
            />
          </div>

          <div className={styles.switchCard}>
            <div>
              <strong>夜游节点预留</strong>
              <span>夜游开关在上方控制，这里保留当前结果提示。</span>
            </div>
            <Switch checked={value.includeNightTour} disabled />
          </div>
        </div>
      </section>
    </div>
  );
}

function buildTimeOptions() {
  const options: Array<{ label: string; value: string }> = [];

  for (let hour = 6; hour <= 23; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({
        label: value,
        value,
      });
    }
  }

  return options;
}
