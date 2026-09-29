import React, { useMemo, useState } from "react";
import { Row, Col, Card, List, Tag, Empty, Button, Tabs, Alert, Statistic } from "antd";
import { WalletOutlined, RiseOutlined, FileDoneOutlined, WarningOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { getStockStatus } from "../mock/products";
import { daysUntilExpiry, EXPIRY_WARNING_DAYS } from "../utils/expiry";
import { formatVND } from "../utils/format";
import { useIsMobile } from "../hooks/useIsMobile";
import SaleDetailModal from "../components/SaleDetailModal";
import DateBoxInput from "../components/DateBoxInput";
import type { Sale, Product } from "../types";
import { EXPENSE_CATEGORY_LABELS } from "../types";

type RangeKey = "today" | "yesterday" | "7days" | "month" | "custom";

/** Dùng chung 1 bộ lọc khoảng thời gian cho cả Sale lẫn Expense - tránh 2 nơi lọc lệch nhau. */
function isInSelectedRange(dateISO: string, range: RangeKey, customRange: [Dayjs, Dayjs] | null) {
  const d = dayjs(dateISO);
  if (range === "today") return d.isSame(dayjs(), "day");
  if (range === "yesterday") return d.isSame(dayjs().subtract(1, "day"), "day");
  if (range === "7days") return d.isAfter(dayjs().subtract(7, "day"));
  if (range === "month") return d.isSame(dayjs(), "month");
  if (range === "custom" && customRange) {
    return d.isAfter(customRange[0].startOf("day")) && d.isBefore(customRange[1].endOf("day"));
  }
  return true;
}

const Statistics: React.FC = () => {
  const { products, sales, expenses, debts } = useAppData();
  const isMobile = useIsMobile();
  const [range, setRange] = useState<RangeKey>("today");
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();
  const rangeInvalid = !!fromDate && !!toDate && dayjs(fromDate).isAfter(dayjs(toDate));
  // Chỉ áp dụng khoảng tùy chỉnh khi CẢ 2 ngày đã nhập hợp lệ và "Từ" không sau "Đến".
  const customRange = useMemo<[Dayjs, Dayjs] | null>(
    () => (fromDate && toDate && !rangeInvalid ? [dayjs(fromDate), dayjs(toDate)] : null),
    [fromDate, toDate, rangeInvalid]
  );
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => isInSelectedRange(s.date, range, customRange));
  }, [sales, range, customRange]);

  const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  // QUAN TRỌNG: lấy `costOfGoodsSold` đã CHỐT ngay lúc bán (lưu trong từng SaleItem), KHÔNG
  // tính lại theo `product.purchasePrice` HIỆN TẠI - nếu không, mỗi lần đổi giá nhập sẽ làm
  // sai lệch lợi nhuận của các đơn hàng cũ trong quá khứ (đúng yêu cầu spec Feature Profit/COGS).
  const cost = filteredSales.reduce(
    (sum, s) => sum + s.items.reduce((itemSum, it) => itemSum + (it.costOfGoodsSold ?? 0), 0),
    0
  );
  const grossProfit = revenue - cost;
  const expensesInRange = useMemo(
    () => expenses.filter((e) => isInSelectedRange(e.createdAt, range, customRange)),
    [expenses, range, customRange]
  );
  const expensesTotal = expensesInRange.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - expensesTotal;

  const lowStockProducts = products.filter((p) => getStockStatus(p) !== "in_stock");

  // Sản phẩm có đặt hạn sử dụng, sắp theo HSD gần nhất trước - để nắm tình hình hàng sắp hỏng.
  const expiringProducts = useMemo(() => {
    return products
      .filter((p) => !!p.expiryDate)
      .map((p) => ({ product: p, days: daysUntilExpiry(p.expiryDate)! }))
      .sort((a, b) => a.days - b.days);
  }, [products]);
  const urgentExpiringCount = expiringProducts.filter((x) => x.days <= EXPIRY_WARNING_DAYS).length;

  // Banner cảnh báo HSD - hiện NGAY trên Tổng quan, không bắt phải bấm vào tab "HSD" mới thấy.
  const expiryAlert = useMemo(() => {
    const urgent = expiringProducts.filter((x) => x.days <= EXPIRY_WARNING_DAYS);
    if (urgent.length === 0) return null;
    const expiredCount = urgent.filter((x) => x.days < 0).length;
    const preview = urgent
      .slice(0, 3)
      .map((x) => `${x.product.name} (${x.days < 0 ? "đã hết hạn" : `còn ${x.days} ngày`})`)
      .join(", ");
    const more = urgent.length > 3 ? ` và ${urgent.length - 3} sản phẩm khác` : "";
    return (
      <Alert
        style={{ marginBottom: 16, borderRadius: 12 }}
        type={expiredCount > 0 ? "error" : "warning"}
        showIcon
        icon={<WarningOutlined />}
        message={`${urgent.length} sản phẩm sắp/đã hết hạn sử dụng`}
        description={preview + more}
      />
    );
  }, [expiringProducts]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    filteredSales.forEach((s) =>
      s.items.forEach((it) => map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity))
    );
    return [...map.entries()]
      .map(([productId, qty]) => ({ product: products.find((p) => p.id === productId), qty }))
      .filter((x) => x.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredSales, products]);

  const recentTransactions = [...sales]
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice(0, 6);

  // Tính doanh thu 7 ngày gần nhất từ dữ liệu bán hàng THẬT (không phải mock cứng)
  // -> biểu đồ tự cập nhật ngay khi có đơn mới hoặc khi đặt lại/xóa toàn bộ dữ liệu.
  const revenueChartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const daysAgo = 6 - idx;
      const date = dayjs().subtract(daysAgo, "day");
      const revenue = sales
        .filter((s) => dayjs(s.date).isSame(date, "day"))
        .reduce((sum, s) => sum + s.total, 0);
      return { date: date.format("DD/MM"), revenue };
    });
  }, [sales]);

  const rangeOptions: { key: RangeKey; label: string }[] = [
    { key: "today", label: "Hôm nay" },
    { key: "yesterday", label: "Hôm qua" },
    { key: "7days", label: "7 ngày" },
    { key: "month", label: "Tháng này" },
    { key: "custom", label: "Tùy chỉnh" },
  ];
  const activeRangeLabel = rangeOptions.find((o) => o.key === range)?.label ?? "";

  // Hero: banner màu thương hiệu chứa số doanh thu nổi bật theo khoảng thời gian đang chọn,
  // phía dưới là 3 thẻ trắng nhô lên đè lên mép banner (giống thẻ số dư ví của Grab).
  // Lời chào/logo đã chuyển sang trang "Trang chủ" riêng, ở đây chỉ tập trung số liệu.
  const hero = (
    <div
      style={{
        background: "linear-gradient(135deg, #147f27 0%, #0d5c1c 100%)",
        borderRadius: 20,
        padding: isMobile ? "18px 16px 44px" : "24px 24px 48px",
        color: "#fff",
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 2 }}>Doanh thu · {activeRangeLabel}</div>
      <div style={{ fontSize: isMobile ? 32 : 38, fontWeight: 800, marginBottom: 18 }}>
        {formatVND(revenue)}
      </div>

      <div
        data-no-swipe-nav="true"
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}
      >
        {rangeOptions.map((opt) => (
          <Tag.CheckableTag
            key={opt.key}
            checked={range === opt.key}
            onChange={() => setRange(opt.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              border: "none",
              background: range === opt.key ? "#fff" : "rgba(255,255,255,0.18)",
              color: range === opt.key ? "#147f27" : "#fff",
            }}
          >
            {opt.label}
          </Tag.CheckableTag>
        ))}
      </div>
      {range === "custom" && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Từ ngày</div>
            <DateBoxInput value={fromDate} onChange={setFromDate} />
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Đến ngày</div>
            <DateBoxInput value={toDate} onChange={setToDate} />
          </div>
          {rangeInvalid && (
            <div style={{ fontSize: 12, color: "#fecaca" }}>Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</div>
          )}
        </div>
      )}
    </div>
  );

  const statCards = (
    <Row gutter={10} style={{ marginTop: -32, marginBottom: 16, position: "relative" }}>
      <Col span={8}>
        <Card className="stat-card" styles={{ body: { padding: "12px 6px", textAlign: "center" } }}>
          <WalletOutlined style={{ color: "#147f27", fontSize: 16 }} />
          <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}>Giá vốn</div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>{formatVND(cost)}</div>
        </Card>
      </Col>
      <Col span={8}>
        <Card className="stat-card" styles={{ body: { padding: "12px 6px", textAlign: "center" } }}>
          <RiseOutlined style={{ color: "#2563eb", fontSize: 16 }} />
          <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}>Lợi nhuận</div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: "#2563eb" }}>{formatVND(grossProfit)}</div>
        </Card>
      </Col>
      <Col span={8}>
        <Card className="stat-card" styles={{ body: { padding: "12px 6px", textAlign: "center" } }}>
          <FileDoneOutlined style={{ color: "#f59e0b", fontSize: 16 }} />
          <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}>Số đơn</div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>{filteredSales.length} đơn</div>
        </Card>
      </Col>
    </Row>
  );

  const chart = (
    <Card title="Doanh thu 7 ngày gần đây" className="page-card">
      <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
        <BarChart data={revenueChartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(v) => `${v / 1000000}tr`} width={40} />
          <Tooltip formatter={(v) => formatVND(Number(v))} />
          <Bar dataKey="revenue" fill="#147f27" radius={[6, 6, 0, 0]} name="Doanh thu" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const lowStockList = (
    <Card title="Sản phẩm sắp hết / hết hàng" className="page-card">
      {lowStockProducts.length === 0 ? (
        <Empty description="Không có sản phẩm sắp hết" />
      ) : (
        <List
          dataSource={lowStockProducts}
          renderItem={(p) => (
            <List.Item>
              <span>{p.name}</span>
              <Tag color={p.stock === 0 ? "red" : "gold"}>
                còn {p.stock} {p.unit}
              </Tag>
            </List.Item>
          )}
        />
      )}
    </Card>
  );

  const topProductsList = (
    <Card title="Sản phẩm bán chạy" className="page-card">
      <List
        dataSource={topProducts}
        locale={{ emptyText: "Chưa có dữ liệu bán hàng" }}
        renderItem={(item, idx) => (
          <List.Item>
            <span>
              <Tag>{idx + 1}</Tag> {item.product?.name}
            </span>
            <b>
              {item.qty} {item.product?.unit}
            </b>
          </List.Item>
        )}
      />
    </Card>
  );

  // Tổng giá trị tồn kho: ưu tiên tính theo unitCost của TỪNG LÔ (chính xác hơn) nếu sản phẩm
  // có theo dõi lô; sản phẩm chưa có lô nào thì tạm dùng purchasePrice hiện tại làm ước lượng.
  const inventoryQty = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValue = products.reduce((sum, p) => {
    if (p.batches && p.batches.length > 0) {
      return sum + p.batches.reduce((s, b) => s + b.quantity * b.unitCost, 0);
    }
    return sum + p.stock * p.purchasePrice;
  }, 0);

  // Công nợ: tổng dư nợ là số liệu TẠI THỜI ĐIỂM HIỆN TẠI (không lọc theo range), riêng "đã
  // thu" thì lọc theo cùng khoảng thời gian đang chọn ở trên - khớp với cách Sổ quỹ tính.
  const totalOutstandingDebt = debts.reduce((sum, d) => sum + Math.max(0, d.totalPurchase - d.totalPaid), 0);
  const customersWithDebt = debts.filter((d) => d.totalPurchase - d.totalPaid > 0).length;
  const debtCollectedInRange = debts.reduce(
    (sum, d) =>
      sum + d.history.filter((h) => isInSelectedRange(h.date, range, customRange)).reduce((s, h) => s + h.amount, 0),
    0
  );

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    expensesInRange.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expensesInRange]);

  const summaryPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title="Tồn kho" className="page-card">
        <Row gutter={12}>
          <Col span={12}>
            <Statistic title="Tổng số lượng tồn" value={inventoryQty} />
          </Col>
          <Col span={12}>
            <Statistic title="Giá trị tồn kho" value={inventoryValue} formatter={(v) => formatVND(Number(v))} />
          </Col>
        </Row>
        <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 8 }}>
          Giá trị tính theo giá vốn từng lô hàng (nếu có theo dõi lô) hoặc giá nhập hiện tại.
        </div>
      </Card>

      <Card title="Công nợ" className="page-card">
        <Row gutter={12}>
          <Col span={8}>
            <Statistic title="Tổng dư nợ" value={totalOutstandingDebt} formatter={(v) => formatVND(Number(v))} />
          </Col>
          <Col span={8}>
            <Statistic title="Khách đang nợ" value={customersWithDebt} />
          </Col>
          <Col span={8}>
            <Statistic
              title="Đã thu (kỳ này)"
              value={debtCollectedInRange}
              formatter={(v) => formatVND(Number(v))}
              valueStyle={{ color: "#147f27" }}
            />
          </Col>
        </Row>
      </Card>

      <Card title="Chi phí theo loại" className="page-card">
        {expenseByCategory.length === 0 ? (
          <Empty description="Không có chi phí nào trong khoảng thời gian này" />
        ) : (
          <List
            dataSource={expenseByCategory}
            renderItem={([category, amount]) => (
              <List.Item>
                <span>{EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS]}</span>
                <b>{formatVND(amount)}</b>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );

  const profitBreakdown = (
    <Card title="Lợi nhuận" className="page-card">
      <List
        dataSource={[
          { label: "Doanh thu", value: revenue, color: "#147f27" },
          { label: "Giá vốn hàng bán (COGS)", value: -cost, color: "#8c8c8c" },
          { label: "Lợi nhuận gộp", value: grossProfit, color: "#2563eb", bold: true },
          { label: "Chi phí vận hành", value: -expensesTotal, color: "#8c8c8c" },
          { label: "Lợi nhuận ròng", value: netProfit, color: netProfit >= 0 ? "#147f27" : "#dc2626", bold: true },
        ]}
        renderItem={(row) => (
          <List.Item>
            <span style={{ fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
            <b style={{ color: row.color }}>
              {row.value < 0 ? "-" : ""}
              {formatVND(Math.abs(row.value))}
            </b>
          </List.Item>
        )}
      />
      <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 8 }}>
        Giá vốn tính theo giá nhập CHỐT tại thời điểm bán từng đơn - không đổi dù giá nhập hiện
        tại của sản phẩm sau này thay đổi. Chi phí lấy từ mục "Chi phí" trong cùng khoảng thời
        gian đang chọn ở trên.
      </div>
    </Card>
  );

  const expiringList = (
    <Card title="Hạn sử dụng gần nhất" className="page-card">
      {expiringProducts.length === 0 ? (
        <Empty description="Chưa có sản phẩm nào đặt hạn sử dụng" />
      ) : (
        (() => {
          const urgent = expiringProducts.filter((x) => x.days <= EXPIRY_WARNING_DAYS);
          const later = expiringProducts.filter((x) => x.days > EXPIRY_WARNING_DAYS);
          const renderRow = ({ product, days }: { product: Product; days: number }) => (
            <List.Item key={product.id}>
              <span>{product.name}</span>
              <Tag color={days < 0 ? "red" : days <= EXPIRY_WARNING_DAYS ? "orange" : "default"}>
                {dayjs(product.expiryDate).format("DD/MM/YYYY")}
                {days < 0 ? " · Đã hết hạn" : days <= EXPIRY_WARNING_DAYS ? ` · Còn ${days} ngày` : ""}
              </Tag>
            </List.Item>
          );
          return (
            <>
              {urgent.length > 0 && (
                <>
                  <div style={{ fontWeight: 600, color: "#d46b08", marginBottom: 4 }}>
                    ⚠️ Cần chú ý (còn ≤ 1 tháng) - {urgent.length}
                  </div>
                  <List dataSource={urgent} renderItem={renderRow} />
                </>
              )}
              {later.length > 0 && (
                <>
                  <div style={{ fontWeight: 600, color: "#8c8c8c", margin: urgent.length > 0 ? "16px 0 4px" : "0 0 4px" }}>
                    Còn hạn xa
                  </div>
                  <List dataSource={later} renderItem={renderRow} />
                </>
              )}
            </>
          );
        })()
      )}
    </Card>
  );

  const recentTransactionsList = (
    <Card title="Giao dịch gần đây" className="page-card">
      <List
        dataSource={recentTransactions}
        locale={{ emptyText: "Chưa có giao dịch nào" }}
        renderItem={(s) => (
          <List.Item>
            <span>
              <Button type="link" style={{ padding: 0 }} onClick={() => setDetailSale(s)}>
                {s.code}
              </Button>{" "}
              · {dayjs(s.date).format("HH:mm DD/MM")}
            </span>
            <b>{formatVND(s.total)}</b>
          </List.Item>
        )}
      />
    </Card>
  );

  return (
    <div>
      {hero}
      {statCards}
      {expiryAlert}

      {isMobile ? (
        <>
          {chart}

          {/* Thông tin phụ gộp vào Tabs để đỡ dồn dập trên 1 màn hình */}
          <Card className="page-card" style={{ marginTop: 16 }} styles={{ body: { padding: "8px 0 0" } }}>
            <Tabs
              defaultActiveKey="recent"
              style={{ padding: "0 16px" }}
              items={[
                { key: "recent", label: "Giao dịch", children: recentTransactionsList },
                { key: "top", label: "Bán chạy", children: topProductsList },
                { key: "profit", label: "Lợi nhuận", children: profitBreakdown },
                { key: "summary", label: "Tổng hợp", children: summaryPanel },
                {
                  key: "low",
                  label: lowStockProducts.length > 0 ? `Sắp hết (${lowStockProducts.length})` : "Sắp hết",
                  children: lowStockList,
                },
                {
                  key: "expiring",
                  label: urgentExpiringCount > 0 ? `HSD (${urgentExpiringCount})` : "HSD",
                  children: expiringList,
                },
              ]}
            />
          </Card>
        </>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>{chart}</Col>
            <Col xs={24} lg={10}>{lowStockList}</Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>{topProductsList}</Col>
            <Col xs={24} lg={12}>{recentTransactionsList}</Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>{profitBreakdown}</Col>
            <Col xs={24} lg={12}>{expiringList}</Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>{summaryPanel}</Col>
          </Row>
        </>
      )}

      <SaleDetailModal
        sale={detailSale}
        open={!!detailSale}
        onClose={() => setDetailSale(null)}
        products={products}
      />
    </div>
  );
};

export default Statistics;
