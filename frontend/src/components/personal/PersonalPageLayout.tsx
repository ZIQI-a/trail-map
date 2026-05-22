import { BellOutlined, HomeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppTopHeader } from "../common";
import type { AppUserDto } from "../../types/auth";
import styles from "./PersonalPageLayout.module.css";

interface PersonalPageLayoutProps {
  actions?: ReactNode;
  children: ReactNode;
  currentUser: AppUserDto;
  description: string;
  onLogout: () => void;
  title: string;
}

// PersonalPageLayout 统一个人相关页面的顶部导航和二级标题区，页面只传内容和局部操作。
export function PersonalPageLayout({
  actions,
  children,
  currentUser,
  description,
  onLogout,
  title,
}: PersonalPageLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const personalNavItems = [
    { label: "个人主页", path: "/profile" },
    { label: "我的收藏", path: "/favorites" },
    { label: "我的足迹", path: "/checkins" },
    { label: "我的行程", path: "/trips" },
  ];

  return (
    <main className={styles.pageShell}>
      <AppTopHeader
        centerSlot={
          <nav className={styles.personalTabs} aria-label="个人中心页面切换">
            {personalNavItems.map((item) => (
              <button
                className={`${styles.personalTab} ${location.pathname === item.path ? styles.personalTabActive : ""}`}
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        }
        currentUser={currentUser}
        onLogout={onLogout}
        rightSlot={
          <div className={styles.headerActions}>
            <Button
              className={styles.homeButton}
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
            >
              返回首页
            </Button>
            <button
              className={styles.noticeButton}
              type="button"
              aria-label="通知"
            >
              <BellOutlined />
            </button>
          </div>
        }
      />

      <section className={styles.subHeader}>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {actions ? <div className={styles.subActions}>{actions}</div> : null}
      </section>

      <section className={styles.contentArea}>{children}</section>
    </main>
  );
}
