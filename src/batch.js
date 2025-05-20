export const batchProcessTokens = (tokens, processor, options = {}) => {
  const { chunkSize = 10, delay = 0 } = options;

  return new Promise((resolve) => {
    const results = [];
    const chunks = [];

    // 토큰을 청크로 분할
    for (let i = 0; i < tokens.length; i += chunkSize) {
      chunks.push(tokens.slice(i, i + chunkSize));
    }

    // 청크 처리 함수
    const processChunk = async (index) => {
      if (index >= chunks.length) {
        resolve(results.flat());
        return;
      }

      const chunk = chunks[index];
      const chunkResults = await Promise.all(chunk.map(processor));
      results.push(chunkResults);

      if (delay > 0) {
        setTimeout(() => processChunk(index + 1), delay);
      } else {
        processChunk(index + 1);
      }
    };

    // 처리 시작
    processChunk(0);
  });
};
