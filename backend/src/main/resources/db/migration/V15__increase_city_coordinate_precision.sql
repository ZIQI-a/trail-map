-- 保留百度地理编码返回的高精度城市中心点，避免写入 DECIMAL(10,6) 时发生隐式舍入。
ALTER TABLE city
    MODIFY COLUMN center_lng DECIMAL(13, 10) NOT NULL,
    MODIFY COLUMN center_lat DECIMAL(13, 10) NOT NULL;
