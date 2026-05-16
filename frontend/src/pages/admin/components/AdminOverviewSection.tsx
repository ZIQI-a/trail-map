import { AlertOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Statistic, Tag } from "antd";
import type { AppUserDto } from "../../../types/auth";
import { overviewCardConfigs } from "../../../admin/config";
import { formatAdminDateTime } from "../../../utils/admin/format";
import sectionStyles from "./AdminSections.module.css";

type OverviewStats = {
  totalUsers: number;
  enabledUsers: number;
  adminUsers: number;
  memberUsers: number;
};

type StatusSummaryItem = {
  label: string;
  description: string;
  value: number;
};

type AdminOverviewSectionProps = {
  overviewStats: OverviewStats;
  recentUsers: AppUserDto[];
  statusSummary: StatusSummaryItem[];
  onOpenUsers: () => void;
};

// 数据概览页聚合统计、待处理事项与最近注册用户，保持首页信息密度稳定。
export function AdminOverviewSection({
  overviewStats,
  recentUsers,
  statusSummary,
  onOpenUsers,
}: AdminOverviewSectionProps) {
  const statValueMap = {
    totalUsers: overviewStats.totalUsers,
    enabledUsers: overviewStats.enabledUsers,
    adminUsers: overviewStats.adminUsers,
    memberUsers: overviewStats.memberUsers,
  };

  return (
    <section className={sectionStyles.contentGridSingle}>
      <div className={sectionStyles.mainColumn}>
        <div className={sectionStyles.pageHeading}>
          <h1>数据概览</h1>
          <p>集中查看后台用户规模、账号状态与近期注册变化。</p>
        </div>

        <div className={sectionStyles.statGrid}>
          {overviewCardConfigs.map((item) => (
            <Card className={sectionStyles.statCard} key={item.key}>
              <Statistic title={item.title} value={statValueMap[item.key]} prefix={item.icon} />
              <span className={sectionStyles.cardTrend}>{item.trend}</span>
            </Card>
          ))}
        </div>

        <div className={sectionStyles.dualSection}>
          <Card className={sectionStyles.panelCard} title="待处理事项">
            <div className={sectionStyles.todoList}>
              {statusSummary.map((item) => (
                <div className={sectionStyles.todoItem} key={item.label}>
                  <span className={sectionStyles.todoIcon}>
                    <AlertOutlined />
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </div>
                  <em>{item.value}</em>
                </div>
              ))}
            </div>
          </Card>

          <Card
            className={sectionStyles.panelCard}
            title="最近注册用户"
            extra={
              <Button type="link" onClick={onOpenUsers}>
                进入用户管理
              </Button>
            }
          >
            <div className={sectionStyles.recentList}>
              {recentUsers.map((user) => (
                <div className={sectionStyles.recentUserStatic} key={user.id}>
                  <Avatar size={42} src={user.avatarUrl || undefined} icon={null} />
                  <div>
                    <strong>{user.nickname}</strong>
                    <span>{formatAdminDateTime(user.createdAt)}</span>
                  </div>
                  <Tag color={user.status === 1 ? "success" : "error"}>
                    {user.status === 1 ? "正常" : "停用"}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
