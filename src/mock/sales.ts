import dayjs from "dayjs";
import type { Sale, SaleItem } from "../types";

function iso(daysAgo: number, hour: number, minute: number) {
  return dayjs().subtract(daysAgo, "day").hour(hour).minute(minute).second(0).toISOString();
}

/** Dữ liệu mẫu không đi qua batch thật -> ước lượng unitCost/costOfGoodsSold từ purchasePrice
 *  mẫu của từng sản phẩm (xem mock/products.ts) để khớp field mới của SaleItem. */
function item(productId: string, quantity: number, sellingPrice: number, unitCost: number): SaleItem {
  return { productId, quantity, sellingPrice, unitCost, costOfGoodsSold: unitCost * quantity };
}

export const sales: Sale[] = [
  {
    id: "s1",
    code: "HD0001",
    date: iso(0, 8, 15),
    items: [item("p1", 5, 4500, 3500), item("p2", 2, 10000, 7000)],
    total: 5 * 4500 + 2 * 10000,
    paymentMethod: "cash",
  },
  {
    id: "s2",
    code: "HD0002",
    date: iso(0, 9, 40),
    items: [item("p8", 3, 8000, 5000)],
    total: 3 * 8000,
    paymentMethod: "transfer",
  },
  {
    id: "s3",
    code: "HD0003",
    date: iso(0, 11, 5),
    items: [item("p3", 10, 3500, 2800), item("p6", 1, 23000, 18000)],
    total: 10 * 3500 + 23000,
    paymentMethod: "cash",
  },
  {
    id: "s4",
    code: "HD0004",
    date: iso(1, 10, 0),
    items: [item("p9", 4, 16000, 12000)],
    total: 4 * 16000,
    paymentMethod: "cash",
  },
  {
    id: "s5",
    code: "HD0005",
    date: iso(2, 14, 20),
    items: [item("p10", 6, 5000, 3000)],
    total: 6 * 5000,
    paymentMethod: "transfer",
  },
];

