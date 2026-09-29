import React from "react";
import { Button } from "antd";

interface SheetFormFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  cancelText?: string;
  submitText?: string;
  loading?: boolean;
  danger?: boolean;
}

const SheetFormFooter: React.FC<SheetFormFooterProps> = ({
  onCancel,
  onSubmit,
  cancelText = "Hủy",
  submitText = "Lưu",
  loading,
  danger,
}) => (
  <div style={{ display: "flex", gap: 10 }}>
    <Button block size="large" onClick={onCancel} style={{ height: 46 }}>
      {cancelText}
    </Button>
    <Button
      block
      size="large"
      type="primary"
      danger={danger}
      loading={loading}
      onClick={onSubmit}
      style={{ height: 46 }}
    >
      {submitText}
    </Button>
  </div>
);

export default SheetFormFooter;
