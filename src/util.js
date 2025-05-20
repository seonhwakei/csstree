import * as csstree from "css-tree";

/**
 * 브레이크포인트를 미디어 쿼리로 변환
 * @param {string} breakpoint - 브레이크포인트 이름
 * @returns {string|null} - 미디어 쿼리 문자열 또는 null (default 브레이크포인트)
 */
export const breakpointToMediaQuery = (breakpoint) => {
  const breakpointMap = {
    xs: "(max-width: 576px)",
    sm: "(max-width: 768px)",
    md: "(max-width: 992px)",
    lg: "(max-width: 1200px)",
    xl: "(max-width: 1400px)",
    default: null,
  };

  return breakpointMap[breakpoint] || null;
};

/**
 * 미디어 쿼리를 브레이크포인트로 변환
 * @param {string} mediaQuery - 미디어 쿼리 문자열
 * @returns {string} - 브레이크포인트 이름
 */
export const mediaQueryToBreakpoint = (mediaQuery) => {
  if (!mediaQuery) return "default";

  const widthMatch = mediaQuery.match(/max-width:\s*(\d+)px/i);
  if (widthMatch) {
    const width = parseInt(widthMatch[1], 10);
    if (width <= 576) return "xs";
    if (width <= 768) return "sm";
    if (width <= 992) return "md";
    if (width <= 1200) return "lg";
    if (width <= 1400) return "xl";
  }

  return "default";
};

/**
 * 선택자에서 의사 상태 추출
 * @param {string} selector - CSS 선택자
 * @returns {string} - 의사 상태 ('default', 'hover', 'focus', 'active')
 */
export const extractPseudoState = (selector) => {
  if (selector.includes(":hover")) return "hover";
  if (selector.includes(":focus")) return "focus";
  if (selector.includes(":active")) return "active";
  return "default";
};
