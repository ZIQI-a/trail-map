package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 用户景点打卡实体，对应 user_checkin_spot 表。
 */
@Getter
@Setter
@TableName("user_checkin_spot")
public class UserCheckinSpot {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long spotId;
    private LocalDateTime checkinTime;
    private BigDecimal checkinLng;
    private BigDecimal checkinLat;
    private String remark;
    private LocalDateTime createdAt;
}
