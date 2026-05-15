import {
  ArrowRightOutlined,
  CalendarOutlined,
  CloudSyncOutlined,
  LockOutlined,
  LoginOutlined,
  QqOutlined,
  StarFilled,
  UserOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { Alert, Button, Checkbox, Divider, Input, Modal } from "antd";
import { useMemo, useState } from "react";
import type { LoginRequestDto, RegisterRequestDto } from "../../../types/auth";
import styles from "./AuthDialog.module.css";

type AuthMode = "login" | "register";

interface AuthDialogProps {
  open: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onLogin: (payload: LoginRequestDto) => void;
  onRegister: (payload: RegisterRequestDto) => void;
}

const featureItems = [
  {
    icon: <StarFilled />,
    title: "收藏想去景点",
    description: "一键收藏，灵感不再错过",
  },
  {
    icon: <CalendarOutlined />,
    title: "保存完整行程",
    description: "行程云端保存，随时查看修改",
  },
  {
    icon: <CloudSyncOutlined />,
    title: "同步旅行足迹",
    description: "多端同步，留住你的每一步",
  },
];

// AuthDialog 负责登录和注册表单展示，视觉重做但不改变现有认证提交流程。
export function AuthDialog({
  open,
  loading,
  error,
  onClose,
  onLogin,
  onRegister,
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const submitDisabled = useMemo(
    () =>
      !username.trim() ||
      !password ||
      (mode === "register" && !nickname.trim()),
    [mode, nickname, password, username],
  );

  function handleSubmit() {
    if (submitDisabled) {
      return;
    }

    if (mode === "login") {
      onLogin({ username: username.trim(), password });
      return;
    }

    onRegister({
      username: username.trim(),
      nickname: nickname.trim(),
      password,
    });
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
  }

  return (
    <Modal
      className={styles.dialogModal}
      title={null}
      open={open}
      width={886}
      footer={null}
      centered
      destroyOnClose={false}
      onCancel={onClose}
    >
      <div className={styles.dialogShell}>
        <aside className={styles.visualPanel}>
          <div className={styles.brandRow}>
            <img
              className={styles.brandLogo}
              src="/header_logo.png"
              alt="行迹旅图 TrailMap"
            />
          </div>

          <div className={styles.heroCopy}>
            <strong>记录每一段旅程</strong>
            <p>让旅行更有计划，让回忆更有温度</p>
          </div>

          <div className={styles.heroArtwork}>
            <img
              className={styles.heroImage}
              src="/loginpage_logo.png"
              alt="TrailMap 旅行插图"
            />
          </div>

          <div className={styles.featureList}>
            {featureItems.map((item) => (
              <article className={styles.featureCard} key={item.title}>
                <span className={styles.featureIcon}>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.formHeader}>
            <button
              className={mode === "login" ? styles.tabActive : styles.tabButton}
              type="button"
              onClick={() => handleModeChange("login")}
            >
              登录
            </button>
            <button
              className={
                mode === "register" ? styles.tabActive : styles.tabButton
              }
              type="button"
              onClick={() => handleModeChange("register")}
            >
              注册
            </button>
          </div>

        {error ? <Alert type="error" showIcon message={error} /> : null}

        <div
          className={styles.formGrid}
          data-mode={mode}
        >
          <Input
            size="large"
            value={username}
            prefix={<UserOutlined />}
            placeholder="手机号 / 邮箱 / 用户名"
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              onPressEnter={handleSubmit}
            />

          {mode === "register" ? (
            <Input
              size="large"
              value={nickname}
              prefix={<LoginOutlined />}
              placeholder="请输入昵称"
              autoComplete="nickname"
              onChange={(event) => setNickname(event.target.value)}
              onPressEnter={handleSubmit}
            />
          ) : null}

          <Input.Password
            size="large"
            value={password}
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              onChange={(event) => setPassword(event.target.value)}
              onPressEnter={handleSubmit}
            />
          </div>

          <button className={styles.codeLoginLink} type="button">
            验证码登录
          </button>

          <div className={styles.metaRow}>
            <Checkbox
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            >
              记住我
            </Checkbox>
            <button className={styles.textLink} type="button">
              忘记密码？
            </button>
          </div>

          <Button
            className={styles.primaryAction}
            type="primary"
            size="large"
            block
            loading={loading}
            disabled={submitDisabled}
            onClick={handleSubmit}
          >
            {mode === "login" ? "立即登录" : "立即注册"}
          </Button>

          <Button
            className={styles.secondaryAction}
            size="large"
            block
            onClick={() =>
              handleModeChange(mode === "login" ? "register" : "login")
            }
          >
            {mode === "login" ? "去注册" : "去登录"}
            <ArrowRightOutlined />
          </Button>

          <Divider className={styles.modeDivider}>其他方式登录</Divider>

          <div className={styles.socialRow}>
            <Button className={styles.socialButton} size="large" block>
              <WechatOutlined />
              微信登录
            </Button>
            <Button className={styles.socialButton} size="large" block>
              <QqOutlined />
              QQ 登录
            </Button>
          </div>

          <p className={styles.policyText}>
            登录即表示同意
            <button className={styles.inlineLink} type="button">
              《用户协议》
            </button>
            与
            <button className={styles.inlineLink} type="button">
              《隐私政策》
            </button>
          </p>
        </section>
      </div>
    </Modal>
  );
}
