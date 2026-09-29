import dayjs from "dayjs";
import type { Debt } from "../types";

function iso(daysAgo: number) {
  return dayjs().subtract(daysAgo, "day").toISOString();
}

export const debts: Debt[] = [
  {
    id: "d1",
    customerName: "Nguyễn Văn A",
    phone: "0901 234 567",
    totalPurchase: 500000,
    totalPaid: 300000,
    history: [
      { id: "h1", date: iso(10), amount: 200000, note: "Trả lần 1" },
      { id: "h2", date: iso(4), amount: 100000, note: "Trả lần 2" },
    ],
  },
  {
    id: "d2",
    customerName: "Trần Thị B",
    phone: "0912 345 678",
    totalPurchase: 250000,
    totalPaid: 250000,
    history: [{ id: "h3", date: iso(5), amount: 250000, note: "Trả hết" }],
  },
  {
    id: "d3",
    customerName: "Lê Văn C",
    totalPurchase: 800000,
    totalPaid: 0,
    history: [],
  },
];
