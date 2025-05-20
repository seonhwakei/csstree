/**
 * 1. 상속 스타일 계산 예시
 */
const computeStyles = (tokens, selector) => {
  // 1. 토큰 병합하여 계산된 스타일 생성
  const computedToken = computeInheritedStyles(tokens);

  // 2. 계산된 스타일을 CSS로 변환
  const css = computedTokenToCss(computedToken, selector);

  // 3. CSS를 AST로 변환 (필요시)
  const ast = cssToAst(css);

  return {
    computedToken,
    css,
    ast,
  };
};

/**
 * 2. 속성 출력 예시
 */
const outputProperties = (computedToken, breakpoint, pseudoState) => {
  // 계산된 스타일에서 특정 브레이크포인트와 의사 상태의 속성 추출
  const properties = extractPropertiesFromComputedToken(
    computedToken,
    breakpoint,
    pseudoState
  );

  return properties;
};

/**
 * 3. 속성 업데이트 예시
 */
const updateProperty = (token, property, value, breakpoint, pseudoState) => {
  // 1. 토큰에서 속성 업데이트
  const updatedToken = updatePropertyInStyleToken(
    token,
    property,
    value,
    breakpoint,
    pseudoState
  );

  // 2. 업데이트된 토큰을 AST로 변환 (필요시)
  const ast = styleTokenToAst(updatedToken);

  // 3. 업데이트된 토큰을 CSS로 변환 (필요시)
  const css = astToCss(ast);

  return {
    updatedToken,
    ast,
    css,
  };
};
