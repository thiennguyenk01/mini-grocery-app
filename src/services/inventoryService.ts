/**
 * Business Logic layer cho các thao tác THAY ĐỔI TỒN KHO (Purchase/Sale/Adjustment).
 *
 * Đây là các HÀM THUẦN (pure function) - không đọc/ghi localStorage, không gọi setState.
 * `AppDataContext.tsx` (Application layer) gọi các hàm này rồi mới `setProducts`/lưu
 * `StockMovement` trả về. Tách riêng như vậy để:
 * 1. Logic nghiệp vụ (tính COGS, trừ kho theo FEFO, tạo movement) có thể unit-test độc lập,
 *    không phụ thuộc React.
 * 2. Sau này thay `localStorage` bằng SQLite/API thật, chỉ cần viết lại phần
 *    đọc/ghi trong AppDataContext - toàn bộ công thức tính toán ở đây GIỮ NGUYÊN.
 *
 * Mọi thay đổi `stock` đều đi qua đây và luôn trả kèm 1 `StockMovement` mô tả đúng biến động -
 * tuyệt đối không có chỗ nào khác trong app được phép sửa thẳng `product.stock`.
 */
import dayjs from "dayjs";
import type { Product, ProductBatch, StockMovement } from "../types";
import { deductFromBatches, nearestExpiry } from "../utils/batches";

/** StockMovement chưa có id/createdAt - do AppDataContext gán (dùng chung bộ đếm id). */
export type NewStockMovement = Omit<StockMovement, "id" | "createdAt">;

export interface PurchaseLineInput {
  quantity: number;
  unitCost: number; // đơn giá vốn của dòng này (đã suy ra từ tổng tiền / số lượng)
  expiryDate?: string;
  barcode?: string;
  supplierId?: string;
}

/** Áp dụng 1 hoặc nhiều dòng nhập hàng (cùng 1 sản phẩm, trong cùng 1 phiếu nhập) vào Product. */
export function applyPurchaseLines(
  product: Product,
  lines: PurchaseLineInput[],
  makeBatchId: () => string
): { product: Product; movement: NewStockMovement } {
  const newBatches: ProductBatch[] = lines.map((l) => ({
    id: makeBatchId(),
    barcode: l.barcode,
    quantity: l.quantity,
    expiryDate: l.expiryDate,
    unitCost: l.unitCost,
    receivedAt: dayjs().toISOString(),
    supplierId: l.supplierId,
  }));
  const batches = [...(product.batches || []), ...newBatches];
  const addedQty = lines.reduce((sum, l) => sum + l.quantity, 0);
  const beforeStock = product.stock;
  const afterStock = beforeStock + addedQty;
  const lastUnitCost = lines[lines.length - 1].unitCost;

  return {
    product: {
      ...product,
      stock: afterStock,
      purchasePrice: lastUnitCost,
      batches,
      expiryDate: nearestExpiry(batches) ?? product.expiryDate,
    },
    movement: {
      productId: product.id,
      type: "PURCHASE",
      quantity: addedQty,
      beforeStock,
      afterStock,
    },
  };
}

export interface SaleDeductionResult {
  product: Product;
  movement: NewStockMovement;
  /** Giá vốn đã "chốt" cho dòng bán này - lưu vào SaleItem để báo cáo lợi nhuận không đổi
   *  theo thời gian dù giá nhập hiện tại của sản phẩm sau này thay đổi. */
  costInfo: { batchId?: string; unitCost: number; costOfGoodsSold: number };
}

/** Trừ tồn kho khi bán hàng - ưu tiên theo lô (FEFO) nếu sản phẩm có theo dõi lô, tính kèm COGS. */
export function applySaleDeduction(
  product: Product,
  quantity: number,
  preferredBatchId: string | undefined
): SaleDeductionResult {
  const beforeStock = product.stock;
  const afterStock = Math.max(0, beforeStock - quantity);

  if (product.batches && product.batches.length > 0) {
    const { batches, consumed } = deductFromBatches(product.batches, quantity, preferredBatchId);
    const costOfGoodsSold = consumed.reduce((sum, c) => sum + c.quantity * c.unitCost, 0);
    const unitCost = quantity > 0 ? costOfGoodsSold / quantity : 0;
    return {
      product: { ...product, batches, stock: afterStock, expiryDate: nearestExpiry(batches) },
      movement: { productId: product.id, type: "SALE", quantity: -quantity, beforeStock, afterStock },
      costInfo: { batchId: consumed[0]?.batchId, unitCost, costOfGoodsSold },
    };
  }

  // Sản phẩm chưa từng nhập qua tính năng lô hàng -> dùng giá nhập hiện tại làm giá vốn ước tính
  // (không có batch nào để lấy giá vốn "chốt tại thời điểm nhập" chính xác hơn).
  const unitCost = product.purchasePrice;
  return {
    product: { ...product, stock: afterStock },
    movement: { productId: product.id, type: "SALE", quantity: -quantity, beforeStock, afterStock },
    costInfo: { unitCost, costOfGoodsSold: unitCost * quantity },
  };
}

/** Ghi nhận hàng bị mất khỏi tồn kho (hư hỏng/hết hạn/thất thoát...) - trừ theo lô (FEFO) nếu
 *  sản phẩm có theo dõi lô, giống cách bán hàng trừ kho, nhưng KHÔNG tạo SaleItem/doanh thu gì. */
export function applyLoss(
  product: Product,
  quantity: number,
  movementType: StockMovement["type"],
  reason: string
): { product: Product; movement: NewStockMovement } {
  const beforeStock = product.stock;
  const afterStock = Math.max(0, beforeStock - quantity);

  if (product.batches && product.batches.length > 0) {
    const { batches } = deductFromBatches(product.batches, quantity, undefined);
    return {
      product: { ...product, batches, stock: afterStock, expiryDate: nearestExpiry(batches) },
      movement: { productId: product.id, type: movementType, quantity: -quantity, beforeStock, afterStock, reason },
    };
  }

  return {
    product: { ...product, stock: afterStock },
    movement: { productId: product.id, type: movementType, quantity: -quantity, beforeStock, afterStock, reason },
  };
}

/** Điều chỉnh tồn kho thủ công (kiểm kho, sửa sai...) - luôn kèm lý do + tạo StockMovement. */
export function applyAdjustment(
  product: Product,
  newStock: number,
  reason?: string
): { product: Product; movement: NewStockMovement } {
  const beforeStock = product.stock;
  const afterStock = Math.max(0, newStock);
  return {
    product: { ...product, stock: afterStock },
    movement: {
      productId: product.id,
      type: "ADJUSTMENT",
      quantity: afterStock - beforeStock,
      beforeStock,
      afterStock,
      reason,
    },
  };
}
