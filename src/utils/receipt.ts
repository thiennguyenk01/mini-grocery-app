import dayjs from "dayjs";
import type { Product, Sale } from "../types";
import { formatVND } from "./format";

const SHOP_NAME = "TẠP HÓA NGA CƯ";

/**
 * Dựng nội dung hóa đơn dạng text thuần - dùng để chia sẻ (Web Share API) hoặc tải về file
 * .txt. Không cần máy in/server nào - "in" ở đây là người dùng tự in file .txt này nếu muốn.
 */
export function buildReceiptText(sale: Sale, products: Product[]): string {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const lines: string[] = [];

  lines.push(SHOP_NAME);
  lines.push("");
  lines.push(`Ngày: ${dayjs(sale.date).format("HH:mm DD/MM/YYYY")}`);
  lines.push(`Mã đơn: ${sale.code}`);
  lines.push("");
  lines.push("-".repeat(28));

  sale.items.forEach((it) => {
    const p = productMap.get(it.productId);
    const name = p?.name ?? "Sản phẩm đã xóa";
    const lineTotal = formatVND(it.sellingPrice * it.quantity);
    lines.push(`${name}`);
    lines.push(`  ${it.quantity} x ${formatVND(it.sellingPrice)} = ${lineTotal}`);
  });

  lines.push("-".repeat(28));
  lines.push(`Tổng cộng: ${formatVND(sale.total)}`);
  lines.push("");
  lines.push(`Thanh toán: ${sale.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}`);
  lines.push("");
  lines.push("Cảm ơn quý khách!");

  return lines.join("\n");
}

/** Ngắt 1 dòng dài thành nhiều dòng vừa khung, giữ nguyên thụt đầu dòng của dòng gốc. */
function wrapLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string[] {
  if (ctx.measureText(line).width <= maxWidth) return [line];
  const indent = line.match(/^\s*/)?.[0] ?? "";
  const words = line.trim().split(/\s+/);
  const out: string[] = [];
  let current = indent;
  for (const word of words) {
    const candidate = current.trim() === "" ? indent + word : `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth || current.trim() === "") {
      current = candidate;
    } else {
      out.push(current);
      current = indent + word;
    }
  }
  if (current.trim() !== "") out.push(current);
  return out;
}

/**
 * Vẽ hóa đơn thành ảnh PNG (data URL) bằng canvas thuần - không cần thư viện chụp màn hình
 * (html2canvas...) nên không thêm dependency nào. Dùng lại đúng nội dung của `buildReceiptText`.
 */
export function buildReceiptImageDataUrl(sale: Sale, products: Product[]): string {
  const lines = buildReceiptText(sale, products).split("\n");
  const scale = 2; // vẽ gấp đôi độ phân giải cho ảnh nét trên màn hình điện thoại
  const width = 360;
  const padding = 20;
  const lineHeight = 22;
  const family = "'Courier New', 'Roboto Mono', monospace";
  const bodyFont = `14px ${family}`;
  const titleFont = `bold 18px ${family}`;

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = bodyFont;
  const maxTextWidth = width - padding * 2;

  const rows: { text: string; title: boolean }[] = [];
  lines.forEach((line, idx) => {
    if (idx === 0) rows.push({ text: line, title: true });
    else wrapLine(measure, line, maxTextWidth).forEach((t) => rows.push({ text: t, title: false }));
  });

  const height = padding * 2 + rows.length * lineHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#1f2933";
  ctx.textBaseline = "middle";

  rows.forEach((row, i) => {
    const y = padding + i * lineHeight + lineHeight / 2;
    if (row.title) {
      ctx.font = titleFont;
      ctx.textAlign = "center";
      ctx.fillText(row.text, width / 2, y);
    } else {
      ctx.font = bodyFont;
      ctx.textAlign = "left";
      ctx.fillText(row.text, padding, y);
    }
  });

  return canvas.toDataURL("image/png");
}

/** Tải hóa đơn về máy dưới dạng ảnh PNG. */
export function downloadReceiptImage(sale: Sale, products: Product[]) {
  const dataUrl = buildReceiptImageDataUrl(sale, products);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `hoa-don-${sale.code}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
