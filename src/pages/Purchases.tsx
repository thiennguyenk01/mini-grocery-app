import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  Space,
  Segmented,
  Divider,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined, QrcodeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import { useAppData } from "../store/AppDataContext";
import { formatVND } from "../utils/format";
import { useIsMobile } from "../hooks/useIsMobile";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { nextProductCode, DEFAULT_LOW_STOCK_THRESHOLD } from "../utils/productCode";
import ResponsiveModal from "../components/ResponsiveModal";
import DateBoxInput from "../components/DateBoxInput";
import SearchBar, { SearchActionButton } from "../components/SearchBar";
import SheetFormFooter from "../components/SheetFormFooter";
import DateGroupedList from "../components/DateGroupedList";
import FAB from "../components/FAB";
import MoneyInput from "../components/MoneyInput";
import PurchaseDetailModal from "../components/PurchaseDetailModal";
import type { Purchase } from "../types";

const NEW_PRODUCT_OPTION = "__new__";

interface ItemFormValue {
  productId: string;
  mode?: "manual" | "case";
  quantity?: number;
  caseCount?: number;
  caseSize?: number;
  totalAmount?: number; // Tổng tiền đã trả cho CẢ dòng này (không phải đơn giá)
  expiryDate?: string;
  barcode?: string; // Mã vạch RIÊNG của lô hàng này (khác lô khác có thể khác mã)
}

interface QuickAddFormValue {
  name: string;
  categoryId: string;
  unit: string;
}

/** Số lượng thực tế của 1 dòng nhập hàng, tùy theo đang nhập lẻ hay nhập theo thùng. */
function getEffectiveQty(it: ItemFormValue | undefined): number {
  if (!it) return 0;
  if (it.mode === "case") return (it.caseCount || 0) * (it.caseSize || 0);
  return it.quantity || 0;
}

/** Đơn giá suy ra từ tổng tiền / số lượng - dùng để lưu giá vốn từng sản phẩm như trước. */
function getUnitPrice(it: ItemFormValue | undefined): number {
  const qty = getEffectiveQty(it);
  if (!it || qty <= 0) return 0;
  return Math.round((it.totalAmount || 0) / qty);
}

const Purchases: React.FC = () => {
  const { purchases, products, categories, units, suppliers, addUnit, addPurchase, addProduct, addCategory } =
    useAppData();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { scanOnce } = useBarcodeScanner();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<{ supplierId?: string; items: ItemFormValue[] }>();
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);

  // Thêm sản phẩm mới ngay trong lúc nhập hàng (khi chưa có sẵn trong danh sách)
  const [quickAddField, setQuickAddField] = useState<number | null>(null);
  const [quickForm] = Form.useForm<QuickAddFormValue>();
  const [newCatName, setNewCatName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");

  /** Segmented "Nhập lẻ / Theo thùng" + input tương ứng cho 1 dòng sản phẩm trong phiếu nhập. */
  const renderQtySection = (field: { name: number; key: React.Key }, size: "large" | "middle", withLabel: boolean) => (
    <div style={{ marginBottom: withLabel ? 8 : 0 }} key={`qty-${field.key}`}>
      {withLabel && <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 14 }}>Số lượng nhập</div>}
      <Form.Item name={[field.name, "mode"]} initialValue="manual" noStyle>
        <Segmented
          size="small"
          options={[
            { label: "Nhập lẻ", value: "manual" },
            { label: "Theo thùng", value: "case" },
          ]}
          style={{ marginBottom: 6 }}
        />
      </Form.Item>
      <Form.Item shouldUpdate noStyle>
        {() => {
          const currentItems: ItemFormValue[] = form.getFieldValue("items") || [];
          const mode = currentItems[field.name]?.mode || "manual";
          const product = products.find((p) => p.id === currentItems[field.name]?.productId);
          const unitLabel = product?.unit ?? "sản phẩm";
          return mode === "case" ? (
            <>
              <Space.Compact block>
                <Form.Item
                  name={[field.name, "caseCount"]}
                  rules={[{ required: true, message: "Số thùng" }]}
                  style={{ width: "50%", marginBottom: 0 }}
                >
                  <InputNumber size={size} min={0} placeholder="Số thùng" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name={[field.name, "caseSize"]}
                  rules={[{ required: true, message: "SL/thùng" }]}
                  style={{ width: "50%", marginBottom: 0 }}
                >
                  <InputNumber size={size} min={0} placeholder="1 thùng = ?" style={{ width: "100%" }} />
                </Form.Item>
              </Space.Compact>
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                = {getEffectiveQty(currentItems[field.name])} {unitLabel}
              </div>
            </>
          ) : (
            <Form.Item
              name={[field.name, "quantity"]}
              rules={[{ required: true, message: "Số lượng" }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber size={size} min={1} placeholder="Số lượng" style={{ width: "100%" }} />
            </Form.Item>
          );
        }}
      </Form.Item>
    </div>
  );

  const sortedPurchases = useMemo(
    () => [...purchases].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()),
    [purchases]
  );

  const openModal = () => {
    form.resetFields();
    setOpen(true);
  };

  // Nếu được điều hướng từ trang Bán hàng sau khi quét 1 mã vạch chưa tồn tại trong bất kỳ lô
  // hàng nào -> tự mở sẵn phiếu nhập với 1 dòng, điền sẵn mã vạch đó, để nhập ngay lô hàng mới.
  useEffect(() => {
    const barcodeFromScan = (location.state as { newBarcode?: string } | null)?.newBarcode;
    if (barcodeFromScan) {
      openModal();
      form.setFieldsValue({ items: [{ mode: "manual", barcode: barcodeFromScan } as ItemFormValue] });
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Đặt lại productId của dòng đang chờ (do hủy, hoặc vừa thêm xong sản phẩm mới). */
  const setLineProductId = (fieldName: number, productId: string | undefined) => {
    const items = [...(form.getFieldValue("items") || [])];
    items[fieldName] = { ...items[fieldName], productId };
    form.setFieldsValue({ items });
  };

  const openQuickAdd = (fieldName: number) => {
    quickForm.resetFields();
    setNewCatName("");
    setNewUnitName("");
    setQuickAddField(fieldName);
  };

  const closeQuickAdd = () => {
    if (quickAddField !== null) setLineProductId(quickAddField, undefined);
    setQuickAddField(null);
  };

  const handleAddCategoryInline = () => {
    const name = newCatName.trim();
    if (!name) return;
    const id = addCategory(name);
    quickForm.setFieldsValue({ categoryId: id });
    setNewCatName("");
  };

  const handleAddUnitInline = () => {
    const name = newUnitName.trim();
    if (!name) return;
    addUnit(name);
    quickForm.setFieldsValue({ unit: name });
    setNewUnitName("");
  };

  const handleScanBarcodeForLine = async (fieldName: number) => {
    const code = await scanOnce();
    if (!code) return;
    const items = [...(form.getFieldValue("items") || [])];
    items[fieldName] = { ...items[fieldName], barcode: code };
    form.setFieldsValue({ items });
  };

  const handleQuickAddSubmit = async () => {
    const values = await quickForm.validateFields();
    const newId = addProduct({
      name: values.name,
      code: nextProductCode(products),
      categoryId: values.categoryId,
      unit: values.unit,
      purchasePrice: 0,
      sellingPrice: 0,
      stock: 0,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    });
    if (quickAddField !== null) setLineProductId(quickAddField, newId);
    message.success("Đã thêm sản phẩm mới - nhớ vào trang Sản phẩm đặt giá bán nhé!");
    setQuickAddField(null);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const items = (values.items || [])
      .map((it) => ({
        productId: it?.productId,
        quantity: getEffectiveQty(it),
        purchasePrice: getUnitPrice(it),
        expiryDate: it?.expiryDate,
        barcode: it?.barcode,
      }))
      .filter((it) => it.productId && it.productId !== NEW_PRODUCT_OPTION && it.quantity > 0 && it.purchasePrice > 0);
    if (items.length === 0) {
      message.warning("Vui lòng chọn sản phẩm, nhập số lượng và số tiền nhập");
      return;
    }
    addPurchase(items, values.supplierId);
    message.success("Đã lưu phiếu nhập, tồn kho đã được cập nhật");
    setOpen(false);
  };

  const productOptions = [
    { label: "+ Thêm sản phẩm mới", value: NEW_PRODUCT_OPTION },
    ...products.map((p) => ({ label: p.name, value: p.id })),
  ];
  const productFilterOption = (input: string, option?: { label: string; value: string }) =>
    option?.value === NEW_PRODUCT_OPTION || option!.label.toLowerCase().includes(input.toLowerCase());

  return (
    <>
      <Card
        title="Lịch sử nhập hàng"
        className="page-card"
        extra={
          !isMobile && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
              Tạo phiếu nhập
            </Button>
          )
        }
      >
        {isMobile ? (
          <DateGroupedList
            items={sortedPurchases}
            getDate={(r) => r.date}
            emptyText="Chưa có phiếu nhập nào"
            renderItem={(r) => (
              <div
                onClick={() => setDetailPurchase(r)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 0",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "#1f2933" }}>
                  <b>{dayjs(r.date).format("HH:mm")}</b>{" "}
                  <span style={{ color: "#374151" }}>{r.code}</span>
                  <span style={{ color: "#9ca3af" }}> · {r.items.length} sản phẩm</span>
                </span>
                <b>{formatVND(r.total)}</b>
              </div>
            )}
          />
        ) : (
          <Table
            rowKey="id"
            dataSource={sortedPurchases}
            columns={[
              { title: "Ngày nhập", dataIndex: "date", render: (d) => dayjs(d).format("HH:mm DD/MM/YYYY") },
              {
                title: "Mã phiếu",
                dataIndex: "code",
                render: (code, r) => (
                  <Button type="link" style={{ padding: 0 }} onClick={() => setDetailPurchase(r)}>
                    {code}
                  </Button>
                ),
              },
              {
                title: "Số sản phẩm",
                render: (_, r) => r.items.length,
              },
              { title: "Tổng tiền", dataIndex: "total", render: formatVND },
            ]}
          />
        )}
      </Card>

      {isMobile && <FAB icon={<PlusOutlined />} onClick={openModal} />}

      <ResponsiveModal
        title="Tạo phiếu nhập hàng"
        open={open}
        onClose={() => setOpen(false)}
        width={680}
        footer={<SheetFormFooter submitText="Lưu phiếu" onCancel={() => setOpen(false)} onSubmit={handleSubmit} />}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplierId" label="Nhà cung cấp (không bắt buộc)">
            <Select
              allowClear
              placeholder="Chọn nhà cung cấp"
              options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
              notFoundContent="Chưa có nhà cung cấp nào - thêm ở mục Nhà cung cấp"
            />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, idx) =>
                  isMobile ? (
                    <div
                      key={field.key}
                      style={{
                        background: "#fafafa",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 12,
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: "#8c8c8c" }}>Sản phẩm #{idx + 1}</span>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                      </div>
                      <Form.Item
                        {...field}
                        name={[field.name, "productId"]}
                        label="Tên sản phẩm"
                        rules={[{ required: true, message: "Chọn sản phẩm" }]}
                        style={{ marginBottom: 8 }}
                      >
                        <Select
                          size="large"
                          placeholder="Chọn sản phẩm"
                          showSearch
                          optionFilterProp="label"
                          filterOption={productFilterOption}
                          options={productOptions}
                          onChange={(val) => {
                            if (val === NEW_PRODUCT_OPTION) openQuickAdd(field.name);
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "totalAmount"]}
                        label="Số tiền nhập (tổng tiền cả dòng, không phải đơn giá)"
                        rules={[{ required: true, message: "Nhập số tiền" }]}
                        style={{ marginBottom: 8 }}
                      >
                        <MoneyInput size="large" placeholder="VD: 500.000" />
                      </Form.Item>
                      {renderQtySection(field, "large", true)}
                      <Form.Item label="Mã vạch lô này (không bắt buộc)" style={{ marginBottom: 8, marginTop: 8 }}>
                        <Form.Item name={[field.name, "barcode"]} noStyle>
                          <SearchBar
                            size="large"
                            icon={<QrcodeOutlined style={{ color: "#9ca3af" }} />}
                            placeholder="Nhập tay hoặc quét mã"
                            actions={
                              <SearchActionButton
                                icon={<QrcodeOutlined />}
                                size="large"
                                onClick={() => handleScanBarcodeForLine(field.name)}
                              />
                            }
                          />
                        </Form.Item>
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "expiryDate"]}
                        label="Hạn sử dụng lô này (không bắt buộc)"
                        style={{ marginBottom: 0 }}
                      >
                        <DateBoxInput size="large" />
                      </Form.Item>
                    </div>
                  ) : (
                    <div
                      key={field.key}
                      style={{ background: "#fafafa", borderRadius: 10, padding: 10, marginBottom: 10 }}
                    >
                      <Space align="start" style={{ display: "flex", marginBottom: 4 }} wrap>
                        <Form.Item
                          {...field}
                          name={[field.name, "productId"]}
                          rules={[{ required: true, message: "Chọn sản phẩm" }]}
                          style={{ width: 200, marginBottom: 8 }}
                        >
                          <Select
                            placeholder="Tên sản phẩm"
                            showSearch
                            optionFilterProp="label"
                            filterOption={productFilterOption}
                            options={productOptions}
                            onChange={(val) => {
                              if (val === NEW_PRODUCT_OPTION) openQuickAdd(field.name);
                            }}
                          />
                        </Form.Item>
                        <div style={{ width: 210 }}>{renderQtySection(field, "middle", false)}</div>
                        <Form.Item
                          {...field}
                          name={[field.name, "totalAmount"]}
                          rules={[{ required: true, message: "Số tiền nhập" }]}
                          style={{ width: 150, marginBottom: 8 }}
                        >
                          <MoneyInput placeholder="Tổng tiền dòng này" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, "expiryDate"]}
                          style={{ width: 230, marginBottom: 8 }}
                        >
                          <DateBoxInput />
                        </Form.Item>
                        <Form.Item name={[field.name, "barcode"]} style={{ width: 210, marginBottom: 8 }} noStyle>
                          <SearchBar
                            size="middle"
                            icon={<QrcodeOutlined style={{ color: "#9ca3af" }} />}
                            placeholder="Mã vạch lô (nếu có)"
                            style={{ width: 210 }}
                            actions={
                              <SearchActionButton
                                icon={<QrcodeOutlined />}
                                size="middle"
                                onClick={() => handleScanBarcodeForLine(field.name)}
                              />
                            }
                          />
                        </Form.Item>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          style={{ marginLeft: 6 }}
                          onClick={() => remove(field.name)}
                        />
                      </Space>
                    </div>
                  )
                )}
                <Button type="dashed" block size={isMobile ? "large" : "middle"} icon={<PlusOutlined />} onClick={() => add()}>
                  Thêm sản phẩm
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const items: ItemFormValue[] = form.getFieldValue("items") || [];
              const total = items.reduce((sum, it) => sum + (it?.totalAmount || 0), 0);
              return (
                <div style={{ textAlign: "right", fontWeight: 600, fontSize: 16, marginTop: 16 }}>
                  Tổng tiền: {formatVND(total)}
                </div>
              );
            }}
          </Form.Item>
        </Form>
      </ResponsiveModal>

      <ResponsiveModal
        title="Thêm sản phẩm mới"
        open={quickAddField !== null}
        onClose={closeQuickAdd}
        footer={<SheetFormFooter submitText="Thêm" onCancel={closeQuickAdd} onSubmit={handleQuickAddSubmit} />}
      >
        <Form form={quickForm} layout="vertical">
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: "Nhập tên sản phẩm" }]}>
            <Input size="large" placeholder="VD: Mì Hảo Hảo" />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: "Chọn hoặc thêm danh mục" }]}>
            <Select
              size="large"
              placeholder="Chọn danh mục"
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <Space.Compact style={{ width: "100%", padding: "0 8px 8px" }}>
                    <Input
                      placeholder="Danh mục mới"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                    <Button type="primary" onClick={handleAddCategoryInline}>
                      Thêm
                    </Button>
                  </Space.Compact>
                </>
              )}
            />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true, message: "Chọn đơn vị" }]}>
            <Select
              size="large"
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
        </Form>
      </ResponsiveModal>

      <PurchaseDetailModal
        purchase={detailPurchase}
        open={!!detailPurchase}
        onClose={() => setDetailPurchase(null)}
        products={products}
      />
    </>
  );
};

export default Purchases;
