// 把米转换成更适合路线规划面板展示的距离文本。
export function formatRouteDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

// 把秒转换成紧凑时间文本，用于路线指标和分段摘要。
export function formatRouteDuration(durationSeconds: number) {
  const totalMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} 分钟`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${hours}h`;
}

// 总行程分钟数统一转成小时 + 分钟，避免底部指标和抽屉展示口径不一致。
export function formatTripDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes} 分钟`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${hours}h`;
}
