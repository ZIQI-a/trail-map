// 百度地图最小类型声明：只覆盖当前项目地图展示阶段用到的类和方法。
type BMapGLEventHandler = () => void;

interface BMapGLPointLike {
  lng: number;
  lat: number;
}

interface BMapGLMap {
  centerAndZoom(point: BMapGLPointLike, zoom: number): void;
  enableScrollWheelZoom(enable: boolean): void;
  addControl(control: unknown): void;
  addOverlay(overlay: unknown): void;
  clearOverlays(): void;
  panTo(point: BMapGLPointLike): void;
  setViewport(points: BMapGLPointLike[]): void;
}

interface BMapGLMarker {
  addEventListener(eventName: 'click', handler: BMapGLEventHandler): void;
}

interface BMapGLPolygon {
  addEventListener(eventName: 'click', handler: BMapGLEventHandler): void;
}

interface BMapGLSizeLike {
  width: number;
  height: number;
}

interface BMapGLNamespace {
  Map: new (container: string | HTMLElement) => BMapGLMap;
  Point: new (lng: number, lat: number) => BMapGLPointLike;
  Size: new (width: number, height: number) => BMapGLSizeLike;
  Icon: new (url: string, size: BMapGLSizeLike, options?: { anchor?: BMapGLSizeLike }) => unknown;
  Marker: new (point: BMapGLPointLike, options?: { icon?: unknown }) => BMapGLMarker;
  Polygon: new (
    points: BMapGLPointLike[],
    options?: {
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      fillColor?: string;
      fillOpacity?: number;
    }
  ) => BMapGLPolygon;
  ScaleControl: new () => unknown;
  NavigationControl: new () => unknown;
}

interface Window {
  BMapGL?: BMapGLNamespace;
  __trailMapBaiduMapInit__?: () => void;
}
