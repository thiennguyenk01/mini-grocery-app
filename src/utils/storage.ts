/**
 * Helper lưu/đọc dữ liệu xuống localStorage, có prefix + version để sau này
 * đổi cấu trúc dữ liệu (breaking change) chỉ cần tăng STORAGE_VERSION là
 * tự động bỏ qua dữ liệu cũ không tương thích thay vì làm app crash.
 *
 * localStorage hoạt động cả khi chạy trên trình duyệt (npm run dev) lẫn khi
 * đóng gói thành app Android bằng Capacitor (WebView có localStorage riêng,
 * dữ liệu vẫn còn sau khi tắt/mở lại app, chỉ mất khi người dùng xóa dữ liệu
 * app hoặc gỡ cài đặt).
 */

const STORAGE_VERSION = "v1";
const PREFIX = `taphoamini:${STORAGE_VERSION}:`;

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Dữ liệu hỏng/không parse được -> dùng dữ liệu mặc định, không crash app
    return fallback;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ví dụ localStorage đầy hoặc bị chặn (chế độ ẩn danh) -> bỏ qua, không crash
  }
}

export function clearAllState(keys: string[]): void {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // bỏ qua
    }
  });
}
