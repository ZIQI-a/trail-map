-- 路线持久化支持与行程领域模型优化
-- 1. 创建路线记录表与分段明细表
CREATE TABLE IF NOT EXISTS route_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    city_id BIGINT NOT NULL,
    user_id BIGINT,
    start_name VARCHAR(100) NOT NULL,
    start_lng DECIMAL(10, 6) NOT NULL,
    start_lat DECIMAL(10, 6) NOT NULL,
    end_name VARCHAR(100),
    end_lng DECIMAL(10, 6),
    end_lat DECIMAL(10, 6),
    transport_type VARCHAR(50) NOT NULL,
    plan_mode VARCHAR(50) NOT NULL,
    spot_ids VARCHAR(500),
    total_distance INT NOT NULL DEFAULT 0,
    total_duration INT NOT NULL DEFAULT 0 COMMENT '对应交通耗时',
    route_summary VARCHAR(500),
    raw_request JSON,
    raw_response JSON,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_route_record_city FOREIGN KEY (city_id) REFERENCES city (id)
);

CREATE TABLE IF NOT EXISTS route_segment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    route_record_id BIGINT NOT NULL,
    day_index INT NOT NULL DEFAULT 1,
    segment_index INT NOT NULL,
    from_name VARCHAR(100) NOT NULL,
    from_lng DECIMAL(10, 6) NOT NULL,
    from_lat DECIMAL(10, 6) NOT NULL,
    to_name VARCHAR(100) NOT NULL,
    to_lng DECIMAL(10, 6) NOT NULL,
    to_lat DECIMAL(10, 6) NOT NULL,
    transport_type VARCHAR(50) NOT NULL,
    distance INT NOT NULL DEFAULT 0,
    duration INT NOT NULL DEFAULT 0,
    instruction TEXT,
    polyline LONGTEXT,
    steps_json JSON,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_route_segment_record FOREIGN KEY (route_record_id) REFERENCES route_record (id)
);

-- 2. 优化行程项目表：将 user_trip_spot 升级为通用的 user_trip_item
RENAME TABLE user_trip_spot TO user_trip_item;

ALTER TABLE user_trip_item 
    MODIFY COLUMN spot_id BIGINT COMMENT '核心景点ID，非景点节点可为空',
    ADD COLUMN item_type VARCHAR(30) NOT NULL DEFAULT 'spot' AFTER spot_id,
    ADD COLUMN item_name VARCHAR(100) NOT NULL AFTER item_type,
    ADD COLUMN lng DECIMAL(10, 6) AFTER item_name,
    ADD COLUMN lat DECIMAL(10, 6) AFTER lng,
    ADD COLUMN start_time VARCHAR(10) AFTER lat,
    ADD COLUMN end_time VARCHAR(10) AFTER start_time;

-- 3. 补全 user_trip 汇总字段，适配多天行程的时间与空间维度展示
ALTER TABLE user_trip 
    ADD COLUMN start_name VARCHAR(100) AFTER trip_name,
    ADD COLUMN end_name VARCHAR(100) AFTER start_name,
    ADD COLUMN total_distance INT NOT NULL DEFAULT 0 AFTER route_record_id,
    ADD COLUMN total_travel_duration INT NOT NULL DEFAULT 0 COMMENT '总交通耗时（秒）' AFTER total_distance,
    ADD COLUMN total_stay_duration INT NOT NULL DEFAULT 0 COMMENT '总停留耗时（分钟）' AFTER total_travel_duration,
    ADD COLUMN total_trip_duration INT NOT NULL DEFAULT 0 COMMENT '总总行程耗时（分钟）' AFTER total_stay_duration;
