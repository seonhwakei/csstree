import "./styles.css";

export default function App() {
  // 스타일 토큰 예시
  const token1 = {
    id: "tokenId1",
    name: "Base Styles",
    state: 0,
    contents: {
      default: {
        default: {
          "font-size": "16px",
          color: "black",
        },
        hover: {
          color: "blue",
        },
      },
    },
  };

  const token2 = {
    id: "tokenId2",
    name: "Theme Styles",
    state: 0,
    contents: {
      default: {
        default: {
          "background-color": "white",
          color: "red",
        },
      },
      md: {
        default: {
          "font-size": "14px",
        },
      },
    },
  };

  // 1. 상속 스타일 계산
  const { computedToken, css } = computeStyles(
    [token1, token2],
    ".my-component"
  );
  console.log("Computed CSS:", css);

  // 2. 속성 출력
  const defaultProperties = outputProperties(
    computedToken,
    "default",
    "default"
  );
  console.log("Default Properties:", defaultProperties);
  // 출력: { "font-size": "16px", "color": "red", "background-color": "white" }

  // 3. 속성 업데이트
  const { updatedToken } = updateProperty(
    token1,
    "font-size",
    "18px",
    "default",
    "default"
  );
  console.log("Updated Token:", updatedToken);

  // 4. 토큰 간 차이점 계산
  const diff = diffStyleTokens(token1, token2);
  console.log("Style Differences:", diff);

  // 5. AST에서 속성 추출
  const ast = styleTokenToAst(token1);
  const extractedProperties = extractPropertiesFromAst(ast);
  console.log("Extracted Properties:", extractedProperties);

  // 6. AST에서 속성 업데이트
  const updatedAst = updatePropertyInAst(ast, "font-size", "20px", {
    selector: ".my-component",
    pseudoState: "hover",
  });
  const updatedCss = astToCss(updatedAst);
  console.log("Updated CSS:", updatedCss);

  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
