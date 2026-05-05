package com.trailmap.model.query;

/**
 * 通用分页查询对象。
 *
 * <p>列表接口统一使用这组参数：都不传时返回全部数据；只传一个时，另一个走默认值。
 */
public record PageQuery(
        Integer pageNum,
        Integer pageSize
) {

    private static final int DEFAULT_PAGE_NUM = 1;
    private static final int DEFAULT_PAGE_SIZE = 10;

    /**
     * 当页号和每页大小都没传时，按“返回全部”处理，兼容当前前端未分页场景。
     */
    public boolean isPaged() {
        return pageNum != null || pageSize != null;
    }

    public long resolvedPageNum() {
        return pageNum == null ? DEFAULT_PAGE_NUM : pageNum;
    }

    public long resolvedPageSize() {
        return pageSize == null ? DEFAULT_PAGE_SIZE : pageSize;
    }
}
