import React, { useState } from "react";
import { Card, Table, Tag, List, Button, Input, Form, message, Empty, Space } from "antd";
import { UserOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { formatVND } from "../utils/format";
import { useIsMobile } from "../hooks/useIsMobile";
import ResponsiveModal from "../components/ResponsiveModal";
import SheetFormFooter from "../components/SheetFormFooter";
import MobileRow from "../components/MobileRow";
import MoneyInput from "../components/MoneyInput";
import FAB from "../components/FAB";
import type { Debt } from "../types";

interface DebtFormValues {
  customerName: string;
  phone?: string;
  totalPurchase: number;
}

const Debts: React.FC = () => {
  const { debts, payDebt, addDebt, updateDebt } = useAppData();
  const isMobile = useIsMobile();
  const [viewing, setViewing] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);
  const [editing, setEditing] = useState<Debt | "new" | null>(null);
  const [payForm] = Form.useForm<{ amount: number; note?: string }>();
  const [debtForm] = Form.useForm<DebtFormValues>();

  // Lịch sử thanh toán đã được unshift (mới nhất trước) ngay từ AppDataContext,
  // sort lại 1 lần nữa cho chắc chắn.
  const sortHistory = (d: Debt) =>
    [...d.history].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

  const handlePay = async () => {
    if (!paying) return;
    const values = await payForm.validateFields();
    payDebt(paying.id, values.amount, values.note);
    message.success("Đã ghi nhận thanh toán công nợ");
    setPaying(null);
    setViewing(null);
  };

  const openPay = (d: Debt) => {
    setPaying(d);
    payForm.resetFields();
  };

  const openAddDebt = () => {
    setEditing("new");
    debtForm.resetFields();
  };

  const openEditDebt = (d: Debt) => {
    setEditing(d);
    debtForm.setFieldsValue({ customerName: d.customerName, phone: d.phone, totalPurchase: d.totalPurchase });
  };

  const handleSaveDebt = async () => {
    const values = await debtForm.validateFields();
    if (editing === "new") {
      addDebt(values.customerName, values.phone, values.totalPurchase);
      message.success("Đã thêm khách hàng công nợ");
    } else if (editing) {
      updateDebt(editing.id, values);
      message.success("Đã cập nhật thông tin công nợ");
      if (viewing && viewing.id === editing.id) setViewing({ ...viewing, ...values });
    }
    setEditing(null);
  };

  return (
    <>
      <Card
        title="Công nợ khách hàng"
        className="page-card"
        extra={
          !isMobile && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddDebt}>
              Thêm khách hàng
            </Button>
          )
        }
      >
        {isMobile ? (
          debts.length === 0 ? (
            <Empty description="Chưa có công nợ nào" />
          ) : (
            debts.map((d) => {
              const remaining = d.totalPurchase - d.totalPaid;
              return (
                <MobileRow
                  key={d.id}
                  onClick={() => setViewing(d)}
                  leading={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        background: "#fff7ed",
                        color: "#ea580c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      <UserOutlined />
                    </div>
                  }
                  title={d.customerName}
                  subtitle={`Tổng mua ${formatVND(d.totalPurchase)}`}
                  trailing={formatVND(remaining)}
                  trailingSub={remaining <= 0 ? "Đã trả hết" : "Còn nợ"}
                  extra={
                    <Space wrap>
                      {remaining > 0 && (
                        <Button
                          size="small"
                          type="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPay(d);
                          }}
                        >
                          Thanh toán
                        </Button>
                      )}
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDebt(d);
                        }}
                      >
                        Sửa
                      </Button>
                    </Space>
                  }
                />
              );
            })
          )
        ) : (
          <Table
            rowKey="id"
            dataSource={debts}
            onRow={(d) => ({ onClick: () => setViewing(d), style: { cursor: "pointer" } })}
            columns={[
              { title: "Khách hàng", dataIndex: "customerName" },
              { title: "Tổng mua", dataIndex: "totalPurchase", render: formatVND },
              { title: "Đã trả", dataIndex: "totalPaid", render: formatVND },
              {
                title: "Còn nợ",
                render: (_, d) => formatVND(d.totalPurchase - d.totalPaid),
              },
              {
                title: "Trạng thái",
                render: (_, d) =>
                  d.totalPurchase - d.totalPaid <= 0 ? (
                    <Tag color="green">Đã trả hết</Tag>
                  ) : (
                    <Tag color="red">Còn nợ</Tag>
                  ),
              },
              {
                title: "Action",
                render: (_, d) => (
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type="primary"
                      disabled={d.totalPurchase - d.totalPaid <= 0}
                      onClick={() => openPay(d)}
                    >
                      Thanh toán
                    </Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEditDebt(d)} />
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {isMobile && <FAB icon={<PlusOutlined />} onClick={openAddDebt} />}

      <ResponsiveModal
        title={viewing?.customerName ?? "Chi tiết công nợ"}
        open={!!viewing}
        onClose={() => setViewing(null)}
        width={420}
      >
        {viewing && (
          <>
            <p>Tổng mua: <b>{formatVND(viewing.totalPurchase)}</b></p>
            <p>Đã trả: <b>{formatVND(viewing.totalPaid)}</b></p>
            <p>Còn nợ: <b style={{ color: "#ef4444" }}>{formatVND(viewing.totalPurchase - viewing.totalPaid)}</b></p>
            {viewing.phone && <p>SĐT: {viewing.phone}</p>}
            <h4 style={{ marginTop: 16 }}>Lịch sử thanh toán</h4>
            <List
              dataSource={sortHistory(viewing)}
              locale={{ emptyText: "Chưa có lịch sử thanh toán" }}
              renderItem={(h) => (
                <List.Item>
                  <span>{dayjs(h.date).format("DD/MM/YYYY")} {h.note ? `· ${h.note}` : ""}</span>
                  <b>{formatVND(h.amount)}</b>
                </List.Item>
              )}
            />
            <Space.Compact block style={{ marginTop: 16 }}>
              <Button size="large" icon={<EditOutlined />} onClick={() => openEditDebt(viewing)} style={{ width: "35%" }}>
                Sửa
              </Button>
              <Button
                type="primary"
                size="large"
                style={{ width: "65%" }}
                disabled={viewing.totalPurchase - viewing.totalPaid <= 0}
                onClick={() => openPay(viewing)}
              >
                Thanh toán công nợ
              </Button>
            </Space.Compact>
          </>
        )}
      </ResponsiveModal>

      <ResponsiveModal
        title={`Thanh toán công nợ - ${paying?.customerName ?? ""}`}
        open={!!paying}
        onClose={() => setPaying(null)}
        footer={<SheetFormFooter submitText="Xác nhận" onCancel={() => setPaying(null)} onSubmit={handlePay} />}
      >
        <p style={{ marginBottom: 16 }}>
          Số tiền cần thanh toán:{" "}
          <b style={{ color: "#ef4444" }}>
            {formatVND((paying?.totalPurchase ?? 0) - (paying?.totalPaid ?? 0))}
          </b>
        </p>
        <Form form={payForm} layout="vertical">
          <Form.Item
            name="amount"
            label="Số tiền thanh toán"
            rules={[
              { required: true, message: "Nhập số tiền khách trả" },
              {
                validator: (_, value) => {
                  const remaining = (paying?.totalPurchase ?? 0) - (paying?.totalPaid ?? 0);
                  if (value != null && value > remaining) {
                    return Promise.reject(new Error("Không được vượt quá số tiền còn nợ"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <MoneyInput size="large" placeholder="Nhập số tiền khách trả" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input size="large" placeholder="VD: Trả lần 3" />
          </Form.Item>
        </Form>
      </ResponsiveModal>

      <ResponsiveModal
        title={editing === "new" ? "Thêm khách hàng công nợ" : `Sửa thông tin: ${editing?.customerName ?? ""}`}
        open={!!editing}
        onClose={() => setEditing(null)}
        footer={<SheetFormFooter onCancel={() => setEditing(null)} onSubmit={handleSaveDebt} />}
      >
        <Form form={debtForm} layout="vertical">
          <Form.Item name="customerName" label="Tên khách hàng" rules={[{ required: true, message: "Nhập tên khách hàng" }]}>
            <Input size="large" placeholder="VD: Chị Lan" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại (không bắt buộc)">
            <Input size="large" placeholder="09xxxxxxxx" />
          </Form.Item>
          <Form.Item
            name="totalPurchase"
            label={editing === "new" ? "Số tiền nợ ban đầu" : "Tổng mua (sửa nếu ghi sai số)"}
            rules={[{ required: true, message: "Nhập số tiền" }]}
          >
            <MoneyInput size="large" />
          </Form.Item>
        </Form>
      </ResponsiveModal>
    </>
  );
};

export default Debts;
