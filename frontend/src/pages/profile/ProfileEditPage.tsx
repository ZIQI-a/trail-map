import {
  ArrowLeftOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Form, Input, Spin, message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PersonalPageLayout } from "../../components/personal";
import {
  useCurrentUserQuery,
  useUpdateCurrentUserProfileMutation,
} from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import styles from "./ProfileEditPage.module.css";

type ProfileEditFormValues = {
  avatarUrl: string;
  email: string;
  nickname: string;
  phone: string;
  region: string;
};

/**
 * ProfileEditPage 提供当前用户资料编辑，不混入管理员字段。
 */
export function ProfileEditPage() {
  const [form] = Form.useForm<ProfileEditFormValues>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  const updateProfileMutation = useUpdateCurrentUserProfileMutation();
  const currentUser = currentUserQuery.data;

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    // 每次进入编辑页时同步当前资料，避免表单残留旧值。
    form.setFieldsValue({
      avatarUrl: currentUser.avatarUrl ?? "",
      email: currentUser.email ?? "",
      nickname: currentUser.nickname ?? "",
      phone: currentUser.phone ?? "",
      region: currentUser.region ?? "",
    });
  }, [currentUser, form]);

  function handleLogout() {
    clearAuthToken();
    queryClient.clear();
    navigate("/");
  }

  async function handleSubmit(values: ProfileEditFormValues) {
    await updateProfileMutation.mutateAsync({
      avatarUrl: values.avatarUrl.trim() || null,
      email: values.email.trim() || null,
      nickname: values.nickname.trim() || null,
      phone: values.phone.trim() || null,
      region: values.region.trim() || null,
    });
    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    message.success("个人资料已更新");
    navigate("/profile");
  }

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Alert type="warning" showIcon message="请先登录后再编辑个人资料" />
        <Button type="primary" onClick={() => navigate("/")}>
          返回首页登录
        </Button>
      </main>
    );
  }

  if (currentUserQuery.isLoading || !currentUser) {
    return (
      <main className={styles.stateShell}>
        <Spin size="large" />
        <p>正在加载个人资料...</p>
      </main>
    );
  }

  return (
    <PersonalPageLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      title="个人信息"
      actions={
        <Button
          className={styles.backButton}
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/profile")}
        >
          返回主页
        </Button>
      }
    >
      <section className={styles.pageGrid}>
        <Card className={styles.previewCard} bordered={false}>
          <div className={styles.previewHeader}>
            <Avatar
              className={styles.previewAvatar}
              size={96}
              src={
                form.getFieldValue("avatarUrl") ||
                currentUser.avatarUrl ||
                undefined
              }
            >
              {(
                form.getFieldValue("nickname") ||
                currentUser.nickname ||
                "旅"
              ).slice(0, 1)}
            </Avatar>
            <div className={styles.previewMeta}>
              <h2>{form.getFieldValue("nickname") || currentUser.nickname}</h2>
              <p>{currentUser.username}</p>
            </div>
          </div>
          <div className={styles.previewList}>
            <div className={styles.previewItem}>
              <EnvironmentOutlined />
              <span>
                {form.getFieldValue("region") ||
                  currentUser.region ||
                  "未设置地区"}
              </span>
            </div>
            <div className={styles.previewItem}>
              <PhoneOutlined />
              <span>
                {form.getFieldValue("phone") ||
                  currentUser.phone ||
                  "未绑定手机号"}
              </span>
            </div>
            <div className={styles.previewItem}>
              <MailOutlined />
              <span>
                {form.getFieldValue("email") ||
                  currentUser.email ||
                  "未绑定邮箱"}
              </span>
            </div>
          </div>
        </Card>

        <Card className={styles.formCard} bordered={false}>
          <Form<ProfileEditFormValues>
            form={form}
            layout="vertical"
            onFinish={(values) => void handleSubmit(values)}
          >
            <Form.Item
              label="昵称"
              name="nickname"
              rules={[
                { required: true, message: "请输入昵称" },
                { whitespace: true, message: "昵称不能为空白字符" },
                { max: 50, message: "昵称最多 50 个字符" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="例如：旅行研究员" />
            </Form.Item>

            <Form.Item
              label="所在地区"
              name="region"
              rules={[{ max: 100, message: "地区最多 100 个字符" }]}
            >
              <Input
                prefix={<EnvironmentOutlined />}
                placeholder="例如：四川·成都"
              />
            </Form.Item>

            <Form.Item
              label="手机号"
              name="phone"
              rules={[{ pattern: /^$|^1\d{10}$/, message: "手机号格式不正确" }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="选填" />
            </Form.Item>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[{ type: "email", message: "邮箱格式不正确" }]}
            >
              <Input prefix={<MailOutlined />} placeholder="选填" />
            </Form.Item>

            <Form.Item
              label="头像链接"
              name="avatarUrl"
              rules={[{ max: 255, message: "头像链接最多 255 个字符" }]}
            >
              <Input
                prefix={<CameraOutlined />}
                placeholder="输入可访问的图片地址"
              />
            </Form.Item>

            {updateProfileMutation.error ? (
              <Alert
                className={styles.formAlert}
                type="error"
                showIcon
                message={
                  updateProfileMutation.error instanceof Error
                    ? updateProfileMutation.error.message
                    : "个人资料保存失败"
                }
              />
            ) : null}

            <div className={styles.formActions}>
              <Button onClick={() => navigate("/profile")}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateProfileMutation.isPending}
              >
                保存资料
              </Button>
            </div>
          </Form>
        </Card>
      </section>
    </PersonalPageLayout>
  );
}
