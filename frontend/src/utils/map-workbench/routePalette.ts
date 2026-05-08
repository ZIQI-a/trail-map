// 路线配色统一由这一层管理，保证地图线条和右侧时间轴颜色保持一致。
const ROUTE_SEGMENT_COLORS = ['#2d6bff', '#20a95a', '#f08b2f', '#7a5af8', '#ef5da8'];

export function getRouteSegmentColor(index: number) {
  return ROUTE_SEGMENT_COLORS[index % ROUTE_SEGMENT_COLORS.length];
}
