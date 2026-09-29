import dayjs from "dayjs";
import type { Product } from "../types";

/**
 * Vá dữ liệu `ProductBatch` cũ (tạo trước khi có field `unitCost`/`receivedAt`) để tính năng
 * COGS/Batch Cost hoạt động đúng ngay cả với dữ liệu đã lưu từ trước.
 *
 * Nguyên tắc migration (mục 22 trong spec): KHÔNG xóa/reset dữ liệu người dùng chỉ vì update
 * app - chỉ điền giá trị mặc định hợp lý cho field còn thiếu, giữ nguyên mọi thứ khác.
 * - `unitCost` thiếu -> lấy tạm `product.purchasePrice` hiện tại (ước lượng tốt nhất có thể,
 *   vì dữ liệu cũ không lưu giá vốn riêng theo từng lô).
 * - `receivedAt` thiếu -> dùng thời điểm chạy migration (không có dữ liệu gốc để suy ra chính
 *   xác ngày nhập, nhưng field này chỉ mang tính tham khảo, không ảnh hưởng FEFO/COGS).
 *
 * Chạy 1 lần khi khởi tạo state `products` trong `AppDataContext` (không sửa dữ liệu trong
 * `localStorage` cho tới khi có thay đổi thật, tại đó `useEffect` lưu lại sẽ tự ghi đè bằng
 * bản đã migrate).
 */
export function migrateProducts(products: Product[]): Product[] {
  return products.map((p) => {
    if (!p.batches || p.batches.length === 0) return p;

    let changed = false;
    const batches = p.batches.map((b) => {
      // Dùng `as any` để đọc field có thể KHÔNG tồn tại trên dữ liệu cũ (trước khi có type mới).

      const legacy = b as unknown as { unitCost?: number; receivedAt?: string };
      if (legacy.unitCost != null && legacy.receivedAt) return b;
      changed = true;
      return {
        ...b,
        unitCost: legacy.unitCost ?? p.purchasePrice ?? 0,
        receivedAt: legacy.receivedAt ?? dayjs().toISOString(),
      };
    });

    return changed ? { ...p, batches } : p;
  });
}
