import React, { useRef, useState } from "react";
import { Card, Button, Space, Modal, message, Popconfirm, Alert } from "antd";
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppData } from "../store/AppDataContext";
import { validateBackup, readFileAsText, downloadTextFile } from "../services/backupService";
import { toCsv } from "../utils/csv";
import { formatVND } from "../utils/format";
import { EXPENSE_CATEGORY_LABELS } from "../types";
import type { BackupPayload } from "../types";

const Data: React.FC = () => {
  const {
    products,
    sales,
    purchases,
    stockMovements,
    expenses,
    debts,
    exportBackup,
    restoreBackup,
    resetAllData,
  } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleBackup = () => {
    const backup = exportBackup();
    const filename = `taphoa-backup-${dayjs().format("YYYYMMDD-HHmm")}.json`;
    downloadTextFile(filename, JSON.stringify(backup, null, 2), "application/json");
    message.success("Đã tải file sao lưu");
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng 1 file lần sau
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text);
      const result = validateBackup(parsed);
      if (!result.valid) {
        message.error(result.error);
        return;
      }
      setPendingBackup(result.backup);
    } catch {
      message.error("File backup không hợp lệ.");
    }
  };

  const confirmRestore = () => {
    if (!pendingBackup) return;
    setRestoring(true);
    restoreBackup(pendingBackup);
    setRestoring(false);
    setPendingBackup(null);
    message.success("Đã khôi phục dữ liệu thành công");
  };

  const handleExportCsv = (
    kind: "products" | "sales" | "purchases" | "stockMovements" | "expenses" | "debts"
  ) => {
    let csv = "";
    const filenamePrefix = `taphoa-${kind}-${dayjs().format("YYYYMMDD")}`;

    if (kind === "products") {
      csv = toCsv(products, [
        { header: "Tên sản phẩm", value: (p) => p.name },
        { header: "Tồn kho", value: (p) => p.stock },
        { header: "Đơn vị", value: (p) => p.unit },
        { header: "Giá nhập", value: (p) => p.purchasePrice },
        { header: "Giá bán", value: (p) => p.sellingPrice },
      ]);
    } else if (kind === "sales") {
      csv = toCsv(sales, [
        { header: "Mã đơn", value: (s) => s.code },
        { header: "Ngày", value: (s) => dayjs(s.date).format("DD/MM/YYYY HH:mm") },
        { header: "Số dòng", value: (s) => s.items.length },
        { header: "Tổng tiền", value: (s) => s.total },
        { header: "Thanh toán", value: (s) => (s.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản") },
      ]);
    } else if (kind === "purchases") {
      csv = toCsv(purchases, [
        { header: "Mã phiếu", value: (p) => p.code },
        { header: "Ngày", value: (p) => dayjs(p.date).format("DD/MM/YYYY HH:mm") },
        { header: "Số dòng", value: (p) => p.items.length },
        { header: "Tổng tiền", value: (p) => p.total },
      ]);
    } else if (kind === "stockMovements") {
      csv = toCsv(stockMovements, [
        { header: "Thời gian", value: (m) => dayjs(m.createdAt).format("DD/MM/YYYY HH:mm") },
        { header: "Sản phẩm ID", value: (m) => m.productId },
        { header: "Loại", value: (m) => m.type },
        { header: "Số lượng", value: (m) => m.quantity },
        { header: "Tồn trước", value: (m) => m.beforeStock },
        { header: "Tồn sau", value: (m) => m.afterStock },
        { header: "Lý do", value: (m) => m.reason ?? "" },
      ]);
    } else if (kind === "expenses") {
      csv = toCsv(expenses, [
        { header: "Thời gian", value: (e) => dayjs(e.createdAt).format("DD/MM/YYYY HH:mm") },
        { header: "Loại chi phí", value: (e) => EXPENSE_CATEGORY_LABELS[e.category] },
        { header: "Số tiền", value: (e) => e.amount },
        { header: "Ghi chú", value: (e) => e.note ?? "" },
      ]);
    } else {
      csv = toCsv(debts, [
        { header: "Khách hàng", value: (d) => d.customerName },
        { header: "SĐT", value: (d) => d.phone ?? "" },
        { header: "Tổng nợ", value: (d) => d.totalPurchase },
        { header: "Đã trả", value: (d) => d.totalPaid },
        { header: "Còn nợ", value: (d) => d.totalPurchase - d.totalPaid },
      ]);
    }

    downloadTextFile(`${filenamePrefix}.csv`, csv, "text/csv;charset=utf-8");
    message.success("Đã tải file CSV");
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <Card className="page-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <DatabaseOutlined style={{ fontSize: 20, color: "#147f27" }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>Sao lưu &amp; khôi phục</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#8c8c8c" }}>
          App lưu dữ liệu ngay trên máy này (offline) - không có server nào giữ hộ. Hãy sao lưu
          định kỳ để không mất dữ liệu khi đổi điện thoại hoặc lỡ xóa app.
        </div>
      </Card>

      <Card className="page-card" title="Sao lưu dữ liệu" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 12 }}>
          Tải xuống 1 file JSON chứa toàn bộ sản phẩm, đơn bán, phiếu nhập, công nợ, chi phí,
          lịch sử kho... - có thể dùng file này để khôi phục lại sau này hoặc chuyển sang máy khác.
        </div>
        <Button block type="primary" icon={<CloudDownloadOutlined />} onClick={handleBackup}>
          Sao lưu dữ liệu (tải file JSON)
        </Button>
      </Card>

      <Card className="page-card" title="Khôi phục dữ liệu" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 12 }}>
          Chọn 1 file JSON đã sao lưu trước đó để khôi phục lại dữ liệu.
        </div>
        <Button block icon={<CloudUploadOutlined />} onClick={handlePickFile}>
          Chọn file sao lưu (.json)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </Card>

      <Card className="page-card" title="Xuất dữ liệu ra CSV" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 12 }}>
          Xuất từng loại dữ liệu ra file CSV để mở bằng Excel/Google Sheets.
        </div>
        <Space wrap>
          <Button icon={<FileTextOutlined />} onClick={() => handleExportCsv("products")}>
            Sản phẩm
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => handleExportCsv("sales")}>
            Bán hàng
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => handleExportCsv("purchases")}>
            Nhập hàng
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => handleExportCsv("stockMovements")}>
            Lịch sử kho
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => handleExportCsv("expenses")}>
            Chi phí
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => handleExportCsv("debts")}>
            Công nợ
          </Button>
        </Space>
      </Card>

      <Card className="page-card" title="Xóa toàn bộ dữ liệu">
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12, borderRadius: 10 }}
          message="Chỉ dùng khi thật sự muốn bắt đầu lại từ đầu. Hãy sao lưu trước khi xóa."
        />
        <Popconfirm
          title="Xóa toàn bộ dữ liệu?"
          description="Toàn bộ sản phẩm, đơn hàng, công nợ, chi phí... sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
          okText="Xóa toàn bộ"
          okButtonProps={{ danger: true }}
          cancelText="Hủy"
          onConfirm={() => {
            resetAllData();
            message.success("Đã xóa toàn bộ dữ liệu");
          }}
        >
          <Button block danger icon={<DeleteOutlined />}>
            Xóa toàn bộ dữ liệu
          </Button>
        </Popconfirm>
      </Card>

      <Modal
        title="Xác nhận khôi phục dữ liệu"
        open={!!pendingBackup}
        onCancel={() => setPendingBackup(null)}
        onOk={confirmRestore}
        okText="Khôi phục"
        okButtonProps={{ danger: true, loading: restoring }}
        cancelText="Hủy"
      >
        {pendingBackup && (
          <div>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12, borderRadius: 10 }}
              message="Dữ liệu hiện tại sẽ được thay thế hoàn toàn bằng dữ liệu trong file này."
            />
            <div style={{ fontSize: 13, color: "#475569" }}>
              <div>Ngày sao lưu: {dayjs(pendingBackup.createdAt).format("HH:mm DD/MM/YYYY")}</div>
              <div>Số sản phẩm: {pendingBackup.data.products.length}</div>
              <div>Số đơn bán: {pendingBackup.data.sales.length}</div>
              <div>Số phiếu nhập: {pendingBackup.data.purchases.length}</div>
              <div>
                Tổng doanh thu trong file:{" "}
                {formatVND(pendingBackup.data.sales.reduce((s, x) => s + x.total, 0))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Data;
