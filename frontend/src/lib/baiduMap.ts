const BAIDU_MAP_SCRIPT_ID = 'trailmap-baidu-map-sdk';
const BAIDU_MAP_AK = import.meta.env.VITE_BAIDU_MAP_AK;

let baiduMapPromise: Promise<BMapGLNamespace> | undefined;

// 加载百度地图 SDK，确保整个应用只注入一次脚本。
export function loadBaiduMapGL() {
  if (window.BMapGL) {
    return Promise.resolve(window.BMapGL);
  }

  if (!BAIDU_MAP_AK) {
    return Promise.reject(new Error('缺少 AK'));
  }

  if (baiduMapPromise) {
    return baiduMapPromise;
  }

  baiduMapPromise = new Promise<BMapGLNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(BAIDU_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener(
        'load',
        () => (window.BMapGL ? resolve(window.BMapGL) : reject(new Error('百度地图 SDK 加载后未找到 BMapGL'))),
        { once: true },
      );
      existingScript.addEventListener('error', () => reject(new Error('百度地图 SDK 加载失败')), { once: true });
      return;
    }

    window.__trailMapBaiduMapInit__ = () => {
      if (!window.BMapGL) {
        reject(new Error('百度地图 SDK 初始化失败'));
        return;
      }

      resolve(window.BMapGL);
      delete window.__trailMapBaiduMapInit__;
    };

    const script = document.createElement('script');
    script.id = BAIDU_MAP_SCRIPT_ID;
    script.async = true;
    script.src = `https://api.map.baidu.com/api?type=webgl&v=1.0&ak=${encodeURIComponent(BAIDU_MAP_AK)}&callback=__trailMapBaiduMapInit__`;
    script.onerror = () => reject(new Error('百度地图 SDK 脚本请求失败'));
    document.head.appendChild(script);
  }).catch((error) => {
    baiduMapPromise = undefined;
    throw error;
  });

  return baiduMapPromise;
}

// 统一创建百度地图点对象，减少组件中重复拼装经纬度逻辑。
export function createBaiduPoint(point: { lng: number; lat: number }) {
  if (!window.BMapGL) {
    throw new Error('百度地图 SDK 尚未完成加载');
  }

  return new window.BMapGL.Point(point.lng, point.lat);
}
