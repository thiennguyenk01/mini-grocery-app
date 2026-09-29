import { Grid } from "antd";

const { useBreakpoint } = Grid;

/** true khi màn hình nhỏ hơn breakpoint "md" (điện thoại) */
export function useIsMobile(): boolean {
  const screens = useBreakpoint();
  return !screens.md;
}
