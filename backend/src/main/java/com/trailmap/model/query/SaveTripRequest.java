package com.trailmap.model.query;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * 保存行程请求参数。
 */
public class SaveTripRequest {

    @NotNull(message = "城市 ID 不能为空")
    private Long cityId;

    @NotBlank(message = "行程名称不能为空")
    private String tripName;

    private LocalDate startDate;
    private LocalDate endDate;

    @NotNull(message = "游玩天数不能为空")
    @Min(value = 1, message = "游玩天数至少为 1 天")
    private Integer days;

    @NotBlank(message = "交通方式不能为空")
    private String transportType;

    @NotBlank(message = "规划模式不能为空")
    private String planMode;

    private Long routeRecordId;
    private String coverUrl;

    @NotEmpty(message = "行程景点不能为空")
    @Valid
    private List<TripSpotRequest> spots;

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

    public String getCoverUrl() {
        return coverUrl;
    }

    public void setCoverUrl(String coverUrl) {
        this.coverUrl = coverUrl;
    }

    public List<TripSpotRequest> getSpots() {
        return spots;
    }

    public void setSpots(List<TripSpotRequest> spots) {
        this.spots = spots;
    }

    /**
     * 行程中的单个景点明细。
     */
    public static class TripSpotRequest {
        @NotNull(message = "景点 ID 不能为空")
        private Long spotId;

        @NotNull(message = "天数索引不能为空")
        private Integer dayIndex;

        @NotNull(message = "排序号不能为空")
        private Integer sortOrder;

        private Integer suggestedDuration;

        public Long getSpotId() {
            return spotId;
        }

        public void setSpotId(Long spotId) {
            this.spotId = spotId;
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

        public Integer getSuggestedDuration() {
            return suggestedDuration;
        }

        public void setSuggestedDuration(Integer suggestedDuration) {
            this.suggestedDuration = suggestedDuration;
        }
    }
}
