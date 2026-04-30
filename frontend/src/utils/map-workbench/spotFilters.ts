import type { ActiveSpotFilter } from '../../components/map-workbench/WorkbenchHeader';
import type { RecommendTab } from '../../components/map-workbench/SpotRecommendList';
import type { TravelSpot } from '../../types/mapWorkbench';

// 根据顶部分类、搜索关键词和列表 Tab 生成当前工作台展示的景点集合。
export function getVisibleSpots(
  spots: TravelSpot[],
  activeFilter: ActiveSpotFilter,
  searchKeyword: string,
  activeTab: RecommendTab,
) {
  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredSpots = spots.filter((spot) => {
    const matchesFilter = activeFilter === 'all' || spot.tags.includes(activeFilter);
    const matchesKeyword =
      normalizedKeyword.length === 0 ||
      spot.name.toLowerCase().includes(normalizedKeyword) ||
      spot.summary.toLowerCase().includes(normalizedKeyword) ||
      spot.recommendReason.toLowerCase().includes(normalizedKeyword);

    return matchesFilter && matchesKeyword;
  });

  return [...filteredSpots].sort((firstSpot, secondSpot) => {
    if (activeTab === 'score') {
      return secondSpot.recommendScore - firstSpot.recommendScore;
    }

    if (activeTab === 'distance') {
      return Number.parseFloat(firstSpot.distanceText) - Number.parseFloat(secondSpot.distanceText);
    }

    return 0;
  });
}
