import React, { useMemo, useState } from "react";
import { Card, Button, Input, Form, Space, Empty, Popconfirm, message, Statistic, Row, Col } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { formatVND } from "../utils/format";
import { useIsMobile } from "../hooks/useIsMobile";
import ResponsiveModal from "../components/ResponsiveModal";
import SheetFormFooter from "../components/SheetFormFooter";
import MobileRow from "../components/MobileRow";
import FAB from "../components/FAB";
import type { Supplier } from "../types";

interface SupplierFormValues {
  name: string;
  phone?: string;
  address?: string;
  note?: string;
}

const Suppliers: React.FC = () => {
  const { suppliers, purchases, addSupplier, updateSupplier, deleteSupplier } = useAppData();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [form] = Form.useForm<SupplierFormValues>();

  /** Tổng tiền nhập + số lần nhập từ mỗi nhà cung cấp - tính trực tiếp từ lịch sử Purchase. */
  const statsBySupplier = useMemo(() => {
    const map = new Map<string, { total: number; count: number; purchases: typeof purchases }>();
    purchases.forEach((p) => {
      if (!p.supplierId) return;
      const cur = map.get(p.supplierId) ?? { total: 0, count: 0, purchases: [] };
      cur.total += p.total;
      cur.count += 1;
      cur.purchases.push(p);
      map.set(p.supplierId, cur);
    });
    return map;
  }, [purchases]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (s: Supplier, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditing(s);
    form.setFieldsValue(s);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateSupplier(editing.id, values);
      message.success("Đã cập nhật nhà cung cấp");
    } else {
      addSupplier(values);
      message.success("Đã thêm nhà cung cấp");
    }
    setOpen(false);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    deleteSupplier(id);
    message.success("Đã xóa nhà cung cấp");
  };

  return (
    <>
      <Card
        title="Nhà cung cấp"
        className="page-card"
        extra={
          !isMobile && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Thêm nhà cung cấp
            </Button>
          )
        }
      >
        {suppliers.length === 0 ? (
          <Empty description="Chưa có nhà cung cấp nào" />
        ) : isMobile ? (
          suppliers.map((s) => {
            const stat = statsBySupplier.get(s.id);
            return (
              <MobileRow
                key={s.id}
                onClick={() => setDetail(s)}
                title={s.name}
                subtitle={s.phone ? `📞 ${s.phone}` : "Chưa có SĐT"}
                trailing={stat ? formatVND(stat.total) : "—"}
                extra={
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={(e) => openEdit(s, e)} />
                    <Popconfirm
                      title="Xóa nhà cung cấp này?"
                      onConfirm={(e) => handleDelete(s.id, e as unknown as React.MouseEvent)}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  </Space>
                }
              />
            );
          })
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suppliers.map((s) => {
              const stat = statsBySupplier.get(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => setDetail(s)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#fafafa",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                      {s.phone ? `📞 ${s.phone}` : "Chưa có SĐT"} · {stat?.count ?? 0} lần nhập
                    </div>
                  </div>
                  <Space>
                    <b>{stat ? formatVND(stat.total) : "—"}</b>
                    <Button size="small" icon={<EditOutlined />} onClick={(e) => openEdit(s, e)} />
                    <Popconfirm title="Xóa nhà cung cấp này?" onConfirm={() => handleDelete(s.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  </Space>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {isMobile && <FAB icon={<PlusOutlined />} onClick={openAdd} />}

      <ResponsiveModal
        title={editing ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
        open={open}
        onClose={() => setOpen(false)}
        footer={<SheetFormFooter onCancel={() => setOpen(false)} onSubmit={handleSubmit} />}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên nhà cung cấp" rules={[{ required: true, message: "Nhập tên" }]}>
            <Input size="large" placeholder="VD: Đại lý Coca-Cola khu vực" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input size="large" prefix={<PhoneOutlined />} placeholder="09xxxxxxxx" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input size="large" placeholder="Không bắt buộc" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Không bắt buộc" />
          </Form.Item>
        </Form>
      </ResponsiveModal>

      <ResponsiveModal title={detail?.name ?? ""} open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <Row gutter={12} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Tổng tiền đã nhập"
                  value={statsBySupplier.get(detail.id)?.total ?? 0}
                  formatter={(v) => formatVND(Number(v))}
                />
              </Col>
              <Col span={12}>
                <Statistic title="Số lần nhập" value={statsBySupplier.get(detail.id)?.count ?? 0} />
              </Col>
            </Row>
            {detail.phone && <div style={{ marginBottom: 6 }}>📞 {detail.phone}</div>}
            {detail.address && <div style={{ marginBottom: 6 }}>📍 {detail.address}</div>}
            {detail.note && <div style={{ marginBottom: 12, color: "#8c8c8c" }}>{detail.note}</div>}
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Lịch sử nhập hàng</div>
            {(statsBySupplier.get(detail.id)?.purchases ?? []).length === 0 ? (
              <Empty description="Chưa có phiếu nhập nào" />
            ) : (
              [...(statsBySupplier.get(detail.id)?.purchases ?? [])]
                .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
                .map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <span>
                      {p.code} · {dayjs(p.date).format("DD/MM/YYYY")}
                    </span>
                    <b>{formatVND(p.total)}</b>
                  </div>
                ))
            )}
          </div>
        )}
      </ResponsiveModal>
    </>
  );
};

export default Suppliers;
