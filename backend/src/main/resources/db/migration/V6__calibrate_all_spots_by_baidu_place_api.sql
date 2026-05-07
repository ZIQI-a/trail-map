-- 统一按百度地点检索主 POI 结果校准当前精选景点坐标。
-- 当前阶段只保留准确主点位，区域轮廓暂不维护，因此一并清空边界数据。

UPDATE spot
SET lng = 104.053572,
    lat = 30.663689,
    address = '四川省成都市青羊区宽巷子27号',
    boundary_geojson = NULL
WHERE id = 101;

UPDATE spot
SET lng = 104.047947,
    lat = 30.646254,
    address = '四川省成都市武侯区武侯祠大街231号',
    boundary_geojson = NULL
WHERE id = 102;

UPDATE spot
SET lng = 104.048964,
    lat = 30.647508,
    address = '成都市武侯区武侯祠大街231号附1号',
    boundary_geojson = NULL
WHERE id = 103;

UPDATE spot
SET lng = 104.139255,
    lat = 30.740995,
    address = '四川省成都市成华区熊猫大道1375号',
    boundary_geojson = NULL
WHERE id = 104;

UPDATE spot
SET lng = 104.028424,
    lat = 30.660141,
    address = '四川省成都市青羊区青华路37号',
    boundary_geojson = NULL
WHERE id = 105;

UPDATE spot
SET lng = 108.955076,
    lat = 34.224201,
    address = '陕西省西安市雁塔区小寨东路91号',
    boundary_geojson = NULL
WHERE id = 201;

UPDATE spot
SET lng = 108.964186,
    lat = 34.218203,
    address = '西安市雁塔区雁塔路南段11号大慈恩寺内',
    boundary_geojson = NULL
WHERE id = 202;

UPDATE spot
SET lng = 108.964059,
    lat = 34.213784,
    address = '陕西省西安市雁塔区慈恩路46号',
    boundary_geojson = NULL
WHERE id = 203;

UPDATE spot
SET lng = 108.947110,
    lat = 34.275703,
    address = '陕西省西安市碑林区南大街2号',
    boundary_geojson = NULL
WHERE id = 204;
