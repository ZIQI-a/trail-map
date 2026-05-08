import {
  AimOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FlagOutlined,
  NodeIndexOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Button, Tag, Timeline } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import type { RoutePlanResponseDto, SpotTag, TravelSpot } from '../../../types/mapWorkbench';
import { getRouteSegmentColor } from '../../../utils/map-workbench/routePalette';
import { formatRouteDistance, formatRouteDuration, formatTripDuration } from '../../../utils/map-workbench/routeDisplay';
import { formatDuration, getSpotTagName } from '../../../utils/map-workbench/spotDisplay';
import styles from './RoutePlanDrawer.module.css';

interface RoutePlanDrawerProps {
  cityName: string;
  routePlan: RoutePlanResponseDto;
  tripSpots: TravelSpot[];
  tags: SpotTag[];
  startPoint: string;
  onClose: () => void;
}

// RoutePlanDrawer 负责在路线规划成功后展示右侧路线时间轴详情。
export function RoutePlanDrawer({ cityName, routePlan, tripSpots, tags, startPoint, onClose }: RoutePlanDrawerProps) {
  const spotMapping = new Map(tripSpots.map((spot) => [spot.id, spot]));
  const timelineEntries = buildTimelineEntries(routePlan, startPoint);

  return (
    <aside className={styles.drawer} aria-label="路线规划详情">
      <div className={styles.header}>
        <div>
          <h2>
            {cityName}
            {routePlan.planMode === 'free' ? '一日游路线' : '行程路线'}
          </h2>
          <p className={styles.headerSubline}>按当前景点池顺序生成，后续可继续补完整行程拆分。</p>
        </div>
        <div className={styles.headerActions}>
          <Button icon={<ShareAltOutlined />} className={styles.headerButton}>
            分享
          </Button>
          <Button icon={<CloseOutlined />} className={styles.headerIconButton} onClick={onClose} />
        </div>
      </div>

      <div className={styles.metricRow}>
        <MetricCard icon={<FlagOutlined />} value={formatRouteDistance(routePlan.totalDistanceMeters)} label="总里程" />
        <MetricCard icon={<CarOutlined />} value={formatRouteDuration(routePlan.totalTravelDurationSeconds)} label="交通耗时" />
        <MetricCard icon={<ClockCircleOutlined />} value={formatTripDuration(routePlan.totalStayDurationMinutes)} label="游玩时长" />
        <MetricCard icon={<AimOutlined />} value={formatTripDuration(routePlan.totalTripDurationMinutes)} label="预计总时长" />
        <MetricCard icon={<NodeIndexOutlined />} value={`${routePlan.orderedSpotIds.length} 个`} label="景点数量" />
      </div>

      <div className={styles.summaryCard}>
        <p>{routePlan.routeSummary}</p>
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
  | { type: 'segment'; title: string; subtitle: string; color: string; icon: ReactNode; sequence: number }
  | {
      type: 'spot';
      sequence: number;
      color: string;
      stayPlan: RoutePlanResponseDto['spotStayPlans'][number];
      arrivalLabel: string;
      leaveLabel: string;
    };

function buildTimelineEntries(routePlan: RoutePlanResponseDto, startPoint: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let currentMinutes = 9 * 60;

  entries.push({
    type: 'start',
    title: startPoint || '市中心',
    timeLabel: formatClock(currentMinutes),
    color: '#20a95a',
  });

  routePlan.spotStayPlans.forEach((stayPlan, index) => {
    const segment = routePlan.segments[index];
    if (segment) {
      // 每个路段先展示，再进入当前景点，符合真实行程阅读顺序。
      entries.push({
        type: 'segment',
        title: getTransportLabel(segment.transportType),
        subtitle: `${formatRouteDistance(segment.distanceMeters)} · ${formatRouteDuration(segment.durationSeconds)}`,
        color: getRouteSegmentColor(index),
        icon: getTransportIcon(segment.transportType),
        sequence: index + 1,
      });
      currentMinutes += Math.ceil(segment.durationSeconds / 60);
    }

    const arrivalMinutes = currentMinutes;
    currentMinutes += stayPlan.suggestedDurationMinutes;
    const leaveMinutes = currentMinutes;

    entries.push({
      type: 'spot',
      sequence: index + 1,
      color: getRouteSegmentColor(index),
      stayPlan,
      arrivalLabel: formatClock(arrivalMinutes),
      leaveLabel: formatClock(leaveMinutes),
    });
  });

  const lastStayPlan = routePlan.spotStayPlans[routePlan.spotStayPlans.length - 1];

  entries.push({
    type: 'end',
    title: lastStayPlan?.spotName ?? '行程结束',
    timeLabel: formatClock(currentMinutes),
    color: '#ff5a40',
  });

  return entries;
}

function formatClock(totalMinutes: number) {
  const normalizedMinutes = Math.max(0, totalMinutes);
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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

function renderTimelineItem(entry: TimelineEntry, spotMapping: Map<number, TravelSpot>, tags: SpotTag[]) {
  if (entry.type === 'segment') {
    return {
      color: entry.color,
      dot: (
        <span className={styles.transportDot} style={{ backgroundColor: entry.color }}>
          {entry.icon}
        </span>
      ),
      children: (
        <div className={styles.segmentCard} style={{ '--route-accent': entry.color } as CSSProperties}>
          <span className={styles.segmentRail} aria-hidden="true" />
          <div className={styles.segmentMain}>
            <strong>{entry.title}</strong>
            <span>第 {entry.sequence} 段 · {entry.subtitle}</span>
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
      color: entry.color,
      dot: (
        <span className={styles.sequenceDot} style={{ backgroundColor: entry.color }}>
          {entry.sequence}
        </span>
      ),
      children: (
        <div className={styles.spotCard} style={{ '--route-accent': entry.color } as CSSProperties}>
          <span className={styles.spotRail} aria-hidden="true" />
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

  return {
    color: entry.color,
    dot: <span className={`${styles.pointDot} ${styles[entry.type]}`}>{entry.type === 'start' ? '起' : '终'}</span>,
    children: (
      <div className={styles.pointCard}>
        <span className={styles.pointTime}>{entry.timeLabel}</span>
        <strong>{entry.title}</strong>
      </div>
    ),
  };
}
