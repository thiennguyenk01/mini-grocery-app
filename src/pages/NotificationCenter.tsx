import React, { useEffect } from "react";
import { Card, Button, Empty } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../store/AppDataContext";
import DateGroupedList from "../components/DateGroupedList";
import type { AppNotification } from "../types";

const SEVERITY_DOT_COLOR: Record<AppNotification["severity"], string> = {
  INFO: "#2563eb",
  WARNING: "#d97706",
  CRITICAL: "#dc2626",
};

const NotificationCenter: React.FC = () => {
  const { notifications, syncNotifications, markNotificationRead, markAllNotificationsRead, dismissNotification } =
    useAppData();
  const navigate = useNavigate();

  // Quét lại rule mỗi khi mở trang - chỉ thêm thông báo MỚI (chưa có cùng dedupKey), không tạo trùng.
  useEffect(() => {
    syncNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...notifications].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.actionRoute) navigate(n.actionRoute);
  };

  return (
    <div>
      <Card
        className="page-card"
        style={{ marginBottom: 16 }}
        styles={{ body: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" } }}
      >
        <div style={{ fontSize: 13, color: "#8c8c8c" }}>
          {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}
        </div>
        {unreadCount > 0 && (
          <Button type="link" style={{ padding: 0 }} icon={<CheckOutlined />} onClick={markAllNotificationsRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </Card>

      <Card className="page-card">
        {sorted.length === 0 ? (
          <Empty description="Không có thông báo nào" />
        ) : (
          <DateGroupedList
            items={sorted}
            getDate={(n) => n.createdAt}
            emptyText="Không có thông báo nào"
            renderItem={(n) => (
              <div
                onClick={() => handleOpen(n)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "11px 0",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      marginTop: 6,
                      flexShrink: 0,
                      background: SEVERITY_DOT_COLOR[n.severity],
                      opacity: n.read ? 0.3 : 1,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, color: "#1f2933" }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 2 }}>{n.message}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{dayjs(n.createdAt).format("HH:mm")}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(n.id);
                    }}
                  />
                </div>
              </div>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default NotificationCenter;
