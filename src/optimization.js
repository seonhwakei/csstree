/**
 * 대규모 스타일 처리를 위한 최적화된 토큰 병합 함수
 * @param {Array<Object>} tokens - 스타일 토큰 배열
 * @returns {Object} - 병합된 스타일 토큰
 */
export const optimizedMergeTokens = (tokens) => {
  // 결과 객체를 한 번만 생성
  const result = {
    id: "merged",
    name: "Merged Styles",
    state: 0,
    contents: {},
  };

  // 모든 브레이크포인트와 의사 상태 수집
  const breakpoints = new Set();
  const pseudoStates = new Set();

  // 첫 번째 패스: 모든 브레이크포인트와 의사 상태 수집
  for (const token of tokens) {
    for (const breakpoint in token.contents) {
      breakpoints.add(breakpoint);
      for (const pseudoState in token.contents[breakpoint]) {
        pseudoStates.add(pseudoState);
      }
    }
  }

  // 구조 초기화
  for (const breakpoint of breakpoints) {
    result.contents[breakpoint] = {};
    for (const pseudoState of pseudoStates) {
      result.contents[breakpoint][pseudoState] = {};
    }
  }

  // 두 번째 패스: 속성 병합
  for (const token of tokens) {
    for (const breakpoint in token.contents) {
      for (const pseudoState in token.contents[breakpoint]) {
        Object.assign(
          result.contents[breakpoint][pseudoState],
          token.contents[breakpoint][pseudoState]
        );
      }
    }
  }

  return result;
};

/**
 * 메모이제이션을 활용한 AST 변환 최적화
 */
const astCache = new Map();

export const memoizedStyleTokenToAst = (
  token,
  selector = ".token",
  cacheKey = null
) => {
  // 캐시 키 생성
  const key = cacheKey || `${selector}:${JSON.stringify(token)}`;

  // 캐시에서 결과 확인
  if (astCache.has(key)) {
    return csstree.clone(astCache.get(key)); // 복제하여 반환
  }

  // 캐시에 없으면 변환 수행
  const ast = styleTokenToAst(token, selector);

  // 결과 캐싱
  astCache.set(key, csstree.clone(ast));

  return ast;
};

/**
 * 캐시 관리 함수
 */
export const clearAstCache = () => {
  astCache.clear();
};

export const invalidateAstCache = (cacheKey) => {
  if (cacheKey) {
    astCache.delete(cacheKey);
  } else {
    clearAstCache();
  }
};
