import {
  AlertOutlined,
  BankOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  PushpinOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Empty,
  Skeleton,
  Statistic,
  Tag,
} from "antd";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type {
  AdminOverviewDimensionDto,
  AdminOverviewDto,
  AdminOverviewRecentSpotDto,
} from "../../../types/admin";
import type { SpotType } from "../../../types/mapWorkbench";
import {
  formatAdminDateTime,
  getAdminUserRoleMeta,
} from "../../../utils/admin/format";
import sectionStyles from "./AdminSections.module.css";

type AdminOverviewSectionProps = {
  overview?: AdminOverviewDto;
  isLoading: boolean;
  overviewError?: Error | null;
  onOpenCities: () => void;
  onOpenSpots: () => void;
  onOpenUsers: () => void;
};

type MetricCardConfig = {
  key: string;
  title: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "orange" | "red";
  onClick?: () => void;
};

const chartColors = [
  "#2f7cf6",
  "#22b8a7",
  "#ff9f43",
  "#ff6b6b",
  "#6c8cff",
  "#2ec4b6",
  "#f4c542",
  "#9b7bff",
];

const spotTypeLabelMap: Record<SpotType, string> = {
  history: "历史文化",
  nature: "自然风光",
  landmark: "城市地标",
  museum: "博物馆展馆",
  food: "美食街区",
  night: "夜游景点",
  family: "亲子游玩",
  business: "商圈街区",
};

// 数据概览页展示后端聚合后的后台全局数据，避免首页自行拉全量列表计算。
export function AdminOverviewSection({
  overview,
  isLoading,
  overviewError,
  onOpenCities,
  onOpenSpots,
  onOpenUsers,
}: AdminOverviewSectionProps) {
  if (isLoading) {
    return (
      <section className={sectionStyles.overviewShell}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </section>
    );
  }

  if (overviewError) {
    return (
      <section className={sectionStyles.overviewShell}>
        <Alert
          type="error"
          showIcon
          message="数据概览加载失败"
          description={overviewError.message}
        />
      </section>
    );
  }

  if (!overview) {
    return (
      <section className={sectionStyles.overviewShell}>
        <Empty description="暂无概览数据" />
      </section>
    );
  }

  const metricCards: MetricCardConfig[] = [
    {
      key: "users",
      title: "用户总数",
      value: overview.metrics.totalUsers,
      detail: `${overview.metrics.enabledUsers} 个启用账号`,
      icon: <TeamOutlined />,
      tone: "blue",
      onClick: onOpenUsers,
    },
    {
      key: "cities",
      title: "城市总数",
      value: overview.metrics.totalCities,
      detail: `${overview.metrics.enabledCities} 个开放城市`,
      icon: <EnvironmentOutlined />,
      tone: "green",
      onClick: onOpenCities,
    },
    {
      key: "spots",
      title: "景点总数",
      value: overview.metrics.totalSpots,
      detail: `${overview.metrics.enabledSpots} 个启用景点`,
      icon: <PushpinOutlined />,
      tone: "orange",
      onClick: onOpenSpots,
    },
    {
      key: "issues",
      title: "待维护数据",
      value:
        overview.metrics.disabledUsers +
        overview.metrics.disabledCities +
        overview.metrics.disabledSpots +
        overview.metrics.missingCoverSpots +
        overview.metrics.missingScoreSpots,
      detail: "含停用与资料缺失",
      icon: <AlertOutlined />,
      tone: "red",
    },
  ];

  const operations = [
    {
      label: "停用账号",
      description: "需要复核账号状态或联系用户",
      value: overview.metrics.disabledUsers,
      icon: <TeamOutlined />,
    },
    {
      label: "停用城市",
      description: "不会作为前台重点城市展示",
      value: overview.metrics.disabledCities,
      icon: <BankOutlined />,
    },
    {
      label: "停用景点",
      description: "路线规划和地图展示会受影响",
      value: overview.metrics.disabledSpots,
      icon: <PushpinOutlined />,
    },
    {
      label: "缺少封面",
      description: "景点卡片视觉质量需要补齐",
      value: overview.metrics.missingCoverSpots,
      icon: <PictureOutlined />,
    },
    {
      label: "缺少评分",
      description: "推荐排序的稳定性会下降",
      value: overview.metrics.missingScoreSpots,
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <section className={sectionStyles.overviewShell}>
      <div className={sectionStyles.pageHeading}>
        <h1>数据概览</h1>
        <p>集中查看后台用户、城市、景点和资料维护状态。</p>
      </div>

      <div className={sectionStyles.overviewMetricGrid}>
        {metricCards.map((card) => (
          <button
            className={`${sectionStyles.overviewMetricCard} ${sectionStyles[`overviewMetricCard${capitalize(card.tone)}`]}`}
            key={card.key}
            type="button"
            onClick={card.onClick}
          >
            <span className={sectionStyles.overviewMetricIcon}>
              {card.icon}
            </span>
            <Statistic title={card.title} value={card.value} />
            <em>{card.detail}</em>
          </button>
        ))}
      </div>

      <div className={sectionStyles.overviewChartGrid}>
        <Card
          className={sectionStyles.overviewChartCard}
          title="城市景点数量 Top 8"
        >
          <OverviewChart
            option={buildCitySpotOption(overview.citySpotRanking)}
          />
        </Card>

        <Card className={sectionStyles.overviewChartCard} title="用户角色分布">
          <OverviewChart
            option={buildDonutOption(
              overview.userRoleDistribution,
              "非管理员用户",
            )}
          />
        </Card>

        <Card className={sectionStyles.overviewChartCard} title="景点类型分布">
          <OverviewChart
            option={buildSpotTypeOption(overview.spotTypeDistribution)}
          />
        </Card>

        <Card className={sectionStyles.overviewChartCard} title="数据启停状态">
          <OverviewChart
            option={buildStatusOption(overview.dataStatusDistribution)}
          />
        </Card>
      </div>

      <div className={sectionStyles.overviewBottomGrid}>
        <Card className={sectionStyles.panelCard} title="运营提醒">
          <div className={sectionStyles.todoList}>
            {operations.map((item) => (
              <div className={sectionStyles.todoItem} key={item.label}>
                <span className={sectionStyles.todoIcon}>{item.icon}</span>
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
              用户管理
            </Button>
          }
        >
          <div className={sectionStyles.recentList}>
            {overview.recentUsers.map((user) => {
              const roleMeta = getAdminUserRoleMeta(user.userType);
              return (
                <div className={sectionStyles.recentUserStatic} key={user.id}>
                  <Avatar size={42} src={user.avatarUrl || undefined}>
                    {user.nickname?.slice(0, 1)}
                  </Avatar>
                  <div>
                    <strong>{user.nickname}</strong>
                    <span>{formatAdminDateTime(user.createdAt)}</span>
                  </div>
                  <Tag color={roleMeta.tagColor}>{roleMeta.label}</Tag>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          className={sectionStyles.panelCard}
          title="最近更新景点"
          extra={
            <Button type="link" onClick={onOpenSpots}>
              景点管理
            </Button>
          }
        >
          <div className={sectionStyles.recentList}>
            {overview.recentSpots.map((spot) => (
              <RecentSpotItem key={spot.id} spot={spot} />
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

// 组件：概览图表
function OverviewChart({ option }: { option: EChartsOption }) {
  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ width: "100%", height: 280 }}
    />
  );
}
// 组件：最近更新景点
function RecentSpotItem({ spot }: { spot: AdminOverviewRecentSpotDto }) {
  return (
    <div className={sectionStyles.recentSpotStatic}>
      <span className={sectionStyles.recentSpotIcon}>
        <PushpinOutlined />
      </span>
      <div>
        <strong>{spot.name}</strong>
        <span>
          {spot.cityName} / {spotTypeLabelMap[spot.type] ?? spot.type} /{" "}
          {formatAdminDateTime(spot.updatedAt)}
        </span>
      </div>
      <Tag color={spot.status === 1 ? "success" : "error"}>
        {spot.status === 1 ? "启用" : "停用"}
      </Tag>
    </div>
  );
}

function buildCitySpotOption(
  items: AdminOverviewDimensionDto[],
): EChartsOption {
  return {
    color: ["#2f7cf6"],
    grid: { top: 20, right: 24, bottom: 24, left: 72 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "value",
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#eef3f8" } },
    },
    yAxis: {
      type: "category",
      data: items.map((item) => item.label).reverse(),
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: items.map((item) => item.value).reverse(),
        barWidth: 14,
        itemStyle: { borderRadius: [0, 8, 8, 0] },
      },
    ],
  };
}

function buildDonutOption(
  items: AdminOverviewDimensionDto[],
  centerText: string,
): EChartsOption {
  return {
    color: chartColors,
    tooltip: { trigger: "item" },
    legend: { bottom: 0, icon: "circle" },
    graphic: {
      type: "text",
      left: "center",
      top: "41%",
      style: {
        text: centerText,
        fill: "#7a8ca5",
        fontSize: 12,
        fontWeight: 700,
      },
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "72%"],
        center: ["50%", "44%"],
        data: items.map((item) => ({ name: item.label, value: item.value })),
        label: { formatter: "{b}\n{c}" },
      },
    ],
  };
}

function buildSpotTypeOption(
  items: AdminOverviewDimensionDto[],
): EChartsOption {
  return {
    color: ["#22b8a7"],
    grid: { top: 28, right: 16, bottom: 54, left: 40 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: items.map((item) => item.label),
      axisLabel: { rotate: 30 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#dfe7f1" } },
    },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#eef3f8" } } },
    series: [
      {
        type: "bar",
        data: items.map((item) => item.value),
        barWidth: 18,
        itemStyle: { borderRadius: [8, 8, 0, 0] },
      },
    ],
  };
}

function buildStatusOption(items: AdminOverviewDimensionDto[]): EChartsOption {
  return {
    color: ["#22b8a7", "#ff6b6b", "#2f7cf6", "#ff9f43"],
    tooltip: { trigger: "item" },
    legend: { bottom: 0, icon: "roundRect" },
    series: [
      {
        type: "pie",
        radius: ["42%", "68%"],
        center: ["50%", "42%"],
        roseType: "radius",
        data: items.map((item) => ({ name: item.label, value: item.value })),
      },
    ],
  };
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
