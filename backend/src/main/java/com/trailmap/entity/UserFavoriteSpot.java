package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 用户收藏景点实体，对应 user_favorite_spot 表。
 */
@Getter
@Setter
@TableName("user_favorite_spot")
public class UserFavoriteSpot {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long spotId;
    private LocalDateTime createdAt;
}
