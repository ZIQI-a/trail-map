package com.trailmap.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 路线分段明细实体，对应 route_segment 表。
 */
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRouteRecordId() {
        return routeRecordId;
    }

    public void setRouteRecordId(Long routeRecordId) {
        this.routeRecordId = routeRecordId;
    }

    public Integer getDayIndex() {
        return dayIndex;
    }

    public void setDayIndex(Integer dayIndex) {
        this.dayIndex = dayIndex;
    }

    public Integer getSegmentIndex() {
        return segmentIndex;
    }

    public void setSegmentIndex(Integer segmentIndex) {
        this.segmentIndex = segmentIndex;
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = fromName;
    }

    public BigDecimal getFromLng() {
        return fromLng;
    }

    public void setFromLng(BigDecimal fromLng) {
        this.fromLng = fromLng;
    }

    public BigDecimal getFromLat() {
        return fromLat;
    }

    public void setFromLat(BigDecimal fromLat) {
        this.fromLat = fromLat;
    }

    public String getToName() {
        return toName;
    }

    public void setToName(String toName) {
        this.toName = toName;
    }

    public BigDecimal getToLng() {
        return toLng;
    }

    public void setToLng(BigDecimal toLng) {
        this.toLng = toLng;
    }

    public BigDecimal getToLat() {
        return toLat;
    }

    public void setToLat(BigDecimal toLat) {
        this.toLat = toLat;
    }

    public String getTransportType() {
        return transportType;
    }

    public void setTransportType(String transportType) {
        this.transportType = transportType;
    }

    public Integer getDistance() {
        return distance;
    }

    public void setDistance(Integer distance) {
        this.distance = distance;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }

    public String getPolyline() {
        return polyline;
    }

    public void setPolyline(String polyline) {
        this.polyline = polyline;
    }

    public String getStepsJson() {
        return stepsJson;
    }

    public void setStepsJson(String stepsJson) {
        this.stepsJson = stepsJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
