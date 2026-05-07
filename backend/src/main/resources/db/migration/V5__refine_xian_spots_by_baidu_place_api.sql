-- 基于百度地点检索实际返回结果进一步修正西安精选景点主点位。
-- 当前阶段优先保证主点位准确；此前的示例轮廓先清空，避免继续展示不准确的范围。

UPDATE spot
SET lng = 108.955076,
    lat = 34.224201,
    address = '陕西省西安市雁塔区小寨东路91号'
WHERE id = 201;

UPDATE spot
SET lng = 108.964186,
    lat = 34.218203,
    address = '西安市雁塔区雁塔路南段11号大慈恩寺内'
WHERE id = 202;

UPDATE spot
SET lng = 108.964059,
    lat = 34.213784,
    address = '陕西省西安市雁塔区慈恩路46号',
    boundary_geojson = NULL
WHERE id = 203;

UPDATE spot
SET lng = 108.946998,
    lat = 34.251323,
    address = '西安市碑林区南大街2号',
    boundary_geojson = NULL
WHERE id = 204;
