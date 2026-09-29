import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Form,
  InputNumber,
  Popconfirm,
  Avatar,
  message,
  Empty,
  Divider,
  Segmented,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, HistoryOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { getStockStatus } from "../mock/products";
import { formatVND } from "../utils/format";
import { getProductImage } from "../utils/avatar";
import { useIsMobile } from "../hooks/useIsMobile";
import { nextProductCode, DEFAULT_LOW_STOCK_THRESHOLD } from "../utils/productCode";
import { daysUntilExpiry } from "../utils/expiry";
import { getProductBarcodes } from "../utils/batches";
import ProductImageUpload from "../components/ProductImageUpload";
import ResponsiveModal from "../components/ResponsiveModal";
import SheetFormFooter from "../components/SheetFormFooter";
import MobileRow from "../components/MobileRow";
import SearchBar, { SearchActionButton } from "../components/SearchBar";
import CategoryChips from "../components/CategoryChips";
import FAB from "../components/FAB";
import MoneyInput from "../components/MoneyInput";
import type { Product, StockStatus, StockMovement, StockMovementType, LossReason } from "../types";
import { LOSS_REASON_LABELS } from "../types";

const LOSS_REASON_OPTIONS = (Object.entries(LOSS_REASON_LABELS) as [LossReason, string][]).map(
  ([value, label]) => ({ value, label })
);

/** Ghi nhận hàng bị mất khỏi tồn kho (hư hỏng/hết hạn/thất thoát/khác) cho 1 sản phẩm cụ thể. */
function LossModal({
  product,
  open,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: LossReason, quantity: number, note?: string) => void;
}) {
  const [form] = Form.useForm<{ reason: LossReason; quantity: number; note?: string }>();

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values.reason, values.quantity, values.note);
    form.resetFields();
  };

  return (
    <ResponsiveModal
      title={`Ghi nhận hao hụt - ${product?.name ?? ""}`}
      open={open}
      onClose={onClose}
      footer={<SheetFormFooter onCancel={onClose} onSubmit={handleOk} submitText="Ghi nhận" />}
    >
      <Form form={form} layout="vertical" initialValues={{ quantity: 1 }}>
        <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: "Chọn lý do" }]}>
          <Select size="large" options={LOSS_REASON_OPTIONS} placeholder="Chọn lý do" />
        </Form.Item>
        <Form.Item
          name="quantity"
          label={`Số lượng (đang tồn: ${product?.stock ?? 0} ${product?.unit ?? ""})`}
          rules={[
            { required: true, message: "Nhập số lượng" },
            {
              validator: (_, v) =>
                v > 0 && (!product || v <= product.stock)
                  ? Promise.resolve()
                  : Promise.reject(new Error("Số lượng phải > 0 và không vượt quá tồn kho")),
            },
          ]}
        >
          <InputNumber size="large" style={{ width: "100%" }} min={1} max={product?.stock ?? undefined} />
        </Form.Item>
        <Form.Item name="note" label="Ghi chú (không bắt buộc)">
          <Input.TextArea rows={2} placeholder="VD: rơi vỡ lúc dọn kho" />
        </Form.Item>
      </Form>
    </ResponsiveModal>
  );
}
const MOVEMENT_LABELS: Record<StockMovementType, { label: string; color: string }> = {
  PURCHASE: { label: "Nhập hàng", color: "green" },
  SALE: { label: "Bán hàng", color: "blue" },
  DAMAGE: { label: "Hư hỏng", color: "red" },
  EXPIRED: { label: "Hết hạn", color: "orange" },
  ADJUSTMENT: { label: "Điều chỉnh", color: "purple" },
  RETURN: { label: "Hoàn trả", color: "cyan" },
};

const MOVEMENT_FILTERS: { label: string; value: StockMovementType | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Nhập hàng", value: "PURCHASE" },
  { label: "Bán hàng", value: "SALE" },
  { label: "Hư hỏng", value: "DAMAGE" },
  { label: "Hết hạn", value: "EXPIRED" },
  { label: "Điều chỉnh", value: "ADJUSTMENT" },
  { label: "Hoàn trả", value: "RETURN" },
];

/** Lịch sử kho (Stock Ledger) của 1 sản phẩm - mọi thay đổi tồn kho đều xuất hiện ở đây. */
function StockHistoryModal({
  product,
  movements,
  open,
  onClose,
}: {
  product: Product | null;
  movements: StockMovement[];
  open: boolean;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<StockMovementType | "ALL">("ALL");
  const list = useMemo(() => {
    if (!product) return [];
    return movements
      .filter((m) => m.productId === product.id)
      .filter((m) => filter === "ALL" || m.type === filter)
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [movements, product, filter]);

  return (
    <ResponsiveModal title={`Lịch sử kho - ${product?.name ?? ""}`} open={open} onClose={onClose}>
      <Segmented
        block
        size="small"
        value={filter}
        onChange={(v) => setFilter(v as StockMovementType | "ALL")}
        options={MOVEMENT_FILTERS}
        style={{ marginBottom: 14, flexWrap: "wrap" }}
      />
      {list.length === 0 ? (
        <Empty description="Chưa có biến động kho nào" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((m) => {
            const cfg = MOVEMENT_LABELS[m.type];
            return (
              <div key={m.id} style={{ background: "#fafafa", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                    {dayjs(m.createdAt).format("HH:mm DD/MM")}
                  </span>
                  <Tag color={cfg.color}>{cfg.label}</Tag>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                    Tồn: {m.beforeStock} → {m.afterStock}
                    {m.reason ? ` · Lý do: ${m.reason}` : ""}
                  </span>
                  <b style={{ color: m.quantity >= 0 ? "#147f27" : "#dc2626", fontSize: 15 }}>
                    {m.quantity >= 0 ? "+" : ""}
                    {m.quantity}
                  </b>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ResponsiveModal>
  );
}

const statusConfig: Record<StockStatus, { color: string; label: string }> = {
  in_stock: { color: "green", label: "🟢 Đủ hàng" },
  low_stock: { color: "gold", label: "🟡 Sắp hết" },
  out_of_stock: { color: "red", label: "🔴 Hết hàng" },
};

/** Hiển thị HSD dạng chữ + màu cảnh báo: đỏ nếu đã hết hạn, cam nếu còn <= 30 ngày. */
function ExpiryTag({ expiryDate }: { expiryDate?: string }) {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return <span style={{ color: "#ccc" }}>—</span>;
  const dateLabel = dayjs(expiryDate).format("DD/MM/YYYY");
  if (days < 0) return <Tag color="red">{dateLabel} · Đã hết hạn</Tag>;
  if (days <= 30) return <Tag color="orange">{dateLabel} · Còn {days} ngày</Tag>;
  return <span>{dateLabel}</span>;
}

/**
 * Danh sách lô hàng CHỈ ĐỌC của 1 sản phẩm (mã vạch + HSD + số lượng riêng từng lô).
 * Lô hàng được tạo ra khi Nhập hàng, nên ở đây chỉ xem, không sửa trực tiếp được.
 */
function BatchListReadOnly({ product }: { product: Product }) {
  const batches = product.batches ?? [];
  if (batches.length === 0) {
    return (
      <div style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>
        Chưa có lô hàng nào (sản phẩm này chưa được nhập qua trang "Nhập hàng").
      </div>
    );
  }
  const sorted = [...batches].sort((a, b) => {
    const av = a.expiryDate ? dayjs(a.expiryDate).valueOf() : Infinity;
    const bv = b.expiryDate ? dayjs(b.expiryDate).valueOf() : Infinity;
    return av - bv;
  });
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>
        Các lô hàng hiện có ({batches.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              background: "#fafafa",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <span style={{ flex: 1 }}>
              {b.barcode ? <code>{b.barcode}</code> : <span style={{ color: "#bbb" }}>Không có mã vạch</span>}
            </span>
            <span>{b.quantity} {product.unit}</span>
            <ExpiryTag expiryDate={b.expiryDate} />
          </div>
        ))}
      </div>
      <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>
        Muốn thêm lô mới (mã vạch/HSD riêng), vào trang Nhập hàng.
      </div>
    </div>
  );
}

interface ProductFormValues {
  name: string;
  code: string;
  categoryId: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  image?: string;
}

const Products: React.FC = () => {
  const {
    products,
    categories,
    units,
    stockMovements,
    addUnit,
    addProduct,
    updateProduct,
    deleteProduct,
    recordLoss,
  } = useAppData();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<StockStatus | undefined>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [lossProduct, setLossProduct] = useState<Product | null>(null);
  const [form] = Form.useForm<ProductFormValues>();
  const [newUnitName, setNewUnitName] = useState("");

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (categoryFilter && p.categoryId !== categoryFilter) return false;
    if (statusFilter && getStockStatus(p) !== statusFilter) return false;
    return true;
  });

  const activeFilterCount = statusFilter ? 1 : 0;

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      code: nextProductCode(products),
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    form.setFieldsValue(p);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateProduct(editing.id, values);
      message.success("Đã cập nhật sản phẩm");
    } else {
      addProduct(values);
      message.success("Đã thêm sản phẩm");
    }
    setOpen(false);
  };

  const handleAddUnitInline = () => {
    const name = newUnitName.trim();
    if (!name) return;
    addUnit(name);
    form.setFieldsValue({ unit: name });
    setNewUnitName("");
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    message.success("Đã xóa sản phẩm");
  };

  const unitSelectField = (size?: "large") => (
    <Form.Item name="unit" label="Đơn vị" rules={[{ required: true, message: "Chọn đơn vị" }]}>
      <Select
        size={size}
        placeholder="Chọn đơn vị"
        options={units.map((u) => ({ label: u, value: u }))}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "8px 0" }} />
            <Space.Compact style={{ width: "100%", padding: "0 8px 8px" }}>
              <Input
                placeholder="Đơn vị mới"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <Button type="primary" onClick={handleAddUnitInline}>
                Thêm
              </Button>
            </Space.Compact>
          </>
        )}
      />
    </Form.Item>
  );

  const statusOptions = [
    { label: "🟢 Đủ hàng", value: "in_stock" },
    { label: "🟡 Sắp hết", value: "low_stock" },
    { label: "🔴 Hết hàng", value: "out_of_stock" },
  ];

  const categoryChips = (
    <CategoryChips
      categories={categories}
      value={categoryFilter}
      onChange={(v) => setCategoryFilter(v ?? undefined)}
    />
  );

  const formFields = (
    <>
      <Form.Item name="image" label="Ảnh sản phẩm (không bắt buộc)">
        <ProductImageUpload />
      </Form.Item>
      {isMobile ? (
        <>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="code" label="Mã sản phẩm (tự động)">
            <Input size="large" disabled />
          </Form.Item>
          {editing && (
            <div style={{ marginBottom: 8 }}>
              <BatchListReadOnly product={editing} />
              <Space wrap>
                <Button size="small" icon={<HistoryOutlined />} onClick={() => setHistoryProduct(editing)}>
                  Lịch sử kho
                </Button>
                <Button size="small" danger icon={<WarningOutlined />} onClick={() => setLossProduct(editing)}>
                  Ghi nhận hao hụt
                </Button>
              </Space>
            </div>
          )}
          <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
            <Select size="large" options={categories.map((c) => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          {unitSelectField("large")}
          <Form.Item name="purchasePrice" label="Giá nhập" rules={[{ required: true }]}>
            <MoneyInput size="large" />
          </Form.Item>
          <Form.Item name="sellingPrice" label="Giá bán" rules={[{ required: true }]}>
            <MoneyInput size="large" />
          </Form.Item>
          <Form.Item name="stock" label="Tồn kho" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="lowStockThreshold" label="Ngưỡng sắp hết (mặc định)">
            <InputNumber size="large" style={{ width: "100%" }} disabled />
          </Form.Item>
        </>
      ) : (
        <>
          <Space.Compact block>
            <Form.Item name="name" label="Tên sản phẩm" style={{ width: "60%" }} rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="code" label="Mã sản phẩm (tự động)" style={{ width: "40%" }}>
              <Input disabled />
            </Form.Item>
          </Space.Compact>
          {editing && (
            <div style={{ marginBottom: 8 }}>
              <BatchListReadOnly product={editing} />
              <Space wrap>
                <Button size="small" icon={<HistoryOutlined />} onClick={() => setHistoryProduct(editing)}>
                  Lịch sử kho
                </Button>
                <Button size="small" danger icon={<WarningOutlined />} onClick={() => setLossProduct(editing)}>
                  Ghi nhận hao hụt
                </Button>
              </Space>
            </div>
          )}
          <Space.Compact block>
            <Form.Item name="categoryId" label="Danh mục" style={{ width: "60%" }} rules={[{ required: true }]}>
              <Select options={categories.map((c) => ({ label: c.name, value: c.id }))} />
            </Form.Item>
            <div style={{ width: "40%" }}>{unitSelectField()}</div>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="purchasePrice" label="Giá nhập" style={{ width: "50%" }} rules={[{ required: true }]}>
              <MoneyInput />
            </Form.Item>
            <Form.Item name="sellingPrice" label="Giá bán" style={{ width: "50%" }} rules={[{ required: true }]}>
              <MoneyInput />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="stock" label="Tồn kho" style={{ width: "50%" }} rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item name="lowStockThreshold" label="Ngưỡng sắp hết (mặc định)" style={{ width: "50%" }}>
              <InputNumber style={{ width: "100%" }} disabled />
            </Form.Item>
          </Space.Compact>
        </>
      )}
    </>
  );

  return (
    <>
      <Card
        title="Sản phẩm & Kho"
        className="page-card"
        extra={
          !isMobile && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Thêm sản phẩm
            </Button>
          )
        }
      >
        {isMobile ? (
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Tìm sản phẩm..."
            style={{ marginBottom: 14 }}
            actions={
              <SearchActionButton
                icon={<FilterOutlined />}
                onClick={() => setFilterOpen(true)}
                badgeCount={activeFilterCount}
              />
            }
          />
        ) : (
          <Space wrap style={{ marginBottom: 16 }}>
            <Input
              placeholder="Tìm theo tên hoặc mã sản phẩm"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 240 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Trạng thái tồn kho"
              allowClear
              style={{ width: 170 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </Space>
        )}

        {categoryChips}

        {isMobile ? (
          filtered.length === 0 ? (
            <Empty description="Không tìm thấy sản phẩm" />
          ) : (
            filtered.map((p) => {
              const st = statusConfig[getStockStatus(p)];
              const barcodes = getProductBarcodes(p);
              const barcodeSuffix =
                barcodes.length > 0
                  ? ` · 🏷️ ${barcodes[0]}${barcodes.length > 1 ? ` +${barcodes.length - 1}` : ""}`
                  : "";
              return (
                <MobileRow
                  key={p.id}
                  onClick={() => openEdit(p)}
                  leading={
                    <Avatar shape="square" size={44} src={getProductImage(p.name, p.image)} style={{ borderRadius: 10 }} />
                  }
                  title={p.name}
                  subtitle={`${categoryMap[p.categoryId] ?? "-"} · ${p.stock} ${p.unit}${barcodeSuffix}`}
                  trailing={formatVND(p.sellingPrice)}
                  extra={
                    <Space wrap>
                      <Tag color={st.color}>{st.label}</Tag>
                      {daysUntilExpiry(p.expiryDate) !== null && daysUntilExpiry(p.expiryDate)! <= 30 && (
                        <ExpiryTag expiryDate={p.expiryDate} />
                      )}
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                      />
                      <Popconfirm
                        title="Xóa sản phẩm này?"
                        onConfirm={(e) => { e?.stopPropagation(); handleDelete(p.id); }}
                        onCancel={(e) => e?.stopPropagation()}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                      </Popconfirm>
                    </Space>
                  }
                />
              );
            })
          )
        ) : (
          <Table
            rowKey="id"
            dataSource={filtered}
            size="middle"
            scroll={{ x: 1000 }}
            columns={[
              {
                title: "Ảnh",
                width: 60,
                render: (_, p) => <Avatar shape="square" size={40} src={getProductImage(p.name, p.image)} />,
              },
              { title: "Tên sản phẩm", dataIndex: "name" },
              { title: "Mã sản phẩm", dataIndex: "code" },
              { title: "Danh mục", dataIndex: "categoryId", render: (id) => categoryMap[id] ?? "-" },
              { title: "Đơn vị", dataIndex: "unit" },
              {
                title: "Mã vạch",
                render: (_, p) => {
                  const barcodes = getProductBarcodes(p);
                  if (barcodes.length === 0) return <span style={{ color: "#ccc" }}>—</span>;
                  return (
                    <span>
                      <code>{barcodes[0]}</code>
                      {barcodes.length > 1 && (
                        <Tag style={{ marginLeft: 6 }}>+{barcodes.length - 1}</Tag>
                      )}
                    </span>
                  );
                },
              },
              { title: "Giá nhập", dataIndex: "purchasePrice", render: formatVND },
              { title: "Giá bán", dataIndex: "sellingPrice", render: formatVND },
              { title: "Tồn kho", dataIndex: "stock" },
              {
                title: "HSD",
                dataIndex: "expiryDate",
                render: (v) => <ExpiryTag expiryDate={v} />,
                sorter: (a, b) => {
                  const av = a.expiryDate ? dayjs(a.expiryDate).valueOf() : Infinity;
                  const bv = b.expiryDate ? dayjs(b.expiryDate).valueOf() : Infinity;
                  return av - bv;
                },
              },
              {
                title: "Trạng thái",
                render: (_, p) => {
                  const st = statusConfig[getStockStatus(p)];
                  return <Tag color={st.color}>{st.label}</Tag>;
                },
              },
              {
                title: "Actions",
                width: 140,
                render: (_, p) => (
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(p)} />
                    <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(p.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {isMobile && <FAB icon={<PlusOutlined />} onClick={openAdd} />}

      {/* Bottom sheet lọc sản phẩm (chỉ mobile) */}
      <ResponsiveModal
        title="Lọc sản phẩm"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        footer={
          <SheetFormFooter
            cancelText="Xóa lọc"
            submitText="Áp dụng"
            onCancel={() => setStatusFilter(undefined)}
            onSubmit={() => setFilterOpen(false)}
          />
        }
      >
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Trạng thái tồn kho</div>
          <Select
            allowClear
            size="large"
            style={{ width: "100%" }}
            placeholder="Tất cả trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        footer={<SheetFormFooter onCancel={() => setOpen(false)} onSubmit={handleSubmit} />}
      >
        <Form form={form} layout="vertical">
          {formFields}
        </Form>
      </ResponsiveModal>

      <StockHistoryModal
        product={historyProduct}
        movements={stockMovements}
        open={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
      />

      <LossModal
        product={lossProduct}
        open={!!lossProduct}
        onClose={() => setLossProduct(null)}
        onSubmit={(reason, quantity, note) => {
          if (!lossProduct) return;
          recordLoss(lossProduct.id, reason, quantity, note);
          message.success("Đã ghi nhận hao hụt, tồn kho đã được cập nhật");
          setLossProduct(null);
        }}
      />
    </>
  );
};

export default Products;
