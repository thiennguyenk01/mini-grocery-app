/**
 * PinSecurityService - abstraction cho việc lưu/kiểm tra PIN.
 *
 * QUAN TRỌNG: dữ liệu PIN được lưu ở 2 key localStorage RIÊNG BIỆT (pinSecurity,
 * pinLockoutState), KHÔNG nằm trong danh sách STORAGE_KEYS mà AppDataContext dùng để
 * reset dữ liệu mẫu / xoá trắng dữ liệu (xem src/store/AppDataContext.tsx). Vì vậy khi
 * người dùng "Đặt lại dữ liệu mẫu" hoặc "Xoá trắng dữ liệu", PIN KHÔNG bị ảnh hưởng -
 * đúng yêu cầu "PIN Lock phải độc lập với business data".
 *
 * Hiện project chưa cài plugin secure storage/Keychain/Android Keystore của Capacitor,
 * nên bản này dùng localStorage + băm PBKDF2 (xem pinCrypto.ts) làm giải pháp mặc định.
 * Nhờ được thiết kế qua interface `PinSecurityService`, sau này có thể thay thế bằng 1
 * implementation khác (ví dụ dùng @capacitor/preferences + Android Keystore) mà không
 * cần sửa bất kỳ nơi nào khác đang dùng `pinSecurityService`.
 */
import { loadState, saveState } from "../utils/storage";
import { derivePinHash, generateSaltHex, timingSafeEqualHex } from "./pinCrypto";

const PIN_KEY = "pinSecurity";
const LOCKOUT_KEY = "pinLockoutState";

/** Sau mỗi 3 lần sai liên tiếp, khoá tạm thời - thời gian khoá tăng dần theo các mốc này (giây). */
const LOCKOUT_STAGES_SECONDS = [30, 60, 120, 300, 900];
const ATTEMPTS_PER_LOCKOUT_STAGE = 3;

interface StoredPin {
  saltHex: string;
  hashHex: string;
}

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms, null = không bị khoá
}

export interface PinSecurityService {
  isEnabled(): boolean;
  setPin(pin: string): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;
  changePin(oldPin: string, newPin: string): Promise<boolean>;
  disablePin(pin: string): Promise<boolean>;
  /** Trạng thái giới hạn số lần thử - dùng để hiển thị đếm ngược trên màn hình khoá. */
  getLockoutState(): LockoutState;
}

class LocalPinSecurityService implements PinSecurityService {
  private getStored(): StoredPin | null {
    return loadState<StoredPin | null>(PIN_KEY, null);
  }

  isEnabled(): boolean {
    return this.getStored() !== null;
  }

  async setPin(pin: string): Promise<void> {
    const saltHex = generateSaltHex();
    const hashHex = await derivePinHash(pin, saltHex);
    saveState<StoredPin | null>(PIN_KEY, { saltHex, hashHex });
    this.resetAttempts();
  }

  async verifyPin(pin: string): Promise<boolean> {
    const stored = this.getStored();
    if (!stored) return false;

    // Đang trong thời gian khoá tạm thời -> từ chối luôn, không tính thêm lượt sai.
    const lockout = this.getLockoutState();
    if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) return false;

    const hashHex = await derivePinHash(pin, stored.saltHex);
    const ok = timingSafeEqualHex(hashHex, stored.hashHex);

    if (ok) this.resetAttempts();
    else this.registerFailedAttempt(lockout);

    return ok;
  }

  async changePin(oldPin: string, newPin: string): Promise<boolean> {
    const ok = await this.verifyPin(oldPin);
    if (!ok) return false;
    await this.setPin(newPin);
    return true;
  }

  async disablePin(pin: string): Promise<boolean> {
    const ok = await this.verifyPin(pin);
    if (!ok) return false;
    saveState<StoredPin | null>(PIN_KEY, null);
    this.resetAttempts();
    return true;
  }

  getLockoutState(): LockoutState {
    return loadState<LockoutState>(LOCKOUT_KEY, { failedAttempts: 0, lockedUntil: null });
  }

  private resetAttempts(): void {
    saveState<LockoutState>(LOCKOUT_KEY, { failedAttempts: 0, lockedUntil: null });
  }

  private registerFailedAttempt(current: LockoutState): void {
    const failedAttempts = current.failedAttempts + 1;
    let lockedUntil: number | null = current.lockedUntil;

    if (failedAttempts % ATTEMPTS_PER_LOCKOUT_STAGE === 0) {
      const stageIndex = Math.min(
        failedAttempts / ATTEMPTS_PER_LOCKOUT_STAGE - 1,
        LOCKOUT_STAGES_SECONDS.length - 1
      );
      lockedUntil = Date.now() + LOCKOUT_STAGES_SECONDS[stageIndex] * 1000;
    }

    saveState<LockoutState>(LOCKOUT_KEY, { failedAttempts, lockedUntil });
  }
}

export const pinSecurityService: PinSecurityService = new LocalPinSecurityService();
