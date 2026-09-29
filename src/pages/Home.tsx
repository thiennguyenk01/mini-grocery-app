import React, { useEffect, useMemo, useState } from "react";
import { Card, List, Button, Badge } from "antd";
import { useNavigate } from "react-router-dom";
import {
  SettingOutlined,
  BellOutlined,
  RiseOutlined,
  FallOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  ImportOutlined,
  UserOutlined,
  HistoryOutlined,
  BarChartOutlined,
  TagsOutlined,
  CalculatorOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { formatVND } from "../utils/format";
import { useIsMobile } from "../hooks/useIsMobile";
import { getRevenueTrend } from "../utils/aiInsights";
import SaleDetailModal from "../components/SaleDetailModal";
import type { Sale } from "../types";
import logo from "../assets/logo.png";

const SHOP_NAME = "Tạp Hóa Nga Cư";

interface QuickAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: "/sales", label: "Bán hàng", icon: <ShoppingCartOutlined />, color: "#16a34a", bg: "#dcfce7" },
  { key: "/products", label: "Sản phẩm", icon: <ShoppingOutlined />, color: "#2563eb", bg: "#dbeafe" },
  { key: "/purchases", label: "Nhập hàng", icon: <ImportOutlined />, color: "#d97706", bg: "#fef3c7" },
  { key: "/debts", label: "Công nợ", icon: <UserOutlined />, color: "#7c3aed", bg: "#ede9fe" },
  { key: "/sales/history", label: "Lịch sử", icon: <HistoryOutlined />, color: "#db2777", bg: "#fce7f3" },
  { key: "/statistics", label: "Thống kê", icon: <BarChartOutlined />, color: "#0891b2", bg: "#cffafe" },
];

const Home: React.FC = () => {
  const { products, sales, notifications, syncNotifications } = useAppData();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  // Quét thông báo mới mỗi khi mở Trang chủ (không tạo trùng - xem dedupKey trong service).
  useEffect(() => {
    syncNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const trend = useMemo(() => getRevenueTrend(sales), [sales]);
  const recentTransactions = useMemo(
    () => [...sales].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).slice(0, 5),
    [sales]
  );

  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 11) return "Chào buổi sáng";
    if (hour < 13) return "Chào buổi trưa";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  return (
    <div>
      {/* Header xanh: logo + tên tiệm + lời chào + nút cài đặt - theo đúng bố cục hình mẫu */}
      <div
        style={{
          background: "linear-gradient(135deg, #16a34a 0%, #0d5c1c 100%)",
          borderRadius: 20,
          padding: isMobile ? "16px 16px 46px" : "20px 24px 50px",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={logo}
              alt="Logo"
              style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.35)" }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{SHOP_NAME}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {greeting}! Quản lý cửa hàng dễ dàng hơn
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <BellOutlined
                onClick={() => navigate("/notifications")}
                style={{ fontSize: 19, cursor: "pointer", opacity: 0.9, color: "#fff" }}
              />
            </Badge>
            <SettingOutlined
              onClick={() => navigate("/security")}
              style={{ fontSize: 19, cursor: "pointer", opacity: 0.9 }}
            />
          </div>
        </div>
      </div>

      {/* Thẻ doanh thu trắng nhô lên đè mép banner, bấm vào xem thống kê chi tiết */}
      <Card
        className="stat-card"
        onClick={() => navigate("/statistics")}
        style={{ marginTop: -32, marginBottom: 14, borderRadius: 16, cursor: "pointer" }}
        styles={{ body: { padding: "16px 18px" } }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 4 }}>Doanh thu hôm nay</div>
            <div style={{ fontSize: isMobile ? 26 : 30, fontWeight: 800, color: "#1f2933" }}>
              {formatVND(trend.today)}
            </div>
            {trend.percent !== null && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: trend.percent >= 0 ? "#16a34a" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {trend.percent >= 0 ? <RiseOutlined /> : <FallOutlined />}
                {Math.abs(trend.percent)}% so với hôm qua
              </div>
            )}
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16a34a",
              fontSize: 18,
            }}
          >
            <BarChartOutlined />
          </div>
        </div>
      </Card>

      {/* Lưới 6 nút truy cập nhanh - đúng bố cục hình mẫu (2 hàng x 3 cột) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {QUICK_ACTIONS.map((action) => (
          <div
            key={action.key}
            onClick={() => navigate(action.key)}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "16px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: action.bg,
                color: action.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {action.icon}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1f2933", textAlign: "center" }}>
              {action.label}
            </span>
          </div>
        ))}
      </div>
      {/* Giao dịch gần đây - lấp phần trống bên dưới lưới nút, đồng thời hữu ích để xem nhanh */}
      <Card
        className="page-card"
        style={{ marginTop: 16 }}
        title="Giao dịch gần đây"
        extra={
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate("/sales/history")}>
            Xem tất cả
          </Button>
        }
      >
        <List
          dataSource={recentTransactions}
          locale={{ emptyText: "Chưa có giao dịch nào" }}
          renderItem={(s) => (
            <List.Item style={{ cursor: "pointer" }} onClick={() => setDetailSale(s)}>
              <span>
                <b>{s.code}</b> · {dayjs(s.date).format("HH:mm DD/MM")}
              </span>
              <b style={{ color: "#147f27" }}>{formatVND(s.total)}</b>
            </List.Item>
          )}
        />
      </Card>

      {/* Lối tắt phụ - các tính năng ít dùng hơn nhưng vẫn cần truy cập nhanh từ Trang chủ */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {[
          { key: "/categories", label: "Danh mục", icon: <TagsOutlined /> },
          { key: "/calculator", label: "Máy tính", icon: <CalculatorOutlined /> },
          { key: "/about", label: "Thông tin", icon: <InfoCircleOutlined /> },
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 14,
              padding: "12px 6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              color: "#475569",
            }}
          >
            <span style={{ fontSize: 17 }}>{item.icon}</span>
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <SaleDetailModal
        sale={detailSale}
        open={!!detailSale}
        onClose={() => setDetailSale(null)}
        products={products}
      />
    </div>
  );
};

export default Home;
