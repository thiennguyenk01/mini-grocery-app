import { useCallback, useRef, type MutableRefObject } from "react";
import {
  BarcodeScanner,
  BarcodeFormat,
} from "@capacitor-mlkit/barcode-scanning";
import { message } from "antd";

// Các định dạng mã vạch thường gặp trên bao bì sản phẩm ở tạp hóa
// (EAN-13/EAN-8 là chuẩn phổ biến nhất tại VN, UPC cho hàng nhập, thêm
// CODE_128/CODE_39 và QR để không bị "kén" mã, quét được nhiều loại tem hơn).
const PRODUCT_BARCODE_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Code128,
  BarcodeFormat.Code39,
  BarcodeFormat.QrCode,
];

/**
 * Đảm bảo module quét mã vạch của Google (Google Barcode Scanner module, tải
 * qua Google Play Services) đã có trên máy. Ở lần dùng đầu tiên trên 1 điện
 * thoại, module này CHƯA có sẵn -> cần tải về (vài giây, cần mạng), các lần
 * sau sẽ có sẵn luôn, không cần tải lại.
 */
async function ensureGoogleModuleReady(): Promise<boolean> {
  try {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (available) return true;

    const hide = message.loading("Đang chuẩn bị bộ quét mã vạch (chỉ lần đầu)...", 0);
    try {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      // Cài đặt chạy nền, poll lại vài lần chờ Play Services cài xong.
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const check = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (check.available) return true;
      }
      return false;
    } finally {
      hide();
    }
  } catch {
    // Không lấy được trạng thái module (ví dụ chạy trên trình duyệt web khi
    // dev bằng `npm run dev`, không phải app Android thật) -> coi như không
    // dùng được, để nơi gọi tự xử lý fallback.
    return false;
  }
}

interface UseBarcodeScannerResult {
  /** Mở camera quét 1 mã vạch, trả về chuỗi mã vạch, hoặc null nếu hủy/lỗi. */
  scanOnce: () => Promise<string | null>;
  scanningRef: MutableRefObject<boolean>;
}

export function useBarcodeScanner(): UseBarcodeScannerResult {
  const scanningRef = useRef(false);

  const scanOnce = useCallback(async () => {
    if (scanningRef.current) return null;
    scanningRef.current = true;
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        message.error("Thiết bị này không hỗ trợ quét mã vạch.");
        return null;
      }

      const moduleReady = await ensureGoogleModuleReady();
      if (!moduleReady) {
        message.error(
          "Không chuẩn bị được bộ quét mã vạch. Kiểm tra Google Play Services / kết nối mạng rồi thử lại."
        );
        return null;
      }

      const result = await BarcodeScanner.scan({ formats: PRODUCT_BARCODE_FORMATS });
      const first = result.barcodes[0];
      if (!first) return null; // người dùng bấm back / hủy, không có mã nào
      return (first.rawValue || first.displayValue || "").trim() || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Người dùng tự hủy quét (bấm back) cũng rơi vào catch trên 1 số máy -
      // không cần làm phiền bằng thông báo lỗi trong trường hợp đó.
      if (!/cancel/i.test(msg)) {
        message.error("Quét mã vạch thất bại: " + msg);
      }
      return null;
    } finally {
      scanningRef.current = false;
    }
  }, []);

  return { scanOnce, scanningRef };
}
