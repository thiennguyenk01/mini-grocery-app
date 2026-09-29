import React, { useState } from "react";
import { Card, Table, Button, Form, Input, Popconfirm, Space, message, Empty } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from "@ant-design/icons";
import { useAppData } from "../store/AppDataContext";
import { useIsMobile } from "../hooks/useIsMobile";
import ResponsiveModal from "../components/ResponsiveModal";
import SheetFormFooter from "../components/SheetFormFooter";
import MobileRow from "../components/MobileRow";
import FAB from "../components/FAB";
import type { Category } from "../types";

const Categories: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useAppData();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm<{ name: string }>();

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    form.setFieldsValue({ name: c.name });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      updateCategory(editing.id, values.name);
      message.success("Đã cập nhật danh mục");
    } else {
      addCategory(values.name);
      message.success("Đã thêm danh mục");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteCategory(id);
    message.success("Đã xóa danh mục");
  };

  return (
    <>
      <Card
        title="Danh mục sản phẩm"
        className="page-card"
        extra={
          !isMobile && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Thêm danh mục
            </Button>
          )
        }
      >
        {isMobile ? (
          categories.length === 0 ? (
            <Empty description="Chưa có danh mục nào" />
          ) : (
            categories.map((c) => (
              <MobileRow
                key={c.id}
                onClick={() => openEdit(c)}
                leading={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "#f0fdf4",
                      color: "#147f27",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    <TagsOutlined />
                  </div>
                }
                title={c.name}
                subtitle={`${products.filter((p) => p.categoryId === c.id).length} sản phẩm`}
                extra={
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                      Sửa
                    </Button>
                    <Popconfirm
                      title="Xóa danh mục này?"
                      onConfirm={(e) => { e?.stopPropagation(); handleDelete(c.id); }}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>
                        Xóa
                      </Button>
                    </Popconfirm>
                  </Space>
                }
              />
            ))
          )
        ) : (
          <Table
            rowKey="id"
            dataSource={categories}
            pagination={false}
            columns={[
              { title: "Tên danh mục", dataIndex: "name" },
              {
                title: "Số sản phẩm",
                render: (_, c) => products.filter((p) => p.categoryId === c.id).length,
              },
              {
                title: "Actions",
                width: 120,
                render: (_, c) => (
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(c)} />
                    <Popconfirm title="Xóa danh mục này?" onConfirm={() => handleDelete(c.id)}>
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

      <ResponsiveModal
        title={editing ? "Sửa danh mục" : "Thêm danh mục"}
        open={open}
        onClose={() => setOpen(false)}
        footer={<SheetFormFooter onCancel={() => setOpen(false)} onSubmit={handleSubmit} />}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: "Nhập tên danh mục" }]}>
            <Input placeholder="VD: Nước uống" size="large" />
          </Form.Item>
        </Form>
      </ResponsiveModal>
    </>
  );
};

export default Categories;
