import React, { useState } from "react";
import { Card, Switch, Radio, Button, Space, Alert, message } from "antd";
import { LockOutlined, SafetyOutlined } from "@ant-design/icons";
import { usePinLock, type AutoLockMinutes } from "../store/PinLockContext";
import PinPadModal from "../components/PinPadModal";

type FlowKind = "enable" | "change" | "disable" | null;

const FLOW_STEPS: Record<Exclude<FlowKind, null>, { title: string; subtitle?: string }[]> = {
  enable: [
    { title: "Tạo mã PIN", subtitle: "Nhập 4 chữ số" },
    { title: "Xác nhận mã PIN", subtitle: "Nhập lại để xác nhận" },
  ],
  change: [
    { title: "Nhập PIN hiện tại" },
    { title: "Nhập PIN mới", subtitle: "Nhập 4 chữ số" },
    { title: "Xác nhận PIN mới" },
  ],
  disable: [{ title: "Nhập PIN hiện tại", subtitle: "Để xác nhận tắt khoá PIN" }],
};

const AUTO_LOCK_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Ngay lập tức" },
  { value: 1, label: "1 phút" },
  { value: 5, label: "5 phút" },
  { value: 15, label: "15 phút" },
  { value: -1, label: "Không tự động khoá" },
];

const Security: React.FC = () => {
  const { enabled, autoLockMinutes, setAutoLockMinutes, enablePin, changePin, disablePin, verifyPin, lockNow } =
    usePinLock();

  const [flow, setFlow] = useState<FlowKind>(null);
  const [step, setStep] = useState(0);
  const [collected, setCollected] = useState<string[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);

  const startFlow = (kind: Exclude<FlowKind, null>) => {
    setFlow(kind);
    setStep(0);
    setCollected([]);
    setModalError(null);
  };

  const closeFlow = () => {
    setFlow(null);
    setStep(0);
    setCollected([]);
    setModalError(null);
  };

  const handleSubmitStep = async (pin: string) => {
    setModalError(null);

    if (flow === "enable") {
      if (step === 0) {
        setCollected([pin]);
        setStep(1);
        return;
      }
      // step 1: xác nhận
      if (pin !== collected[0]) {
        setModalError("Mã PIN xác nhận không khớp, thử lại từ đầu");
        setStep(0);
        setCollected([]);
        return;
      }
      await enablePin(pin);
      message.success("Đã bật khoá PIN cho ứng dụng");
      closeFlow();
      return;
    }

    if (flow === "change") {
      if (step === 0) {
        const ok = await verifyPin(pin);
        if (!ok) {
          setModalError("PIN hiện tại không chính xác");
          return;
        }
        setCollected([pin]);
        setStep(1);
        setModalError(null);
        return;
      }
      if (step === 1) {
        setCollected([collected[0], pin]);
        setStep(2);
        return;
      }
      // step 2: xác nhận PIN mới
      if (pin !== collected[1]) {
        setModalError("Mã PIN mới xác nhận không khớp, nhập lại");
        setStep(1);
        setCollected([collected[0]]);
        return;
      }
      const ok = await changePin(collected[0], pin);
      if (ok) {
        message.success("Đổi PIN thành công");
        closeFlow();
      } else {
        message.error("Có lỗi xảy ra, vui lòng thử lại");
        closeFlow();
      }
      return;
    }

    if (flow === "disable") {
      const ok = await disablePin(pin);
      if (ok) {
        message.success("Đã tắt khoá PIN");
        closeFlow();
      } else {
        setModalError("PIN không chính xác");
      }
    }
  };

  const stepInfo = flow ? FLOW_STEPS[flow][step] : null;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <Card className="page-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#ecfdf5",
                color: "#147f27",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              <LockOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Khoá ứng dụng bằng PIN</div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                Yêu cầu nhập mã PIN mỗi khi mở app
              </div>
            </div>
          </div>
          <Switch
            checked={enabled}
            onChange={(checked) => (checked ? startFlow("enable") : startFlow("disable"))}
          />
        </div>
      </Card>

      {enabled && (
        <>
          <Card className="page-card" style={{ marginBottom: 16 }} title="Khoá ứng dụng sau">
            <Radio.Group
              value={autoLockMinutes === null ? -1 : autoLockMinutes}
              onChange={(e) => {
                const v = e.target.value as number;
                setAutoLockMinutes((v === -1 ? null : v) as AutoLockMinutes);
              }}
            >
              <Space direction="vertical" size={10}>
                {AUTO_LOCK_OPTIONS.map((o) => (
                  <Radio key={o.value} value={o.value}>
                    {o.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 10 }}>
              Chỉ tính thời gian khi app bị chuyển xuống nền - chuyển qua lại giữa các màn hình
              trong app không bị khoá lại.
            </div>
          </Card>

          <Card className="page-card" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }} size={10}>
              <Button block onClick={() => startFlow("change")}>
                Đổi PIN
              </Button>
              <Button block danger onClick={() => startFlow("disable")}>
                Tắt PIN
              </Button>
              <Button block icon={<LockOutlined />} onClick={lockNow}>
                Khoá ngay
              </Button>
            </Space>
          </Card>
        </>
      )}

      <Alert
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ borderRadius: 12 }}
        message="An toàn dữ liệu"
        description="Mã PIN chỉ dùng để khoá màn hình, không ảnh hưởng tới sản phẩm, đơn hàng, công nợ hay bất kỳ dữ liệu nào khác của cửa hàng. PIN được lưu dưới dạng mã hoá (hash), ứng dụng không lưu và không thể xem lại PIN gốc của bạn."
      />

      <PinPadModal
        open={flow !== null}
        title={stepInfo?.title ?? ""}
        subtitle={stepInfo?.subtitle}
        errorText={modalError}
        onSubmit={handleSubmitStep}
        onClose={closeFlow}
      />
    </div>
  );
};

export default Security;
