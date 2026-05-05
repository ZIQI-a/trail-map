CREATE TABLE IF NOT EXISTS city (
    id BIGINT PRIMARY KEY,
    city_name VARCHAR(50) NOT NULL,
    province_name VARCHAR(50) NOT NULL,
    city_code VARCHAR(50) NOT NULL,
    center_lng DECIMAL(10, 6) NOT NULL,
    center_lat DECIMAL(10, 6) NOT NULL,
    map_zoom INT NOT NULL,
    cover_url VARCHAR(255),
    description VARCHAR(500),
    recommend_days DECIMAL(3, 1),
    hot_score INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS spot (
    id BIGINT PRIMARY KEY,
    city_id BIGINT NOT NULL,
    spot_name VARCHAR(100) NOT NULL,
    spot_type VARCHAR(50) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    address VARCHAR(255) NOT NULL,
    amap_poi_id VARCHAR(100),
    cover_url VARCHAR(255),
    summary VARCHAR(500),
    description TEXT,
    recommend_reason TEXT,
    travel_guide TEXT,
    opening_hours VARCHAR(255),
    ticket_info VARCHAR(255),
    suggested_duration INT,
    best_time VARCHAR(100),
    recommend_score DECIMAL(2, 1),
    hot_score INT DEFAULT 0,
    suitable_crowd VARCHAR(255),
    is_free TINYINT DEFAULT 0,
    is_indoor TINYINT DEFAULT 0,
    is_night TINYINT DEFAULT 0,
    is_rainy_day TINYINT DEFAULT 0,
    subway_friendly TINYINT DEFAULT 0,
    first_visit TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_spot_city FOREIGN KEY (city_id) REFERENCES city (id)
);

CREATE TABLE IF NOT EXISTS spot_tag (
    id BIGINT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL,
    tag_code VARCHAR(50) NOT NULL,
    tag_type VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_spot_tag_code UNIQUE (tag_code)
);

CREATE TABLE IF NOT EXISTS spot_tag_relation (
    id BIGINT PRIMARY KEY,
    spot_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_relation_spot FOREIGN KEY (spot_id) REFERENCES spot (id),
    CONSTRAINT fk_relation_tag FOREIGN KEY (tag_id) REFERENCES spot_tag (id),
    CONSTRAINT uk_spot_tag_relation UNIQUE (spot_id, tag_id)
);