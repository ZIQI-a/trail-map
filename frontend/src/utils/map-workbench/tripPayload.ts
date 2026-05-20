import type {
  GeoPoint,
  PlanMode,
  RoutePlanResponseDto,
  SaveTripRequestDto,
  SchedulePlanConfig,
  TravelCity,
  TravelSpot,
} from "../../types/mapWorkbench";

export interface SaveTripPayloadContext {
  city: TravelCity;
  routePlan: RoutePlanResponseDto;
  tripSpots: TravelSpot[];
  startPoint: string;
  startPointPosition: GeoPoint;
  scheduleConfig: SchedulePlanConfig;
}

// 规划结果是展示结构，保存行程接口是持久化结构，这里统一做一次适配。
export function buildSaveTripPayload(
  context: SaveTripPayloadContext,
): SaveTripRequestDto {
  const {
    city,
    routePlan,
    tripSpots,
    startPoint,
    startPointPosition,
    scheduleConfig,
  } = context;
  const items =
    routePlan.planMode === "schedule"
      ? routePlan.itineraryDays.flatMap((day) =>
          day.items.map((item, index) => ({
            spotId: item.itemType === "spot" ? item.relatedSpotId : undefined,
            itemName: item.placeName || item.title,
            itemType: item.itemType,
            position: item.position ?? undefined,
            dayIndex: day.dayIndex,
            sortOrder: index + 1,
            startTime: item.suggestedStartTime,
            endTime: item.suggestedEndTime,
            suggestedDuration: item.durationMinutes,
          })),
        )
      : routePlan.spotStayPlans.map((spot, index) => {
          const currentSpot = tripSpots.find(
            (tripSpot) => tripSpot.id === spot.spotId,
          );
          return {
            spotId: spot.spotId,
            itemName: spot.spotName,
            itemType: "spot" as const,
            position: currentSpot?.position,
            dayIndex: 1,
            sortOrder: index + 1,
            startTime: spot.suggestedStartTime,
            endTime: spot.suggestedEndTime,
            suggestedDuration: spot.suggestedDurationMinutes,
          };
        });
  const segments =
    routePlan.planMode === "schedule"
      ? routePlan.itineraryDays.flatMap((day) =>
          day.segments.map((segment) => ({
            dayIndex: day.dayIndex,
            segmentIndex: segment.segmentIndex,
            fromName: segment.fromName,
            fromPosition: segment.fromPosition,
            toName: segment.toName,
            toPosition: segment.toPosition,
            transportType: segment.transportType,
            distance: segment.distanceMeters,
            duration: segment.durationSeconds,
            instruction: segment.instruction,
            polyline: segment.polyline,
            steps: segment.stepTexts,
          })),
        )
      : routePlan.segments.map((segment) => ({
          dayIndex: 1,
          segmentIndex: segment.segmentIndex,
          fromName: segment.fromName,
          fromPosition: segment.fromPosition,
          toName: segment.toName,
          toPosition: segment.toPosition,
          transportType: segment.transportType,
          distance: segment.distanceMeters,
          duration: segment.durationSeconds,
          instruction: segment.instruction,
          polyline: segment.polyline,
          steps: segment.stepTexts,
        }));
  const lastSegment = segments[segments.length - 1];
  const scheduleDayCount =
    routePlan.itineraryDays.length || scheduleConfig.tripDays || 1;

  return {
    cityId: city.id,
    tripName: buildDefaultTripName(
      city.name,
      routePlan.planMode,
      scheduleDayCount,
    ),
    startName: startPoint,
    endName: lastSegment?.toName,
    startPosition: startPointPosition,
    endPosition: lastSegment?.toPosition,
    startDate:
      routePlan.planMode === "schedule"
        ? scheduleConfig.tripStartDate
        : undefined,
    endDate:
      routePlan.planMode === "schedule"
        ? scheduleConfig.tripEndDate
        : undefined,
    days: routePlan.planMode === "schedule" ? scheduleDayCount : 1,
    transportType: routePlan.transportType,
    planMode: routePlan.planMode,
    totalDistance: routePlan.totalDistanceMeters,
    totalTravelDuration: routePlan.totalTravelDurationSeconds,
    totalStayDuration: routePlan.totalStayDurationMinutes,
    totalTripDuration: routePlan.totalTripDurationMinutes,
    routeSummary: routePlan.routeSummary,
    routeRecordId: routePlan.routeRecordId,
    coverUrl: tripSpots[0]?.coverUrl || undefined,
    items,
    segments,
  };
}

function buildDefaultTripName(cityName: string, planMode: PlanMode, days: number) {
  if (planMode === "schedule") {
    return `${cityName}${days}天行程`;
  }
  return `${cityName}路线规划`;
}
