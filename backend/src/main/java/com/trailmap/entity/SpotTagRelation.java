package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * 景点与标签的多对多关联实体。
 */
@Getter
@Setter
@TableName("spot_tag_relation")
public class SpotTagRelation {

    @TableId(type = IdType.INPUT)
    private Long id;
    private Long spotId;
    private Long tagId;
    private LocalDateTime createdAt;
}
