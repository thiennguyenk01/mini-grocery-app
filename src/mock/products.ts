import type { Product } from "../types";

export const products: Product[] = [
  { id: "p1", code: "SP001", name: "Mì Hảo Hảo", categoryId: "cat2", unit: "gói", purchasePrice: 3500, sellingPrice: 4500, stock: 3, lowStockThreshold: 10 },
  { id: "p2", code: "SP002", name: "Coca Cola", categoryId: "cat1", unit: "chai", purchasePrice: 7000, sellingPrice: 10000, stock: 2, lowStockThreshold: 10 },
  { id: "p3", code: "SP003", name: "Trứng gà", categoryId: "cat5", unit: "quả", purchasePrice: 2800, sellingPrice: 3500, stock: 5, lowStockThreshold: 15 },
  { id: "p4", code: "SP004", name: "Dầu ăn", categoryId: "cat4", unit: "chai", purchasePrice: 38000, sellingPrice: 45000, stock: 1, lowStockThreshold: 5 },
  { id: "p5", code: "SP005", name: "Nước mắm", categoryId: "cat4", unit: "chai", purchasePrice: 25000, sellingPrice: 32000, stock: 18, lowStockThreshold: 5 },
  { id: "p6", code: "SP006", name: "Đường", categoryId: "cat4", unit: "kg", purchasePrice: 18000, sellingPrice: 23000, stock: 22, lowStockThreshold: 5 },
  { id: "p7", code: "SP007", name: "Sữa tươi", categoryId: "cat6", unit: "hộp", purchasePrice: 26000, sellingPrice: 32000, stock: 14, lowStockThreshold: 8 },
  { id: "p8", code: "SP008", name: "Bánh mì", categoryId: "cat3", unit: "ổ", purchasePrice: 5000, sellingPrice: 8000, stock: 20, lowStockThreshold: 10 },
  { id: "p9", code: "SP009", name: "Bánh Oreo", categoryId: "cat3", unit: "gói", purchasePrice: 12000, sellingPrice: 16000, stock: 25, lowStockThreshold: 8 },
  { id: "p10", code: "SP010", name: "Nước suối", categoryId: "cat1", unit: "chai", purchasePrice: 3000, sellingPrice: 5000, stock: 40, lowStockThreshold: 15 },
];

export function getStockStatus(p: Pick<Product, "stock" | "lowStockThreshold">) {
  if (p.stock <= 0) return "out_of_stock" as const;
  if (p.stock <= p.lowStockThreshold) return "low_stock" as const;
  return "in_stock" as const;
}
