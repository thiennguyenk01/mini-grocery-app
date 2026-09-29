import dayjs from "dayjs";
import type { Purchase } from "../types";

function iso(daysAgo: number) {
  return dayjs().subtract(daysAgo, "day").hour(7).minute(30).toISOString();
}

export const purchases: Purchase[] = [
  {
    id: "pu1",
    code: "PN0001",
    date: iso(3),
    items: [
      { productId: "p1", quantity: 50, purchasePrice: 3500 },
      { productId: "p2", quantity: 24, purchasePrice: 7000 },
    ],
    total: 50 * 3500 + 24 * 7000,
  },
  {
    id: "pu2",
    code: "PN0002",
    date: iso(1),
    items: [{ productId: "p4", quantity: 12, purchasePrice: 38000 }],
    total: 12 * 38000,
  },
];
