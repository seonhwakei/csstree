/**
 * AST에서 CSS 속성 추출
 * @param {Object} ast - CSSTree AST
 * @param {Object} options - 추출 옵션
 * @param {string} options.selector - 필터링할 선택자 (null이면 모든 선택자)
 * @param {string} options.mediaQuery - 필터링할 미디어 쿼리 (null이면 모든 미디어 쿼리)
 * @param {string} options.pseudoState - 필터링할 의사 상태 (null이면 모든 의사 상태)
 * @returns {Array<Object>} - 추출된 속성 배열
 */
export const extractPropertiesFromAst = (ast, options = {}) => {
  const { selector = null, mediaQuery = null, pseudoState = null } = options;
  const properties = [];

  // 현재 미디어 쿼리 컨텍스트 추적
  let currentMediaQuery = null;

  csstree.walk(ast, {
    enter: (node) => {
      // 미디어 쿼리 노드 처리
      if (node.type === "Atrule" && node.name === "media") {
        currentMediaQuery = csstree.generate(node.prelude);
      }

      // 선언 노드 처리
      if (node.type === "Declaration") {
        // 상위 규칙 노드 찾기
        let ruleNode = node;
        while (ruleNode && ruleNode.type !== "Rule") {
          ruleNode = ruleNode.parent;
        }

        if (ruleNode) {
          const selectorText = csstree.generate(ruleNode.prelude);
          const currentPseudoState = extractPseudoState(selectorText);

          // 필터 조건 확인
          const selectorMatch =
            selector === null || selectorText.includes(selector);
          const mediaMatch =
            mediaQuery === null || currentMediaQuery === mediaQuery;
          const pseudoMatch =
            pseudoState === null || currentPseudoState === pseudoState;

          if (selectorMatch && mediaMatch && pseudoMatch) {
            properties.push({
              property: node.property,
              value: csstree.generate(node.value),
              important: node.important,
              selector: selectorText,
              mediaQuery: currentMediaQuery,
              pseudoState: currentPseudoState,
            });
          }
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

  return properties;
};

/**
 * CSS 문자열에서 속성 추출 (AST 변환 후 추출)
 * @param {string} css - CSS 문자열
 * @param {Object} options - 추출 옵션
 * @returns {Array<Object>} - 추출된 속성 배열
 */
export const extractPropertiesFromCss = (css, options = {}) => {
  const ast = cssToAst(css);
  return extractPropertiesFromAst(ast, options);
};

/**
 * AST에서 특정 속성 업데이트
 * @param {Object} ast - CSSTree AST
 * @param {string} property - 업데이트할 속성 이름
 * @param {string} value - 새 속성 값
 * @param {Object} options - 업데이트 옵션
 * @param {string} options.selector - 대상 선택자
 * @param {string} options.mediaQuery - 대상 미디어 쿼리 (null이면 미디어 쿼리 없음)
 * @param {string} options.pseudoState - 대상 의사 상태
 * @param {boolean} options.important - !important 여부
 * @returns {Object} - 업데이트된 AST
 */
export const updatePropertyInAst = (ast, property, value, options = {}) => {
  const {
    selector = ".token",
    mediaQuery = null,
    pseudoState = "default",
    important = false,
  } = options;

  // AST 복제 (원본 변경 방지)
  const newAst = csstree.clone(ast);

  // 대상 선택자 생성
  const targetSelector =
    pseudoState === "default" ? selector : `${selector}:${pseudoState}`;

  // 속성이 이미 존재하는지 확인하는 플래그
  let propertyUpdated = false;

  // 현재 미디어 쿼리 컨텍스트 추적
  let currentMediaQuery = null;
  let inTargetMediaQuery = mediaQuery === null;

  // AST 순회하며 속성 업데이트
  csstree.walk(newAst, {
    enter: (node) => {
      // 미디어 쿼리 노드 처리
      if (node.type === "Atrule" && node.name === "media") {
        currentMediaQuery = csstree.generate(node.prelude);
        inTargetMediaQuery =
          mediaQuery === null || currentMediaQuery === mediaQuery;
      }

      // 규칙 노드 처리
      if (node.type === "Rule" && inTargetMediaQuery) {
        const selectorText = csstree.generate(node.prelude);

        // 대상 선택자와 일치하는지 확인
        if (selectorText === targetSelector) {
          // 속성 찾기
          let propertyFound = false;

          if (node.block && node.block.children) {
            // 기존 속성 업데이트
            node.block.children.forEach((child) => {
              if (child.type === "Declaration" && child.property === property) {
                // 값 파싱 및 업데이트
                const valueNode = csstree.parse(`${property}: ${value}`, {
                  context: "declaration",
                }).value;

                child.value = valueNode;
                child.important = important;
                propertyFound = true;
                propertyUpdated = true;
              }
            });

            // 속성이 없으면 추가
            if (!propertyFound) {
              const declNode = csstree
                .parse(`${property}: ${value};`)
                .children.first();
              declNode.important = important;
              node.block.children.append(declNode);
              propertyUpdated = true;
            }
          }
        }
      }
    },

    leave: (node) => {
      // 미디어 쿼리 노드를 떠날 때 컨텍스트 초기화
      if (node.type === "Atrule" && node.name === "media") {
        currentMediaQuery = null;
        inTargetMediaQuery = mediaQuery === null;
      }
    },
  });

  // 속성이 업데이트되지 않았다면 새로운 규칙 추가
  if (!propertyUpdated) {
    // 미디어 쿼리 컨텍스트 찾기 또는 생성
    let mediaContext = newAst;

    if (mediaQuery) {
      // 기존 미디어 쿼리 찾기
      let mediaNode = null;
      newAst.children.forEach((child) => {
        if (
          child.type === "Atrule" &&
          child.name === "media" &&
          csstree.generate(child.prelude) === mediaQuery
        ) {
          mediaNode = child;
        }
      });

      // 미디어 쿼리가 없으면 생성
      if (!mediaNode) {
        mediaNode = csstree.parse(`@media ${mediaQuery} {}`).children.first();
        newAst.children.append(mediaNode);
      }

      mediaContext = mediaNode.block;
    }

    // 규칙 생성 및 추가
    const ruleNode = csstree
      .parse(
        `${targetSelector} { ${property}: ${value}${
          important ? " !important" : ""
        }; }`
      )
      .children.first();
    mediaContext.children.append(ruleNode);
  }

  return newAst;
};

/**
 * 스타일 토큰에서 특정 속성 업데이트
 * @param {Object} token - 스타일 토큰
 * @param {string} property - 업데이트할 속성 이름
 * @param {string} value - 새 속성 값
 * @param {string} breakpoint - 대상 브레이크포인트
 * @param {string} pseudoState - 대상 의사 상태
 * @returns {Object} - 업데이트된 스타일 토큰
 */
export const updatePropertyInStyleToken = (
  token,
  property,
  value,
  breakpoint = "default",
  pseudoState = "default"
) => {
  // 토큰 복제 (원본 변경 방지)
  const newToken = JSON.parse(JSON.stringify(token));

  // 해당 브레이크포인트와 의사 상태가 존재하는지 확인
  if (!newToken.contents[breakpoint]) {
    newToken.contents[breakpoint] = {};
  }

  if (!newToken.contents[breakpoint][pseudoState]) {
    newToken.contents[breakpoint][pseudoState] = {};
  }

  // 속성 업데이트
  newToken.contents[breakpoint][pseudoState][property] = value;

  return newToken;
};
