import React, { useEffect, useRef, useState } from "react";
import { Input } from "antd";
import type { InputRef } from "antd";
import dayjs from "dayjs";

interface DateBoxInputProps {
  /** Ngày dạng chuỗi ISO (ví dụ "2026-10-04T00:00:00.000+07:00"). Bỏ trống = chưa nhập. */
  value?: string;
  /** Gọi với chuỗi ISO khi cả 3 ô tạo thành 1 ngày HỢP LỆ, ngược lại gọi với `undefined`. */
  onChange?: (value?: string) => void;
  size?: "large" | "middle" | "small";
  disabled?: boolean;
}

const onlyDigits = (s: string, max: number) => s.replace(/\D/g, "").slice(0, max);

/** Ghép 3 ô thành ISO nếu là ngày có thật (không nhận 31/02, tháng 13...), ngược lại `undefined`. */
function toIso(day: string, month: string, year: string): string | undefined {
  if (!day || !month || year.length !== 4) return undefined;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return undefined;
  return dayjs(date).toISOString(); // 00:00 giờ địa phương - cùng ngữ nghĩa với DatePicker trước đây
}

/**
 * Nhập ngày bằng tay theo dạng 3 ô riêng: [Ngày] / [Tháng] / [Năm] - thay cho DatePicker dạng
 * lịch. Chỉ nhận chữ số (bàn phím số trên điện thoại), tự nhảy sang ô kế tiếp khi đủ chữ số,
 * Backspace ở ô trống sẽ lùi về ô trước. Hoạt động như 1 control bình thường của antd Form
 * (nhận `value`/`onChange` trực tiếp, không cần `normalize`/`getValueProps`).
 */
const DateBoxInput: React.FC<DateBoxInputProps> = ({ value, onChange, size = "middle", disabled }) => {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const dayRef = useRef<InputRef>(null);
  const monthRef = useRef<InputRef>(null);
  const yearRef = useRef<InputRef>(null);

  // Đồng bộ khi `value` bị đổi từ bên ngoài (form reset, đặt giá trị sẵn...). Chỉ ghi đè các ô khi
  // giá trị ngoài KHÁC với thứ 3 ô đang biểu diễn - nhờ vậy không xóa mất phần người dùng đang gõ dở.
  useEffect(() => {
    if (value === toIso(day, month, year)) return;
    if (!value) {
      setDay("");
      setMonth("");
      setYear("");
      return;
    }
    const d = dayjs(value);
    setDay(d.format("DD"));
    setMonth(d.format("MM"));
    setYear(d.format("YYYY"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (d: string, m: string, y: string) => onChange?.(toIso(d, m, y));

  const filledAll = day !== "" && month !== "" && year.length === 4;
  const invalid = filledAll && toIso(day, month, year) === undefined;
  const status = invalid ? "error" : undefined;

  const boxStyle: React.CSSProperties = { textAlign: "center" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      <Input
        ref={dayRef}
        size={size}
        status={status}
        disabled={disabled}
        inputMode="numeric"
        placeholder="Ngày"
        maxLength={2}
        value={day}
        style={{ ...boxStyle, flex: 1 }}
        onChange={(e) => {
          const v = onlyDigits(e.target.value, 2);
          setDay(v);
          emit(v, month, year);
          if (v.length === 2) monthRef.current?.focus();
        }}
      />
      <span style={{ color: "#bfbfbf" }}>/</span>
      <Input
        ref={monthRef}
        size={size}
        status={status}
        disabled={disabled}
        inputMode="numeric"
        placeholder="Tháng"
        maxLength={2}
        value={month}
        style={{ ...boxStyle, flex: 1 }}
        onChange={(e) => {
          const v = onlyDigits(e.target.value, 2);
          setMonth(v);
          emit(day, v, year);
          if (v.length === 2) yearRef.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && month === "") dayRef.current?.focus();
        }}
      />
      <span style={{ color: "#bfbfbf" }}>/</span>
      <Input
        ref={yearRef}
        size={size}
        status={status}
        disabled={disabled}
        inputMode="numeric"
        placeholder="Năm"
        maxLength={4}
        value={year}
        style={{ ...boxStyle, flex: 1.4 }}
        onChange={(e) => {
          const v = onlyDigits(e.target.value, 4);
          setYear(v);
          emit(day, month, v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && year === "") monthRef.current?.focus();
        }}
      />
    </div>
  );
};

export default DateBoxInput;
