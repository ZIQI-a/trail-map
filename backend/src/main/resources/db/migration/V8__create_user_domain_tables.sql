CREATE TABLE IF NOT EXISTS app_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    status TINYINT NOT NULL DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_app_user_username UNIQUE (username),
    CONSTRAINT uk_app_user_phone UNIQUE (phone),
    CONSTRAINT uk_app_user_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS user_favorite_spot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    spot_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_user_favorite_spot_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_favorite_spot_spot FOREIGN KEY (spot_id) REFERENCES spot (id),
    CONSTRAINT uk_user_favorite_spot UNIQUE (user_id, spot_id)
);

CREATE TABLE IF NOT EXISTS user_checkin_spot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    spot_id BIGINT NOT NULL,
    checkin_time DATETIME NOT NULL,
    checkin_lng DECIMAL(10, 6),
    checkin_lat DECIMAL(10, 6),
    remark VARCHAR(500),
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_user_checkin_spot_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_checkin_spot_spot FOREIGN KEY (spot_id) REFERENCES spot (id),
    CONSTRAINT uk_user_checkin_spot UNIQUE (user_id, spot_id)
);

CREATE TABLE IF NOT EXISTS user_trip (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    city_id BIGINT NOT NULL,
    trip_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    days INT NOT NULL,
    transport_type VARCHAR(50) NOT NULL,
    plan_mode VARCHAR(50) NOT NULL,
    route_record_id BIGINT,
    cover_url VARCHAR(255),
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_user_trip_user FOREIGN KEY (user_id) REFERENCES app_user (id),
    CONSTRAINT fk_user_trip_city FOREIGN KEY (city_id) REFERENCES city (id)
);

CREATE TABLE IF NOT EXISTS user_trip_spot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    trip_id BIGINT NOT NULL,
    spot_id BIGINT NOT NULL,
    day_index INT NOT NULL,
    sort_order INT NOT NULL,
    suggested_duration INT,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_user_trip_spot_trip FOREIGN KEY (trip_id) REFERENCES user_trip (id),
    CONSTRAINT fk_user_trip_spot_spot FOREIGN KEY (spot_id) REFERENCES spot (id),
    CONSTRAINT uk_user_trip_spot_order UNIQUE (trip_id, day_index, sort_order)
);
