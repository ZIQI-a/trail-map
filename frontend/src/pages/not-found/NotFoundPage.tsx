import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import styles from "./NotFoundPage.module.css";

// NotFoundPage 统一承接未知路由和后台不可访问场景，避免暴露权限细节。
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className={styles.notFoundShell}>
      <div className={styles.notFoundCard}>
        <Result
          status="404"
          title="404"
          subTitle="页面不存在或暂时无法访问"
          extra={
            <Button type="primary" onClick={() => navigate("/")}>
              返回首页
            </Button>
          }
        />
      </div>
    </main>
  );
}
