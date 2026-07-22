package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 城市实体，字段与 city 表保持一致，便于直接映射数据库记录。
 */
@Getter
@Setter
@TableName("city")
public class City {

    @TableId(type = IdType.INPUT)
    private Long id;
    private String cityName;
    private String provinceName;
    private String cityCode;
    private BigDecimal centerLng;
    private BigDecimal centerLat;
    private Integer mapZoom;
    private String coverUrl;
    private String description;
    private BigDecimal recommendDays;
    private Integer hotScore;
    private Integer sortOrder;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
