import React, { useMemo, useState } from "react";
import { Card, Button, Select, Input, Form, Space, Empty, Popconfirm, message, Statistic } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { formatVND } from "../utils/format";
import { useIsMobile } from "../hooks/useIsMobile";
import ResponsiveModal from "../components/ResponsiveModal";
import SheetFormFooter from "../components/SheetFormFooter";
import MobileRow from "../components/MobileRow";
import FAB from "../components/FAB";
import MoneyInput from "../components/MoneyInput";
import DateGroupedList from "../components/DateGroupedList";
import { EXPENSE_CATEGORY_LABELS, type Expense, type ExpenseCategory } from "../types";

interface ExpenseFormValues {
  category: ExpenseCategory;
  amount: number;
  note?: string;
}

const CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
  value: value as ExpenseCategory,
  label,
}));

const Expenses: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppData();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form] = Form.useForm<ExpenseFormValues>();

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    [expenses]
  );

  const thisMonthTotal = useMemo(
    () =>
      expenses
        .filter((e) => dayjs(e.createdAt).isSame(dayjs(), "month"))
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    form.setFieldsValue(e);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateExpense(editing.id, values);
      message.success("Đã cập nhật chi phí");
    } else {
      addExpense(values);
      message.success("Đã thêm chi phí");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    message.success("Đã xóa chi phí");
  };

  return (
    <>
      <Card
        title="Chi phí"
        className="page-card"
        extra={
          !isMobile && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Thêm chi phí
            </Button>
          )
        }
      >
        <Statistic
          title="Tổng chi phí tháng này"
          value={thisMonthTotal}
          formatter={(v) => formatVND(Number(v))}
          valueStyle={{ color: "#dc2626", marginBottom: 16 }}
          style={{ marginBottom: 16 }}
        />

        {sorted.length === 0 ? (
          <Empty description="Chưa có khoản chi phí nào" />
        ) : isMobile ? (
          <DateGroupedList
            items={sorted}
            getDate={(e) => e.createdAt}
            emptyText="Chưa có khoản chi phí nào"
            renderItem={(e) => (
              <MobileRow
                onClick={() => openEdit(e)}
                title={EXPENSE_CATEGORY_LABELS[e.category]}
                subtitle={e.note || dayjs(e.createdAt).format("HH:mm")}
                trailing={formatVND(e.amount)}
                extra={
                  <Popconfirm
                    title="Xóa khoản chi này?"
                    onConfirm={(ev) => {
                      ev?.stopPropagation();
                      handleDelete(e.id);
                    }}
                    onCancel={(ev) => ev?.stopPropagation()}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={(ev) => ev.stopPropagation()} />
                  </Popconfirm>
                }
              />
            )}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#fafafa",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{EXPENSE_CATEGORY_LABELS[e.category]}</div>
                  <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                    {dayjs(e.createdAt).format("HH:mm DD/MM/YYYY")}
                    {e.note ? ` · ${e.note}` : ""}
                  </div>
                </div>
                <Space>
                  <b style={{ color: "#dc2626" }}>-{formatVND(e.amount)}</b>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(e)} />
                  <Popconfirm title="Xóa khoản chi này?" onConfirm={() => handleDelete(e.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isMobile && <FAB icon={<PlusOutlined />} onClick={openAdd} />}

      <ResponsiveModal
        title={editing ? "Sửa chi phí" : "Thêm chi phí"}
        open={open}
        onClose={() => setOpen(false)}
        footer={<SheetFormFooter onCancel={() => setOpen(false)} onSubmit={handleSubmit} />}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category" label="Loại chi phí" rules={[{ required: true, message: "Chọn loại" }]}>
            <Select size="large" options={CATEGORY_OPTIONS} placeholder="Chọn loại chi phí" />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true, message: "Nhập số tiền" }]}>
            <MoneyInput size="large" placeholder="VD: 500.000" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input size="large" placeholder="Không bắt buộc" />
          </Form.Item>
        </Form>
      </ResponsiveModal>
    </>
  );
};

export default Expenses;
