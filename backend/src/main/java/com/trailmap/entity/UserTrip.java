package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户行程主实体，对应 user_trip 表。
 */
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

    public Long getCityId() {
        return cityId;
    }

    public void setCityId(Long cityId) {
        this.cityId = cityId;
    }

    public String getTripName() {
        return tripName;
    }

    public void setTripName(String tripName) {
        this.tripName = tripName;
    }

    public String getStartName() {
        return startName;
    }

    public void setStartName(String startName) {
        this.startName = startName;
    }

    public String getEndName() {
        return endName;
    }

    public void setEndName(String endName) {
        this.endName = endName;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }

    public String getTransportType() {
        return transportType;
    }

    public void setTransportType(String transportType) {
        this.transportType = transportType;
    }

    public String getPlanMode() {
        return planMode;
    }

    public void setPlanMode(String planMode) {
        this.planMode = planMode;
    }

    public Long getRouteRecordId() {
        return routeRecordId;
    }

    public void setRouteRecordId(Long routeRecordId) {
        this.routeRecordId = routeRecordId;
    }

    public String getRouteFingerprint() {
        return routeFingerprint;
    }

    public void setRouteFingerprint(String routeFingerprint) {
        this.routeFingerprint = routeFingerprint;
    }

    public Integer getTotalDistance() {
        return totalDistance;
    }

    public void setTotalDistance(Integer totalDistance) {
        this.totalDistance = totalDistance;
    }

    public Integer getTotalTravelDuration() {
        return totalTravelDuration;
    }

    public void setTotalTravelDuration(Integer totalTravelDuration) {
        this.totalTravelDuration = totalTravelDuration;
    }

    public Integer getTotalStayDuration() {
        return totalStayDuration;
    }

    public void setTotalStayDuration(Integer totalStayDuration) {
        this.totalStayDuration = totalStayDuration;
    }

    public Integer getTotalTripDuration() {
        return totalTripDuration;
    }

    public void setTotalTripDuration(Integer totalTripDuration) {
        this.totalTripDuration = totalTripDuration;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }

    public Integer getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Integer isPublic) {
        this.isPublic = isPublic;
    }

    public String getShareToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

    public LocalDateTime getSharedAt() {
        return sharedAt;
    }

    public void setSharedAt(LocalDateTime sharedAt) {
        this.sharedAt = sharedAt;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
