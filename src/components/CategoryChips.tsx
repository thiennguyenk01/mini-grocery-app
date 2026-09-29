import React from "react";
import { Tag } from "antd";
import type { Category } from "../types";

interface CategoryChipsProps {
  categories: Category[];
  value: string | null | undefined;
  onChange: (id: string | null | undefined) => void;
  /** Giá trị dùng cho "Tất cả" - Products dùng undefined, Sales dùng null (giữ đúng type cũ của từng trang). */
  allValue?: string | null;
  style?: React.CSSProperties;
}

/**
 * Dải chip chọn danh mục (Tất cả, Nước uống, Mì...) - CẢ chip đã chọn lẫn CHƯA chọn đều có nền
 * (chọn = xanh thương hiệu đậm, chưa chọn = xám nhạt) để trông đồng đều thành 1 dải chip thật
 * sự, thay vì chỉ chip đang chọn có nền còn lại là chữ trơn nổi trên nền trắng.
 */
const CategoryChips: React.FC<CategoryChipsProps> = ({ categories, value, onChange, allValue = undefined, style }) => {
  const ALL = allValue;
  const chipStyle = (checked: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
    border: "none",
    background: checked ? "#147f27" : "#f0f1ef",
    color: checked ? "#fff" : "#4b5563",
  });

  return (
    <div
      data-no-swipe-nav="true"
      style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2, ...style }}
    >
      <Tag.CheckableTag checked={value === ALL} onChange={() => onChange(ALL)} style={chipStyle(value === ALL)}>
        Tất cả
      </Tag.CheckableTag>
      {categories.map((c) => (
        <Tag.CheckableTag
          key={c.id}
          checked={value === c.id}
          onChange={() => onChange(value === c.id ? ALL : c.id)}
          style={chipStyle(value === c.id)}
        >
          {c.name}
        </Tag.CheckableTag>
      ))}
    </div>
  );
};

export default CategoryChips;
