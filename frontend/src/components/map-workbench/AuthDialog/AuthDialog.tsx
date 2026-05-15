import {
  LockOutlined,
  LoginOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Button, Input, Modal, Segmented } from "antd";
import { useState } from "react";
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

// AuthDialog 负责登录和注册表单，不直接处理 token 保存，保持展示和业务解耦。
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

  function handleSubmit() {
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

  return (
    <Modal
      title={null}
      open={open}
      width={430}
      footer={null}
      centered
      onCancel={onClose}
    >
      <div className={styles.dialogShell}>
        <div className={styles.hero}>
          <span className={styles.heroIcon}>
            {mode === "login" ? <LoginOutlined /> : <UserAddOutlined />}
          </span>
          <div>
            <strong>{mode === "login" ? "登录 TrailMap" : "创建 TrailMap 账号"}</strong>
            <p>
              {mode === "login"
                ? "登录后可继续扩展收藏、打卡和行程保存。"
                : "当前注册默认为普通用户，会员和管理员后续单独配置。"}
            </p>
          </div>
        </div>

        <Segmented
          block
          value={mode}
          options={[
            { label: "登录", value: "login" },
            { label: "注册", value: "register" },
          ]}
          onChange={(value) => setMode(value as AuthMode)}
        />

        {error ? <Alert type="error" showIcon message={error} /> : null}

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>用户名</span>
            <Input
              value={username}
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              onPressEnter={handleSubmit}
            />
          </label>

          {mode === "register" ? (
            <label className={styles.field}>
              <span>昵称</span>
              <Input
                value={nickname}
                prefix={<UserOutlined />}
                placeholder="例如：旅行规划师"
                autoComplete="nickname"
                onChange={(event) => setNickname(event.target.value)}
                onPressEnter={handleSubmit}
              />
            </label>
          ) : null}

          <label className={styles.field}>
            <span>密码</span>
            <Input.Password
              value={password}
              prefix={<LockOutlined />}
              placeholder="至少 6 位"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              onChange={(event) => setPassword(event.target.value)}
              onPressEnter={handleSubmit}
            />
          </label>
        </div>

        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          disabled={
            !username.trim() ||
            !password ||
            (mode === "register" && !nickname.trim())
          }
          onClick={handleSubmit}
        >
          {mode === "login" ? "登录" : "注册并登录"}
        </Button>
      </div>
    </Modal>
  );
}
