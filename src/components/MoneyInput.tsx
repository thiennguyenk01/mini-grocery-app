import React, { useEffect, useState } from "react";
import { Input } from "antd";

interface MoneyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  size?: "large" | "middle" | "small";
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

/** Chỉ giữ lại chữ số, rồi chèn dấu chấm ngăn cách hàng nghìn */
const formatDigits = (digits: string): string => {
  if (!digits) return "";
  // bỏ số 0 thừa ở đầu (trừ khi cả chuỗi toàn số 0)
  const trimmed = digits.replace(/^0+(?=\d)/, "");
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Ô nhập tiền dùng chung cho toàn bộ app (giá nhập, giá bán, công nợ...).
 * Là 1 <Input> text thuần (KHÔNG dùng antd InputNumber) để tự định dạng dấu
 * chấm ngăn cách hàng nghìn NGAY KHI GÕ (không phải đợi bấm ra ngoài mới format) -
 * antd InputNumber + formatter trên WebView Android đôi khi chỉ áp dụng format
 * sau khi blur, gây khó chịu khi nhập số tiền lớn.
 * value/onChange vẫn là number như InputNumber để tương thích với Form của antd.
 */
const MoneyInput: React.FC<MoneyInputProps> = ({ value, onChange, style, ...rest }) => {
  const [display, setDisplay] = useState<string>(() =>
    value != null ? formatDigits(String(value)) : ""
  );

  // Đồng bộ khi value được set từ bên ngoài (VD form.setFieldsValue khi mở sửa)
  useEffect(() => {
    const digits = value != null && value !== 0 ? String(value) : value === 0 ? "0" : "";
    setDisplay(formatDigits(digits));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setDisplay(formatDigits(digitsOnly));
    onChange?.(digitsOnly ? Number(digitsOnly) : 0);
  };

  return (
    <Input
      {...rest}
      style={{ width: "100%", textAlign: "right", ...style }}
      value={display}
      onChange={handleChange}
      inputMode="numeric"
      addonAfter="đ"
      placeholder={rest.placeholder ?? "0"}
    />
  );
};

export default MoneyInput;
