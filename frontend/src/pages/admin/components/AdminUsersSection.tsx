import {
  SearchOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Form,
  Grid,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { roleOptions, statusOptions } from "../../../admin/config";
import type { AdminStatusFilter } from "../../../admin/types";
import type { AppUserDto, UserUpdateRequestDto } from "../../../types/auth";
import {
  formatAdminDateTime,
  getAdminUserRoleMeta,
} from "../../../utils/admin/format";
import sectionStyles from "./AdminSections.module.css";

type AdminUsersSectionProps = {
  currentUserId?: number;
  editingUser: AppUserDto | null;
  isLoading: boolean;
  isUpdating: boolean;
  pageNum: number;
  pageSize: number;
  searchKeyword: string;
  roleFilter: "all" | AppUserDto["userType"];
  statusFilter: AdminStatusFilter;
  tableError?: Error | null;
  total: number;
  users: AppUserDto[];
  onCloseEditModal: () => void;
  onOpenEditModal: (user: AppUserDto) => void;
  onPageChange: (pageNum: number, pageSize: number) => void;
  onResetFilters: () => void;
  onRoleFilterChange: (value: "all" | AppUserDto["userType"]) => void;
  onSearch: (value: string) => void;
  onStatusFilterChange: (value: AdminStatusFilter) => void;
  onToggleStatus: (user: AppUserDto) => void;
  onSubmitEdit: (user: AppUserDto, payload: UserUpdateRequestDto) => void;
};

type AdminUserEditFormValues = {
  nickname: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  userType: AppUserDto["userType"];
};

type AdminUserEditModalProps = {
  currentUserId?: number;
  editingUser: AppUserDto | null;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmitEdit: (user: AppUserDto, payload: UserUpdateRequestDto) => void;
};

function AdminUserEditModal({
  currentUserId,
  editingUser,
  isUpdating,
  onCancel,
  onSubmitEdit,
}: AdminUserEditModalProps) {
  const [form] = Form.useForm<AdminUserEditFormValues>();

  if (!editingUser) {
    return null;
  }

  return (
    <Modal
      title="编辑用户"
      open
      okText="保存"
      cancelText="取消"
      confirmLoading={isUpdating}
      destroyOnHidden
      afterOpenChange={(opened) => {
        if (opened) {
          form.setFieldsValue({
            nickname: editingUser.nickname,
            phone: editingUser.phone ?? undefined,
            email: editingUser.email ?? undefined,
            avatarUrl: editingUser.avatarUrl ?? undefined,
            userType: editingUser.userType,
          });
        }
      }}
      onCancel={onCancel}
      afterClose={() => form.resetFields()}
      onOk={() => {
        void form.validateFields().then((values) => {
          onSubmitEdit(editingUser, {
            nickname: values.nickname.trim(),
            phone: values.phone?.trim() || null,
            email: values.email?.trim() || null,
            avatarUrl: values.avatarUrl?.trim() || null,
            userType: values.userType,
          });
        });
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="用户名">
          <Input value={editingUser.username} disabled />
        </Form.Item>
        <Form.Item
          label="昵称"
          name="nickname"
          rules={[{ required: true, message: "请输入昵称" }]}
        >
          <Input maxLength={30} placeholder="请输入用户昵称" />
        </Form.Item>
        <Form.Item
          label="角色"
          name="userType"
          rules={[{ required: true, message: "请选择角色" }]}
        >
          <Select
            options={roleOptions}
            disabled={currentUserId === editingUser.id}
          />
        </Form.Item>
        <Form.Item label="手机号" name="phone">
          <Input maxLength={20} placeholder="请输入手机号" />
        </Form.Item>
        <Form.Item
          label="邮箱"
          name="email"
          rules={[{ type: "email", message: "邮箱格式不正确" }]}
        >
          <Input maxLength={60} placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item label="头像地址" name="avatarUrl">
          <Input placeholder="请输入头像 URL" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// 用户管理模块聚焦列表筛选与基础操作，角色和资料编辑统一收敛到弹窗中。
export function AdminUsersSection({
  currentUserId,
  editingUser,
  isLoading,
  isUpdating,
  pageNum,
  pageSize,
  roleFilter,
  searchKeyword,
  statusFilter,
  tableError,
  total,
  users,
  onCloseEditModal,
  onOpenEditModal,
  onPageChange,
  onResetFilters,
  onRoleFilterChange,
  onSearch,
  onStatusFilterChange,
  onToggleStatus,
  onSubmitEdit,
}: AdminUsersSectionProps) {
  const screens = Grid.useBreakpoint();
  const isMediumScreen = Boolean(screens.md);
  const isLargeScreen = Boolean(screens.lg);

  const columns = useMemo<ColumnsType<AppUserDto>>(
    () => [
      {
        title: "用户",
        dataIndex: "username",
        key: "username",
        width: isMediumScreen ? 220 : 200,
        render: (_, user) => (
          <div className={sectionStyles.userCell}>
            <Avatar
              size={36}
              src={user.avatarUrl || undefined}
              icon={<UserOutlined />}
            />
            <div className={sectionStyles.userIdentity}>
              <strong>{user.nickname}</strong>
              <span>@{user.username}</span>
              {!isLargeScreen ? (
                <em className={sectionStyles.userMobileMeta}>
                  {user.phone || user.email || "未填写联系方式"}
                </em>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        title: "手机号",
        dataIndex: "phone",
        key: "phone",
        width: 132,
        responsive: ["lg"],
        ellipsis: true,
        render: (value) => value || "--",
      },
      {
        title: "邮箱",
        dataIndex: "email",
        key: "email",
        width: 200,
        responsive: ["xl"],
        ellipsis: true,
        render: (value) => value || "--",
      },
      {
        title: "角色",
        dataIndex: "userType",
        key: "userType",
        width: 96,
        render: (userType) => {
          const roleMeta = getAdminUserRoleMeta(userType);
          return (
            <div className={sectionStyles.roleCell}>
              <Tag color={roleMeta.tagColor}>{roleMeta.label}</Tag>
            </div>
          );
        },
      },
      {
        title: "账号状态",
        dataIndex: "status",
        key: "status",
        width: 96,
        render: (status) => (
          <div className={sectionStyles.statusCell}>
            <Tag color={status === 1 ? "success" : "error"}>
              {status === 1 ? "正常" : "停用"}
            </Tag>
          </div>
        ),
      },
      {
        title: "注册时间",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        responsive: ["xl"],
        render: (value) => formatAdminDateTime(value),
      },
      {
        title: "最近登录",
        dataIndex: "lastLoginAt",
        key: "lastLoginAt",
        width: 160,
        responsive: ["lg"],
        render: (value) => formatAdminDateTime(value),
      },
      {
        title: "操作",
        key: "actions",
        width: isMediumScreen ? 156 : 132,
        render: (_, user) => (
          <Space size="small" wrap>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onOpenEditModal(user)}
            >
              编辑
            </Button>
            <Button
              type="link"
              danger={user.status === 1}
              icon={
                user.status === 1 ? <EyeInvisibleOutlined /> : <EyeOutlined />
              }
              disabled={currentUserId === user.id}
              onClick={() => onToggleStatus(user)}
            >
              {user.status === 1 ? "停用" : "启用"}
            </Button>
          </Space>
        ),
      },
    ],
    [
      currentUserId,
      isLargeScreen,
      isMediumScreen,
      onOpenEditModal,
      onToggleStatus,
    ],
  );

  return (
    <section className={sectionStyles.contentGridSingle}>
      <div className={sectionStyles.mainColumn}>
        <div className={sectionStyles.pageHeading}>
          <h1>用户管理</h1>
          <p>统一查看注册用户、角色类型、账号状态与最近登录情况。</p>
        </div>

        <div className={sectionStyles.filterToolbar}>
          <div className={sectionStyles.filterGroup}>
            <Input.Search
              key={searchKeyword}
              className={sectionStyles.filterInput}
              prefix={<SearchOutlined />}
              enterButton="搜索"
              allowClear
              placeholder="昵称 / 用户名 / 手机号 / 邮箱"
              defaultValue={searchKeyword}
              onSearch={(value) => onSearch(value.trim())}
            />
            <Select
              className={sectionStyles.filterSelect}
              value={roleFilter}
              options={[{ label: "全部角色", value: "all" }, ...roleOptions]}
              onChange={(value) =>
                onRoleFilterChange(value as "all" | AppUserDto["userType"])
              }
            />
            <Select
              className={sectionStyles.filterSelect}
              value={statusFilter}
              options={statusOptions}
              onChange={(value) =>
                onStatusFilterChange(value as AdminStatusFilter)
              }
            />
          </div>
          <div className={sectionStyles.filterActions}>
            <Button onClick={onResetFilters}>重置筛选</Button>
          </div>
        </div>

        <Card className={sectionStyles.tableCard} styles={{ body: { padding: 0 } }}>
          {tableError ? (
            <div className={sectionStyles.tableState}>
              <Alert
                type="error"
                showIcon
                message="用户列表加载失败"
                description={tableError.message || "暂时无法获取用户数据"}
              />
            </div>
          ) : (
            <Table
              rowKey="id"
              className={sectionStyles.userTable}
              loading={isLoading || isUpdating}
              columns={columns}
              dataSource={users}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: 1160 }}
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

        <AdminUserEditModal
          currentUserId={currentUserId}
          editingUser={editingUser}
          isUpdating={isUpdating}
          onCancel={onCloseEditModal}
          onSubmitEdit={onSubmitEdit}
        />
      </div>
    </section>
  );
}
