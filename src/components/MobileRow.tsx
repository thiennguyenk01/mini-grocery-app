import React from "react";

interface MobileRowProps {
  onClick?: () => void;
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  trailingSub?: React.ReactNode;
  /** Hàng phụ bên dưới, ví dụ Tag trạng thái hoặc nút hành động */
  extra?: React.ReactNode;
}

/** 1 dòng dạng card dùng thay cho hàng bảng (table row) trên mobile */
const MobileRow: React.FC<MobileRowProps> = ({
  onClick,
  leading,
  title,
  subtitle,
  trailing,
  trailingSub,
  extra,
}) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#fff",
      borderRadius: 14,
      padding: "12px 14px",
      marginBottom: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      cursor: onClick ? "pointer" : "default",
    }}
  >
    {leading && <div style={{ flexShrink: 0 }}>{leading}</div>}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: "#1f2933" }}>{title}</div>
      {subtitle && (
        <div style={{ color: "#8c8c8c", fontSize: 13, marginTop: 2 }}>{subtitle}</div>
      )}
      {extra && <div style={{ marginTop: 8 }}>{extra}</div>}
    </div>
    {(trailing || trailingSub) && (
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        {trailing && <div style={{ fontWeight: 700, fontSize: 15 }}>{trailing}</div>}
        {trailingSub && (
          <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 2 }}>{trailingSub}</div>
        )}
      </div>
    )}
  </div>
);

export default MobileRow;
