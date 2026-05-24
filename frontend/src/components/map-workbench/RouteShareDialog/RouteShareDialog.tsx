import { CopyOutlined, LinkOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Modal } from "antd";
import { useMemo, useState } from "react";
import styles from "./RouteShareDialog.module.css";

interface RouteShareDialogProps {
  loading?: boolean;
  open: boolean;
  routeSummary: string;
  routeTitle: string;
  shareTripId?: number;
  onClose: () => void;
  onCreateShareLink: () => Promise<number | undefined> | number | undefined;
}

/**
 * RouteShareDialog 展示当前行程的分享链接；未保存时先触发保存再生成稳定链接。
 */
export function RouteShareDialog({
  loading = false,
  open,
  routeSummary,
  routeTitle,
  shareTripId,
  onClose,
  onCreateShareLink,
}: RouteShareDialogProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const shareLink = useMemo(
    () =>
      shareTripId
        ? `${window.location.origin}/?tripId=${shareTripId}`
        : undefined,
    [shareTripId],
  );

  /**
   * 复制分享链接到剪贴板；浏览器不支持时给出失败状态。
   */
  async function handleCopyLink() {
    if (!shareLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  /**
   * 保存当前行程并等待父级回填 tripId，随后弹窗展示可复制链接。
   */
  async function handleCreateShareLink() {
    setCopyState("idle");
    await onCreateShareLink();
  }

  return (
    <Modal
      title="分享行程"
      open={open}
      width={520}
      footer={null}
      onCancel={onClose}
    >
      <div className={styles.shareShell}>
        <section className={styles.routeSummaryCard}>
          <span className={styles.summaryIcon}>
            <LinkOutlined />
          </span>
          <div>
            <strong>{routeTitle}</strong>
            <p>{routeSummary}</p>
          </div>
        </section>

        {shareLink ? (
          <section className={styles.linkPanel}>
            <span>分享链接</span>
            <Input value={shareLink} readOnly />
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => void handleCopyLink()}
            >
              {copyState === "copied" ? "已复制" : "复制链接"}
            </Button>
            {copyState === "failed" ? (
              <small>复制失败，请手动选择链接复制。</small>
            ) : null}
          </section>
        ) : (
          <section className={styles.unsavedPanel}>
            <strong>保存后行程后才能分享哦~</strong>
            <p>先保存到“我的行程”，系统会生成可回放的分享链接。</p>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => void handleCreateShareLink()}
            >
              保存并生成链接
            </Button>
          </section>
        )}
      </div>
    </Modal>
  );
}
