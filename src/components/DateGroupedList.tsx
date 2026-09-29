import React, { useMemo } from "react";
import dayjs from "dayjs";

interface DateGroupedListProps<T> {
  items: T[];
  getDate: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  emptyText?: string;
}

/**
 * Nhóm danh sách theo ngày (mới nhất trước), mỗi ngày bọc trong 1 khung viền
 * riêng để dễ phân biệt ngày này với ngày khác, kiểu:
 *
 * ┌─────────────────────────┐
 * │ 20/09/2026               │
 * ├─────────────────────────┤
 * │ 18:16   HD006      ...   │
 * │ 11:05   HD003      ...   │
 * └─────────────────────────┘
 * ┌─────────────────────────┐
 * │ 19/09/2026               │
 * ├─────────────────────────┤
 * │ 15:12   HD004      ...   │
 * └─────────────────────────┘
 *
 * Giả định `items` đã được sắp xếp mới nhất trước; hàm chỉ gom nhóm, không sort lại.
 */
function DateGroupedList<T>({ items, getDate, renderItem, emptyText }: DateGroupedListProps<T>) {
  const groups = useMemo(() => {
    const map = new Map<string, T[]>();
    items.forEach((item) => {
      const key = dayjs(getDate(item)).format("DD/MM/YYYY");
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    });
    return Array.from(map.entries());
  }, [items, getDate]);

  if (items.length === 0) {
    return <div style={{ textAlign: "center", color: "#8c8c8c", padding: "24px 0" }}>{emptyText}</div>;
  }

  return (
    <div>
      {groups.map(([dateLabel, groupItems]) => (
        <div
          key={dateLabel}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            marginBottom: 14,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            style={{
              background: "#f9fafb",
              padding: "9px 14px",
              fontWeight: 700,
              fontSize: 13,
              color: "#374151",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            {dateLabel}
          </div>
          <div style={{ padding: "2px 14px" }}>
            {groupItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  borderBottom: idx < groupItems.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                {renderItem(item)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DateGroupedList;
