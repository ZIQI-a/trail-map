ALTER TABLE spot
    ADD COLUMN boundary_geojson LONGTEXT NULL AFTER amap_poi_id;

-- 大唐不夜城属于区域型景点，先补一条矩形轮廓样例，验证“左侧精选景点点击后高亮轮廓”的闭环。
UPDATE spot
SET boundary_geojson = '{"type":"Polygon","coordinates":[[[108.966322,34.224287],[108.969524,34.224287],[108.969524,34.213904],[108.966322,34.213904],[108.966322,34.224287]]]}'
WHERE id = 203;
