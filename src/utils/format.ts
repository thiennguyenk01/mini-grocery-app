export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + "đ";
}
