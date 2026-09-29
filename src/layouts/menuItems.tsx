import type { ReactNode } from "react";
import {
  HomeOutlined,
  ShoppingOutlined,
  TagsOutlined,
  ImportOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CalculatorOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  ContactsOutlined,
  WalletOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

export interface MenuItem {
  key: string;
  icon: ReactNode;
  label: string;
}

/**
 * Toàn bộ mục điều hướng chính, dùng cho sidebar desktop.
 * 4 mục đầu là các tính năng dùng nhiều nhất hàng ngày (Trang chủ, Bán hàng, Sản phẩm,
 * Nhập hàng) - cũng chính là 4 mục hiển thị ở bottom nav mobile.
 * Lưu ý: "Điều chỉnh tồn kho" đã gộp vào "Nhập hàng" (chọn chế độ Nhập lẻ/Theo thùng ngay
 * trong phiếu nhập), không còn là tính năng riêng ở trang Sản phẩm nữa.
 * "Lịch sử giao dịch" KHÔNG nằm trong menu chính - vào từ nút trong trang Bán hàng.
 * "Bảo mật" (khoá PIN) cũng không nằm trong menu chính - vào từ nút cài đặt ở Trang chủ.
 */
export const menuItems: MenuItem[] = [
  { key: "/", icon: <HomeOutlined />, label: "Trang chủ" },
  { key: "/sales", icon: <ShoppingCartOutlined />, label: "Bán hàng" },
  { key: "/products", icon: <ShoppingOutlined />, label: "Sản phẩm" },
  { key: "/purchases", icon: <ImportOutlined />, label: "Nhập hàng" },
  { key: "/categories", icon: <TagsOutlined />, label: "Danh mục" },
  { key: "/debts", icon: <UserOutlined />, label: "Công nợ" },
  { key: "/suppliers", icon: <ContactsOutlined />, label: "Nhà cung cấp" },
  { key: "/expenses", icon: <WalletOutlined />, label: "Chi phí" },
  { key: "/statistics", icon: <BarChartOutlined />, label: "Thống kê" },
  { key: "/calculator", icon: <CalculatorOutlined />, label: "Máy tính" },
  { key: "/data", icon: <DatabaseOutlined />, label: "Dữ liệu" },
  { key: "/about", icon: <InfoCircleOutlined />, label: "Thông tin" },
];

/** Tiêu đề cho các trang thuộc menu chính */
export const pageTitles: Record<string, string> = Object.fromEntries(
  menuItems.map((m) => [m.key, m.label])
);

/** Tiêu đề cho các trang phụ, không nằm trong menu chính (có nút back riêng) */
export const subPageTitles: Record<string, string> = {
  "/sales/history": "Lịch sử giao dịch",
  "/security": "Bảo mật",
  "/notifications": "Thông báo",
};

/**
 * Bottom navigation mobile: 4 tính năng chính dùng nhiều nhất hàng ngày + 1 nút "Thêm"
 * mở bottom sheet chứa các mục còn lại (Danh mục, Công nợ, Nhà cung cấp, Chi phí, Thống kê,
 * Máy tính, Dữ liệu, Thông tin).
 */
const MOBILE_PRIMARY_KEYS = ["/", "/sales", "/products", "/purchases"];

export const mobilePrimaryItems: MenuItem[] = MOBILE_PRIMARY_KEYS.map(
  (key) => menuItems.find((m) => m.key === key)!
);

export const mobileMoreItems: MenuItem[] = menuItems.filter(
  (m) => !MOBILE_PRIMARY_KEYS.includes(m.key)
);
