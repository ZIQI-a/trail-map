ALTER TABLE user_trip
    ADD COLUMN route_fingerprint VARCHAR(64) NULL COMMENT '行程路线唯一指纹' AFTER route_record_id;

CREATE UNIQUE INDEX uk_user_trip_active_route_fingerprint
    ON user_trip (user_id, status, route_fingerprint);
