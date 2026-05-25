# 06 - API 接口文档

## 目录

- [API 设计规范](#api-设计规范)
- [统一响应结构](#统一响应结构)
- [认证机制](#认证机制)
- [公开接口（无需认证）](#公开接口无需认证)
- [用户接口（需登录）](#用户接口需登录)
- [管理后台接口（需 ADMIN 角色）](#管理后台接口需-admin-角色)
- [错误码参考](#错误码参考)

---

## API 设计规范

| 规范项 | 说明 |
| --- | --- |
| 前缀 | 所有接口以 `/api` 开头 |
| 风格 | RESTful |
| 数据格式 | JSON (`Content-Type: application/json`) |
| 响应结构 | 统一 `ApiResponse<T>` 包装 |
| 分页参数 | `pageNum` (从 1 开始), `pageSize` |
| 筛选参数 | Query String |
| API 文档 | Swagger UI: `/swagger-ui.html` |
| OpenAPI Spec | `/v3/api-docs` |

---

## 统一响应结构

所有接口返回统一的 `ApiResponse` 结构：

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "ok",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | boolean | 请求是否成功 |
| `code` | string | 业务状态码 |
| `message` | string | 提示信息 |
| `data` | T | 业务数据 |

### 分页响应

分页数据使用 `PageResponse` 结构：

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "ok",
  "data": {
    "records": [ ... ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 20
  }
}
```

---

## 认证机制

### 认证方式

- **类型**：HMAC Bearer Token
- **传递方式**：HTTP Header `Authorization: Bearer <token>`
- **Token 来源**：`/api/auth/login` 或 `/api/auth/register` 响应

### Token 生命周期

| 阶段 | 说明 |
| --- | --- |
| 获取 | 登录或注册成功后返回 |
| 存储 | 前端 localStorage (`trailmap_auth_token`) |
| 使用 | 每次请求自动附加到 Authorization 头 |
| 失效 | Token 过期或用户主动清除 |

---

## 公开接口（无需认证）

### 健康检查

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/health` |
| 说明 | 服务健康检查 |

### 城市相关

#### 获取城市列表

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/cities` |
| 说明 | 获取所有启用状态的城市列表 |

**响应示例**：
```json
{
  "data": {
    "records": [
      {
        "id": 1,
        "cityName": "成都",
        "provinceName": "四川省",
        "centerLng": 104.066541,
        "centerLat": 30.572269,
        "mapZoom": 12,
        "coverUrl": "https://...",
        "description": "天府之国",
        "recommendDays": 3.0,
        "hotScore": 95
      }
    ],
    "total": 15
  }
}
```

#### 获取城市详情

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/cities/{cityId}` |
| 路径参数 | `cityId` - 城市 ID |

#### 获取城市景点标签

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/cities/{cityId}/tags` |
| 路径参数 | `cityId` - 城市 ID |

#### 获取城市景点列表

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/cities/{cityId}/spots` |
| 路径参数 | `cityId` - 城市 ID |
| 查询参数 | `keyword` (关键词), `type` (类型), `tagCode` (标签编码) |

**响应示例**：
```json
{
  "data": {
    "records": [
      {
        "id": 1,
        "spotName": "宽窄巷子",
        "spotType": "food",
        "lng": 104.055036,
        "lat": 30.665475,
        "address": "成都市青羊区...",
        "coverUrl": "https://...",
        "summary": "清朝古街道...",
        "recommendScore": 4.8,
        "hotScore": 90
      }
    ],
    "total": 50
  }
}
```

### 景点相关

#### 获取景点详情

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/spots/{spotId}` |
| 路径参数 | `spotId` - 景点 ID |

**响应包含**：景点基本信息、标签列表、图片列表、详细描述等

### 标签相关

#### 获取全量标签

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/tags` |
| 说明 | 获取所有启用状态的标签 |

### POI 校准

#### 获取 POI 候选

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/poi-calibration/candidates` |
| 查询参数 | `cityName` (城市名), `keyword` (关键词), `addressKeyword` (地址关键词) |
| 说明 | 通过百度地图地点检索 API 将输入关键词解析为候选坐标 |

### 路线规划

#### 提交路线规划

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/routes/plan` |
| 说明 | 提交行程规划参数，返回路线结果 |

**请求体**：
```json
{
  "cityId": 1,
  "planMode": "free",
  "transportType": "driving",
  "startName": "成都双流国际机场",
  "startLng": 103.947136,
  "startLat": 30.572269,
  "spots": [
    { "spotId": 1, "dayIndex": 1, "sortOrder": 1 },
    { "spotId": 2, "dayIndex": 1, "sortOrder": 2 }
  ],
  "scheduleConfig": {
    "days": 2,
    "dailyStartTime": "09:00",
    "dailyEndTime": "21:00",
    "lunchStartTime": "12:00",
    "lunchEndTime": "13:00"
  }
}
```

**响应包含**：路线分段列表、总距离、总耗时、路线坐标串等

### 公开行程分享

#### 获取公开分享行程

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/public-trips/{shareToken}` |
| 路径参数 | `shareToken` - 分享 Token |
| 说明 | 未登录用户也可访问 |

---

## 用户接口（需登录）

### 认证相关

#### 用户注册

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/auth/register` |
| 说明 | 注册新用户，成功后直接返回 Token |

**请求体**：
```json
{
  "username": "testuser",
  "password": "123456",
  "nickname": "测试用户"
}
```

**响应**：
```json
{
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "username": "testuser",
      "nickname": "测试用户",
      "userType": "normal"
    }
  }
}
```

#### 用户登录

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/auth/login` |
| 说明 | 使用用户名密码换取 Token |

**请求体**：
```json
{
  "username": "testuser",
  "password": "123456"
}
```

#### 获取当前用户

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/auth/me` |
| 说明 | 获取当前登录用户信息 |

### 个人资料

#### 更新个人资料

| 项目 | 说明 |
| --- | --- |
| 路径 | `PUT /api/profile/me` |
| 说明 | 更新当前用户昵称、头像等 |

#### 获取个人主页概览

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/profile/overview` |
| 说明 | 获取用户统计数据（收藏数、打卡数、行程数等） |

### 收藏相关

#### 获取收藏状态

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/favorite-spots/{spotId}/status` |

#### 收藏景点

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/favorite-spots/{spotId}` |

#### 取消收藏

| 项目 | 说明 |
| --- | --- |
| 路径 | `DELETE /api/favorite-spots/{spotId}` |

#### 获取收藏列表

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/favorite-spots` |
| 查询参数 | `tagCode`, `cityName`, `favoritedWithinDays`, `sortBy`, `pageNum`, `pageSize` |

### 打卡相关

#### 获取打卡状态

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/checkin-spots/{spotId}/status` |

#### 打卡景点

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/checkin-spots/{spotId}` |
| 请求体 | `{ "remark": "很棒的体验" }` (可选) |

#### 取消打卡

| 项目 | 说明 |
| --- | --- |
| 路径 | `DELETE /api/checkin-spots/{spotId}` |

#### 获取打卡列表

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/checkin-spots` |
| 查询参数 | `tagCode`, `cityName`, `checkedInWithinDays`, `sortBy`, `pageNum`, `pageSize` |

#### 获取足迹地图数据

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/checkin-spots/footprint` |
| 查询参数 | `tagCode`, `cityName`, `checkedInWithinDays`, `sortBy` |
| 说明 | 返回省级/市级打卡统计聚合数据 |

### 行程管理

#### 保存行程

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/user-trips` |
| 说明 | 保存规划结果到"我的行程" |

**请求体**：
```json
{
  "tripName": "成都三日游",
  "cityId": 1,
  "planMode": "schedule",
  "transportType": "driving",
  "days": 3,
  "spots": [
    { "spotId": 1, "dayIndex": 1, "sortOrder": 1, "suggestedDuration": 120 },
    { "spotId": 2, "dayIndex": 1, "sortOrder": 2, "suggestedDuration": 90 }
  ],
  "routePlanResult": { ... }
}
```

#### 获取行程列表

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/user-trips` |
| 查询参数 | `cityName`, `planMode`, `sortBy`, `pageNum`, `pageSize` |

#### 获取行程详情

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/user-trips/{tripId}` |

#### 更新行程名称

| 项目 | 说明 |
| --- | --- |
| 路径 | `PATCH /api/user-trips/{tripId}/name` |
| 请求体 | `{ "tripName": "新名称" }` |

#### 开启/关闭行程分享

| 项目 | 说明 |
| --- | --- |
| 路径 | `PUT /api/user-trips/{tripId}/share?enabled=true` |

#### 删除行程

| 项目 | 说明 |
| --- | --- |
| 路径 | `DELETE /api/user-trips/{tripId}` |

---

## 管理后台接口（需 ADMIN 角色）

### 数据概览

#### 获取管理后台统计

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/admin/overview` |
| 说明 | 返回用户总数、城市总数、景点总数等统计 |

### 用户管理

#### 获取用户列表

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/users` |
| 查询参数 | `keyword`, `userType`, `status`, `pageNum`, `pageSize` |

#### 更新用户信息

| 项目 | 说明 |
| --- | --- |
| 路径 | `PUT /api/users/{userId}` |
| 说明 | 支持更新用户类型、状态等 |

### 城市管理

#### 获取城市列表（管理端）

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/admin/cities` |
| 查询参数 | `keyword`, `pageNum`, `pageSize` |

#### 创建城市

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/admin/cities` |

#### 更新城市

| 项目 | 说明 |
| --- | --- |
| 路径 | `PUT /api/admin/cities/{cityId}` |

#### 删除城市

| 项目 | 说明 |
| --- | --- |
| 路径 | `DELETE /api/admin/cities/{cityId}` |

### 景点管理

#### 获取景点列表（管理端）

| 项目 | 说明 |
| --- | --- |
| 路径 | `GET /api/admin/spots` |
| 查询参数 | `cityId`, `keyword`, `type`, `status`, `pageNum`, `pageSize` |

#### 创建景点

| 项目 | 说明 |
| --- | --- |
| 路径 | `POST /api/admin/spots` |

#### 更新景点

| 项目 | 说明 |
| --- | --- |
| 路径 | `PUT /api/admin/spots/{spotId}` |

#### 删除景点

| 项目 | 说明 |
| --- | --- |
| 路径 | `DELETE /api/admin/spots/{spotId}` |

---

## 错误码参考

| 错误码 | HTTP 状态码 | 说明 |
| --- | --- | --- |
| `SUCCESS` | 200 | 请求成功 |
| `BAD_REQUEST` | 400 | 请求参数错误 |
| `UNAUTHORIZED` | 401 | 未认证（Token 缺失或无效） |
| `FORBIDDEN` | 403 | 无权限（需更高角色） |
| `NOT_FOUND` | 404 | 资源不存在 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

**错误响应示例**：
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "登录已过期，请重新登录",
  "data": null
}
```
