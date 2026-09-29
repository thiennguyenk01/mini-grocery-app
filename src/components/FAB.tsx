import React from "react";
import { Button } from "antd";

interface FABProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
}

/** Floating Action Button - luôn nổi ở góc phải dưới, trên thanh bottom nav */
const FAB: React.FC<FABProps> = ({ icon, label, onClick }) => (
  <Button
    type="primary"
    shape={label ? "round" : "circle"}
    icon={icon}
    onClick={onClick}
    style={{
      position: "fixed",
      right: 16,
      bottom: "calc(78px + env(safe-area-inset-bottom, 0px))",
      zIndex: 90,
      height: 56,
      minWidth: 56,
      paddingInline: label ? 20 : 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontSize: 16,
      fontWeight: 600,
      boxShadow: "0 6px 16px rgba(22,163,74,0.45)",
    }}
  >
    {label}
  </Button>
);

export default FAB;
