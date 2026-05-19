package com.trailmap.model.query;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 保存行程请求参数。
 * 已适配真实业务：支持多天行程中的景点、午餐、休息、酒店等所有节点。
 */
public class SaveTripRequest {

    @NotNull(message = "城市 ID 不能为空")
    private Long cityId;

    @NotBlank(message = "行程名称不能为空")
    private String tripName;

    private String startName;
    private String endName;
    private CoordinateRequest startPosition;
    private CoordinateRequest endPosition;

    private LocalDate startDate;
    private LocalDate endDate;

    @NotNull(message = "游玩天数不能为空")
    @Min(value = 1, message = "游玩天数至少为 1 天")
    private Integer days;

    @NotBlank(message = "交通方式不能为空")
    private String transportType;

    @NotBlank(message = "规划模式不能为空")
    private String planMode;

    private Integer totalDistance;
    private Integer totalTravelDuration;
    private Integer totalStayDuration;
    private Integer totalTripDuration;
    private String routeSummary;

    private Long routeRecordId;
    private String coverUrl;

    @NotEmpty(message = "行程节点不能为空")
    @Valid
    private List<TripItemRequest> items;

    @Valid
    private List<RouteSegmentRequest> segments;

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

    public CoordinateRequest getStartPosition() {
        return startPosition;
    }

    public void setStartPosition(CoordinateRequest startPosition) {
        this.startPosition = startPosition;
    }

    public CoordinateRequest getEndPosition() {
        return endPosition;
    }

    public void setEndPosition(CoordinateRequest endPosition) {
        this.endPosition = endPosition;
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

    public String getRouteSummary() {
        return routeSummary;
    }

    public void setRouteSummary(String routeSummary) {
        this.routeSummary = routeSummary;
    }

    public Long getRouteRecordId() {
        return routeRecordId;
    }

    public void setRouteRecordId(Long routeRecordId) {
        this.routeRecordId = routeRecordId;
    }

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }

    public List<TripItemRequest> getItems() {
        return items;
    }

    public void setItems(List<TripItemRequest> items) {
        this.items = items;
    }

    public List<RouteSegmentRequest> getSegments() {
        return segments;
    }

    public void setSegments(List<RouteSegmentRequest> segments) {
        this.segments = segments;
    }

    /**
     * 行程中的单个项目节点（景点、餐馆、酒店等）。
     */
    public static class TripItemRequest {
        private Long spotId; // 核心景点才有 spotId，推荐节点为空

        @NotBlank(message = "项目名称不能为空")
        private String itemName;

        @NotBlank(message = "项目类型不能为空")
        private String itemType; // spot, lunch, rest, hotel

        private CoordinateRequest position;

        @NotNull(message = "天数索引不能为空")
        private Integer dayIndex;

        @NotNull(message = "排序号不能为空")
        private Integer sortOrder;

        private String startTime;
        private String endTime;
        private Integer suggestedDuration;

        public Long getSpotId() {
            return spotId;
        }

        public void setSpotId(Long spotId) {
            this.spotId = spotId;
        }

        public String getItemName() {
            return itemName;
        }

        public void setItemName(String itemName) {
            this.itemName = itemName;
        }

        public String getItemType() {
            return itemType;
        }

        public void setItemType(String itemType) {
            this.itemType = itemType;
        }

        public CoordinateRequest getPosition() {
            return position;
        }

        public void setPosition(CoordinateRequest position) {
            this.position = position;
        }

        public Integer getDayIndex() {
            return dayIndex;
        }

        public void setDayIndex(Integer dayIndex) {
            this.dayIndex = dayIndex;
        }

        public Integer getSortOrder() {
            return sortOrder;
        }

        public void setSortOrder(Integer sortOrder) {
            this.sortOrder = sortOrder;
        }

        public String getStartTime() {
            return startTime;
        }

        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public void setEndTime(String endTime) {
            this.endTime = endTime;
        }

        public Integer getSuggestedDuration() {
            return suggestedDuration;
        }

        public void setSuggestedDuration(Integer suggestedDuration) {
            this.suggestedDuration = suggestedDuration;
        }
    }

    /**
     * 路线分段请求参数。
     */
    public static class RouteSegmentRequest {
        @NotNull(message = "天数索引不能为空")
        private Integer dayIndex;
        
        private Integer segmentIndex;
        private String fromName;
        private CoordinateRequest fromPosition;
        private String toName;
        private CoordinateRequest toPosition;
        private String transportType;
        private Integer distance;
        private Integer duration;
        private String instruction;
        private List<CoordinateRequest> polyline;
        private List<String> steps;

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

        public CoordinateRequest getFromPosition() {
            return fromPosition;
        }

        public void setFromPosition(CoordinateRequest fromPosition) {
            this.fromPosition = fromPosition;
        }

        public String getToName() {
            return toName;
        }

        public void setToName(String toName) {
            this.toName = toName;
        }

        public CoordinateRequest getToPosition() {
            return toPosition;
        }

        public void setToPosition(CoordinateRequest toPosition) {
            this.toPosition = toPosition;
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

        public List<CoordinateRequest> getPolyline() {
            return polyline;
        }

        public void setPolyline(List<CoordinateRequest> polyline) {
            this.polyline = polyline;
        }

        public List<String> getSteps() {
            return steps;
        }

        public void setSteps(List<String> steps) {
            this.steps = steps;
        }
    }
}
