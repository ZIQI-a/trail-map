import type { RuleObject } from "antd/es/form";

export const BOUNDARY_GEOJSON_EXAMPLE =
  '{"type":"Polygon","coordinates":[[[118.7865,32.0189],[118.7912,32.0189],[118.7912,32.0225],[118.7865,32.0225],[118.7865,32.0189]]]}';

/**
 * 校验项目当前支持的景点边界格式：GCJ-02 Polygon 第一条闭合外环。
 */
export async function validateBoundaryGeoJson(
  _rule: RuleObject,
  value?: string,
) {
  if (!value?.trim()) {
    return;
  }
  if (value.length > 200_000) {
    throw new Error("边界数据过大，请控制在 200KB 以内");
  }

  try {
    const parsed = JSON.parse(value) as {
      type?: unknown;
      coordinates?: unknown;
    };
    if (parsed.type !== "Polygon" || !Array.isArray(parsed.coordinates)) {
      throw new Error("当前仅支持 Polygon 类型");
    }
    const ring = parsed.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      throw new Error("边界外环至少需要 4 个坐标点");
    }
    const points = ring.map((point) => {
      if (
        !Array.isArray(point) ||
        point.length < 2 ||
        typeof point[0] !== "number" ||
        typeof point[1] !== "number" ||
        point[0] < -180 ||
        point[0] > 180 ||
        point[1] < -90 ||
        point[1] > 90
      ) {
        throw new Error("坐标必须使用合法的 [经度, 纬度] 数字格式");
      }
      return point;
    });
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new Error("边界首尾坐标必须相同，形成闭合外环");
    }
  } catch (error) {
    throw new Error(
      error instanceof SyntaxError
        ? "请输入合法的 JSON"
        : error instanceof Error
          ? error.message
          : "边界格式不正确",
    );
  }
}
