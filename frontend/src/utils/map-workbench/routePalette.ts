// 路线配色统一由这一层管理，保证地图线条和右侧时间轴颜色保持一致。
const ROUTE_SEGMENT_COLORS = ['#2d6bff', '#20a95a', '#f08b2f', '#7a5af8', '#ef5da8'];
const ITINERARY_ACTIVITY_COLORS = {
  lunch: {
    fill: '#f59e0b',
    ring: '#fde68a',
    label: '餐',
  },
  rest: {
    fill: '#14b8a6',
    ring: '#99f6e4',
    label: '休',
  },
  hotel: {
    fill: '#8b5cf6',
    ring: '#ddd6fe',
    label: '住',
  },
} as const;

export function getRouteSegmentColor(index: number) {
  return ROUTE_SEGMENT_COLORS[index % ROUTE_SEGMENT_COLORS.length];
}

export type ItineraryActivityType = keyof typeof ITINERARY_ACTIVITY_COLORS;

export function getItineraryActivityColor(itemType: ItineraryActivityType) {
  return ITINERARY_ACTIVITY_COLORS[itemType].fill;
}

export function getItineraryActivityMarkerConfig(itemType: ItineraryActivityType) {
  return ITINERARY_ACTIVITY_COLORS[itemType];
}
