import assert from "node:assert/strict"
import { createFetchGeneration, shouldApplyFetchResult } from "./fetchGeneration.ts"

function testShouldApplyOnlyLatest() {
  const gen = createFetchGeneration()
  const g1 = gen.next()
  const g2 = gen.next()
  assert.equal(shouldApplyFetchResult(gen.current, g1), false)
  assert.equal(shouldApplyFetchResult(gen.current, g2), true)
  assert.equal(gen.isCurrent(g1), false)
  assert.equal(gen.isCurrent(g2), true)
}

/** 模拟乱序响应：旧请求后返回不得覆盖新结果 */
async function testOutOfOrderResponses() {
  const gen = createFetchGeneration()
  let applied: string | null = null

  const runFetch = async (keyword: string, delayMs: number) => {
    const requestGen = gen.next()
    await new Promise((r) => setTimeout(r, delayMs))
    if (!gen.isCurrent(requestGen)) {
      return
    }
    applied = keyword
  }

  // 先发起 “a”（慢），再 “ab”（快）；最终只能是 ab
  const p1 = runFetch("a", 40)
  const p2 = runFetch("ab", 5)
  await Promise.all([p1, p2])
  assert.equal(applied, "ab")
}

async function main() {
  testShouldApplyOnlyLatest()
  await testOutOfOrderResponses()
  process.stdout.write("fetchGeneration tests passed\n")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
