package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 路线规划记录实体，对应 route_record 表。
 */
@Getter
@Setter
@TableName("route_record")
public class RouteRecord {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long cityId;
    private Long userId;
    private String startName;
    private BigDecimal startLng;
    private BigDecimal startLat;
    private String endName;
    private BigDecimal endLng;
    private BigDecimal endLat;
    private String transportType;
    private String planMode;
    private String spotIds;
    private Integer totalDistance;
    private Integer totalDuration;
    private String routeSummary;
    private String rawRequest;
    private String rawResponse;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
