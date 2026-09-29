import React from "react";
import { Input, Badge } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface SearchBarProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  size?: "large" | "middle";
  /** Icon bên trong ô input, mặc định là kính lúp tìm kiếm - đổi thành icon khác (vd mã vạch)
   *  khi tái dùng component này cho mục đích không phải tìm kiếm. */
  icon?: React.ReactNode;
  /** 1 hoặc nhiều nút hành động (lọc, quét mã...) hiện bên phải ô tìm kiếm. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Ô nhập kiểu "pill" bo tròn đều, nền xám nhạt thay vì viền đen cứng như Input mặc định - đi
 * kèm các nút hành động hình vuông/pill bo góc, nền tint xanh nhạt, CÙNG CHIỀU CAO với ô nhập
 * (dùng chung `height`) để không bị lệch/không cân bằng. Ban đầu chỉ dùng cho tìm kiếm, nay
 * cũng được tái dùng cho các ô "nhập tay hoặc quét mã vạch" (Purchases) để đồng bộ giao diện.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  size = "large",
  icon,
  actions,
  style,
}) => {
  const height = size === "large" ? 48 : 40;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        allowClear
        size={size}
        prefix={icon ?? <SearchOutlined style={{ color: "#9ca3af", marginRight: 4 }} />}
        style={{
          height,
          borderRadius: height / 2,
          background: "#f3f4f2",
          border: "1px solid transparent",
          flex: 1,
        }}
        variant="borderless"
      />
      {actions}
    </div>
  );
};

export default SearchBar;

/** Nút hành động hình vuông bo góc đi kèm SearchBar (lọc, quét mã...) - luôn cùng chiều cao ô tìm kiếm. */
export const SearchActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  size?: "large" | "middle";
  badgeCount?: number;
  label?: string;
}> = ({ icon, onClick, size = "large", badgeCount, label }) => {
  const dim = size === "large" ? 48 : 40;
  const btn = (
    <button
      onClick={onClick}
      style={{
        width: label ? undefined : dim,
        height: dim,
        padding: label ? "0 16px" : 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        flexShrink: 0,
        borderRadius: dim / 2,
        border: "none",
        background: "#e6f4ea",
        color: "#147f27",
        fontSize: size === "large" ? 18 : 16,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {icon}
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
    </button>
  );
  if (badgeCount !== undefined) {
    return (
      <Badge count={badgeCount} size="small" offset={[-4, 4]}>
        {btn}
      </Badge>
    );
  }
  return btn;
};
