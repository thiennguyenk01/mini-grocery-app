import React, { useMemo, useState } from "react";
import { Card, Row, Col, Empty, Button, Radio, notification, Tag, Popconfirm } from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  HistoryOutlined,
  QrcodeOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../store/AppDataContext";
import { formatVND } from "../utils/format";
import { getProductImage } from "../utils/avatar";
import { useIsMobile } from "../hooks/useIsMobile";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { findByBarcode } from "../utils/batches";
import ResponsiveModal from "../components/ResponsiveModal";
import SaleDetailModal from "../components/SaleDetailModal";
import SearchBar, { SearchActionButton } from "../components/SearchBar";
import CategoryChips from "../components/CategoryChips";
import type { PaymentMethod, Sale } from "../types";
import vietqr from "../assets/vietqr.png";

interface CartLine {
  productId: string;
  quantity: number;
  /** Có giá trị khi dòng này được thêm bằng cách quét đúng mã vạch của 1 lô cụ thể. */
  batchId?: string;
}

const Sales: React.FC = () => {
  const { products, categories, checkout } = useAppData();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [api, contextHolder] = notification.useNotification();
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const { scanOnce } = useBarcodeScanner();

  const filteredProducts = products.filter(
    (p) =>
      p.stock > 0 &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter === null || p.categoryId === categoryFilter)
  );

  const addToCart = (productId: string, batchId?: string) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      const product = products.find((p) => p.id === productId);
      if (!product) return prev;
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + 1, batchId: batchId ?? l.batchId } : l
        );
      }
      return [...prev, { productId, quantity: 1, batchId }];
    });
  };

  const handleScanBarcode = async () => {
    const code = await scanOnce();
    if (!code) return; // người dùng hủy quét hoặc không đọc được mã

    const match = findByBarcode(products, code);
    const product = match?.product ?? products.find((p) => p.code === code);

    if (!product) {
      api.warning({
        message: "Chưa có sản phẩm với mã vạch này",
        description: `Mã quét được: ${code}. Bấm để tạo phiếu nhập cho sản phẩm này.`,
        btn: (
          <Button
            size="small"
            type="primary"
            onClick={() => navigate("/purchases", { state: { newBarcode: code } })}
          >
            Nhập hàng mới
          </Button>
        ),
      });
      return;
    }

    if (product.stock <= 0) {
      api.warning({ message: "Sản phẩm đã hết hàng", description: product.name });
      return;
    }

    addToCart(product.id, match?.batch.id);
    api.success({
      message: "Đã thêm vào giỏ hàng",
      description: `${product.name} · ${formatVND(product.sellingPrice)}`,
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (productId: string) =>
    setCart((prev) => prev.filter((l) => l.productId !== productId));

  const clearCart = () => {
    setCart([]);
    setCartSheetOpen(false);
    api.info({ message: "Đã làm mới giỏ hàng" });
  };

  const cartDetails = useMemo(
    () =>
      cart.map((line) => {
        const product = products.find((p) => p.id === line.productId)!;
        return { ...line, product, lineTotal: product.sellingPrice * line.quantity };
      }),
    [cart, products]
  );

  const totalQty = cartDetails.reduce((sum, l) => sum + l.quantity, 0);
  const total = cartDetails.reduce((sum, l) => sum + l.lineTotal, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const sale = checkout(cart, paymentMethod);
    api.success({ message: "Thanh toán thành công", description: `Tổng tiền: ${formatVND(total)}` });
    setCart([]);
    setCartSheetOpen(false);
    setCompletedSale(sale);
  };

  const cartContent = (
    <>
      {cartDetails.length === 0 ? (
        <Empty description="Chưa có sản phẩm trong giỏ" />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <Popconfirm
              title="Làm mới giỏ hàng?"
              description="Toàn bộ sản phẩm đang chọn sẽ bị xóa khỏi giỏ."
              okText="Xóa hết"
              okButtonProps={{ danger: true }}
              cancelText="Hủy"
              onConfirm={clearCart}
            >
              <Button size="small" danger icon={<ClearOutlined />}>
                Làm mới giỏ hàng
              </Button>
            </Popconfirm>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cartDetails.map((l) => (
              <div key={l.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <img
                  src={getProductImage(l.product.name, l.product.image)}
                  alt={l.product.name}
                  style={{ width: isMobile ? 40 : 32, height: isMobile ? 40 : 32, borderRadius: 8, objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{l.product.name}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{formatVND(l.product.sellingPrice)} / {l.product.unit}</div>
                </div>
                <Button size={isMobile ? "middle" : "small"} icon={<MinusOutlined />} onClick={() => changeQty(l.productId, -1)} />
                <span style={{ width: 24, textAlign: "center" }}>{l.quantity}</span>
                <Button size={isMobile ? "middle" : "small"} icon={<PlusOutlined />} onClick={() => changeQty(l.productId, 1)} disabled={l.quantity >= l.product.stock} />
                <b style={{ width: 80, textAlign: "right", fontSize: isMobile ? 13 : 14 }}>{formatVND(l.lineTotal)}</b>
                <Button size={isMobile ? "middle" : "small"} danger icon={<DeleteOutlined />} onClick={() => removeLine(l.productId)} />
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 16, paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span>Tạm tính</span>
          <span>{formatVND(total)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
          <span>Tổng cộng</span>
          <span style={{ color: "#147f27" }}>{formatVND(total)}</span>
        </div>

        <Radio.Group
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={{ marginBottom: 16, width: "100%" }}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="cash" style={{ width: "50%", textAlign: "center" }}>
            Tiền mặt
          </Radio.Button>
          <Radio.Button value="transfer" style={{ width: "50%", textAlign: "center" }}>
            Chuyển khoản
          </Radio.Button>
        </Radio.Group>

        {paymentMethod === "transfer" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 16,
              padding: 12,
              background: "#fafafa",
              borderRadius: 12,
            }}
          >
            <img src={vietqr} alt="Mã QR chuyển khoản" style={{ width: 200, maxWidth: "100%", borderRadius: 12 }} />
            <span style={{ marginTop: 8, color: "#888", fontSize: 13, textAlign: "center" }}>
              Đưa mã này cho khách quét để chuyển khoản {formatVND(total)}
            </span>
          </div>
        )}

        {!isMobile && (
          <Button type="primary" block size="large" disabled={cart.length === 0} onClick={handleCheckout}>
            THANH TOÁN
          </Button>
        )}
      </div>
    </>
  );

  const categoryChips = (
    <CategoryChips
      categories={categories}
      value={categoryFilter}
      onChange={(v) => setCategoryFilter(v ?? null)}
      allValue={null}
    />
  );

  const productGrid = (
    <>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Tìm sản phẩm..."
        size={isMobile ? "large" : "middle"}
        style={{ marginBottom: 14 }}
        actions={
          <SearchActionButton
            icon={<QrcodeOutlined />}
            onClick={handleScanBarcode}
            size={isMobile ? "large" : "middle"}
            label={isMobile ? undefined : "Quét mã"}
          />
        }
      />
      {categoryChips}
      <Row gutter={[12, 12]}>
        {filteredProducts.map((p) => (
          <Col xs={12} sm={8} md={8} key={p.id}>
            <Card
              hoverable
              size="small"
              onClick={() => addToCart(p.id)}
              style={{ textAlign: "center", borderRadius: 12 }}
            >
              <img
                src={getProductImage(p.name, p.image)}
                alt={p.name}
                style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", marginBottom: 6 }}
              />
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: "#147f27", fontWeight: 700, marginTop: 4 }}>
                {formatVND(p.sellingPrice)}
              </div>
              <Tag style={{ marginTop: 6 }}>còn {p.stock} {p.unit}</Tag>
            </Card>
          </Col>
        ))}
        {filteredProducts.length === 0 && (
          <Col span={24}>
            <Empty description="Không tìm thấy sản phẩm" />
          </Col>
        )}
      </Row>
    </>
  );

  const historyButton = (
    <Button icon={<HistoryOutlined />} onClick={() => navigate("/sales/history")}>
      Lịch sử giao dịch
    </Button>
  );

  return (
    <>
      {contextHolder}

      {isMobile ? (
        <div style={{ paddingBottom: cart.length > 0 ? 78 : 0 }}>
          <Card
            className="page-card"
            title="Chọn sản phẩm"
            extra={
              <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => navigate("/sales/history")}>
                Lịch sử
              </Button>
            }
          >
            {productGrid}
          </Card>
        </div>
      ) : (
        <Row gutter={16}>
          <Col xs={24} lg={15}>
            <Card className="page-card" title="Chọn sản phẩm" extra={historyButton}>
              {productGrid}
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card className="page-card" title={<span><ShoppingCartOutlined /> Giỏ hàng</span>}>
              {cartContent}
            </Card>
          </Col>
        </Row>
      )}

      {/* Thanh giỏ hàng dính ở dưới, nổi trên bottom nav (chỉ mobile) */}
      {isMobile && cart.length > 0 && (
        <div
          onClick={() => setCartSheetOpen(true)}
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
            zIndex: 95,
            background: "#147f27",
            color: "#fff",
            borderRadius: 14,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 16px rgba(22,163,74,0.4)",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <ShoppingCartOutlined style={{ fontSize: 18 }} />
            {totalQty} sản phẩm
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            {formatVND(total)} <span style={{ fontSize: 12, fontWeight: 400 }}>Xem giỏ →</span>
          </span>
        </div>
      )}

      <ResponsiveModal
        title={<span><ShoppingCartOutlined /> Giỏ hàng</span>}
        open={cartSheetOpen}
        onClose={() => setCartSheetOpen(false)}
        footer={
          <Button type="primary" block size="large" style={{ height: 48 }} disabled={cart.length === 0} onClick={handleCheckout}>
            THANH TOÁN {cart.length > 0 && `· ${formatVND(total)}`}
          </Button>
        }
      >
        {cartContent}
      </ResponsiveModal>

      <SaleDetailModal
        sale={completedSale}
        open={!!completedSale}
        onClose={() => setCompletedSale(null)}
        products={products}
      />
    </>
  );
};

export default Sales;
