import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Pagination, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import type { AdminCityDto, AdminCityFormDto } from "../../../types/admin";
import sectionStyles from "./AdminSections.module.css";

type AdminCitiesSectionProps = {
  cities: AdminCityDto[];
  editingCity: AdminCityDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  keyword: string;
  tableError?: Error | null;
  onCloseEditModal: () => void;
  onDeleteCity: (city: AdminCityDto) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (city: AdminCityDto) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (city: AdminCityDto) => void;
  onSubmitCreate: (payload: AdminCityFormDto) => void;
  onSubmitEdit: (city: AdminCityDto, payload: Partial<AdminCityFormDto>) => void;
};

type AdminCityFormValues = AdminCityFormDto;

type AdminCityEditModalProps = {
  editingCity: AdminCityDto | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmitCreate: (payload: AdminCityFormDto) => void;
  onSubmitEdit: (city: AdminCityDto, payload: Partial<AdminCityFormDto>) => void;
};

function AdminCityEditModal({
  editingCity,
  isSubmitting,
  onCancel,
  onSubmitCreate,
  onSubmitEdit,
}: AdminCityEditModalProps) {
  const [form] = Form.useForm<AdminCityFormValues>();

  if (!editingCity) {
    return null;
  }

  const isCreateMode = editingCity.id === 0;

  return (
    <Modal
      title={isCreateMode ? "新增城市" : "编辑城市"}
      open
      okText={isCreateMode ? "创建" : "保存"}
      cancelText="取消"
      confirmLoading={isSubmitting}
      destroyOnHidden
      width={720}
      afterOpenChange={(opened) => {
        if (opened) {
          form.setFieldsValue({
            cityName: editingCity.name,
            provinceName: editingCity.provinceName,
            cityCode: editingCity.cityCode,
            centerLng: editingCity.center.lng,
            centerLat: editingCity.center.lat,
            mapZoom: editingCity.mapZoom,
            coverUrl: editingCity.coverUrl,
            description: editingCity.description,
            recommendDays: editingCity.recommendDays,
            hotScore: editingCity.hotScore,
            sortOrder: editingCity.sortOrder ?? 0,
            status: editingCity.status,
          });
        }
      }}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      onOk={() => {
        void form.validateFields().then((values) => {
          if (isCreateMode) {
            onSubmitCreate(values);
            return;
          }
          onSubmitEdit(editingCity, values);
        });
      }}
    >
      <Form form={form} layout="vertical">
        <div className={sectionStyles.formGridTwo}>
          <Form.Item label="城市名称" name="cityName" rules={[{ required: true, message: "请输入城市名称" }]}>
            <Input placeholder="例如：南京市" />
          </Form.Item>
          <Form.Item label="所属省份" name="provinceName" rules={[{ required: true, message: "请输入所属省份" }]}>
            <Input placeholder="例如：江苏省" />
          </Form.Item>
          <Form.Item label="城市编码" name="cityCode" rules={[{ required: true, message: "请输入城市编码" }]}>
            <Input placeholder="例如：nanjing" />
          </Form.Item>
          <Form.Item label="地图缩放" name="mapZoom" rules={[{ required: true, message: "请输入地图缩放" }]}>
            <InputNumber min={1} max={20} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="中心经度" name="centerLng" rules={[{ required: true, message: "请输入中心经度" }]}>
            <InputNumber style={{ width: "100%" }} precision={6} />
          </Form.Item>
          <Form.Item label="中心纬度" name="centerLat" rules={[{ required: true, message: "请输入中心纬度" }]}>
            <InputNumber style={{ width: "100%" }} precision={6} />
          </Form.Item>
          <Form.Item label="推荐天数" name="recommendDays">
            <InputNumber min={0.5} max={30} style={{ width: "100%" }} precision={1} />
          </Form.Item>
          <Form.Item label="热度" name="hotScore">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={[{ label: "启用", value: 1 }, { label: "停用", value: 0 }]} />
          </Form.Item>
        </div>
        <Form.Item label="封面图地址" name="coverUrl">
          <Input placeholder="请输入封面图地址" />
        </Form.Item>
        <Form.Item label="城市简介" name="description">
          <Input.TextArea rows={4} placeholder="请输入城市简介" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// 城市管理模块提供城市基础资料的列表查看、创建、编辑和删除。
export function AdminCitiesSection({
  cities,
  editingCity,
  isLoading,
  isSubmitting,
  keyword,
  tableError,
  onCloseEditModal,
  onDeleteCity,
  onOpenCreateModal,
  onOpenEditModal,
  onSearchChange,
  onToggleStatus,
  onSubmitCreate,
  onSubmitEdit,
}: AdminCitiesSectionProps) {
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredCities = useMemo(
    () =>
      cities.filter((city) => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        if (!normalizedKeyword) {
          return true;
        }
        return (
          city.name.toLowerCase().includes(normalizedKeyword) ||
          city.provinceName.toLowerCase().includes(normalizedKeyword) ||
          city.cityCode.toLowerCase().includes(normalizedKeyword)
        );
      }),
    [cities, keyword],
  );

  const pagedCities = useMemo(() => {
    const maxPage = Math.max(1, Math.ceil(filteredCities.length / pageSize));
    const safePageNum = Math.min(pageNum, maxPage);
    const startIndex = (safePageNum - 1) * pageSize;
    return filteredCities.slice(startIndex, startIndex + pageSize);
  }, [filteredCities, pageNum, pageSize]);

  const totalCityPages = Math.max(1, Math.ceil(filteredCities.length / pageSize));
  const currentCityPage = Math.min(pageNum, totalCityPages);

  const columns = useMemo<ColumnsType<AdminCityDto>>(
    () => [
      {
        title: "城市名称",
        dataIndex: "name",
        key: "name",
        width: 160,
      },
      {
        title: "所属省份",
        dataIndex: "provinceName",
        key: "provinceName",
        width: 140,
      },
      {
        title: "城市编码",
        dataIndex: "cityCode",
        key: "cityCode",
        width: 140,
      },
      {
        title: "推荐天数",
        dataIndex: "recommendDays",
        key: "recommendDays",
        width: 110,
        render: (value) => `${value ?? "--"} 天`,
      },
      {
        title: "热度",
        dataIndex: "hotScore",
        key: "hotScore",
        width: 100,
      },
      {
        title: "地图缩放",
        dataIndex: "mapZoom",
        key: "mapZoom",
        width: 110,
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
        render: (_, city) => (
          <Space size="small" wrap>
            <Button type="link" icon={<EditOutlined />} onClick={() => onOpenEditModal(city)}>
              编辑
            </Button>
            <Button
              type="link"
              icon={city.status === 1 ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => onToggleStatus(city)}
            >
              {city.status === 1 ? "停用" : "启用"}
            </Button>
            <Popconfirm
              title="确定删除该城市吗？"
              description="若该城市下仍有关联景点，后端会阻止删除。"
              okText="确定"
              cancelText="取消"
              onConfirm={() => onDeleteCity(city)}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onDeleteCity, onOpenEditModal, onToggleStatus],
  );

  return (
    <section className={sectionStyles.contentGridSingle}>
      <div className={sectionStyles.mainColumn}>
        <div className={sectionStyles.pageHeading}>
          <h1>城市管理</h1>
          <p>维护城市基础资料、地图中心点和推荐展示信息。</p>
        </div>

        <div className={sectionStyles.filterToolbar}>
          <div className={sectionStyles.filterGroup}>
            <Input
              className={sectionStyles.filterInput}
              prefix={<SearchOutlined />}
              placeholder="搜索城市名称 / 省份 / 城市编码"
              value={keyword}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className={sectionStyles.filterActions}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onOpenCreateModal}
            >
              新增城市
            </Button>
          </div>
        </div>

        <Card className={sectionStyles.tableCard} styles={{ body: { padding: 0 } }}>
          {tableError ? (
            <div className={sectionStyles.tableState}>
              <Alert
                type="error"
                showIcon
                message="城市列表加载失败"
                description={tableError.message || "暂时无法获取城市数据"}
              />
            </div>
          ) : (
            <Table
              rowKey="id"
              className={sectionStyles.userTable}
              loading={isLoading || isSubmitting}
              columns={columns}
              dataSource={pagedCities}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: 1030 }}
            />
          )}
        </Card>

        <div className={sectionStyles.paginationBar}>
          <Pagination
            current={currentCityPage}
            pageSize={pageSize}
            total={filteredCities.length}
            showSizeChanger
            pageSizeOptions={["10", "20", "50", "100"]}
            showTotal={(total) => `共 ${total} 条`}
            onChange={(nextPage, nextPageSize) => {
              setPageNum(nextPage);
              setPageSize(nextPageSize);
            }}
            onShowSizeChange={(_, nextPageSize) => {
              setPageNum(1);
              setPageSize(nextPageSize);
            }}
          />
        </div>

        <AdminCityEditModal
          editingCity={editingCity}
          isSubmitting={isSubmitting}
          onCancel={onCloseEditModal}
          onSubmitCreate={onSubmitCreate}
          onSubmitEdit={onSubmitEdit}
        />
      </div>
    </section>
  );
}
