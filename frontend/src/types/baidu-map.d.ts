// 百度地图最小类型声明：只覆盖当前项目地图展示阶段用到的类和方法。
type BMapGLEventHandler = () => void;
type BMapGLMapClickHandler = (event: BMapGLMapClickEvent) => void;

interface BMapGLPointLike {
  lng: number;
  lat: number;
}

interface BMapGLMapClickEvent {
  latlng?: BMapGLPointLike;
  point?: BMapGLPointLike;
}

interface BMapGLMap {
  centerAndZoom(point: BMapGLPointLike, zoom: number): void;
  enableScrollWheelZoom(enable: boolean): void;
  addControl(control: unknown): void;
  addOverlay(overlay: unknown): void;
  clearOverlays(): void;
  getZoom(): number;
  panTo(point: BMapGLPointLike): void;
  setViewport(points: BMapGLPointLike[]): void;
  addEventListener(eventName: 'click', handler: BMapGLMapClickHandler): void;
  removeEventListener(eventName: 'click', handler: BMapGLMapClickHandler): void;
  addEventListener(eventName: 'zoomend', handler: BMapGLEventHandler): void;
  removeEventListener(eventName: 'zoomend', handler: BMapGLEventHandler): void;
}

interface BMapGLMarker {
  addEventListener(eventName: 'click', handler: BMapGLEventHandler): void;
}

interface BMapGLPolygon {
  addEventListener(eventName: 'click', handler: BMapGLEventHandler): void;
}

interface BMapGLPolyline {
  addEventListener(eventName: 'click', handler: BMapGLEventHandler): void;
}

interface BMapGLGeocoderResult {
  address?: string;
  addressComponents?: {
    province?: string;
    city?: string;
    district?: string;
    street?: string;
    streetNumber?: string;
  };
  surroundingPois?: Array<{
    title?: string;
    address?: string;
  }>;
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
  Polyline: new (
    points: BMapGLPointLike[],
    options?: {
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
    }
  ) => BMapGLPolyline;
  ScaleControl: new () => unknown;
  NavigationControl: new () => unknown;
  Geocoder: new () => {
    getLocation(point: BMapGLPointLike, callback: (result?: BMapGLGeocoderResult) => void): void;
  };
}

interface Window {
  BMapGL?: BMapGLNamespace;
  __trailMapBaiduMapInit__?: () => void;
}
