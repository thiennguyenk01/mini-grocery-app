const PALETTE = ["#147f27", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#ec4899"];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns the product's image if set, otherwise generates a stable
 * colored placeholder (initial letter) so the UI never shows a broken image.
 */
export function getProductImage(name: string, image?: string): string {
  if (image) return image;
  const color = PALETTE[hashString(name) % PALETTE.length];
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
    <rect width="120" height="120" rx="16" fill="${color}"/>
    <text x="50%" y="54%" font-family="Arial, sans-serif" font-size="52" fill="#fff" text-anchor="middle" dominant-baseline="middle">${letter}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
