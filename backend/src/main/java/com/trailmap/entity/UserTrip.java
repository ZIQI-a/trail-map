package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 用户行程主实体，对应 user_trip 表。
 */
@Getter
@Setter
@TableName("user_trip")
public class UserTrip {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long cityId;
    private String tripName;
    private String startName;
    private String endName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer days;
    private String transportType;
    private String planMode;
    private Long routeRecordId;
    private String routeFingerprint;
    private Integer totalDistance;
    private Integer totalTravelDuration;
    private Integer totalStayDuration;
    private Integer totalTripDuration;
    private String coverUrl;
    private Integer isPublic;
    private String shareToken;
    private LocalDateTime sharedAt;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
