package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 景点实体，覆盖当前阶段列表和详情需要的核心字段。
 */
@Getter
@Setter
@TableName("spot")
public class Spot {

    @TableId(type = IdType.INPUT)
    private Long id;
    private Long cityId;
    private String spotName;
    private String spotType;
    private BigDecimal lng;
    private BigDecimal lat;
    private String address;
    private String amapPoiId;
    private String boundaryGeojson;
    private String coverUrl;
    private String summary;
    private String description;
    private String recommendReason;
    private String travelGuide;
    private String openingHours;
    private String ticketInfo;
    private Integer suggestedDuration;
    private String bestTime;
    private BigDecimal recommendScore;
    private Integer hotScore;
    private String suitableCrowd;
    private Integer isFree;
    private Integer isIndoor;
    private Integer isNight;
    private Integer isRainyDay;
    private Integer subwayFriendly;
    private Integer firstVisit;
    private Integer sortOrder;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
