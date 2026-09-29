import React, { useEffect, useState } from "react";
import { Modal } from "antd";

const PIN_LENGTH = 4;

interface PinPadModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  errorText?: string | null;
  onSubmit: (pin: string) => void | Promise<void>;
  onClose: () => void;
}

/**
 * Modal bàn phím số dùng chung cho các bước "Tạo PIN / Xác nhận PIN / Nhập PIN hiện tại"
 * trong trang Bảo mật. Chỉ chứa UI nhập liệu - toàn bộ logic xác thực từng bước do trang
 * Security.tsx (component cha) điều phối qua props title/subtitle/errorText/onSubmit.
 */
const PinPadModal: React.FC<PinPadModalProps> = ({
  open,
  title,
  subtitle,
  errorText,
  onSubmit,
  onClose,
}) => {
  const [digits, setDigits] = useState("");
  const [shake, setShake] = useState(false);

  // Mỗi khi modal mở lại hoặc chuyển sang bước khác (title đổi) -> xoá input cũ.
  useEffect(() => {
    if (open) setDigits("");
  }, [open, title]);

  useEffect(() => {
    if (!errorText) return;
    setShake(true);
    setDigits("");
    const t = setTimeout(() => setShake(false), 400);
    return () => clearTimeout(t);
  }, [errorText]);

  const press = async (d: string) => {
    const next = (digits + d).slice(0, PIN_LENGTH);
    setDigits(next);
    if (next.length === PIN_LENGTH) {
      await onSubmit(next);
    }
  };

  const backspace = () => setDigits((d) => d.slice(0, -1));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      width={320}
      styles={{ body: { padding: "24px 12px 8px" } }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12.5, color: "#8c8c8c", marginBottom: 8 }}>{subtitle}</div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            margin: "16px 0 8px",
            animation: shake ? "pin-shake 0.4s" : undefined,
          }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: i < digits.length ? "#147f27" : "#e5e7eb",
                transition: "background .15s",
              }}
            />
          ))}
        </div>

        <div style={{ height: 18, marginBottom: 4 }}>
          {errorText && <div style={{ color: "#dc2626", fontSize: 13 }}>{errorText}</div>}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 8,
            maxWidth: 240,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <button key={n} onClick={() => press(n)} style={lightKeyStyle}>
              {n}
            </button>
          ))}
          <div />
          <button onClick={() => press("0")} style={lightKeyStyle}>
            0
          </button>
          <button onClick={backspace} style={{ ...lightKeyStyle, fontSize: 13 }}>
            Xóa
          </button>
        </div>
      </div>
    </Modal>
  );
};

const lightKeyStyle: React.CSSProperties = {
  aspectRatio: "1",
  borderRadius: "50%",
  border: "1px solid #f0f0f0",
  background: "#fafafa",
  fontSize: 20,
  fontWeight: 600,
  cursor: "pointer",
  color: "#1f2933",
};

export default PinPadModal;
