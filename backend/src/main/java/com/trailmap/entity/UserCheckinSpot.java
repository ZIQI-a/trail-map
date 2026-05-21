package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户景点打卡实体，对应 user_checkin_spot 表。
 */
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getSpotId() {
        return spotId;
    }

    public void setSpotId(Long spotId) {
        this.spotId = spotId;
    }

    public LocalDateTime getCheckinTime() {
        return checkinTime;
    }

    public void setCheckinTime(LocalDateTime checkinTime) {
        this.checkinTime = checkinTime;
    }

    public BigDecimal getCheckinLng() {
        return checkinLng;
    }

    public void setCheckinLng(BigDecimal checkinLng) {
        this.checkinLng = checkinLng;
    }

    public BigDecimal getCheckinLat() {
        return checkinLat;
    }

    public void setCheckinLat(BigDecimal checkinLat) {
        this.checkinLat = checkinLat;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
