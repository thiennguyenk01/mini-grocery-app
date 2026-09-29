import React, { useMemo, useState } from "react";
import { Card, Table, Tag, Button } from "antd";
import dayjs from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { formatVND } from "../utils/format";
import { useIsMobile } from "../hooks/useIsMobile";
import DateGroupedList from "../components/DateGroupedList";
import SaleDetailModal from "../components/SaleDetailModal";
import type { PaymentMethod, Sale } from "../types";

const TransactionHistory: React.FC = () => {
  const { sales, products } = useAppData();
  const isMobile = useIsMobile();
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  // Dữ liệu trong context đã luôn ở dạng mới nhất trước (unshift khi tạo đơn),
  // sort lại 1 lần nữa cho chắc chắn nếu sau này nguồn dữ liệu thay đổi.
  const sortedSales = useMemo(
    () => [...sales].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()),
    [sales]
  );

  return (
    <>
      <Card title="Lịch sử giao dịch" className="page-card">
        {isMobile ? (
          <DateGroupedList
            items={sortedSales}
            getDate={(s) => s.date}
            emptyText="Chưa có giao dịch nào"
            renderItem={(s) => (
              <div
                onClick={() => setDetailSale(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 0",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "#1f2933" }}>
                  <b>{dayjs(s.date).format("HH:mm")}</b>{" "}
                  <span style={{ color: "#374151" }}>{s.code}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag color={s.paymentMethod === "cash" ? "green" : "blue"} style={{ marginRight: 0 }}>
                    {s.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
                  </Tag>
                  <b>{formatVND(s.total)}</b>
                </span>
              </div>
            )}
          />
        ) : (
          <Table
            rowKey="id"
            dataSource={sortedSales}
            columns={[
              {
                title: "Mã đơn",
                dataIndex: "code",
                render: (code, r) => (
                  <Button type="link" style={{ padding: 0 }} onClick={() => setDetailSale(r)}>
                    {code}
                  </Button>
                ),
              },
              { title: "Thời gian", dataIndex: "date", render: (d) => dayjs(d).format("HH:mm DD/MM/YYYY") },
              { title: "Số mặt hàng", render: (_, r) => r.items.length },
              {
                title: "Thanh toán",
                dataIndex: "paymentMethod",
                render: (m: PaymentMethod) => (
                  <Tag color={m === "cash" ? "green" : "blue"}>
                    {m === "cash" ? "Tiền mặt" : "Chuyển khoản"}
                  </Tag>
                ),
              },
              { title: "Tổng tiền", dataIndex: "total", render: formatVND, align: "right" },
            ]}
          />
        )}
      </Card>

      <SaleDetailModal
        sale={detailSale}
        open={!!detailSale}
        onClose={() => setDetailSale(null)}
        products={products}
      />
    </>
  );
};

export default TransactionHistory;
