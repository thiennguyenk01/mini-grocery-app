import React, { useState } from "react";
import { Card } from "antd";

type Operator = "+" | "-" | "×" | "÷";

const MAX_DIGITS = 14;

/** Định dạng số theo kiểu Việt Nam khi hiển thị: "." ngăn hàng nghìn, "," là dấu thập phân. */
function formatDisplay(raw: string): string {
  if (raw === "Lỗi") return raw;
  const negative = raw.startsWith("-");
  const body = negative ? raw.slice(1) : raw;
  const [intPart, decPart] = body.split(".");
  const groupedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const out = decPart !== undefined ? `${groupedInt},${decPart}` : groupedInt;
  return negative ? `-${out}` : out;
}

function calculate(a: number, b: number, op: Operator): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

/** Làm tròn nhẹ để tránh lỗi số thực kiểu 0.1 + 0.2 = 0.30000000000000004 */
function cleanNumber(n: number): string {
  if (!isFinite(n)) return "Lỗi";
  const rounded = parseFloat(n.toPrecision(12));
  return String(rounded);
}

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const expression =
    prevValue !== null && operator ? `${formatDisplay(String(prevValue))} ${operator}` : "";

  const inputDigit = (d: string) => {
    if (display === "Lỗi" || waitingForNewValue) {
      setDisplay(d);
      setWaitingForNewValue(false);
      return;
    }
    if (display === "0") {
      setDisplay(d);
      return;
    }
    const digitsOnly = display.replace(/[-.]/g, "").length;
    if (digitsOnly >= MAX_DIGITS) return;
    setDisplay(display + d);
  };

  const inputDecimal = () => {
    if (waitingForNewValue || display === "Lỗi") {
      setDisplay("0.");
      setWaitingForNewValue(false);
      return;
    }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const clearAll = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const backspace = () => {
    if (waitingForNewValue || display === "Lỗi") return;
    if (display.length <= 1 || (display.length === 2 && display.startsWith("-"))) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const toggleSign = () => {
    if (display === "0" || display === "Lỗi") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  };

  const inputPercent = () => {
    if (display === "Lỗi") return;
    setDisplay(cleanNumber(parseFloat(display) / 100));
  };

  const chooseOperator = (nextOp: Operator) => {
    const inputValue = parseFloat(display === "Lỗi" ? "0" : display);
    if (prevValue !== null && operator && !waitingForNewValue) {
      const result = calculate(prevValue, inputValue, operator);
      setDisplay(cleanNumber(result));
      setPrevValue(isFinite(result) ? result : null);
    } else {
      setPrevValue(inputValue);
    }
    setOperator(nextOp);
    setWaitingForNewValue(true);
  };

  const equals = () => {
    if (operator === null || prevValue === null) return;
    const inputValue = parseFloat(display === "Lỗi" ? "0" : display);
    const result = calculate(prevValue, inputValue, operator);
    setDisplay(cleanNumber(result));
    setPrevValue(null);
    setOperator(null);
    setWaitingForNewValue(true);
  };

  const funcBtnStyle: React.CSSProperties = {
    background: "#eef2f1",
    color: "#1f2933",
  };
  const opBtnStyle: React.CSSProperties = {
    background: "#147f27",
    color: "#fff",
  };
  const numBtnStyle: React.CSSProperties = {
    background: "#fff",
    color: "#1f2933",
    border: "1px solid #ececec",
  };

  const Btn: React.FC<{
    label: React.ReactNode;
    onClick: () => void;
    style?: React.CSSProperties;
    span?: number;
  }> = ({ label, onClick, style, span }) => (
    <button
      onClick={onClick}
      style={{
        gridColumn: span ? `span ${span}` : undefined,
        aspectRatio: span ? undefined : "1",
        height: span ? "clamp(52px, 15vw, 76px)" : undefined,
        border: "none",
        borderRadius: 16,
        fontSize: "clamp(18px, 5.5vw, 26px)",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: span ? "flex-start" : "center",
        paddingLeft: span ? "clamp(20px, 7vw, 30px)" : undefined,
        ...numBtnStyle,
        ...style,
      }}
    >
      {label}
    </button>
  );

  return (
    <Card className="page-card" title="Máy tính" style={{ maxWidth: 420, margin: "0 auto" }}>
      <div
        style={{
          background: "#0f2418",
          borderRadius: 16,
          padding: "20px 18px",
          marginBottom: 16,
          textAlign: "right",
          overflow: "hidden",
        }}
      >
        <div style={{ color: "#8fd6ac", fontSize: 14, minHeight: 18, marginBottom: 4 }}>
          {expression || "\u00A0"}
        </div>
        <div
          style={{
            color: "#fff",
            fontSize: "clamp(30px, 9vw, 46px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflowX: "auto",
          }}
        >
          {formatDisplay(display)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <Btn label="C" onClick={clearAll} style={funcBtnStyle} />
        <Btn label="⌫" onClick={backspace} style={funcBtnStyle} />
        <Btn label="%" onClick={inputPercent} style={funcBtnStyle} />
        <Btn label="÷" onClick={() => chooseOperator("÷")} style={opBtnStyle} />

        <Btn label="7" onClick={() => inputDigit("7")} />
        <Btn label="8" onClick={() => inputDigit("8")} />
        <Btn label="9" onClick={() => inputDigit("9")} />
        <Btn label="×" onClick={() => chooseOperator("×")} style={opBtnStyle} />

        <Btn label="4" onClick={() => inputDigit("4")} />
        <Btn label="5" onClick={() => inputDigit("5")} />
        <Btn label="6" onClick={() => inputDigit("6")} />
        <Btn label="−" onClick={() => chooseOperator("-")} style={opBtnStyle} />

        <Btn label="1" onClick={() => inputDigit("1")} />
        <Btn label="2" onClick={() => inputDigit("2")} />
        <Btn label="3" onClick={() => inputDigit("3")} />
        <Btn label="+" onClick={() => chooseOperator("+")} style={opBtnStyle} />

        <Btn label="±" onClick={toggleSign} style={funcBtnStyle} />
        <Btn label="0" onClick={() => inputDigit("0")} />
        <Btn label="," onClick={inputDecimal} />
        <Btn label="=" onClick={equals} style={opBtnStyle} />
      </div>
    </Card>
  );
};

export default Calculator;
