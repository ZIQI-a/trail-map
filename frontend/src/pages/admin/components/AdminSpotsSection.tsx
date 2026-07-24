import { AimOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, AutoComplete, Button, Card, Collapse, Form, Input, InputNumber, Modal, Pagination, Popconfirm, Select, Space, Switch, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DefaultOptionType } from "antd/es/select";
import { useMemo, useRef, useState } from "react";
import { fetchAdminSpotCandidates } from "../../../api/admin";
import type { AdminSpotDto, AdminSpotFormDto } from "../../../types/admin";
import type { PoiCalibrationCandidateDto, SpotType, TravelCityDto } from "../../../types/mapWorkbench";
import { AdminLocationPickerModal } from "./AdminLocationPickerModal";
import {
  BOUNDARY_GEOJSON_EXAMPLE,
  validateBoundaryGeoJson,
} from "./adminMapFormUtils";
import sectionStyles from "./AdminSections.module.css";

type AdminSpotsSectionProps = {
  cities: TravelCityDto[];
  editingSpot: AdminSpotDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  keyword: string;
  pageNum: number;
  pageSize: number;
  selectedCityId?: number;
  selectedStatus: "all" | "enabled" | "disabled";
  selectedType: "all" | SpotType;
  spots: AdminSpotDto[];
  tableError?: Error | null;
  total: number;
  onCityFilterChange: (value?: number) => void;
  onCloseEditModal: () => void;
  onDeleteSpot: (spot: AdminSpotDto) => void;
  onKeywordSearch: (value: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (spot: AdminSpotDto) => void;
  onPageChange: (pageNum: number, pageSize: number) => void;
  onStatusFilterChange: (value: "all" | "enabled" | "disabled") => void;
  onToggleStatus: (spot: AdminSpotDto) => void;
  onSubmitCreate: (payload: AdminSpotFormDto) => void;
  onSubmitEdit: (spot: AdminSpotDto, payload: Partial<AdminSpotFormDto>) => void;
  onTypeFilterChange: (value: "all" | SpotType) => void;
};

type AdminSpotFormValues = Omit<AdminSpotFormDto, "isFree" | "isIndoor" | "isNight" | "isRainyDay" | "subwayFriendly" | "firstVisit"> & {
  isFree: boolean;
  isIndoor: boolean;
  isNight: boolean;
  isRainyDay: boolean;
  subwayFriendly: boolean;
  firstVisit: boolean;
};

type AdminSpotEditModalProps = {
  cities: TravelCityDto[];
  editingSpot: AdminSpotDto | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (payload: AdminSpotFormDto) => void;
  onSubmitEdit: (spot: AdminSpotDto, payload: Partial<AdminSpotFormDto>) => void;
};

const spotTypeOptions = [
  { label: "历史文化", value: "history" },
  { label: "自然风光", value: "nature" },
  { label: "城市地标", value: "landmark" },
  { label: "博物馆展馆", value: "museum" },
  { label: "美食街区", value: "food" },
  { label: "夜游景点", value: "night" },
  { label: "亲子游玩", value: "family" },
  { label: "商圈街区", value: "business" },
] satisfies Array<{ label: string; value: SpotType }>;

type SpotCandidateOption = DefaultOptionType & {
  candidate: PoiCalibrationCandidateDto;
};

function AdminSpotEditModal({
  cities,
  editingSpot,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: AdminSpotEditModalProps) {
  const [form] = Form.useForm<AdminSpotFormValues>();
  const [spotSearchText, setSpotSearchText] = useState("");
  const [spotCandidates, setSpotCandidates] = useState<
    PoiCalibrationCandidateDto[]
  >([]);
  const confirmedSpotNameRef = useRef("");
  const [isCandidateLoading, setIsCandidateLoading] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [candidateSearchSubmitted, setCandidateSearchSubmitted] =
    useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedCityId = Form.useWatch("cityId", form);
  const selectedLng = Form.useWatch("lng", form);
  const selectedLat = Form.useWatch("lat", form);
  const selectedAddress = Form.useWatch("address", form);
  const selectedCity = cities.find((city) => city.id === selectedCityId);
  const isCreateMode = editingSpot?.id === 0;

  /**
   * 仅在点击搜索按钮或按回车时查询百度景点候选。
   */
  async function handleSpotCandidateSearch() {
    const keyword = spotSearchText.trim();
    if (!editingSpot || !selectedCity) {
      form.setFields([{ name: "cityId", errors: ["请先选择所属城市"] }]);
      return;
    }
    if (keyword.length < 2) {
      form.setFields([{ name: "spotName", errors: ["请输入至少两个字符后搜索"] }]);
      return;
    }

    setIsCandidateLoading(true);
    setCandidateSearchSubmitted(false);
    form.setFields([{ name: "spotName", errors: [] }]);
    try {
      setSpotCandidates(
        await fetchAdminSpotCandidates(selectedCity.name, keyword),
      );
      setCandidateOpen(true);
      setCandidateSearchSubmitted(true);
    } catch (error) {
      setSpotCandidates([]);
      setCandidateOpen(false);
      form.setFields([
        {
          name: "spotName",
          errors: [
            error instanceof Error ? error.message : "景点候选查询失败",
          ],
        },
      ]);
    } finally {
      setIsCandidateLoading(false);
    }
  }

  /**
   * 景点名称发生自由输入时清除旧点位，避免名称和坐标继续指向不同景点。
   */
  function handleSpotSearch(value: string) {
    setSpotSearchText(value);
    setSpotCandidates([]);
    setCandidateOpen(Boolean(value.trim()));
    setCandidateSearchSubmitted(false);
    form.setFields([{ name: "spotName", errors: [] }]);
    form.setFieldValue("spotName", value);
    if (value !== confirmedSpotNameRef.current) {
      form.setFieldsValue({
        address: "",
        lng: undefined,
        lat: undefined,
      });
    }
  }

  /**
   * 管理员确认百度候选后，一次性回填主点位、标准地址和名称。
   */
  function handleCandidateSelect(
    _value: string,
    option: DefaultOptionType,
  ) {
    const candidate = (option as SpotCandidateOption).candidate;
    if (!candidate.location) {
      form.setFields([
        {
          name: "spotName",
          errors: ["该候选项没有有效坐标，请改用地图选点"],
        },
      ]);
      return;
    }
    form.setFieldsValue({
      spotName: candidate.name,
      address: candidate.address,
      lng: roundCoordinate(candidate.location.lng),
      lat: roundCoordinate(candidate.location.lat),
    });
    setSpotSearchText(candidate.name);
    setCandidateOpen(false);
    setCandidateSearchSubmitted(false);
    confirmedSpotNameRef.current = candidate.name;
    form.setFields([{ name: "spotName", errors: [] }]);
  }

  /**
   * 切换所属城市后清空原点位，防止跨城市候选被直接提交。
   */
  function handleCityChange(cityId: number) {
    form.setFieldsValue({
      cityId,
      spotName: "",
      address: "",
      lng: undefined,
      lat: undefined,
    });
    setSpotSearchText("");
    confirmedSpotNameRef.current = "";
    setSpotCandidates([]);
    setCandidateOpen(false);
    setCandidateSearchSubmitted(false);
    form.setFields([
      { name: "cityId", errors: [] },
      { name: "spotName", errors: [] },
    ]);
  }

  if (!editingSpot) {
    return null;
  }

  const candidateOptions: SpotCandidateOption[] = spotCandidates.map(
    (candidate) => ({
      key: candidate.uid,
      value: candidate.name,
      candidate,
      label: (
        <div className={sectionStyles.poiOption}>
          <span className={sectionStyles.poiOptionIcon}>
            <EnvironmentOutlined />
          </span>
          <div>
            <strong>{candidate.name}</strong>
            <span>
              {[candidate.area, candidate.address].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      ),
    }),
  );

  return (
    <Modal
      title={isCreateMode ? "新增景点" : "编辑景点"}
      open
      okText={isCreateMode ? "创建" : "保存"}
      cancelText="取消"
      confirmLoading={isSubmitting}
      destroyOnHidden
      width={860}
      afterOpenChange={(opened) => {
        if (opened) {
          setSpotSearchText(editingSpot.name);
          confirmedSpotNameRef.current = editingSpot.name;
          setSpotCandidates([]);
          setCandidateOpen(false);
          setCandidateSearchSubmitted(false);
          form.setFieldsValue({
            cityId: editingSpot.cityId,
            spotName: editingSpot.name,
            spotType: editingSpot.type,
            lng: isCreateMode ? undefined : editingSpot.position.lng,
            lat: isCreateMode ? undefined : editingSpot.position.lat,
            address: editingSpot.address,
            boundaryGeojson: editingSpot.boundaryGeojson ?? undefined,
            coverUrl: editingSpot.coverUrl ?? undefined,
            summary: editingSpot.summary ?? undefined,
            description: editingSpot.description ?? undefined,
            recommendReason: editingSpot.recommendReason ?? undefined,
            travelGuide: editingSpot.travelGuide ?? undefined,
            openingHours: editingSpot.openingHours ?? undefined,
            ticketInfo: editingSpot.ticketInfo ?? undefined,
            suggestedDuration: editingSpot.suggestedDurationMinutes ?? undefined,
            bestTime: editingSpot.bestTime ?? undefined,
            recommendScore: editingSpot.recommendScore ?? undefined,
            hotScore: editingSpot.hotScore ?? undefined,
            suitableCrowd: editingSpot.suitableCrowd ?? undefined,
            isFree: editingSpot.free,
            isIndoor: editingSpot.indoor,
            isNight: editingSpot.night,
            isRainyDay: editingSpot.rainyDay,
            subwayFriendly: editingSpot.subwayFriendly,
            firstVisit: editingSpot.firstVisit,
            sortOrder: editingSpot.sortOrder ?? undefined,
            status: editingSpot.status,
          });
        }
      }}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      onOk={() => {
        void form.validateFields().then((values) => {
          const payload: AdminSpotFormDto = {
            ...values,
            // 平台 POI ID 本期不使用，编辑时只原样保留已有数据。
            amapPoiId: isCreateMode
              ? undefined
              : editingSpot.amapPoiId ?? undefined,
            isFree: values.isFree ? 1 : 0,
            isIndoor: values.isIndoor ? 1 : 0,
            isNight: values.isNight ? 1 : 0,
            isRainyDay: values.isRainyDay ? 1 : 0,
            subwayFriendly: values.subwayFriendly ? 1 : 0,
            firstVisit: values.firstVisit ? 1 : 0,
          };
          if (isCreateMode) {
            onSubmitCreate(payload);
            return;
          }
          onSubmitEdit(editingSpot, payload);
        });
      }}
    >
      <Form form={form} layout="vertical">
        <div className={sectionStyles.mapAssistBanner}>
          <span className={sectionStyles.mapAssistIcon}>
            <AimOutlined />
          </span>
          <div>
            <strong>先确认地图位置，再维护旅游信息</strong>
            <p>选择百度候选可自动填充地址和坐标；没有准确结果时使用地图选点。</p>
          </div>
        </div>
        <div className={sectionStyles.formGridTwo}>
          <div className={sectionStyles.remoteSearchRow}>
            <Form.Item label="景点名称" name="spotName" rules={[{ required: true, message: "请输入景点名称" }]}>
              <AutoComplete
                value={spotSearchText}
                open={candidateOpen}
                options={candidateOptions}
                filterOption={false}
                notFoundContent={
                  spotSearchText.trim().length < 2
                    ? "请输入至少两个字符"
                    : isCandidateLoading
                      ? "正在查询百度地图"
                      : candidateSearchSubmitted
                        ? "暂无匹配地点，可使用地图选点"
                        : "点击搜索或按回车查询景点"
                }
                placeholder="输入景点名称并选择候选"
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.nativeEvent.isComposing &&
                    (!candidateSearchSubmitted || candidateOptions.length === 0)
                  ) {
                    event.preventDefault();
                    void handleSpotCandidateSearch();
                  }
                }}
                onOpenChange={setCandidateOpen}
                onSearch={handleSpotSearch}
                onChange={handleSpotSearch}
                onSelect={handleCandidateSelect}
              />
            </Form.Item>
            <Button
              className={sectionStyles.remoteSearchButton}
              type="primary"
              icon={<SearchOutlined />}
              loading={isCandidateLoading}
              onClick={() => void handleSpotCandidateSearch()}
            >
              搜索
            </Button>
          </div>
          <Form.Item label="所属城市" name="cityId" rules={[{ required: true, message: "请选择所属城市" }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={cities.map((city) => ({
                label: `${city.name} · ${city.provinceName}`,
                value: city.id,
              }))}
              onChange={handleCityChange}
            />
          </Form.Item>
          <Form.Item label="景点类型" name="spotType" rules={[{ required: true, message: "请选择景点类型" }]}>
            <Select options={spotTypeOptions} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: "请选择状态" }]}>
            <Select options={[{ label: "启用", value: 1 }, { label: "停用", value: 0 }]} />
          </Form.Item>
          <Form.Item label="经度" name="lng" rules={[{ required: true, message: "请选择景点候选或在地图上选点" }]}>
            <InputNumber readOnly controls={false} style={{ width: "100%" }} precision={6} placeholder="自动获取" />
          </Form.Item>
          <Form.Item label="纬度" name="lat" rules={[{ required: true, message: "请选择景点候选或在地图上选点" }]}>
            <InputNumber readOnly controls={false} style={{ width: "100%" }} precision={6} placeholder="自动获取" />
          </Form.Item>
          <Form.Item label="评分" name="recommendScore">
            <InputNumber style={{ width: "100%" }} min={0.1} max={9.9} precision={1} />
          </Form.Item>
          <Form.Item label="热度" name="hotScore">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="建议时长（分钟）" name="suggestedDuration">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </div>
        <Form.Item label="景点地址" name="address" rules={[{ required: true, message: "请输入景点地址" }]}>
          <Input placeholder="选择候选或地图选点后自动填充，也可补充门牌信息" />
        </Form.Item>
        <Button
          className={sectionStyles.mapPickButton}
          icon={<EnvironmentOutlined />}
          disabled={!selectedCity}
          onClick={() => setPickerOpen(true)}
        >
          {selectedLng && selectedLat ? "在地图上重新确认位置" : "在地图上选择位置"}
        </Button>
        <Form.Item label="封面图地址" name="coverUrl">
          <Input placeholder="请输入封面图地址" />
        </Form.Item>
        <Form.Item label="开放时间" name="openingHours">
          <Input placeholder="请输入开放时间" />
        </Form.Item>
        <Form.Item label="门票信息" name="ticketInfo">
          <Input placeholder="请输入门票信息" />
        </Form.Item>
        <Form.Item label="推荐时间" name="bestTime">
          <Input placeholder="请输入推荐游玩时间" />
        </Form.Item>
        <Form.Item label="摘要" name="summary">
          <Input.TextArea rows={2} placeholder="请输入景点摘要" />
        </Form.Item>
        <Form.Item label="推荐理由" name="recommendReason">
          <Input.TextArea rows={2} placeholder="请输入推荐理由" />
        </Form.Item>
        <Form.Item label="详细介绍" name="description">
          <Input.TextArea rows={3} placeholder="请输入详细介绍" />
        </Form.Item>
        <Form.Item label="游玩攻略" name="travelGuide">
          <Input.TextArea rows={3} placeholder="请输入游玩攻略" />
        </Form.Item>
        <Form.Item label="适合人群" name="suitableCrowd">
          <Input placeholder="请输入适合人群" />
        </Form.Item>
        <Collapse
          className={sectionStyles.advancedCollapse}
          ghost
          items={[
            {
              key: "map-data",
              label: "高级地图数据（可选）",
              children: (
                <Form.Item
                  label="边界 GeoJSON"
                  name="boundaryGeojson"
                  rules={[{ validator: validateBoundaryGeoJson }]}
                  extra={
                    <span>
                      仅区域型景点需要。坐标使用 GCJ-02，顺序为 [经度, 纬度]，首尾点必须闭合。
                    </span>
                  }
                >
                  <Input.TextArea
                    rows={5}
                    placeholder={BOUNDARY_GEOJSON_EXAMPLE}
                  />
                </Form.Item>
              ),
            },
          ]}
        />
        <div className={sectionStyles.switchGrid}>
          <Form.Item label="免费景点" name="isFree" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="室内景点" name="isIndoor" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="适合夜游" name="isNight" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="雨天可去" name="isRainyDay" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="地铁方便" name="subwayFriendly" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="首次必去" name="firstVisit" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
      {pickerOpen && selectedCity ? (
        <AdminLocationPickerModal
          open
          fallbackPosition={selectedCity.center}
          initialAddress={selectedAddress}
          initialPosition={
            typeof selectedLng === "number" && typeof selectedLat === "number"
              ? { lng: selectedLng, lat: selectedLat }
              : undefined
          }
          onCancel={() => setPickerOpen(false)}
          onConfirm={(location) => {
            form.setFieldsValue({
              address: location.address,
              lng: location.position.lng,
              lat: location.position.lat,
            });
            setPickerOpen(false);
          }}
        />
      ) : null}
    </Modal>
  );
}

/**
 * POI 接口可能返回较长小数，写入表单前统一为数据库支持的六位精度。
 */
function roundCoordinate(value: number) {
  return Number(value.toFixed(6));
}

// 景点管理模块提供景点基础资料的筛选、编辑、新增和删除。
export function AdminSpotsSection({
  cities,
  editingSpot,
  isLoading,
  isSubmitting,
  keyword,
  pageNum,
  pageSize,
  selectedCityId,
  selectedStatus,
  selectedType,
  spots,
  tableError,
  total,
  onCityFilterChange,
  onCloseEditModal,
  onDeleteSpot,
  onKeywordSearch,
  onOpenCreateModal,
  onOpenEditModal,
  onPageChange,
  onStatusFilterChange,
  onToggleStatus,
  onSubmitCreate,
  onSubmitEdit,
  onTypeFilterChange,
}: AdminSpotsSectionProps) {
  const columns = useMemo<ColumnsType<AdminSpotDto>>(
    () => [
      {
        title: "景点名称",
        dataIndex: "name",
        key: "name",
        width: 180,
      },
      {
        title: "所属城市",
        dataIndex: "cityName",
        key: "cityName",
        width: 120,
      },
      {
        title: "类型",
        dataIndex: "type",
        key: "type",
        width: 110,
        render: (value: SpotType) => spotTypeOptions.find((item) => item.value === value)?.label ?? value,
      },
      {
        title: "评分",
        dataIndex: "recommendScore",
        key: "recommendScore",
        width: 90,
        render: (value) => value ?? "--",
      },
      {
        title: "热度",
        dataIndex: "hotScore",
        key: "hotScore",
        width: 90,
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (value) => (
          <Tag color={value === 1 ? "success" : "error"}>
            {value === 1 ? "启用" : "停用"}
          </Tag>
        ),
      },
      {
        title: "操作",
        key: "actions",
        width: 220,
        render: (_, spot) => (
          <Space size="small" wrap>
            <Button type="link" icon={<EditOutlined />} onClick={() => onOpenEditModal(spot)}>
              编辑
            </Button>
            <Button
              type="link"
              icon={spot.status === 1 ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => onToggleStatus(spot)}
            >
              {spot.status === 1 ? "停用" : "启用"}
            </Button>
            <Popconfirm
              title="确定删除该景点吗？"
              description="删除后景点将不再出现在地图工作台列表中。"
              okText="确定"
              cancelText="取消"
              onConfirm={() => onDeleteSpot(spot)}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onDeleteSpot, onOpenEditModal, onToggleStatus],
  );

  return (
    <section className={sectionStyles.contentGridSingle}>
      <div className={sectionStyles.mainColumn}>
        <div className={sectionStyles.pageHeading}>
          <h1>景点管理</h1>
          <p>维护景点基础信息、地图坐标、标签属性和上下线状态。</p>
        </div>

        <div className={sectionStyles.filterToolbar}>
          <div className={sectionStyles.filterGroup}>
            <Input.Search
              key={keyword}
              className={sectionStyles.filterInput}
              prefix={<SearchOutlined />}
              enterButton="搜索"
              allowClear
              placeholder="搜索景点名称 / 摘要 / 地址"
              defaultValue={keyword}
              onSearch={(value) => onKeywordSearch(value.trim())}
            />
            <Select
              className={sectionStyles.filterSelect}
              value={selectedCityId}
              placeholder="全部城市"
              options={[
                { label: "全部城市", value: 0 },
                ...cities.map((city) => ({ label: city.name, value: city.id })),
              ]}
              onChange={(value) =>
                onCityFilterChange(value === 0 ? undefined : value)
              }
            />
            <Select
              className={sectionStyles.filterSelect}
              value={selectedType}
              options={[{ label: "全部类型", value: "all" }, ...spotTypeOptions]}
              onChange={(value) =>
                onTypeFilterChange(value as "all" | SpotType)
              }
            />
            <Select
              className={sectionStyles.filterSelect}
              value={selectedStatus}
              options={[
                { label: "全部状态", value: "all" },
                { label: "启用", value: "enabled" },
                { label: "停用", value: "disabled" },
              ]}
              onChange={(value) =>
                onStatusFilterChange(
                  value as "all" | "enabled" | "disabled",
                )
              }
            />
          </div>
          <div className={sectionStyles.filterActions}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreateModal}
            >
              新增景点
            </Button>
          </div>
        </div>

        <Card className={sectionStyles.tableCard} styles={{ body: { padding: 0 } }}>
          {tableError ? (
            <div className={sectionStyles.tableState}>
              <Alert
                type="error"
                showIcon
                message="景点列表加载失败"
                description={tableError.message || "暂时无法获取景点数据"}
              />
            </div>
          ) : (
            <Table
              rowKey="id"
              className={sectionStyles.userTable}
              loading={isLoading || isSubmitting}
              columns={columns}
              dataSource={spots}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: 960 }}
            />
          )}
        </Card>

        <div className={sectionStyles.paginationBar}>
          <Pagination
            current={pageNum}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={["5", "10", "20", "50", "100"]}
            showTotal={(total) => `共 ${total} 条`}
            onChange={onPageChange}
            onShowSizeChange={(_, nextPageSize) => {
              onPageChange(1, nextPageSize);
            }}
          />
        </div>

        <AdminSpotEditModal
          cities={cities}
          editingSpot={editingSpot}
          isSubmitting={isSubmitting}
          onCancel={onCloseEditModal}
          onSubmitCreate={onSubmitCreate}
          onSubmitEdit={onSubmitEdit}
        />
      </div>
    </section>
  );
}
