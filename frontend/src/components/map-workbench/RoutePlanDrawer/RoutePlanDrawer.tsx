import {
  AimOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CompassOutlined,
  CoffeeOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FlagOutlined,
  HomeOutlined,
  NodeIndexOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Button, Tag, Timeline } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import type {
  ItineraryDayDto,
  ItineraryItemDto,
  RoutePlanResponseDto,
  RouteSegmentDto,
  SpotTag,
  TravelSpot,
} from '../../../types/mapWorkbench';
import { getItineraryActivityColor, getRouteSegmentColor } from '../../../utils/map-workbench/routePalette';
import { formatRouteDistance, formatRouteDuration, formatTripDuration } from '../../../utils/map-workbench/routeDisplay';
import { formatDuration, getSpotTagName } from '../../../utils/map-workbench/spotDisplay';
import styles from './RoutePlanDrawer.module.css';

interface RoutePlanDrawerProps {
  cityName: string;
  routePlan: RoutePlanResponseDto;
  tripSpots: TravelSpot[];
  tags: SpotTag[];
  startPoint: string;
  scheduleStartTime?: string;
  selectedDayIndex?: number;
  onClose: () => void;
}

// RoutePlanDrawer 负责在路线规划成功后展示右侧路线时间轴详情。
export function RoutePlanDrawer({
  cityName,
  routePlan,
  tripSpots,
  tags,
  startPoint,
  scheduleStartTime,
  selectedDayIndex,
  onClose,
}: RoutePlanDrawerProps) {
  const spotMapping = new Map(tripSpots.map((spot) => [spot.id, spot]));
  const activeDay =
    routePlan.planMode === "schedule"
      ? routePlan.itineraryDays.find((day) => day.dayIndex === selectedDayIndex) ??
        routePlan.itineraryDays[0]
      : undefined;
  const timelineEntries =
    routePlan.planMode === 'schedule' && activeDay?.items.length
      ? buildScheduleTimelineEntries(routePlan, startPoint, activeDay, scheduleStartTime)
      : buildTimelineEntries(routePlan, startPoint, activeDay?.dayIndex);
  const metricTarget = activeDay ?? routePlan;
  const summaryText = activeDay
    ? `${activeDay.title} 已安排 ${activeDay.spots.length} 个景点，预计交通 ${formatRouteDuration(activeDay.totalTravelDurationSeconds)}，游玩 ${formatTripDuration(activeDay.totalStayDurationMinutes)}。`
    : routePlan.routeSummary;

  return (
    <aside className={styles.drawer} aria-label="路线规划详情">
      <div className={styles.header}>
        <div>
          <h2>
            {cityName}
            {routePlan.planMode === 'free'
              ? '一日游路线'
              : `${activeDay?.title ?? "行程"}详细安排`}
          </h2>
          <p className={styles.headerSubline}>
            {routePlan.planMode === "schedule"
              ? "按当前选择的 Day 展示详细时间轴，后续继续补餐饮与酒店节点。"
              : "按当前景点池顺序生成，后续可继续补完整行程拆分。"}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<ShareAltOutlined />} className={styles.headerButton}>
            分享
          </Button>
          <Button icon={<CloseOutlined />} className={styles.headerIconButton} onClick={onClose} />
        </div>
      </div>

      <div className={styles.metricRow}>
        <MetricCard icon={<FlagOutlined />} value={formatRouteDistance(metricTarget.totalDistanceMeters)} label="总里程" />
        <MetricCard icon={<CarOutlined />} value={formatRouteDuration(metricTarget.totalTravelDurationSeconds)} label="交通耗时" />
        <MetricCard icon={<ClockCircleOutlined />} value={formatTripDuration(metricTarget.totalStayDurationMinutes)} label="游玩时长" />
        <MetricCard icon={<AimOutlined />} value={formatTripDuration(metricTarget.totalTripDurationMinutes)} label="预计总时长" />
        <MetricCard
          icon={<NodeIndexOutlined />}
          value={`${activeDay?.spots.length ?? routePlan.orderedSpotIds.length} 个`}
          label="景点数量"
        />
      </div>

      <div className={styles.summaryCard}>
        <p>{summaryText}</p>
      </div>

      <Timeline
        className={styles.timeline}
        items={timelineEntries.map((entry) => renderTimelineItem(entry, spotMapping, tags))}
      />
    </aside>
  );
}

interface MetricCardProps {
  icon: ReactNode;
  value: string;
  label: string;
}

function MetricCard({ icon, value, label }: MetricCardProps) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricIcon}>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

type TimelineEntry =
  | { type: 'start' | 'end'; title: string; timeLabel: string; color: string }
  | {
      type: 'segment';
      title: string;
      subtitle: string;
      meta: string;
      color: string;
      icon: ReactNode;
      sequence: number;
    }
  | {
      type: 'spot';
      sequence: number;
      color: string;
      stayPlan: RoutePlanResponseDto['spotStayPlans'][number];
      arrivalLabel: string;
      leaveLabel: string;
    }
  | {
      type: 'activity';
      sequence: number;
      color: string;
      item: ItineraryItemDto;
    };

function buildTimelineEntries(
  routePlan: RoutePlanResponseDto,
  startPoint: string,
  selectedDayIndex?: number,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const scopedSpotPlans =
    routePlan.planMode === "schedule" && selectedDayIndex != null
      ? routePlan.spotStayPlans.filter((stayPlan) => stayPlan.dayIndex === selectedDayIndex)
      : routePlan.spotStayPlans;
  const scopedPlanIndexes = scopedSpotPlans
    .map((stayPlan) =>
      routePlan.spotStayPlans.findIndex((currentPlan) => currentPlan.spotId === stayPlan.spotId),
    )
    .filter((index) => index >= 0);
  const initialMinutes = scopedSpotPlans[0]?.suggestedStartTime
    ? parseClock(scopedSpotPlans[0].suggestedStartTime)
    : 9 * 60;
  let currentMinutes = initialMinutes;

  entries.push({
    type: 'start',
    title: selectedDayIndex && selectedDayIndex > 1 ? `Day ${selectedDayIndex} 出发` : startPoint || '市中心',
    timeLabel: formatClock(initialMinutes),
    color: getRouteSegmentColor(0),
  });

  scopedSpotPlans.forEach((stayPlan, localIndex) => {
    const globalIndex = scopedPlanIndexes[localIndex];
    const segment = globalIndex >= 0 ? routePlan.segments[globalIndex] : undefined;
    if (segment) {
      // 每个路段先展示，再进入当前景点，符合真实行程阅读顺序。
      entries.push({
        type: 'segment',
        title: getTransportLabel(segment.transportType),
        subtitle: `${segment.fromName} → ${segment.toName}`,
        meta: `${formatRouteDistance(segment.distanceMeters)} · ${formatRouteDuration(segment.durationSeconds)}`,
        color: getRouteSegmentColor(localIndex),
        icon: getTransportIcon(segment.transportType),
        sequence: localIndex + 1,
      });
      currentMinutes += Math.ceil(segment.durationSeconds / 60);
    }

    const arrivalMinutes = stayPlan.suggestedStartTime
      ? parseClock(stayPlan.suggestedStartTime)
      : currentMinutes;
    const leaveMinutes = stayPlan.suggestedEndTime
      ? parseClock(stayPlan.suggestedEndTime)
      : arrivalMinutes + stayPlan.suggestedDurationMinutes;
    currentMinutes = leaveMinutes;

    entries.push({
      type: 'spot',
      sequence: localIndex + 1,
      color: getRouteSegmentColor(localIndex),
      stayPlan,
      arrivalLabel: formatClock(arrivalMinutes),
      leaveLabel: formatClock(leaveMinutes),
    });
  });

  const lastStayPlan = scopedSpotPlans[scopedSpotPlans.length - 1];

  entries.push({
    type: 'end',
    title: selectedDayIndex && selectedDayIndex > 1 ? `Day ${selectedDayIndex} 收尾` : lastStayPlan?.spotName ?? '行程结束',
    timeLabel: lastStayPlan?.suggestedEndTime ?? formatClock(currentMinutes),
    color: '#ff5a40',
  });

  return entries;
}

function buildScheduleTimelineEntries(
  routePlan: RoutePlanResponseDto,
  startPoint: string,
  activeDay: ItineraryDayDto,
  scheduleStartTime?: string,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const daySegments = resolveScheduleDaySegments(routePlan, activeDay);
  const firstItem = activeDay.items[0];
  // 起点节点展示用户选择的每日开始时间；后端 startTime 可能随第一段交通被写成到达时间。
  const startLabel = scheduleStartTime || activeDay.startTime || firstItem?.suggestedStartTime || '09:00';

  entries.push({
    type: 'start',
    title: activeDay.startPlaceName || (activeDay.dayIndex > 1 ? `Day ${activeDay.dayIndex} 出发` : startPoint || '市中心'),
    timeLabel: startLabel,
    color: getRouteSegmentColor(0),
  });

  let segmentCursor = 0;
  let currentItemColor = getRouteSegmentColor(0);

  activeDay.items.forEach((item) => {
    const sequence = item.sequence;
    const matchedSegmentIndex = item.position
      ? findSegmentIndexForItem(daySegments, item, segmentCursor, Boolean(activeDay.segments?.length))
      : -1;
    const segment = matchedSegmentIndex >= 0 ? daySegments[matchedSegmentIndex] : undefined;
    if (segment) {
      currentItemColor = getRouteSegmentColor(matchedSegmentIndex);
      entries.push({
        type: 'segment',
        title: getTransportLabel(segment.transportType),
        subtitle: `${segment.fromName} → ${segment.toName}`,
        meta: `${formatRouteDistance(segment.distanceMeters)} · ${formatRouteDuration(segment.durationSeconds)}`,
        color: currentItemColor,
        icon: getTransportIcon(segment.transportType),
        sequence,
      });
      segmentCursor = matchedSegmentIndex + 1;
    }

    if (item.itemType === 'spot') {
      const stayPlan = routePlan.spotStayPlans.find(
        (currentPlan) => currentPlan.spotId === item.relatedSpotId,
      );
      if (stayPlan) {
        entries.push({
          type: 'spot',
          sequence,
          color: currentItemColor,
          stayPlan,
          arrivalLabel: item.suggestedStartTime,
          leaveLabel: item.suggestedEndTime,
        });
        return;
      }
    }

    entries.push({
      type: 'activity',
      sequence,
      color: getActivityTimelineColor(item.itemType),
      item,
    });
  });

  const lastItem = activeDay.items[activeDay.items.length - 1];
  entries.push({
    type: 'end',
    title: activeDay.dayIndex > 1 ? `Day ${activeDay.dayIndex} 收尾` : lastItem?.placeName ?? '行程结束',
    timeLabel: lastItem?.suggestedEndTime ?? '18:00',
    color: '#ff5a40',
  });
  return entries;
}

function resolveScheduleDaySegments(routePlan: RoutePlanResponseDto, activeDay: ItineraryDayDto) {
  if (activeDay.segments?.length) {
    return activeDay.segments;
  }

  const dayTargetNames = activeDay.items
    .filter((item) => item.position)
    .map((item) => normalizePlaceName(item.placeName || item.title));
  let searchStartIndex = 0;
  const matchedSegments: RouteSegmentDto[] = [];

  dayTargetNames.forEach((targetName) => {
    const matchedIndex = routePlan.segments.findIndex(
      (segment, index) => index >= searchStartIndex && normalizePlaceName(segment.toName) === targetName,
    );
    if (matchedIndex >= 0) {
      matchedSegments.push(routePlan.segments[matchedIndex]);
      searchStartIndex = matchedIndex + 1;
    }
  });

  return matchedSegments;
}

function findSegmentIndexForItem(
  segments: RouteSegmentDto[],
  item: ItineraryItemDto,
  startIndex: number,
  allowSequentialFallback: boolean,
) {
  const itemName = normalizePlaceName(item.placeName || item.title);
  const matchedIndex = segments.findIndex(
    (segment, index) => index >= startIndex && normalizePlaceName(segment.toName) === itemName,
  );

  if (matchedIndex >= 0) {
    return matchedIndex;
  }

  return allowSequentialFallback && startIndex < segments.length ? startIndex : -1;
}

function normalizePlaceName(placeName: string) {
  return placeName.trim().replace(/\s+/g, '').toLowerCase();
}

function formatClock(totalMinutes: number) {
  const normalizedMinutes = Math.max(0, totalMinutes);
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseClock(clockText: string) {
  const [hoursText, minutesText] = clockText.split(":");
  const hours = Number(hoursText) || 0;
  const minutes = Number(minutesText) || 0;
  return hours * 60 + minutes;
}

function getTransportLabel(transportType: string) {
  switch (transportType) {
    case 'walking':
      return '步行';
    case 'bicycling':
      return '骑行';
    case 'transit':
      return '公共交通';
    default:
      return '驾车';
  }
}

function getTransportIcon(transportType: string) {
  switch (transportType) {
    case 'walking':
      return <CompassOutlined />;
    case 'transit':
      return <EnvironmentOutlined />;
    default:
      return <CarOutlined />;
  }
}

function getActivityIcon(itemType: ItineraryItemDto['itemType']) {
  switch (itemType) {
    case 'lunch':
      return <CoffeeOutlined />;
    case 'hotel':
      return <HomeOutlined />;
    default:
      return <EnvironmentOutlined />;
  }
}

function getActivityTimelineColor(itemType: ItineraryItemDto['itemType']) {
  if (itemType === 'lunch' || itemType === 'rest' || itemType === 'hotel') {
    return getItineraryActivityColor(itemType);
  }

  return '#7a8ca4';
}

function renderTimelineItem(entry: TimelineEntry, spotMapping: Map<number, TravelSpot>, tags: SpotTag[]) {
  // 将路线颜色写入时间轴节点，由 CSS 统一渲染左侧步骤线，避免卡片内再出现独立竖线。
  const timelineStyle = { '--route-accent': entry.color } as CSSProperties;

  if (entry.type === 'segment') {
    return {
      className: styles.routeTimelineItem,
      color: entry.color,
      style: timelineStyle,
      dot: <span className={styles.transportDot} style={{ color: entry.color }} aria-hidden="true" />,
      children: (
        <div className={styles.segmentCard}>
          <div className={styles.segmentMain}>
            <strong>{entry.title}</strong>
            <span>{entry.subtitle}</span>
            <span>{entry.meta}</span>
          </div>
          <ExportOutlined className={styles.segmentArrow} />
        </div>
      ),
    };
  }

  if (entry.type === 'spot') {
    const spot = spotMapping.get(entry.stayPlan.spotId);
    const previewTags = spot?.tags.slice(0, 2) ?? [];

    return {
      className: styles.routeTimelineItem,
      color: entry.color,
      style: timelineStyle,
      dot: (
        <span className={styles.sequenceDot} style={{ backgroundColor: entry.color }}>
          {entry.sequence}
        </span>
      ),
      children: (
        <div className={styles.spotCard}>
          <div
            className={styles.cover}
            style={spot?.coverUrl ? { backgroundImage: `linear-gradient(160deg, rgb(20 37 64 / 12%), rgb(20 37 64 / 40%)), url(${spot.coverUrl})` } : undefined}
          />
          <div className={styles.spotContent}>
            <div className={styles.spotTop}>
              <div className={styles.spotTitleGroup}>
                <strong>{entry.stayPlan.spotName}</strong>
                <span>{entry.arrivalLabel} 到达</span>
              </div>
              <strong className={styles.spotSchedule}>
                {entry.arrivalLabel} - {entry.leaveLabel}
              </strong>
            </div>
            {previewTags.length > 0 ? (
              <div className={styles.tagLine}>
                {previewTags.map((tagCode) => (
                  <Tag className={styles.tagPill} bordered={false} key={`${entry.stayPlan.spotId}-${tagCode}`}>
                    {getSpotTagName(tagCode, tags)}
                  </Tag>
                ))}
              </div>
            ) : null}
            <div className={styles.spotMeta}>
              <span>游玩时长 {formatDuration(entry.stayPlan.suggestedDurationMinutes)}</span>
              <strong>第 {entry.sequence} 站</strong>
            </div>
          </div>
        </div>
      ),
    };
  }

  if (entry.type === 'activity') {
    return {
      className: styles.routeTimelineItem,
      color: entry.color,
      style: timelineStyle,
      dot: (
        <span className={styles.activityDot} style={{ backgroundColor: entry.color }}>
          {getActivityIcon(entry.item.itemType)}
        </span>
      ),
      children: (
        <div className={styles.segmentCard}>
          <div className={styles.segmentMain}>
            <strong>
              {entry.item.title}
              {entry.item.placeName && entry.item.placeName !== entry.item.title
                ? ` · ${entry.item.placeName}`
                : ''}
            </strong>
            <span>
              {entry.item.suggestedStartTime} - {entry.item.suggestedEndTime} · {formatDuration(entry.item.durationMinutes)}
            </span>
            {entry.item.note ? <span className={styles.activityNote}>{entry.item.note}</span> : null}
          </div>
          <ExportOutlined className={styles.segmentArrow} />
        </div>
      ),
    };
  }

  return {
    className: styles.routeTimelineItem,
    color: entry.color,
    style: timelineStyle,
    dot: (
      <span className={`${styles.pointDot} ${styles[entry.type]}`} style={{ backgroundColor: entry.color }}>
        {entry.type === 'start' ? '起' : '终'}
      </span>
    ),
    children: (
      <div className={styles.pointCard}>
        <span className={styles.pointTime}>{entry.timeLabel}</span>
        <strong>{entry.title}</strong>
      </div>
    ),
  };
}
