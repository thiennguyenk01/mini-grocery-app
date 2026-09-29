/**
 * Chuyển 1 mảng object thành chuỗi CSV đơn giản (đủ dùng để mở bằng Excel/Google Sheets).
 * `columns` chỉ định rõ cột nào lấy field nào + tiêu đề tiếng Việt - tránh lộ ra các field kỹ
 * thuật (id nội bộ, object lồng nhau...) mà chủ tiệm không cần thấy.
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(","));
  // Thêm BOM (\uFEFF) để Excel mở file tiếng Việt không bị lỗi font.
  return "\uFEFF" + [header, ...lines].join("\r\n");
}
