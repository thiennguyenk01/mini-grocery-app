/**
 * Notification Center - sinh thông báo HOÀN TOÀN LOCAL từ dữ liệu hiện có, không có
 * server/push nào cả. Chỉ tạo thông báo khi 1 RULE THỰC SỰ thỏa điều kiện (không spam theo
 * lịch, không tạo hàng loạt mỗi lần mở app) - xem `dedupKey` trong types/index.ts.
 */
import type { Product, Sale, Debt, AppNotification } from "../types";
import { getStockHealth, getExpiryRisks, getRevenueTrend, getSlowMovingProducts } from "../utils/aiInsights";
import { formatVND } from "../utils/format";

export type NotificationCandidate = Omit<AppNotification, "id" | "createdAt" | "read">;

/** Ngưỡng % thay đổi doanh thu mới đáng để thông báo - tránh spam mỗi khi nhích 1-2%. */
const REVENUE_TREND_THRESHOLD_PERCENT = 20;

export function generateNotificationCandidates(
  products: Product[],
  sales: Sale[],
  debts: Debt[]
): NotificationCandidate[] {
  const candidates: NotificationCandidate[] = [];

  const criticalStock = getStockHealth(products, sales).filter((h) => h.level === "CRITICAL");
  if (criticalStock.length > 0) {
    candidates.push({
      type: "LOW_STOCK",
      severity: "CRITICAL",
      title: `${criticalStock.length} sản phẩm sắp/đã hết hàng`,
      message: criticalStock
        .slice(0, 3)
        .map((h) => h.product.name)
        .join(", "),
      dedupKey: "low-stock-critical",
      actionRoute: "/products",
    });
  }

  const expiryRisks = getExpiryRisks(products, sales);
  if (expiryRisks.length > 0) {
    candidates.push({
      type: "EXPIRY",
      severity: expiryRisks.some((r) => r.daysLeft <= 0) ? "CRITICAL" : "WARNING",
      title: `${expiryRisks.length} sản phẩm sắp hết hạn`,
      message: expiryRisks
        .slice(0, 3)
        .map((r) => `${r.product.name} (còn ${r.daysLeft} ngày)`)
        .join(", "),
      dedupKey: "expiry-warning",
      actionRoute: "/ai-insights",
    });
  }

  const totalOutstandingDebt = debts.reduce((sum, d) => sum + Math.max(0, d.totalPurchase - d.totalPaid), 0);
  if (totalOutstandingDebt > 0) {
    candidates.push({
      type: "DEBT",
      severity: "INFO",
      title: "Có công nợ chưa thu",
      message: `Tổng dư nợ hiện tại: ${formatVND(totalOutstandingDebt)}`,
      dedupKey: "debt-outstanding",
      actionRoute: "/debts",
    });
  }

  const trend = getRevenueTrend(sales);
  if (trend.percent !== null && Math.abs(trend.percent) >= REVENUE_TREND_THRESHOLD_PERCENT) {
    candidates.push({
      type: "REVENUE",
      severity: "INFO",
      title: trend.percent >= 0 ? "Doanh thu hôm nay tăng mạnh" : "Doanh thu hôm nay giảm mạnh",
      message: `${formatVND(trend.today)} (${trend.percent >= 0 ? "+" : ""}${trend.percent}% so với hôm qua)`,
      dedupKey: `revenue-trend-${new Date().toDateString()}`,
      actionRoute: "/statistics",
    });
  }

  const slowMoving = getSlowMovingProducts(products, sales);
  if (slowMoving.length > 0) {
    candidates.push({
      type: "AI",
      severity: "INFO",
      title: `${slowMoving.length} sản phẩm bán chậm`,
      message: `${slowMoving.slice(0, 3).map((p) => p.name).join(", ")} còn tồn nhiều nhưng chưa bán được gần đây.`,
      dedupKey: "ai-slow-moving",
      actionRoute: "/ai-insights",
    });
  }

  return candidates;
}
