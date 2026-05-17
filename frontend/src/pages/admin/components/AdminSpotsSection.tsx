import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo } from "react";
import type { AdminSpotDto, AdminSpotFormDto } from "../../../types/admin";
import type { SpotType, TravelCityDto } from "../../../types/mapWorkbench";
import sectionStyles from "./AdminSections.module.css";

type AdminSpotsSectionProps = {
  cities: TravelCityDto[];
  editingSpot: AdminSpotDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  keyword: string;
  selectedCityId?: number;
  selectedStatus: "all" | "enabled" | "disabled";
  selectedType: "all" | SpotType;
  spots: AdminSpotDto[];
  tableError?: Error | null;
  onCityFilterChange: (value?: number) => void;
  onCloseEditModal: () => void;
  onDeleteSpot: (spot: AdminSpotDto) => void;
  onKeywordChange: (value: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (spot: AdminSpotDto) => void;
  onStatusFilterChange: (value: "all" | "enabled" | "disabled") => void;
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

// 景点管理模块提供景点基础资料的筛选、编辑、新增和删除。
export function AdminSpotsSection({
  cities,
  editingSpot,
  isLoading,
  isSubmitting,
  keyword,
  selectedCityId,
  selectedStatus,
  selectedType,
  spots,
  tableError,
  onCityFilterChange,
  onCloseEditModal,
  onDeleteSpot,
  onKeywordChange,
  onOpenCreateModal,
  onOpenEditModal,
  onStatusFilterChange,
  onSubmitCreate,
  onSubmitEdit,
  onTypeFilterChange,
}: AdminSpotsSectionProps) {
  const [form] = Form.useForm<AdminSpotFormValues>();
  const isCreateMode = editingSpot?.id === 0;

  useEffect(() => {
    if (!editingSpot) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      cityId: editingSpot.cityId,
      spotName: editingSpot.name,
      spotType: editingSpot.type,
      lng: editingSpot.position.lng,
      lat: editingSpot.position.lat,
      address: editingSpot.address,
      amapPoiId: editingSpot.amapPoiId ?? undefined,
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
  }, [editingSpot, form]);

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
        width: 170,
        render: (_, spot) => (
          <Space size="small" wrap>
            <Button type="link" icon={<EditOutlined />} onClick={() => onOpenEditModal(spot)}>
              编辑
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
    [onDeleteSpot, onOpenEditModal],
  );

  return (
    <section className={sectionStyles.contentGridSingle}>
      <div className={sectionStyles.mainColumn}>
        <div className={sectionStyles.pageHeading}>
          <h1>景点管理</h1>
          <p>维护景点基础信息、地图坐标、标签属性和上下线状态。</p>
        </div>

        <div className={sectionStyles.filterBar}>
          <Input
            className={sectionStyles.filterInput}
            prefix={<SearchOutlined />}
            placeholder="搜索景点名称 / 摘要 / 地址"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          <Select
            className={sectionStyles.filterSelect}
            value={selectedCityId}
            placeholder="全部城市"
            options={[
              { label: "全部城市", value: 0 },
              ...cities.map((city) => ({ label: city.name, value: city.id })),
            ]}
            onChange={(value) => onCityFilterChange(value === 0 ? undefined : value)}
          />
          <Select
            className={sectionStyles.filterSelect}
            value={selectedType}
            options={[{ label: "全部类型", value: "all" }, ...spotTypeOptions]}
            onChange={(value) => onTypeFilterChange(value as "all" | SpotType)}
          />
          <Select
            className={sectionStyles.filterSelect}
            value={selectedStatus}
            options={[
              { label: "全部状态", value: "all" },
              { label: "启用", value: "enabled" },
              { label: "停用", value: "disabled" },
            ]}
            onChange={(value) => onStatusFilterChange(value as "all" | "enabled" | "disabled")}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreateModal}>
            新增景点
          </Button>
        </div>

        <Card className={sectionStyles.tableCard} bodyStyle={{ padding: 0 }}>
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

        <Modal
          title={isCreateMode ? "新增景点" : "编辑景点"}
          open={Boolean(editingSpot)}
          okText={isCreateMode ? "创建" : "保存"}
          cancelText="取消"
          confirmLoading={isSubmitting}
          destroyOnHidden
          width={860}
          onCancel={onCloseEditModal}
          onOk={() => {
            void form.validateFields().then((values) => {
              const payload: AdminSpotFormDto = {
                ...values,
                isFree: values.isFree ? 1 : 0,
                isIndoor: values.isIndoor ? 1 : 0,
                isNight: values.isNight ? 1 : 0,
                isRainyDay: values.isRainyDay ? 1 : 0,
                subwayFriendly: values.subwayFriendly ? 1 : 0,
                firstVisit: values.firstVisit ? 1 : 0,
              };
              if (!editingSpot) {
                return;
              }
              if (isCreateMode) {
                onSubmitCreate(payload);
                return;
              }
              onSubmitEdit(editingSpot, payload);
            });
          }}
        >
          <Form form={form} layout="vertical">
            <div className={sectionStyles.formGridTwo}>
              <Form.Item label="景点名称" name="spotName" rules={[{ required: true, message: "请输入景点名称" }]}>
                <Input placeholder="请输入景点名称" />
              </Form.Item>
              <Form.Item label="所属城市" name="cityId" rules={[{ required: true, message: "请选择所属城市" }]}>
                <Select options={cities.map((city) => ({ label: city.name, value: city.id }))} />
              </Form.Item>
              <Form.Item label="景点类型" name="spotType" rules={[{ required: true, message: "请选择景点类型" }]}>
                <Select options={spotTypeOptions} />
              </Form.Item>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: "请选择状态" }]}>
                <Select options={[{ label: "启用", value: 1 }, { label: "停用", value: 0 }]} />
              </Form.Item>
              <Form.Item label="经度" name="lng" rules={[{ required: true, message: "请输入经度" }]}>
                <InputNumber style={{ width: "100%" }} precision={6} />
              </Form.Item>
              <Form.Item label="纬度" name="lat" rules={[{ required: true, message: "请输入纬度" }]}>
                <InputNumber style={{ width: "100%" }} precision={6} />
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
              <Input placeholder="请输入景点地址" />
            </Form.Item>
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
            <Form.Item label="高德 POI ID" name="amapPoiId">
              <Input placeholder="请输入高德 POI ID" />
            </Form.Item>
            <Form.Item label="边界 GeoJSON" name="boundaryGeojson">
              <Input.TextArea rows={3} placeholder="如有需要可输入区域边界 GeoJSON" />
            </Form.Item>
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
        </Modal>
      </div>
    </section>
  );
}
