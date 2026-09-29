export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Category {
  id: string;
  name: string;
}

export interface ProductBatch {
  id: string;
  barcode?: string; // Mã vạch RIÊNG của lô này (mỗi lô nhập có thể có mã khác nhau)
  quantity: number; // Số lượng còn lại trong lô này
  expiryDate?: string; // Hạn sử dụng riêng của lô này (ISO date, không bắt buộc)
  /** Giá vốn/đơn vị của lô này TẠI THỜI ĐIỂM NHẬP - dùng để tính COGS chính xác theo từng lô,
   *  không đổi dù giá nhập hiện tại của sản phẩm (Product.purchasePrice) sau này thay đổi. */
  unitCost: number;
  /** Thời điểm nhập lô này (ISO). */
  receivedAt: string;
  /** Nhà cung cấp của lô này (không bắt buộc). */
  supplierId?: string;
  /** Số lô/lot number (chưa có UI nhập ở phase này, chuẩn bị sẵn field). */
  lotNumber?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  unit: string; // gói, chai, quả, kg...
  purchasePrice: number;
  sellingPrice: number;
  stock: number; // Tổng tồn kho - luôn bằng tổng quantity của các batches (nếu sản phẩm có theo dõi lô)
  lowStockThreshold: number;
  image?: string; // URL ảnh sản phẩm (không bắt buộc)
  batches?: ProductBatch[]; // Chi tiết từng lô hàng (mã vạch + HSD + số lượng riêng), tạo ra từ Nhập hàng
  expiryDate?: string; // HSD gần nhất trong các lô còn hàng (cache để hiển thị nhanh, tự tính lại mỗi khi batches đổi)
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  purchasePrice: number;
}

export interface Purchase {
  id: string;
  code: string;
  date: string; // ISO
  items: PurchaseItem[];
  total: number;
  /** Nhà cung cấp của phiếu nhập này (không bắt buộc). */
  supplierId?: string;
}

export type PaymentMethod = "cash" | "transfer";

export interface SaleItem {
  productId: string;
  quantity: number;
  sellingPrice: number;
  /** Lô hàng ĐẦU TIÊN bị trừ cho dòng này (tham khảo/hiển thị - nếu bán cắt qua nhiều lô thì
   *  đây là lô ưu tiên ban đầu, giá vốn thực tế đã gộp đủ trong `costOfGoodsSold`). */
  batchId?: string;
  /** Giá vốn bình quân/đơn vị của dòng này TẠI THỜI ĐIỂM BÁN (= costOfGoodsSold / quantity).
   *  Được "chốt" lại lúc bán, không đổi dù Product.purchasePrice sau này thay đổi - đảm bảo
   *  báo cáo lợi nhuận lịch sử không bị sai lệch. */
  unitCost: number;
  /** Tổng giá vốn thực tế của dòng này (có thể gộp từ NHIỀU lô nếu 1 lần bán cắt qua 2 lô). */
  costOfGoodsSold: number;
}

export interface Sale {
  id: string;
  code: string;
  date: string; // ISO
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
}

export interface DebtPayment {
  id: string;
  date: string; // ISO
  amount: number;
  note?: string;
}

export interface Debt {
  id: string;
  customerName: string;
  phone?: string;
  totalPurchase: number;
  totalPaid: number;
  history: DebtPayment[];
}

/**
 * STOCK MOVEMENT / STOCK LEDGER
 * Mọi thay đổi tồn kho (nhập, bán, hư hỏng, hết hạn, điều chỉnh, hoàn trả) đều PHẢI tạo ra 1
 * bản ghi StockMovement - không được sửa thẳng `product.stock` mà không ghi lại lịch sử.
 * `quantity` LUÔN có dấu (+ tăng / - giảm) sao cho `afterStock = beforeStock + quantity` luôn
 * đúng - cộng dồn toàn bộ `quantity` của 1 sản phẩm sẽ ra đúng biến động tồn kho ròng.
 */
export type StockMovementType =
  | "PURCHASE" // Nhập hàng (+)
  | "SALE" // Bán hàng (-)
  | "DAMAGE" // Hư hỏng/vỡ (-)
  | "EXPIRED" // Hết hạn phải bỏ (-)
  | "ADJUSTMENT" // Điều chỉnh sau kiểm kho / sửa tay (+/-)
  | "RETURN"; // Hoàn trả (+)

export interface StockMovement {
  id: string;
  productId: string;
  batchId?: string;
  type: StockMovementType;
  /** Có dấu: dương = tăng tồn, âm = giảm tồn. */
  quantity: number;
  beforeStock: number;
  afterStock: number;
  /** Lý do (bắt buộc có ý nghĩa với DAMAGE/EXPIRED/ADJUSTMENT, ví dụ "Hàng thất lạc"). */
  reason?: string;
  /** id của Sale/Purchase liên quan (nếu có), để truy ngược nguồn gốc thay đổi. */
  referenceId?: string;
  createdAt: string;
}

/** Nhà cung cấp. */
export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | "ELECTRICITY"
  | "WATER"
  | "RENT"
  | "TRANSPORT"
  | "PACKAGING"
  | "REPAIR"
  | "OTHER";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ELECTRICITY: "Tiền điện",
  WATER: "Tiền nước",
  RENT: "Tiền thuê mặt bằng",
  TRANSPORT: "Vận chuyển",
  PACKAGING: "Bao bì/đóng gói",
  REPAIR: "Sửa chữa",
  OTHER: "Khác",
};

/** Chi phí vận hành cửa hàng (không phải giá vốn hàng hóa). */
export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  createdAt: string;
}

/**
 * DAMAGE / EXPIRED / LOSS
 * Lý do cụ thể khi ghi nhận hàng bị mất khỏi tồn kho (không gộp chung hết vào "Điều chỉnh"
 * chung chung) - map sang đúng `StockMovementType` tương ứng khi có (DAMAGED->DAMAGE,
 * EXPIRED->EXPIRED); THẤT THOÁT/KHÁC dùng chung `ADJUSTMENT` (kèm lý do mô tả rõ trong
 * `StockMovement.reason`) vì `StockMovementType` không có type riêng cho 2 trường hợp này.
 */
export type LossReason = "DAMAGED" | "EXPIRED" | "LOST" | "OTHER";

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  DAMAGED: "Hư hỏng",
  EXPIRED: "Hết hạn",
  LOST: "Thất thoát/mất",
  OTHER: "Khác",
};

/**
 * BACKUP / RESTORE
 * Toàn bộ dữ liệu nghiệp vụ của app, đóng gói thành 1 file JSON để người dùng tự lưu giữ
 * (offline-first - không có server nào lưu hộ). `version` để sau này còn biết cách đọc file
 * backup cũ nếu cấu trúc dữ liệu thay đổi.
 */
export const BACKUP_VERSION = 1;

export interface BackupData {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  purchases: Purchase[];
  debts: Debt[];
  units: string[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  expenses: Expense[];
}

export interface BackupPayload {
  version: number;
  createdAt: string;
  data: BackupData;
}

/**
 * NOTIFICATION CENTER
 * Thông báo tạo HOÀN TOÀN LOCAL (không có server/push nào) khi 1 rule thực sự thỏa điều kiện -
 * xem `src/services/notificationService.ts`. `dedupKey` dùng để chống spam: nếu đã có 1 thông
 * báo với cùng `dedupKey` còn tồn tại (chưa bị xóa/dismiss), không tạo thêm bản thứ 2.
 */
export type NotificationType = "LOW_STOCK" | "EXPIRY" | "DEBT" | "REVENUE" | "AI";
export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string;
  actionRoute?: string;
  dedupKey: string;
}
