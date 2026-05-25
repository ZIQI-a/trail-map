import { CopyOutlined, LinkOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Modal } from "antd";
import { useMemo, useState } from "react";
import styles from "./RouteShareDialog.module.css";

interface RouteShareDialogProps {
  loading?: boolean;
  open: boolean;
  routeSummary: string;
  routeTitle: string;
  shareToken?: string | null;
  onClose: () => void;
  onCreateShareLink: () => Promise<string | null | undefined> | string | null | undefined;
}

/**
 * RouteShareDialog 展示当前行程的公开分享链接；未公开时先开启分享。
 */
export function RouteShareDialog({
  loading = false,
  open,
  routeSummary,
  routeTitle,
  shareToken,
  onClose,
  onCreateShareLink,
}: RouteShareDialogProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const shareLink = useMemo(
    () =>
      shareToken
        ? `${window.location.origin}/?shareToken=${shareToken}`
        : undefined,
    [shareToken],
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
   * 保存并开启公开分享，随后弹窗展示可复制链接。
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
            <strong>当前行程还没有公开分享链接</strong>
            <p>开启公开分享后，未登录用户也可以通过链接查看这条行程。</p>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => void handleCreateShareLink()}
            >
              开启公开分享
            </Button>
          </section>
        )}
      </div>
    </Modal>
  );
}
