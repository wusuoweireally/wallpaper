import assert from "node:assert/strict"
import {
  HOME_FOLD_SIZE,
  masonryAspectRatio,
  masonryColumnCount,
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
  assert.equal(wallpaperDisplayTitle(null, "people"), "人物")
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
}

testQualityLabel()
testDisplayTitle()
testMasonryAspect()
testMergeUniqueById()
testMasonryColumns()
console.log("wallpaperLayout.test.ts: all passed")
