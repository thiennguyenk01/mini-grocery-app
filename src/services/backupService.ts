/**
 * Backup / Restore - đóng gói toàn bộ dữ liệu nghiệp vụ thành 1 file JSON và validate lại khi
 * người dùng chọn file để khôi phục. Vì app offline-first (không có server nào giữ hộ dữ liệu),
 * đây là cách duy nhất để người dùng tự sao lưu/chuyển dữ liệu sang máy khác.
 *
 * Nguyên tắc: KHÔNG import file JSON bất kỳ một cách mù quáng - validate version, cấu trúc,
 * kiểu dữ liệu của từng mảng trước khi cho phép ghi đè dữ liệu hiện tại.
 */
import dayjs from "dayjs";
import { BACKUP_VERSION, type BackupData, type BackupPayload } from "../types";

export function createBackup(data: BackupData): BackupPayload {
  return {
    version: BACKUP_VERSION,
    createdAt: dayjs().toISOString(),
    data,
  };
}

export type BackupValidationResult =
  | { valid: true; backup: BackupPayload }
  | { valid: false; error: string };

/** Tên field bắt buộc phải có trên MỖI phần tử của từng mảng - kiểm tra nhanh cấu trúc, không
 *  cần exhaustive (đây là app cá nhân, không cần validate kiểu enterprise). */
const REQUIRED_ARRAY_FIELDS: Record<keyof BackupData, string[]> = {
  products: ["id", "name"],
  categories: ["id", "name"],
  sales: ["id", "items", "total"],
  purchases: ["id", "items", "total"],
  debts: ["id", "customerName"],
  units: [], // mảng string, không phải mảng object
  stockMovements: ["id", "productId", "type"],
  suppliers: ["id", "name"],
  expenses: ["id", "category", "amount"],
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Kiểm tra 1 file JSON do người dùng chọn có đúng là backup của Tạp Hóa Mini không, trước khi
 * cho phép ghi đè dữ liệu hiện tại. Trả về lỗi cụ thể (không chỉ 1 câu chung chung) để người
 * dùng/AI sau này dễ debug nếu file bị lỗi.
 */
export function validateBackup(raw: unknown): BackupValidationResult {
  if (!isPlainObject(raw)) {
    return { valid: false, error: "File backup không hợp lệ." };
  }
  const { version, createdAt, data } = raw as Record<string, unknown>;

  if (typeof version !== "number") {
    return { valid: false, error: "File backup không hợp lệ (thiếu version)." };
  }
  if (version > BACKUP_VERSION) {
    return {
      valid: false,
      error: `File backup được tạo bởi phiên bản app mới hơn (v${version}). Vui lòng cập nhật app trước khi khôi phục.`,
    };
  }
  if (typeof createdAt !== "string" || !dayjs(createdAt).isValid()) {
    return { valid: false, error: "File backup không hợp lệ (thiếu ngày tạo)." };
  }
  if (!isPlainObject(data)) {
    return { valid: false, error: "File backup không hợp lệ (thiếu dữ liệu)." };
  }

  for (const key of Object.keys(REQUIRED_ARRAY_FIELDS) as (keyof BackupData)[]) {
    const arr = (data as Record<string, unknown>)[key];
    if (!Array.isArray(arr)) {
      return { valid: false, error: `File backup không hợp lệ (thiếu mục "${key}").` };
    }
    const requiredFields = REQUIRED_ARRAY_FIELDS[key];
    if (requiredFields.length === 0) continue; // units: mảng string, chỉ cần là mảng
    for (const item of arr) {
      if (!isPlainObject(item) || requiredFields.some((f) => !(f in item))) {
        return { valid: false, error: `File backup không hợp lệ (dữ liệu "${key}" sai cấu trúc).` };
      }
    }
  }

  return { valid: true, backup: raw as unknown as BackupPayload };
}

/** Đọc nội dung 1 file người dùng chọn thành text (dùng cho input type="file"). */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Kích hoạt trình duyệt/WebView tải xuống 1 file text (JSON hoặc CSV). */
export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
