package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 景点标签实体。
 */
@Getter
@Setter
@TableName("spot_tag")
public class SpotTag {

    @TableId(type = IdType.INPUT)
    private Long id;
    private String tagName;
    private String tagCode;
    private String tagType;
    private Integer sortOrder;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
