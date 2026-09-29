import React, { useEffect, useState } from "react";
import { usePinLock } from "../store/PinLockContext";
import logo from "../assets/logo.png";

const PIN_LENGTH = 4;
const SHOP_NAME = "Tạp Hóa Nga Cư";

/**
 * Màn hình nhập PIN toàn màn hình khi mở app / khi bị auto-lock.
 * - Nền gradient xanh trùng màu thương hiệu (giống header Trang chủ).
 * - Bàn phím số lớn, không dùng bàn phím mặc định của điện thoại.
 * - Tự động xác thực khi nhập đủ số chữ số, rung nhẹ + hiệu ứng lắc khi sai.
 * - Không hiển thị PIN dạng số thật, chỉ hiện chấm tròn.
 */
const PinLockScreen: React.FC = () => {
  const { verifyPin, getLockoutState } = usePinLock();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setLockedUntil(getLockoutState().lockedUntil);
  }, [getLockoutState]);

  // Đếm ngược thời gian khoá tạm thời (nếu có) và tự mở lại khi hết hạn.
  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        setError(null);
      }
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const remainingSec = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;
  const isLockedOut = remainingSec > 0;

  const handlePress = async (d: string) => {
    if (isLockedOut || checking) return;
    setError(null);
    const next = (digits + d).slice(0, PIN_LENGTH);
    setDigits(next);

    if (next.length === PIN_LENGTH) {
      setChecking(true);
      const ok = await verifyPin(next);
      if (!ok) {
        setError("Mã PIN không chính xác");
        setShake(true);
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => setShake(false), 400);
        setDigits("");
        setLockedUntil(getLockoutState().lockedUntil);
      }
      setChecking(false);
    }
  };

  const handleBackspace = () => {
    if (isLockedOut) return;
    setError(null);
    setDigits((d) => d.slice(0, -1));
  };

  const keys: (string | null)[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", null, "0", "back"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "linear-gradient(160deg, #16a34a 0%, #0d5c1c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        padding: "24px 24px max(24px, env(safe-area-inset-bottom, 0px))",
        paddingTop: "max(24px, env(safe-area-inset-top, 0px))",
        boxSizing: "border-box",
      }}
    >
      <img
        src={logo}
        alt="Logo"
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.35)",
          marginBottom: 14,
          objectFit: "cover",
        }}
      />
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{SHOP_NAME}</div>
      <div style={{ fontSize: 13.5, opacity: 0.9, marginBottom: 26, textAlign: "center" }}>
        {isLockedOut
          ? `Nhập sai nhiều lần - thử lại sau ${remainingSec}s`
          : "Nhập mã PIN để tiếp tục"}
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 14,
          animation: shake ? "pin-shake 0.4s" : undefined,
        }}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: i < digits.length ? "#fff" : "rgba(255,255,255,0.3)",
              transition: "background .15s",
            }}
          />
        ))}
      </div>

      <div style={{ height: 20, marginBottom: 12 }}>
        {error && !isLockedOut && (
          <div style={{ color: "#fecaca", fontSize: 13 }}>{error}</div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
          width: "100%",
          maxWidth: 280,
        }}
      >
        {keys.map((k, i) => {
          if (k === null) return <div key={i} />;
          if (k === "back") {
            return (
              <button
                key={i}
                onClick={handleBackspace}
                disabled={isLockedOut}
                style={{ ...keyStyle, fontSize: 14, opacity: isLockedOut ? 0.4 : 1 }}
              >
                Xóa
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handlePress(k)}
              disabled={isLockedOut}
              style={{ ...keyStyle, opacity: isLockedOut ? 0.4 : 1 }}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const keyStyle: React.CSSProperties = {
  aspectRatio: "1",
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,0.16)",
  color: "#fff",
  fontSize: 24,
  fontWeight: 600,
  cursor: "pointer",
};

export default PinLockScreen;
