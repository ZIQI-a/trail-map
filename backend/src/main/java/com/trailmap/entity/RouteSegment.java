package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 路线分段明细实体，对应 route_segment 表。
 */
@Getter
@Setter
@TableName("route_segment")
public class RouteSegment {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long routeRecordId;
    private Integer dayIndex;
    private Integer segmentIndex;
    private String fromName;
    private BigDecimal fromLng;
    private BigDecimal fromLat;
    private String toName;
    private BigDecimal toLng;
    private BigDecimal toLat;
    private String transportType;
    private Integer distance;
    private Integer duration;
    private String instruction;
    private String polyline;
    private String stepsJson;
    private LocalDateTime createdAt;
}
