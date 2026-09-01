import assert from "node:assert/strict"
import {
  HOME_FOLD_SIZE,
  masonryAspectRatio,
  masonryColumnCount,
  masonryColumnFlexGrow,
  masonryColumnHeights,
  masonryItemWeight,
  mergeUniqueById,
  qualityLabel,
  splitMasonryColumns,
  wallpaperDisplayTitle,
} from "./wallpaperLayout.ts"

function testQualityLabel() {
  assert.equal(qualityLabel(7680, 4320), "8K")
  assert.equal(qualityLabel(3840, 2160), "4K")
  assert.equal(qualityLabel(1080, 4000), "4K")
  assert.equal(qualityLabel(2560, 1440), "2K")
  assert.equal(qualityLabel(1920, 1080), "1080P")
  assert.equal(qualityLabel(1280, 720), "HD")
  assert.equal(qualityLabel(Number.NaN, 0), "HD")
}

function testDisplayTitle() {
  assert.equal(wallpaperDisplayTitle([{ name: "星空" }], "general"), "星空")
  assert.equal(wallpaperDisplayTitle([{ name: "  " }, { name: "海" }], "anime"), "海")
  assert.equal(wallpaperDisplayTitle([], "anime"), "动漫")
  assert.equal(wallpaperDisplayTitle(null, "people"), "真人")
  assert.equal(wallpaperDisplayTitle(undefined, "unknown"), "壁纸")
}

function testMasonryAspect() {
  assert.equal(masonryAspectRatio(1920, 1080), "1920/1080")
  assert.equal(masonryAspectRatio(0, 1080), "16/10")
  assert.equal(masonryAspectRatio(800, Number.NaN), "16/10")
}

function testMergeUniqueById() {
  const featured = [{ id: 1 }, { id: 2 }]
  const popular = [{ id: 2 }, { id: 3 }, { id: 4 }]
  const latest = [{ id: 4 }, { id: 5 }]
  assert.deepEqual(
    mergeUniqueById([featured, popular, latest], 4).map((x) => x.id),
    [1, 2, 3, 4],
  )
  assert.deepEqual(mergeUniqueById([featured], HOME_FOLD_SIZE), featured)
  assert.deepEqual(mergeUniqueById([featured, popular], 0), [])
  assert.deepEqual(mergeUniqueById([[{ id: 1 }], null as unknown as { id: number }[]], 3), [
    { id: 1 },
  ])
}

function testMasonryColumns() {
  assert.equal(masonryColumnCount(375), 2)
  assert.equal(masonryColumnCount(800), 3)
  assert.equal(masonryColumnCount(1100), 4)
  assert.equal(masonryColumnCount(1400), 5)
  assert.equal(masonryColumnCount(1600), 6)
  assert.equal(masonryColumnCount(1920), 7)
  assert.equal(masonryColumnCount(Number.NaN), 2)

  const four = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
  const spread = splitMasonryColumns(four, 5)
  assert.equal(spread.length, 4)
  assert.deepEqual(
    spread.map((c) => c.map((x) => x.id)),
    [[1], [2], [3], [4]],
  )

  const six = [1, 2, 3, 4, 5, 6]
  assert.deepEqual(splitMasonryColumns(six, 3), [
    [1, 4],
    [2, 5],
    [3, 6],
  ])
  assert.deepEqual(splitMasonryColumns([], 4), [[], [], [], []])

  const tallFirst = splitMasonryColumns(
    [
      { id: "a", h: 3 },
      { id: "b", h: 1 },
      { id: "c", h: 1 },
    ],
    2,
    (x) => x.h,
  )
  assert.deepEqual(
    tallFirst.map((c) => c.map((x) => x.id)),
    [["a"], ["b", "c"]],
  )
  assert.equal(masonryItemWeight(1920, 1080), 1080 / 1920)
  assert.equal(masonryItemWeight(0, 10), 0.625)

  // 末位交换收敛尾差：极差应明显小于理论最差（整档差 1.78-0.56≈1.2）
  const colSum = (cols: { h: number }[][]) => cols.map((c) => c.reduce((s, x) => s + x.h, 0))
  const tailItems = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    h: [0.5625, 0.75, 1.3333, 0.625, 1.7778][i % 5],
  }))
  const tailCols = splitMasonryColumns(tailItems, 5, (x) => x.h)
  const sums = colSum(tailCols)
  const tailSpread = Math.max(...sums) - Math.min(...sums)
  assert.ok(tailSpread < 0.7, `尾差应收敛（实际 ${tailSpread}）`)
  // 交换后所有条目仍在场且无重复
  const flat = tailCols.flat().map((x) => x.id).sort((a, b) => a - b)
  assert.deepEqual(flat, Array.from({ length: 24 }, (_, i) => i))
}

function testMasonryColumnHeights() {
  const cols = [
    [
      { h: 1 },
      { h: 2 },
    ],
    [{ h: 0.5 }],
  ]
  assert.deepEqual(masonryColumnHeights(cols, (x) => x.h), [3, 0.5])
  assert.deepEqual(masonryColumnHeights([[]], () => 1), [0])
}

function testMasonryColumnFlexGrow() {
  // 非法输入回退等宽
  assert.deepEqual(masonryColumnFlexGrow([]), [])
  assert.deepEqual(masonryColumnFlexGrow([0, 2]), [1, 1])
  assert.deepEqual(masonryColumnFlexGrow([Number.NaN, 1]), [1, 1])

  // 等高列 → 等宽（归一化后均值 ≈ 1）
  assert.deepEqual(masonryColumnFlexGrow([2, 2, 2]), [1, 1, 1])

  // 核心数学：列宽 = 自由宽 × grow_j / Σgrow 时，渲染列高 列宽×S_j 严格恒等
  const heights = [3.2, 1.4, 2.6, 0.9]
  const grow = masonryColumnFlexGrow(heights)
  const FREE_WIDTH = 1000
  const totalGrow = grow.reduce((a, b) => a + b, 0)
  const widths = grow.map((g) => (FREE_WIDTH * g) / totalGrow)
  const rendered = heights.map((s, i) => widths[i] * s)
  const spread = Math.max(...rendered) - Math.min(...rendered)
  assert.ok(spread < 1e-9, `底缘应严格平齐（极差 ${spread}）`)

  // 真实数据全链路：随机比例 24 张 → 5 列 → 底缘平齐
  const items = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    h: [0.5625, 0.75, 1.3333, 0.625, 1.7778][i % 5],
  }))
  const cols = splitMasonryColumns(items, 5, (x) => x.h)
  const grow2 = masonryColumnFlexGrow(masonryColumnHeights(cols, (x) => x.h))
  const widths2 = grow2.map((g) => (FREE_WIDTH * g) / grow2.reduce((a, b) => a + b, 0))
  const rendered2 = cols.map((col, j) => col.reduce((s, x) => s + x.h, 0) * widths2[j])
  const spread2 = Math.max(...rendered2) - Math.min(...rendered2)
  assert.ok(spread2 < 1e-9, `真实分栏底缘应平齐（极差 ${spread2}）`)

  // 列内垂直间隙补偿：张数不同也要等高（列高 = 列宽×S_j + (张数−1)×ρ）
  const gapHeights = [2.55, 2.55, 2.42, 2.68, 2.49]
  const counts = [23, 23, 21, 25, 22]
  const RHO = 0.01
  const grow3 = masonryColumnFlexGrow(gapHeights, counts, RHO)
  const sum3 = grow3.reduce((a, b) => a + b, 0)
  const widths3 = grow3.map((g) => g / sum3) // 自由宽归一为 1
  const rendered3 = gapHeights.map((s, j) => widths3[j] * s + (counts[j] - 1) * RHO)
  const spread3 = Math.max(...rendered3) - Math.min(...rendered3)
  assert.ok(spread3 < 1e-9, `含间隙底缘应平齐（极差 ${spread3}）`)
}

testQualityLabel()
testDisplayTitle()
testMasonryAspect()
testMergeUniqueById()
testMasonryColumns()
testMasonryColumnHeights()
testMasonryColumnFlexGrow()
