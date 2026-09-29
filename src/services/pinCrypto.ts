/**
 * Các hàm băm/mã hoá PIN dùng Web Crypto API (SubtleCrypto) - có sẵn trong mọi WebView hiện đại
 * (kể cả Capacitor Android) mà không cần cài thêm plugin gốc nào.
 *
 * PIN không bao giờ được lưu ở dạng chữ số thường. Thay vào đó:
 * 1. Sinh 1 "salt" ngẫu nhiên (khác nhau mỗi lần đặt PIN).
 * 2. Băm PIN + salt bằng PBKDF2-SHA256 với số vòng lặp lớn (làm chậm brute-force).
 * 3. Chỉ lưu salt + kết quả băm (hash) - không thể suy ngược ra PIN gốc.
 */

const PBKDF2_ITERATIONS = 150_000;
const HASH_BITS = 256;
const SALT_BYTES = 16;

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** Sinh salt ngẫu nhiên (hex) - dùng crypto.getRandomValues, không dùng Math.random(). */
export function generateSaltHex(): string {
  const arr = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

/** Băm PIN với salt cho trước bằng PBKDF2-SHA256. Trả về chuỗi hex, không phải PIN gốc. */
export async function derivePinHash(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const saltBytes = hexToBuf(saltHex);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BITS
  );
  return bufToHex(bits);
}

/** So sánh 2 chuỗi hex theo thời gian không đổi (timing-safe) - tránh lộ thông tin qua thời gian xử lý. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
