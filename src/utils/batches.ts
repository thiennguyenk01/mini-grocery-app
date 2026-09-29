import dayjs from "dayjs";
import type { Product, ProductBatch } from "../types";

/** Tìm sản phẩm + lô hàng khớp với 1 mã vạch cụ thể (dùng khi quét mã lúc bán hàng). */
export function findByBarcode(
  products: Product[],
  code: string
): { product: Product; batch: ProductBatch } | null {
  for (const p of products) {
    const batch = p.batches?.find((b) => b.barcode === code);
    if (batch) return { product: p, batch };
  }
  return null;
}

/** HSD gần nhất trong các lô CÒN HÀNG - dùng để cache lại Product.expiryDate mỗi khi batches đổi. */
export function nearestExpiry(batches: ProductBatch[] | undefined): string | undefined {
  const withExpiry = (batches || []).filter((b) => b.quantity > 0 && b.expiryDate);
  if (withExpiry.length === 0) return undefined;
  return [...withExpiry].sort(
    (a, b) => dayjs(a.expiryDate).valueOf() - dayjs(b.expiryDate).valueOf()
  )[0].expiryDate;
}

/** Tổng số lượng còn lại của tất cả các lô. */
export function totalBatchQuantity(batches: ProductBatch[] | undefined): number {
  return (batches || []).reduce((sum, b) => sum + b.quantity, 0);
}

/** Tất cả mã vạch (của các lô còn hàng) của 1 sản phẩm - dùng để hiển thị trong trang Sản phẩm. */
export function getProductBarcodes(product: Product): string[] {
  return (product.batches || [])
    .filter((b) => b.quantity > 0 && b.barcode)
    .map((b) => b.barcode as string);
}

/** Chi tiết 1 lô đã bị trừ trong 1 lần bán - dùng để tính COGS (giá vốn hàng đã bán) chính xác. */
export interface BatchConsumption {
  batchId: string;
  quantity: number;
  unitCost: number;
}

/**
 * Trừ tồn kho theo lô, ưu tiên FEFO (hạn sử dụng gần nhất trước).
 * - Nếu KHÔNG truyền preferredBatchId (bán trực tiếp, không quét mã): trừ theo lô có HSD gần
 *   nhất trước, lô không có HSD coi như hạn xa nhất (trừ sau cùng).
 * - Nếu CÓ preferredBatchId (khách quét đúng mã vạch của 1 lô cụ thể): trừ lô đó TRƯỚC, phần
 *   còn thiếu (nếu số lượng mua nhiều hơn lô đó còn) mới trừ tiếp sang các lô khác theo FEFO.
 * Lô nào bị trừ về 0 sẽ bị loại khỏi danh sách trả về - đồng nghĩa mã vạch riêng của lô đó cũng
 * biến mất theo (đúng yêu cầu "hết hàng tồn kho thì tự xóa mã vạch"), và lô gần hạn tiếp theo
 * (nếu có) sẽ tự động trở thành lô ưu tiên cho lần bán trực tiếp kế tiếp.
 *
 * Trả về thêm `consumed`: danh sách các lô đã thực sự bị trừ + số lượng + unitCost tại lô đó -
 * dùng để tính COGS (giá vốn hàng bán) CHÍNH XÁC theo từng lô, kể cả khi 1 lần bán "cắt" qua 2
 * lô có giá vốn khác nhau (ví dụ lô A còn 3 giá 7.500đ, bán 5 cái -> lấy nốt 3 của lô A + 2 của
 * lô B giá 8.000đ -> COGS = 3*7.500 + 2*8.000, KHÔNG phải 5 * giá 1 lô nào).
 */
export function deductFromBatches(
  batches: ProductBatch[] | undefined,
  quantity: number,
  preferredBatchId?: string
): { batches: ProductBatch[]; consumed: BatchConsumption[] } {
  let remaining = quantity;
  const working = (batches || []).map((b) => ({ ...b }));
  const order = [...working].sort((a, b) => {
    if (preferredBatchId) {
      if (a.id === preferredBatchId) return -1;
      if (b.id === preferredBatchId) return 1;
    }
    const av = a.expiryDate ? dayjs(a.expiryDate).valueOf() : Infinity;
    const bv = b.expiryDate ? dayjs(b.expiryDate).valueOf() : Infinity;
    return av - bv;
  });
  const consumed: BatchConsumption[] = [];
  for (const b of order) {
    if (remaining <= 0) break;
    const take = Math.min(b.quantity, remaining);
    if (take > 0) {
      consumed.push({ batchId: b.id, quantity: take, unitCost: b.unitCost ?? 0 });
      b.quantity -= take;
      remaining -= take;
    }
  }
  return { batches: working.filter((b) => b.quantity > 0), consumed };
}
