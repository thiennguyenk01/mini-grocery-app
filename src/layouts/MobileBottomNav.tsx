import React, { useState } from "react";
import { Drawer, Modal } from "antd";
import { MoreOutlined, ReloadOutlined, ClearOutlined, RightOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import type { MenuItem } from "./menuItems";

interface MobileBottomNavProps {
  primaryItems: MenuItem[];
  moreItems: MenuItem[];
  onResetSampleData: () => void;
  onResetAllData: () => void;
}

const NAV_ITEM_STYLE: React.CSSProperties = {
  flex: "1 0 0",
  minWidth: 60,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  padding: "8px 4px 6px",
  border: "none",
  background: "transparent",
  fontSize: 11,
  lineHeight: 1.2,
  cursor: "pointer",
};

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  primaryItems,
  moreItems,
  onResetSampleData,
  onResetAllData,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isInMore = moreItems.some((m) => m.key === location.pathname);

  const confirmResetSample = () => {
    setMoreOpen(false);
    Modal.confirm({
      title: "Đặt lại dữ liệu mẫu?",
      content:
        "Toàn bộ sản phẩm, đơn bán, phiếu nhập, công nợ đã lưu sẽ bị xóa và thay bằng dữ liệu mẫu ban đầu. Không thể hoàn tác.",
      okText: "Đặt lại",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: onResetSampleData,
    });
  };

  const confirmResetAll = () => {
    setMoreOpen(false);
    Modal.confirm({
      title: "Đặt lại toàn bộ - Xóa trắng dữ liệu?",
      content:
        "Toàn bộ sản phẩm, danh mục, đơn bán, phiếu nhập, công nợ sẽ bị XÓA HẾT (không còn dữ liệu mẫu). Dùng khi bạn muốn bắt đầu nhập dữ liệu thật từ đầu. Không thể hoàn tác.",
      okText: "Xóa hết",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: onResetAllData,
    });
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          display: "flex",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {primaryItems.map((item) => {
          const active = location.pathname === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{ ...NAV_ITEM_STYLE, color: active ? "#147f27" : "#8c8c8c" }}
            >
              <span style={{ fontSize: 21, display: "flex" }}>{item.icon}</span>
              <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          style={{ ...NAV_ITEM_STYLE, color: isInMore ? "#147f27" : "#8c8c8c" }}
        >
          <span style={{ fontSize: 21, display: "flex" }}>
            <MoreOutlined />
          </span>
          <span>Thêm</span>
        </button>
      </nav>

      <Drawer
        title="Thêm"
        placement="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        height="auto"
        styles={{
          content: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
          body: { padding: "8px 0 max(12px, env(safe-area-inset-bottom, 12px))" },
        }}
      >
        {moreItems.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              setMoreOpen(false);
              navigate(item.key);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 20px",
              fontSize: 16,
              color: location.pathname === item.key ? "#147f27" : "#1f2933",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <RightOutlined style={{ color: "#bfbfbf", fontSize: 12 }} />
          </div>
        ))}
        <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 8 }}>
          <div
            onClick={confirmResetSample}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 20px",
              fontSize: 16,
              color: "#8c8c8c",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>
              <ReloadOutlined />
            </span>
            <span style={{ flex: 1 }}>Đặt lại dữ liệu mẫu</span>
          </div>
          <div
            onClick={confirmResetAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 20px",
              fontSize: 16,
              color: "#ef4444",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>
              <ClearOutlined />
            </span>
            <span style={{ flex: 1 }}>Đặt lại toàn bộ (xóa hết)</span>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default MobileBottomNav;
