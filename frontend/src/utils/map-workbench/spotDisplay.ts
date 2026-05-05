import type { SpotTag, SpotTagCode } from '../../types/mapWorkbench';

// 根据分钟数生成面向游客可读的游玩时长。
export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return restMinutes > 0 ? `${hours}小时${restMinutes}分钟` : `${hours}小时`;
}

// 把标签编码转换为中文名称，找不到时保留编码，便于联调时快速定位数据问题。
export function getSpotTagName(code: SpotTagCode, tags: SpotTag[]) {
  return tags.find((tag) => tag.code === code)?.name ?? code;
}
