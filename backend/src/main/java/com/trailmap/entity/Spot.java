package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 景点实体，覆盖当前阶段列表和详情需要的核心字段。
 */
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCityId() {
        return cityId;
    }

    public void setCityId(Long cityId) {
        this.cityId = cityId;
    }

    public String getSpotName() {
        return spotName;
    }

    public void setSpotName(String spotName) {
        this.spotName = spotName;
    }

    public String getSpotType() {
        return spotType;
    }

    public void setSpotType(String spotType) {
        this.spotType = spotType;
    }

    public BigDecimal getLng() {
        return lng;
    }

    public void setLng(BigDecimal lng) {
        this.lng = lng;
    }

    public BigDecimal getLat() {
        return lat;
    }

    public void setLat(BigDecimal lat) {
        this.lat = lat;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAmapPoiId() {
        return amapPoiId;
    }

    public void setAmapPoiId(String amapPoiId) {
        this.amapPoiId = amapPoiId;
    }

    public String getBoundaryGeojson() {
        return boundaryGeojson;
    }

    public void setBoundaryGeojson(String boundaryGeojson) {
        this.boundaryGeojson = boundaryGeojson;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRecommendReason() {
        return recommendReason;
    }

    public void setRecommendReason(String recommendReason) {
        this.recommendReason = recommendReason;
    }

    public String getTravelGuide() {
        return travelGuide;
    }

    public void setTravelGuide(String travelGuide) {
        this.travelGuide = travelGuide;
    }

    public String getOpeningHours() {
        return openingHours;
    }

    public void setOpeningHours(String openingHours) {
        this.openingHours = openingHours;
    }

    public String getTicketInfo() {
        return ticketInfo;
    }

    public void setTicketInfo(String ticketInfo) {
        this.ticketInfo = ticketInfo;
    }

    public Integer getSuggestedDuration() {
        return suggestedDuration;
    }

    public void setSuggestedDuration(Integer suggestedDuration) {
        this.suggestedDuration = suggestedDuration;
    }

    public String getBestTime() {
        return bestTime;
    }

    public void setBestTime(String bestTime) {
        this.bestTime = bestTime;
    }

    public BigDecimal getRecommendScore() {
        return recommendScore;
    }

    public void setRecommendScore(BigDecimal recommendScore) {
        this.recommendScore = recommendScore;
    }

    public Integer getHotScore() {
        return hotScore;
    }

    public void setHotScore(Integer hotScore) {
        this.hotScore = hotScore;
    }

    public String getSuitableCrowd() {
        return suitableCrowd;
    }

    public void setSuitableCrowd(String suitableCrowd) {
        this.suitableCrowd = suitableCrowd;
    }

    public Integer getIsFree() {
        return isFree;
    }

    public void setIsFree(Integer isFree) {
        this.isFree = isFree;
    }

    public Integer getIsIndoor() {
        return isIndoor;
    }

    public void setIsIndoor(Integer isIndoor) {
        this.isIndoor = isIndoor;
    }

    public Integer getIsNight() {
        return isNight;
    }

    public void setIsNight(Integer isNight) {
        this.isNight = isNight;
    }

    public Integer getIsRainyDay() {
        return isRainyDay;
    }

    public void setIsRainyDay(Integer isRainyDay) {
        this.isRainyDay = isRainyDay;
    }

    public Integer getSubwayFriendly() {
        return subwayFriendly;
    }

    public void setSubwayFriendly(Integer subwayFriendly) {
        this.subwayFriendly = subwayFriendly;
    }

    public Integer getFirstVisit() {
        return firstVisit;
    }

    public void setFirstVisit(Integer firstVisit) {
        this.firstVisit = firstVisit;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
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
