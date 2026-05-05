package com.trailmap.model.response;

import java.util.List;

/**
 * 统一分页响应对象，兼容分页和不分页两种列表返回形式。
 *
 * @param list 当前页数据
 * @param total 总记录数
 * @param pageNum 当前页号，不分页时固定为 1
 * @param pageSize 当前页大小，不分页时等于返回记录数
 * @param totalPages 总页数，不分页时为 1
 * @param paged 是否启用分页
 * @param <T> 列表项类型
 */
public record PageResponse<T>(
        List<T> list,
        long total,
        long pageNum,
        long pageSize,
        long totalPages,
        boolean paged
) {

    /**
     * 分页返回统一由这里构造，避免控制层和服务层重复计算页码信息。
     */
    public static <T> PageResponse<T> paged(List<T> list, long total, long pageNum, long pageSize) {
        long totalPages = total == 0 ? 0 : (total + pageSize - 1) / pageSize;
        return new PageResponse<>(list, total, pageNum, pageSize, totalPages, true);
    }

    /**
     * 不传分页参数时返回全部数据，同时保留与分页接口一致的结构。
     */
    public static <T> PageResponse<T> unpaged(List<T> list) {
        long size = list.size();
        return new PageResponse<>(list, size, 1, size, size == 0 ? 0 : 1, false);
    }
}
