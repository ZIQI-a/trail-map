import { AimOutlined, DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Pagination, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminCityOptions,
  fetchAdminProvinceOptions,
  resolveAdminCityLocation,
} from "../../../api/admin";
import type {
  AdminCityDto,
  AdminCityFormDto,
  AdminCityOptionDto,
  AdminProvinceOptionDto,
} from "../../../types/admin";
import sectionStyles from "./AdminSections.module.css";

type AdminCitiesSectionProps = {
  cities: AdminCityDto[];
  editingCity: AdminCityDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  keyword: string;
  pageNum: number;
  pageSize: number;
  tableError?: Error | null;
  total: number;
  onCloseEditModal: () => void;
  onDeleteCity: (city: AdminCityDto) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (city: AdminCityDto) => void;
  onPageChange: (pageNum: number, pageSize: number) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (city: AdminCityDto) => void;
  onSubmitCreate: (payload: AdminCityFormDto) => void;
  onSubmitEdit: (city: AdminCityDto, payload: Partial<AdminCityFormDto>) => void;
};

type AdminCityFormValues = AdminCityFormDto & {
  provinceCode?: string;
};

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
  const [provinceOptions, setProvinceOptions] = useState<
    AdminProvinceOptionDto[]
  >([]);
  const [cityOptions, setCityOptions] = useState<AdminCityOptionDto[]>([]);
  const [isRegionLoading, setIsRegionLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [regionError, setRegionError] = useState("");
  const provinceCodeValue = Form.useWatch("provinceCode", form);
  const cityCodeValue = Form.useWatch("cityCode", form);
  const isCreateMode = editingCity?.id === 0;
  const initialProvinceCode = resolveProvinceCode(editingCity?.cityCode ?? "");
  const displayedProvinceOptions = useMemo(
    () =>
      editingCity && !isCreateMode && initialProvinceCode
        ? mergeOptionByCode(provinceOptions, {
            code: initialProvinceCode,
            name: editingCity.provinceName,
          })
        : provinceOptions,
    [
      editingCity,
      initialProvinceCode,
      isCreateMode,
      provinceOptions,
    ],
  );
  const displayedCityOptions = useMemo(() => {
    const provinceCities = cityOptions.filter(
      (option) => option.provinceCode === provinceCodeValue,
    );
    if (
      !editingCity ||
      isCreateMode ||
      !initialProvinceCode ||
      provinceCodeValue !== initialProvinceCode
    ) {
      return provinceCities;
    }
    // 编辑时用数据库已有名称兜底，接口加载或失败期间不直接展示 adcode。
    return mergeOptionByCode(provinceCities, {
      code: editingCity.cityCode,
      name: editingCity.name,
      provinceCode: initialProvinceCode,
      provinceName: editingCity.provinceName,
    });
  }, [
    cityOptions,
    editingCity,
    initialProvinceCode,
    isCreateMode,
    provinceCodeValue,
  ]);

  useEffect(() => {
    let active = true;
    fetchAdminProvinceOptions()
      .then((options) => {
        if (active) {
          setProvinceOptions(options);
        }
      })
      .catch((error) => {
        if (active) {
          setRegionError(
            error instanceof Error ? error.message : "省份候选加载失败",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsRegionLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!initialProvinceCode) {
      return;
    }
    let active = true;
    fetchAdminCityOptions(initialProvinceCode)
      .then((options) => {
        if (active) {
          setCityOptions(options);
        }
      })
      .catch((error) => {
        if (active) {
          setRegionError(
            error instanceof Error ? error.message : "城市候选加载失败",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsRegionLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [initialProvinceCode]);

  /**
   * 切换省份后清空原城市资料，只展示该省份真实包含的城市候选。
   */
  async function handleProvinceChange(provinceCode: string) {
    const province = displayedProvinceOptions.find(
      (option) => option.code === provinceCode,
    );
    form.setFieldsValue({
      provinceCode,
      provinceName: province?.name ?? "",
      cityName: "",
      cityCode: "",
      centerLng: undefined,
      centerLat: undefined,
    });
    setRegionError("");
    setIsRegionLoading(true);
    try {
      setCityOptions(await fetchAdminCityOptions(provinceCode));
    } catch (error) {
      setCityOptions([]);
      setRegionError(
        error instanceof Error ? error.message : "城市候选加载失败",
      );
    } finally {
      setIsRegionLoading(false);
    }
  }

  /**
   * 选中城市后由后端校验省市关系，并回填标准名称、adcode 和中心坐标。
   */
  async function handleCityChange(cityCode: string) {
    const provinceCode = form.getFieldValue("provinceCode");
    if (!provinceCode) {
      return;
    }
    setRegionError("");
    setIsLocationLoading(true);
    try {
      const resolved = await resolveAdminCityLocation(
        provinceCode,
        cityCode,
      );
      form.setFieldsValue({
        cityName: resolved.cityName,
        provinceName: resolved.provinceName,
        cityCode: resolved.cityCode,
        centerLng: resolved.center.lng,
        centerLat: resolved.center.lat,
      });
    } catch (error) {
      setRegionError(
        error instanceof Error ? error.message : "城市中心点查询失败",
      );
    } finally {
      setIsLocationLoading(false);
    }
  }

  if (!editingCity) {
    return null;
  }

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
          if (!initialProvinceCode) {
            setCityOptions([]);
          }
          form.setFieldsValue({
            provinceCode: initialProvinceCode,
            cityName: editingCity.name,
            provinceName: editingCity.provinceName,
            cityCode: editingCity.cityCode,
            centerLng: isCreateMode ? undefined : editingCity.center.lng,
            centerLat: isCreateMode ? undefined : editingCity.center.lat,
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
          const payload = { ...values };
          delete payload.provinceCode;
          if (isCreateMode) {
            onSubmitCreate(payload);
            return;
          }
          onSubmitEdit(editingCity, payload);
        });
      }}
    >
      <Form form={form} layout="vertical">
        {regionError ? (
          <Alert
            className={sectionStyles.formAlert}
            type="error"
            showIcon
            message="地图资料查询失败"
            description={regionError}
          />
        ) : null}
        <Form.Item name="cityName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="provinceName" hidden>
          <Input />
        </Form.Item>
        <div className={sectionStyles.formGridTwo}>
          <Form.Item
            label="所属省份"
            name="provinceCode"
            rules={[{ required: true, message: "请选择所属省份" }]}
            extra="省市采用官方行政区划关系，不能自由组合。"
          >
            <Select
              showSearch
              loading={isRegionLoading}
              placeholder="输入名称或编码搜索省份"
              optionFilterProp="label"
              options={displayedProvinceOptions.map((option) => ({
                label: `${option.name} · ${option.code}`,
                value: option.code,
              }))}
              onChange={(value) => void handleProvinceChange(value)}
            />
          </Form.Item>
          <Form.Item
            label="城市名称"
            name="cityCode"
            rules={[{ required: true, message: "请选择城市" }]}
            extra="选择后自动获取城市编码和中心坐标。"
          >
            <Select
              showSearch
              loading={isRegionLoading || isLocationLoading}
              disabled={!provinceCodeValue}
              placeholder="请从所属省份内选择城市"
              optionFilterProp="label"
              options={displayedCityOptions.map((option) => ({
                label: `${option.name} · ${option.code}`,
                value: option.code,
              }))}
              onChange={(value) => void handleCityChange(value)}
            />
          </Form.Item>
          <Form.Item label="城市编码">
            <Input
              value={cityCodeValue}
              readOnly
              prefix={<AimOutlined />}
              placeholder="选择城市后自动生成"
            />
          </Form.Item>
          <Form.Item label="地图缩放" name="mapZoom" rules={[{ required: true, message: "请输入地图缩放" }]}>
            <InputNumber min={1} max={20} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="中心经度" name="centerLng" rules={[{ required: true, message: "请先查询城市中心点" }]}>
            <InputNumber readOnly controls={false} style={{ width: "100%" }} precision={6} placeholder="自动获取" />
          </Form.Item>
          <Form.Item label="中心纬度" name="centerLat" rules={[{ required: true, message: "请先查询城市中心点" }]}>
            <InputNumber readOnly controls={false} style={{ width: "100%" }} precision={6} placeholder="自动获取" />
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
        <Button
          className={sectionStyles.locationRefreshButton}
          icon={<ReloadOutlined />}
          loading={isLocationLoading}
          disabled={!cityCodeValue}
          onClick={() => {
            const cityCode = form.getFieldValue("cityCode");
            if (cityCode) {
              void handleCityChange(cityCode);
            }
          }}
        >
          重新查询城市中心点
        </Button>
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

/**
 * 根据六位城市 adcode 推导省级编码，编辑已有城市时用于恢复级联选择。
 */
function resolveProvinceCode(cityCode: string) {
  return /^\d{6}$/.test(cityCode) ? `${cityCode.slice(0, 2)}0000` : undefined;
}

/**
 * 将编辑数据合并进百度候选，接口暂不可用时仍能正确展示已有名称。
 */
function mergeOptionByCode<T extends { code: string }>(
  options: T[],
  fallback: T,
) {
  return options.some((option) => option.code === fallback.code)
    ? options
    : [fallback, ...options];
}

// 城市管理模块提供城市基础资料的列表查看、创建、编辑和删除。
export function AdminCitiesSection({
  cities,
  editingCity,
  isLoading,
  isSubmitting,
  keyword,
  pageNum,
  pageSize,
  tableError,
  total,
  onCloseEditModal,
  onDeleteCity,
  onOpenCreateModal,
  onOpenEditModal,
  onPageChange,
  onSearchChange,
  onToggleStatus,
  onSubmitCreate,
  onSubmitEdit,
}: AdminCitiesSectionProps) {
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
              dataSource={cities}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: 1030 }}
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
