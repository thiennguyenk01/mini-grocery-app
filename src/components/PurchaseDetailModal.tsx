import React from "react";
import { Table, Descriptions } from "antd";
import dayjs from "dayjs";
import type { Product, Purchase } from "../types";
import { formatVND } from "../utils/format";
import { getProductImage } from "../utils/avatar";
import ResponsiveModal from "./ResponsiveModal";
import MobileRow from "./MobileRow";
import { useIsMobile } from "../hooks/useIsMobile";

interface PurchaseDetailModalProps {
  purchase: Purchase | null;
  open: boolean;
  onClose: () => void;
  products: Product[];
}

const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  purchase,
  open,
  onClose,
  products,
}) => {
  const isMobile = useIsMobile();
  const productMap = React.useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  return (
    <ResponsiveModal
      title={purchase ? `Chi tiết phiếu nhập ${purchase.code}` : "Chi tiết phiếu nhập"}
      open={open}
      onClose={onClose}
      width={640}
      destroyOnHidden
    >
      {purchase && (
        <>
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Mã phiếu">{purchase.code}</Descriptions.Item>
            <Descriptions.Item label="Ngày nhập">
              {dayjs(purchase.date).format("HH:mm DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Số mặt hàng" span={2}>
              {purchase.items.length}
            </Descriptions.Item>
          </Descriptions>

          {isMobile ? (
            <div>
              {purchase.items.map((it, idx) => {
                const p = productMap[it.productId];
                return (
                  <MobileRow
                    key={idx}
                    leading={
                      <img
                        src={getProductImage(p?.name ?? "?", p?.image)}
                        alt={p?.name ?? "?"}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
                      />
                    }
                    title={p?.name ?? "Sản phẩm đã xóa"}
                    subtitle={`${formatVND(it.purchasePrice)} x ${it.quantity}`}
                    trailing={formatVND(it.purchasePrice * it.quantity)}
                  />
                );
              })}
            </div>
          ) : (
            <Table
              rowKey={(_, idx) => String(idx)}
              dataSource={purchase.items}
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Sản phẩm",
                  render: (_, it) => {
                    const p = productMap[it.productId];
                    return (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img
                          src={getProductImage(p?.name ?? "?", p?.image)}
                          alt={p?.name ?? "?"}
                          style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }}
                        />
                        {p?.name ?? "Sản phẩm đã xóa"}
                      </span>
                    );
                  },
                },
                { title: "Giá nhập", dataIndex: "purchasePrice", render: formatVND, align: "right" },
                { title: "SL", dataIndex: "quantity", align: "right" },
                {
                  title: "Thành tiền",
                  align: "right",
                  render: (_, it) => formatVND(it.purchasePrice * it.quantity),
                },
              ]}
            />
          )}

          <div
            style={{
              textAlign: "right",
              fontWeight: 700,
              fontSize: 16,
              marginTop: 16,
              color: "#147f27",
            }}
          >
            Tổng tiền: {formatVND(purchase.total)}
          </div>
        </>
      )}
    </ResponsiveModal>
  );
};

export default PurchaseDetailModal;
