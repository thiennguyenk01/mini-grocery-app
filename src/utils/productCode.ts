import type { Product } from "../types";

export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/** Sinh mã sản phẩm tiếp theo dạng SP001, SP002... dựa trên mã lớn nhất đang có. */
export function nextProductCode(products: Product[]): string {
  const maxNum = products.reduce((max, p) => {
    const match = /^SP(\d+)$/i.exec(p.code.trim());
    if (!match) return max;
    return Math.max(max, parseInt(match[1], 10));
  }, 0);
  return `SP${String(maxNum + 1).padStart(3, "0")}`;
}
