import dayjs from "dayjs";

/** Số ngày còn lại tới hạn sử dụng (âm = đã hết hạn). null nếu chưa đặt HSD. */
export function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  return dayjs(expiryDate).startOf("day").diff(dayjs().startOf("day"), "day");
}

/** Sản phẩm được coi là "cần chú ý HSD" khi còn <= số ngày này (hoặc đã hết hạn). */
export const EXPIRY_WARNING_DAYS = 30;
