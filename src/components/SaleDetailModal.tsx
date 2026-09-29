import React from "react";
import { Table, Tag, Descriptions, Button } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Product, Sale } from "../types";
import { formatVND } from "../utils/format";
import { getProductImage } from "../utils/avatar";
import { downloadReceiptImage } from "../utils/receipt";
import ResponsiveModal from "./ResponsiveModal";
import MobileRow from "./MobileRow";
import { useIsMobile } from "../hooks/useIsMobile";

interface SaleDetailModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
  products: Product[];
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, open, onClose, products }) => {
  const isMobile = useIsMobile();
  const productMap = React.useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products]
  );

  const handleDownloadImage = () => {
    if (!sale) return;
    downloadReceiptImage(sale, products);
  };

  return (
    <ResponsiveModal
      title={sale ? `Chi tiết đơn hàng ${sale.code}` : "Chi tiết đơn hàng"}
      open={open}
      onClose={onClose}
      width={640}
      destroyOnHidden
      footer={
        sale && (
          <Button type="primary" block icon={<PictureOutlined />} onClick={handleDownloadImage}>
            Tải hình ảnh hóa đơn
          </Button>
        )
      }
    >
      {sale && (
        <>
          <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Mã đơn">{sale.code}</Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(sale.date).format("HH:mm DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Thanh toán">
              <Tag color={sale.paymentMethod === "cash" ? "green" : "blue"}>
                {sale.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Số mặt hàng">{sale.items.length}</Descriptions.Item>
          </Descriptions>

          {isMobile ? (
            <div>
              {sale.items.map((it, idx) => {
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
                    subtitle={`${formatVND(it.sellingPrice)} x ${it.quantity}`}
                    trailing={formatVND(it.sellingPrice * it.quantity)}
                  />
                );
              })}
            </div>
          ) : (
            <Table
              rowKey={(_, idx) => String(idx)}
              dataSource={sale.items}
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
                { title: "Đơn giá", dataIndex: "sellingPrice", render: formatVND, align: "right" },
                { title: "SL", dataIndex: "quantity", align: "right" },
                {
                  title: "Thành tiền",
                  align: "right",
                  render: (_, it) => formatVND(it.sellingPrice * it.quantity),
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
            Tổng cộng: {formatVND(sale.total)}
          </div>
        </>
      )}
    </ResponsiveModal>
  );
};

export default SaleDetailModal;
