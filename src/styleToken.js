/**
 * 스타일 토큰을 CSSTree AST로 변환
 * @param {Object} token - 스타일 토큰
 * @param {string} selector - 적용할 CSS 선택자
 * @returns {Object} - CSSTree AST
 */
export const styleTokenToAst = (token, selector = ".token") => {
  // AST 루트 노드 생성
  const ast = csstree.parse("");

  // 각 브레이크포인트 처리
  for (const [breakpoint, pseudoStates] of Object.entries(token.contents)) {
    const mediaQuery = breakpointToMediaQuery(breakpoint);

    // 미디어 쿼리 컨텍스트 생성 (default 브레이크포인트 제외)
    let mediaContext = ast;
    if (mediaQuery) {
      const mediaNode = csstree
        .parse(`@media ${mediaQuery} {}`)
        .children.first();
      ast.children.append(mediaNode);
      mediaContext = mediaNode.block;
    }

    // 각 의사 상태 처리
    for (const [pseudoState, properties] of Object.entries(pseudoStates)) {
      if (Object.keys(properties).length === 0) continue;

      // 선택자 생성
      const fullSelector =
        pseudoState === "default" ? selector : `${selector}:${pseudoState}`;

      // 규칙 노드 생성
      const ruleNode = csstree.parse(`${fullSelector} {}`).children.first();
      mediaContext.children.append(ruleNode);

      // 속성 추가
      for (const [property, value] of Object.entries(properties)) {
        const declNode = csstree
          .parse(`${property}: ${value};`)
          .children.first();
        ruleNode.block.children.append(declNode);
      }
    }
  }

  return ast;
};

/**
 * CSSTree AST를 스타일 토큰으로 변환
 * @param {Object} ast - CSSTree AST
 * @param {string} id - 토큰 ID
 * @param {string} name - 토큰 이름
 * @param {Array<string>} breakpoints - 지원할 브레이크포인트 목록
 * @param {Array<string>} pseudoStates - 지원할 의사 상태 목록
 * @returns {Object} - 스타일 토큰
 */
export const astToStyleToken = (
  ast,
  id,
  name,
  breakpoints = ["default", "xl", "lg", "md", "sm", "xs"],
  pseudoStates = ["default", "hover", "focus", "active"]
) => {
  // 결과 객체 초기화
  const token = {
    id,
    name,
    state: 0,
    contents: {},
  };

  // 빈 구조 초기화
  breakpoints.forEach((breakpoint) => {
    token.contents[breakpoint] = {};
    pseudoStates.forEach((state) => {
      token.contents[breakpoint][state] = {};
    });
  });

  // 현재 미디어 쿼리 컨텍스트 추적
  let currentMediaQuery = null;

  // AST 순회
  csstree.walk(ast, {
    enter: (node) => {
      // 미디어 쿼리 노드 처리
      if (node.type === "Atrule" && node.name === "media") {
        currentMediaQuery = csstree.generate(node.prelude);
      }

      // 규칙 노드 처리
      if (node.type === "Rule") {
        const selectorText = csstree.generate(node.prelude);
        const pseudoState = extractPseudoState(selectorText);
        const breakpoint = currentMediaQuery
          ? mediaQueryToBreakpoint(currentMediaQuery)
          : "default";

        // 선언(속성) 추출
        if (node.block && node.block.children) {
          node.block.children.forEach((child) => {
            if (child.type === "Declaration") {
              const property = child.property;
              const value = csstree.generate(child.value);

              // 토큰에 속성 추가
              if (
                token.contents[breakpoint] &&
                token.contents[breakpoint][pseudoState]
              ) {
                token.contents[breakpoint][pseudoState][property] = value;
              }
            }
          });
        }
      }
    },

    leave: (node) => {
      // 미디어 쿼리 노드를 떠날 때 컨텍스트 초기화
      if (node.type === "Atrule" && node.name === "media") {
        currentMediaQuery = null;
      }
    },
  });

  return token;
};

/**
 * 두 스타일 토큰 간의 차이점 계산
 * @param {Object} baseToken - 기준 스타일 토큰
 * @param {Object} compareToken - 비교 스타일 토큰
 * @returns {Object} - 차이점 객체
 */
export const diffStyleTokens = (baseToken, compareToken) => {
  const diff = {
    added: {}, // compareToken에만 있는 속성
    removed: {}, // baseToken에만 있는 속성
    changed: {}, // 두 토큰 모두에 있지만 값이 다른 속성
  };

  // 각 브레이크포인트와 의사 상태 비교
  for (const breakpoint in baseToken.contents) {
    diff.added[breakpoint] = {};
    diff.removed[breakpoint] = {};
    diff.changed[breakpoint] = {};

    for (const pseudoState in baseToken.contents[breakpoint]) {
      diff.added[breakpoint][pseudoState] = {};
      diff.removed[breakpoint][pseudoState] = {};
      diff.changed[breakpoint][pseudoState] = {};

      const baseProps = baseToken.contents[breakpoint][pseudoState];
      const compareProps =
        compareToken.contents[breakpoint]?.[pseudoState] || {};

      // baseToken에만 있는 속성 찾기
      for (const prop in baseProps) {
        if (!(prop in compareProps)) {
          diff.removed[breakpoint][pseudoState][prop] = baseProps[prop];
        } else if (baseProps[prop] !== compareProps[prop]) {
          diff.changed[breakpoint][pseudoState][prop] = {
            from: baseProps[prop],
            to: compareProps[prop],
          };
        }
      }

      // compareToken에만 있는 속성 찾기
      for (const prop in compareProps) {
        if (!(prop in baseProps)) {
          diff.added[breakpoint][pseudoState][prop] = compareProps[prop];
        }
      }
    }
  }

  return diff;
};
