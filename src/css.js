/**
 * CSSTree AST를 CSS 문자열로 변환
 * @param {Object} ast - CSSTree AST
 * @param {Object} options - 변환 옵션
 * @param {boolean} options.minify - 최소화 여부
 * @returns {string} - CSS 문자열
 */
export const astToCss = (ast, options = {}) => {
  const { minify = false } = options;

  return csstree.generate(ast, {
    sourceMap: false,
    mode: minify ? "spec" : "safe",
  });
};

/**
 * CSS 문자열을 CSSTree AST로 변환
 * @param {string} css - CSS 문자열
 * @param {Object} options - 파싱 옵션
 * @returns {Object} - CSSTree AST
 */
export const cssToAst = (css, options = {}) => {
  return csstree.parse(css, {
    positions: true,
    ...options,
  });
};

/**
 * 스타일 토큰을 CSS 문자열로 직접 변환
 * @param {Object} token - 스타일 토큰
 * @param {string} selector - 적용할 CSS 선택자
 * @param {Object} options - 변환 옵션
 * @returns {string} - CSS 문자열
 */
export const styleTokenToCss = (token, selector = ".token", options = {}) => {
  const ast = styleTokenToAst(token, selector);
  return astToCss(ast, options);
};

/**
 * CSS 문자열을 스타일 토큰으로 직접 변환
 * @param {string} css - CSS 문자열
 * @param {string} id - 토큰 ID
 * @param {string} name - 토큰 이름
 * @param {Object} options - 변환 옵션
 * @returns {Object} - 스타일 토큰
 */
export const cssToStyleToken = (css, id, name, options = {}) => {
  const ast = cssToAst(css);
  return astToStyleToken(
    ast,
    id,
    name,
    options.breakpoints,
    options.pseudoStates
  );
};
