import {
  CalendarOutlined,
  CompassOutlined,
  EditOutlined,
  EnvironmentOutlined,
  HeartFilled,
  PushpinFilled,
  ReadOutlined,
  RightOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Empty, Spin, Tag } from "antd";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PersonalPageLayout } from "../../components/personal";
import {
  useCheckinSpotsQuery,
  useCurrentUserQuery,
  useFavoriteSpotsQuery,
  useUserTripsQuery,
} from "../../hooks/useMapWorkbenchData";
import { clearAuthToken, getAuthToken } from "../../lib/authToken";
import styles from "./ProfilePage.module.css";

const PROFILE_FAVORITE_PAGE_SIZE = 6;
const PROFILE_CHECKIN_PAGE_SIZE = 4;
const PROFILE_TRIP_PAGE_SIZE = 3;

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authToken = getAuthToken();
  const currentUserQuery = useCurrentUserQuery(Boolean(authToken));
  
  const favoriteSpotsQuery = useFavoriteSpotsQuery(
    { sortBy: "latest", pageNum: 1, pageSize: PROFILE_FAVORITE_PAGE_SIZE },
    Boolean(authToken)
  );
  const checkinSpotsQuery = useCheckinSpotsQuery(
    { sortBy: "latest", pageNum: 1, pageSize: PROFILE_CHECKIN_PAGE_SIZE },
    Boolean(authToken)
  );
  const userTripsQuery = useUserTripsQuery(
    { pageNum: 1, pageSize: PROFILE_TRIP_PAGE_SIZE },
    Boolean(authToken)
  );

  const favoriteSpots = favoriteSpotsQuery.data?.list ?? [];
  const checkinSpots = useMemo(() => checkinSpotsQuery.data?.list ?? [], [checkinSpotsQuery.data?.list]);
  const userTrips = useMemo(() => userTripsQuery.data?.list ?? [], [userTripsQuery.data?.list]);
  
  const profileStats = useMemo(() => {
    const visitedCityCount = new Set([
      ...checkinSpots.map(s => s.cityName),
      ...userTrips.map(t => t.cityName)
    ]).size;
    const travelDays = userTrips.reduce((acc, t) => acc + t.days, 0);

    return [
      { label: "去过城市", value: visitedCityCount, icon: <RocketOutlined />, color: "#2e6cff", bg: "#edf4ff" },
      { label: "收藏景点", value: favoriteSpotsQuery.data?.total ?? 0, icon: <HeartFilled />, color: "#10b981", bg: "#eefcf9" },
      { label: "保存行程", value: userTripsQuery.data?.total ?? 0, icon: <ReadOutlined />, color: "#8b5cf6", bg: "#f3efff" },
      { label: "打卡景点", value: checkinSpotsQuery.data?.total ?? 0, icon: <PushpinFilled />, color: "#f59e0b", bg: "#fff7e5" },
      { label: "旅行天数", value: travelDays, icon: <CompassOutlined />, color: "#f43f5e", bg: "#fff1f2" },
    ];
  }, [checkinSpots, favoriteSpotsQuery.data?.total, userTrips, userTripsQuery.data?.total, checkinSpotsQuery.data?.total]);

  function handleLogout() {
    clearAuthToken();
    queryClient.clear();
    navigate("/");
  }

  if (!authToken) {
    return (
      <main className={styles.stateShell}>
        <Empty description="登录后即可查看你的个人主页" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        <Button type="primary" onClick={() => navigate("/")}>返回首页登录</Button>
      </main>
    );
  }

  if (currentUserQuery.isLoading) {
    return (
      <main className={styles.stateShell}>
        <Spin size="large" />
        <p>正在加载个人主页...</p>
      </main>
    );
  }

  const currentUser = currentUserQuery.data;
  if (!currentUser) return null;

  return (
    <PersonalPageLayout
      currentUser={currentUser}
      title="个人主页"
      description="汇总你的旅行收藏、足迹和路线记录。"
      onLogout={handleLogout}
    >
      {/* 顶部 Hero 卡片 */}
      <section className={styles.heroCard}>
        <Button className={styles.editBtn} icon={<EditOutlined />}>编辑资料</Button>
        
        <div className={styles.heroContent}>
          <div className={styles.avatarWrap}>
            <Avatar 
              className={styles.avatar} 
              size={120} 
              src={currentUser.avatarUrl || undefined}
            >
              {currentUser.nickname?.slice(0, 1) ?? "旅"}
            </Avatar>
            <div className={styles.levelBadge}>Lv.3</div>
          </div>
          
          <div className={styles.userInfo}>
            <div className={styles.titleRow}>
              <h2>Hi, {currentUser.nickname || "旅行者"} 👋</h2>
              <Tag className={styles.userTag}>旅行达人 Lv.3</Tag>
            </div>
            <p className={styles.slogan}>用脚步丈量世界，用地图记录美好✨</p>
            <div className={styles.metaRow}>
              <span><EnvironmentOutlined /> 中国 · {checkinSpots[0]?.cityName || "成都"}</span>
              <span><CalendarOutlined /> 加入时间：{formatDate(currentUser.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 浮动统计面板 */}
        <div className={styles.statsPanel}>
          {profileStats.map((item) => (
            <div className={styles.statItem} key={item.label}>
              <div className={styles.statIcon} style={{ color: item.color, background: item.bg }}>{item.icon}</div>
              <div className={styles.statInfo}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 仪表盘网格 */}
      <div className={styles.dashboardGrid}>
        {/* 我的足迹地图 */}
        <section className={styles.cardBox}>
          <header className={styles.cardHeader}>
            <h3><EnvironmentOutlined /> 我的足迹地图</h3>
          </header>
          <div className={styles.mapSketch} />
          <div className={styles.mapFooter}>
            <strong>累计去过 {profileStats[0].value} 个城市</strong>
            <span className={styles.viewAll} onClick={() => navigate("/checkins")}>查看足迹地图 <RightOutlined /></span>
          </div>
        </section>

        {/* 最近行程 */}
        <section className={styles.cardBox}>
          <header className={styles.cardHeader}>
            <h3><ReadOutlined /> 最近行程</h3>
            <span className={styles.viewAll} onClick={() => navigate("/trips")}>查看全部 <RightOutlined /></span>
          </header>
          {userTrips.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无行程" />
          ) : (
            <div className={styles.tripList}>
              {userTrips.map(trip => (
                <div key={trip.id} className={styles.tripItem}>
                  <img className={styles.tripImg} src={trip.coverUrl || undefined} alt={trip.tripName} />
                  <div className={styles.tripInfo}>
                    <h4>{trip.tripName}</h4>
                    <p>{trip.cityName} · {trip.days}天 · {trip.planMode === 'schedule' ? '完整行程' : '自由路线'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 最近打卡 */}
        <section className={styles.cardBox}>
          <header className={styles.cardHeader}>
            <h3><PushpinFilled /> 最近打卡</h3>
            <span className={styles.viewAll} onClick={() => navigate("/checkins")}>查看全部 <RightOutlined /></span>
          </header>
          {checkinSpots.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无打卡" />
          ) : (
            <div className={styles.checkinTimeline}>
              {checkinSpots.slice(0, 4).map(spot => (
                <div key={spot.checkinId} className={styles.checkinItem}>
                  <div className={styles.checkinDot} />
                  <img className={styles.checkinAvatar} src={spot.coverUrl || undefined} alt={spot.name} />
                  <div className={styles.checkinDetail}>
                    <h5>{spot.name}</h5>
                    <span>{spot.cityName} · {formatDate(spot.checkedInAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 底部收藏 */}
      <section className={styles.favoritesSection}>
        <header className={styles.cardHeader}>
          <h3><HeartFilled style={{ color: '#f87171' }} /> 我的收藏</h3>
          <span className={styles.viewAll} onClick={() => navigate("/favorites")}>查看全部 <RightOutlined /></span>
        </header>
        <div className={styles.favGrid}>
          {favoriteSpots.map(spot => (
            <div key={spot.favoriteId} className={styles.favCard} onClick={() => navigate(`/?spotId=${spot.spotId}`)}>
              <img className={styles.favCover} src={spot.coverUrl} alt={spot.name} />
              <h5>{spot.name}</h5>
              <p>{spot.cityName}</p>
            </div>
          ))}
        </div>
      </section>
    </PersonalPageLayout>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`;
}
