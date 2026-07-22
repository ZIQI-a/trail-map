package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 用户行程子项目实体，对应 user_trip_item 表。
 * 支持景点、午餐、休息、酒店等多种类型的节点。
 */
@Getter
@Setter
@TableName("user_trip_item")
public class UserTripItem {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long tripId;
    private Long spotId;
    private String itemType;
    private String itemName;
    private BigDecimal lng;
    private BigDecimal lat;
    private String startTime;
    private String endTime;
    private Integer dayIndex;
    private Integer sortOrder;
    private Integer suggestedDuration;
    private LocalDateTime createdAt;
}
