/**
 * 여러 스타일 토큰을 병합하여 계산된 스타일 생성
 * @param {Array<Object>} tokens - 스타일 토큰 배열
 * @param {Object} options - 병합 옵션
 * @param {Array<string>} options.breakpointOrder - 브레이크포인트 우선순위
 * @returns {Object} - 계산된 스타일 토큰
 */
export const computeInheritedStyles = (tokens, options = {}) => {
  const { breakpointOrder = ["default", "xl", "lg", "md", "sm", "xs"] } =
    options;

  // 결과 토큰 초기화
  const computedToken = {
    id: "computed",
    name: "Computed Styles",
    state: 0,
    contents: {},
  };

  // 브레이크포인트 및 의사 상태 초기화
  breakpointOrder.forEach((breakpoint) => {
    computedToken.contents[breakpoint] = {
      default: {},
      hover: {},
      focus: {},
      active: {},
    };
  });

  // 토큰 병합 (우선순위: 배열의 마지막 토큰이 우선)
  for (const token of tokens) {
    for (const breakpoint in token.contents) {
      if (computedToken.contents[breakpoint]) {
        for (const pseudoState in token.contents[breakpoint]) {
          if (computedToken.contents[breakpoint][pseudoState]) {
            // 속성 병합
            Object.assign(
              computedToken.contents[breakpoint][pseudoState],
              token.contents[breakpoint][pseudoState]
            );
          }
        }
      }
    }
  }

  return computedToken;
};

/**
 * 계산된 스타일 토큰을 CSS로 변환
 * @param {Object} computedToken - 계산된 스타일 토큰
 * @param {string} selector - 적용할 CSS 선택자
 * @param {Object} options - 변환 옵션
 * @returns {string} - CSS 문자열
 */
export const computedTokenToCss = (
  computedToken,
  selector = ".token",
  options = {}
) => {
  return styleTokenToCss(computedToken, selector, options);
};

/**
 * 계산된 스타일에서 특정 브레이크포인트와 의사 상태의 속성 추출
 * @param {Object} computedToken - 계산된 스타일 토큰
 * @param {string} breakpoint - 대상 브레이크포인트
 * @param {string} pseudoState - 대상 의사 상태
 * @returns {Object} - 속성-값 쌍 객체
 */
export const extractPropertiesFromComputedToken = (
  computedToken,
  breakpoint = "default",
  pseudoState = "default"
) => {
  if (
    computedToken.contents[breakpoint] &&
    computedToken.contents[breakpoint][pseudoState]
  ) {
    return { ...computedToken.contents[breakpoint][pseudoState] };
  }

  return {};
};
