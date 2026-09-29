/**
 * Engine phân tích tồn kho/doanh thu THUẦN, chạy 100% OFFLINE (không gọi API/internet nào).
 * Trước đây phục vụ trang "Trợ lý AI" (đã bị xóa theo yêu cầu người dùng) - nay chỉ còn được
 * dùng làm nền cho Trung tâm thông báo (`notificationService.ts`) và thẻ doanh thu ở Trang chủ.
 * Giữ lại các hàm này vì vẫn còn nơi khác phụ thuộc, không phải "tính năng AI" độc lập nữa.
 */
import dayjs from "dayjs";
import type { Product, Sale } from "../types";
import { daysUntilExpiry, EXPIRY_WARNING_DAYS } from "./expiry";

/** Doanh thu hôm nay so với hôm qua - tăng/giảm bao nhiêu %. */
export function getRevenueTrend(sales: Sale[]) {
  const today = sales
    .filter((s) => dayjs(s.date).isSame(dayjs(), "day"))
    .reduce((sum, s) => sum + s.total, 0);
  const yesterday = sales
    .filter((s) => dayjs(s.date).isSame(dayjs().subtract(1, "day"), "day"))
    .reduce((sum, s) => sum + s.total, 0);

  let percent: number | null = null;
  if (yesterday > 0) percent = Math.round(((today - yesterday) / yesterday) * 100);
  else if (today > 0) percent = 100;

  return { today, yesterday, percent };
}

/** Sản phẩm bán chậm/không bán được trong 30 ngày qua nhưng vẫn còn tồn nhiều - gợi ý xả hàng. */
export function getSlowMovingProducts(products: Product[], sales: Sale[]) {
  const since = dayjs().subtract(30, "day");
  const soldMap = new Map<string, number>();
  sales
    .filter((s) => dayjs(s.date).isAfter(since))
    .forEach((s) =>
      s.items.forEach((it) => soldMap.set(it.productId, (soldMap.get(it.productId) ?? 0) + it.quantity))
    );
  return products.filter((p) => p.stock >= p.lowStockThreshold && (soldMap.get(p.id) ?? 0) === 0);
}

export interface ExpiryRiskItem {
  product: Product;
  daysLeft: number;
  velocityPerDay: number;
  /** Số lượng dự kiến CÒN TỒN khi tới hạn = stock - (velocity × số ngày còn lại), tối thiểu 0.
   *  `null` = chưa đủ dữ liệu bán 14 ngày qua để dự đoán (không tự bịa ra 1 con số ở đây). */
  projectedRemaining: number | null;
}

/** Kết hợp HSD + tồn kho + tốc độ bán 14 ngày gần nhất - dùng để cảnh báo nguy cơ tồn hàng khi
 *  hết hạn (Notification Center). Chỉ xét sản phẩm trong ngưỡng cảnh báo HSD và chưa hết hạn. */
export function getExpiryRisks(products: Product[], sales: Sale[]): ExpiryRiskItem[] {
  const since = dayjs().subtract(14, "day");
  const soldMap = new Map<string, number>();
  sales
    .filter((s) => dayjs(s.date).isAfter(since))
    .forEach((s) =>
      s.items.forEach((it) => soldMap.set(it.productId, (soldMap.get(it.productId) ?? 0) + it.quantity))
    );

  return products
    .filter((p) => !!p.expiryDate)
    .map((p) => {
      const daysLeft = daysUntilExpiry(p.expiryDate)!;
      const sold14 = soldMap.get(p.id) ?? 0;
      const velocityPerDay = sold14 / 14;
      const projectedRemaining =
        velocityPerDay > 0 ? Math.max(0, Math.round(p.stock - velocityPerDay * Math.max(daysLeft, 0))) : null;
      return { product: p, daysLeft, velocityPerDay, projectedRemaining };
    })
    .filter((x) => x.daysLeft >= 0 && x.daysLeft <= EXPIRY_WARNING_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export type StockHealthLevel = "CRITICAL" | "LOW" | "NORMAL" | "OVERSTOCK" | "INSUFFICIENT_DATA";

export interface StockHealthItem {
  product: Product;
  velocityPerDay: number;
  daysUntilStockout: number | null;
  level: StockHealthLevel;
}

const STOCKOUT_THRESHOLD_DAYS = { CRITICAL: 3, LOW: 7, NORMAL: 30 };

/** Phân loại từng sản phẩm theo daysUntilStockout = tồn kho / tốc độ bán 14 ngày gần nhất -
 *  dùng để phát hiện sản phẩm CRITICAL (báo Notification Center). */
export function getStockHealth(products: Product[], sales: Sale[]): StockHealthItem[] {
  const since = dayjs().subtract(14, "day");
  const soldMap = new Map<string, number>();
  sales
    .filter((s) => dayjs(s.date).isAfter(since))
    .forEach((s) =>
      s.items.forEach((it) => soldMap.set(it.productId, (soldMap.get(it.productId) ?? 0) + it.quantity))
    );

  return products.map((p) => {
    const sold14 = soldMap.get(p.id) ?? 0;
    const velocityPerDay = sold14 / 14;

    if (p.stock === 0) {
      return { product: p, velocityPerDay, daysUntilStockout: 0, level: "CRITICAL" as StockHealthLevel };
    }
    if (velocityPerDay === 0) {
      return { product: p, velocityPerDay, daysUntilStockout: null, level: "INSUFFICIENT_DATA" as StockHealthLevel };
    }

    const daysUntilStockout = p.stock / velocityPerDay;
    let level: StockHealthLevel;
    if (daysUntilStockout <= STOCKOUT_THRESHOLD_DAYS.CRITICAL) level = "CRITICAL";
    else if (daysUntilStockout <= STOCKOUT_THRESHOLD_DAYS.LOW) level = "LOW";
    else if (daysUntilStockout <= STOCKOUT_THRESHOLD_DAYS.NORMAL) level = "NORMAL";
    else level = "OVERSTOCK";

    return { product: p, velocityPerDay, daysUntilStockout, level };
  });
}
