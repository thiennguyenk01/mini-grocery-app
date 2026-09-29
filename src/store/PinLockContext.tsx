import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { pinSecurityService, type LockoutState } from "../services/PinSecurityService";
import { loadState, saveState } from "../utils/storage";

/** Số phút để tự khoá khi app chuyển background. 0 = ngay lập tức, null = không tự động khoá. */
export type AutoLockMinutes = 0 | 1 | 5 | 15 | null;

const AUTO_LOCK_KEY = "pinAutoLockMinutes";
const DEFAULT_AUTO_LOCK: AutoLockMinutes = 1;

interface PinLockContextValue {
  /** true khi đã đọc xong trạng thái PIN từ storage - tránh nháy màn hình lúc khởi động. */
  ready: boolean;
  enabled: boolean;
  isLocked: boolean;
  autoLockMinutes: AutoLockMinutes;
  setAutoLockMinutes: (minutes: AutoLockMinutes) => void;
  verifyPin: (pin: string) => Promise<boolean>;
  enablePin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  disablePin: (pin: string) => Promise<boolean>;
  lockNow: () => void;
  getLockoutState: () => LockoutState;
}

const PinLockContext = createContext<PinLockContextValue | null>(null);

export const PinLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [autoLockMinutes, setAutoLockMinutesState] = useState<AutoLockMinutes>(DEFAULT_AUTO_LOCK);
  // Mốc thời gian app bị đưa xuống nền - dùng để tính đã "background" bao lâu khi quay lại.
  const hiddenAtRef = useRef<number | null>(null);

  // Đọc trạng thái PIN 1 lần khi app khởi động (cold start): nếu đã bật PIN thì bắt buộc
  // phải khoá ngay từ đầu, không cho vào thẳng dữ liệu cửa hàng.
  useEffect(() => {
    const isEnabled = pinSecurityService.isEnabled();
    const savedAutoLock = loadState<AutoLockMinutes>(AUTO_LOCK_KEY, DEFAULT_AUTO_LOCK);
    setEnabled(isEnabled);
    setAutoLockMinutes_(savedAutoLock);
    setIsLocked(isEnabled);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setAutoLockMinutes_(m: AutoLockMinutes) {
    setAutoLockMinutesState(m);
  }

  // Theo dõi khi app chuyển ra nền (tab ẩn / app Android bị minimize) và quay lại.
  // Chỉ khoá lại nếu thời gian ở nền vượt quá cấu hình auto-lock - việc chuyển qua lại
  // giữa các MÀN HÌNH trong app (route change) không kích hoạt sự kiện này nên không bị khoá.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (!enabled) return;
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt == null) return;
      if (autoLockMinutes === null) return; // "Không tự động khoá"

      const elapsedMs = Date.now() - hiddenAt;
      if (autoLockMinutes === 0 || elapsedMs >= autoLockMinutes * 60_000) {
        setIsLocked(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, autoLockMinutes]);

  const verifyPin = useCallback(async (pin: string) => {
    const ok = await pinSecurityService.verifyPin(pin);
    if (ok) setIsLocked(false);
    return ok;
  }, []);

  const enablePin = useCallback(async (pin: string) => {
    await pinSecurityService.setPin(pin);
    setEnabled(true);
  }, []);

  const changePin = useCallback(async (oldPin: string, newPin: string) => {
    return pinSecurityService.changePin(oldPin, newPin);
  }, []);

  const disablePin = useCallback(async (pin: string) => {
    const ok = await pinSecurityService.disablePin(pin);
    if (ok) setEnabled(false);
    return ok;
  }, []);

  const lockNow = useCallback(() => {
    setIsLocked((prev) => {
      // Chỉ khoá được nếu PIN đang bật - tránh tự khoá app khi chưa cấu hình PIN
      // (sẽ không có màn hình nào để nhập PIN thoát ra).
      return enabled ? true : prev;
    });
  }, [enabled]);

  const setAutoLockMinutes = useCallback((minutes: AutoLockMinutes) => {
    setAutoLockMinutesState(minutes);
    saveState(AUTO_LOCK_KEY, minutes);
  }, []);

  const getLockoutState = useCallback(() => pinSecurityService.getLockoutState(), []);

  return (
    <PinLockContext.Provider
      value={{
        ready,
        enabled,
        isLocked,
        autoLockMinutes,
        setAutoLockMinutes,
        verifyPin,
        enablePin,
        changePin,
        disablePin,
        lockNow,
        getLockoutState,
      }}
    >
      {children}
    </PinLockContext.Provider>
  );
};

export function usePinLock(): PinLockContextValue {
  const ctx = useContext(PinLockContext);
  if (!ctx) throw new Error("usePinLock phải được dùng bên trong PinLockProvider");
  return ctx;
}
