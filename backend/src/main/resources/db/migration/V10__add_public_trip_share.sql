ALTER TABLE user_trip
    ADD COLUMN is_public TINYINT NOT NULL DEFAULT 0 COMMENT '是否开启公开分享' AFTER cover_url,
    ADD COLUMN share_token VARCHAR(64) NULL COMMENT '公开分享令牌' AFTER is_public,
    ADD COLUMN shared_at DATETIME NULL COMMENT '公开分享开启时间' AFTER share_token;

CREATE UNIQUE INDEX uk_user_trip_share_token ON user_trip (share_token);
