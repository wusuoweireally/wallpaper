/**
 * 列表请求代数：每次发起新查询递增，仅最新代数的响应可写回 UI。
 */
export function createFetchGeneration() {
  let generation = 0

  return {
    /** 发起新请求前调用，返回本请求代数 */
    next(): number {
      generation += 1
      return generation
    },
    /** 响应返回时判断是否仍为当前最新请求 */
    isCurrent(requestGeneration: number): boolean {
      return requestGeneration === generation
    },
    get current(): number {
      return generation
    },
  }
}

/** 纯函数：是否应采用某次响应（供单测与调用方共用） */
export function shouldApplyFetchResult(
  latestGeneration: number,
  responseGeneration: number,
): boolean {
  return responseGeneration === latestGeneration
}
