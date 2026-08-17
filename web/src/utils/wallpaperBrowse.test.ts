import assert from "node:assert/strict"
import {
  buildApiListQuery,
  defaultBrowseFilters,
  filtersFromRouteQuery,
  filtersToRouteQuery,
  hasActiveBrowseFilters,
  mapSortToApi,
  sceneHeroFromFilters,
} from "./wallpaperBrowse.ts"

function testDefaults() {
  const f = defaultBrowseFilters()
  assert.equal(f.sortBy, "latest")
  assert.equal(f.sortOrder, "DESC")
  assert.equal(hasActiveBrowseFilters(f), false)
}

function testHotAlias() {
  const f = filtersFromRouteQuery({ sort: "hot" })
  assert.equal(f.sortBy, "popular")
}

function testRouteRoundTrip() {
  const f = defaultBrowseFilters()
  f.sortBy = "views"
  f.sortOrder = "ASC"
  f.category = "anime"
  f.color = "blue"
  f.ratio = "16:9"
  f.resolutionMode = "exact"
  f.exactResolution = "1920x1080"
  const q = filtersToRouteQuery(f)
  assert.equal(q.sort, "views")
  assert.equal(q.order, "ASC")
  assert.equal(q.category, "anime")
  assert.equal(q.color, "blue")
  assert.equal(q.ratio, "16:9")
  assert.equal(q.q, undefined)
  assert.equal(q.exact, "1920x1080")
  const back = filtersFromRouteQuery(q)
  assert.equal(back.sortBy, "views")
  assert.equal(back.sortOrder, "ASC")
  assert.equal(back.category, "anime")
  assert.equal(back.exactResolution, "1920x1080")
  assert.equal(back.resolutionMode, "exact")
}

function testApiListQuery() {
  const f = defaultBrowseFilters()
  f.sortBy = "popular"
  f.resolutionMode = "atLeast"
  f.resolution = "4k"
  f.category = "anime"
  const api = buildApiListQuery(f, 2, 24)
  assert.equal(api.page, 2)
  assert.equal(api.limit, 24)
  assert.equal(api.sortBy, "popular")
  assert.equal(api.sortOrder, "DESC")
  assert.equal(api.category, "anime")
  assert.equal(api.minWidth, 3000)
  assert.equal(api.minHeight, 1600)

  const exact = defaultBrowseFilters()
  exact.resolutionMode = "exact"
  exact.exactResolution = "1920x1080"
  const a = buildApiListQuery(exact, 1, 20)
  assert.deepEqual(a.resolutions, ["1920x1080"])
  assert.equal(a.minWidth, undefined)

  const custom = defaultBrowseFilters()
  custom.resolutionMode = "custom"
  custom.customWidth = "2560"
  custom.customHeight = "1440"
  const b = buildApiListQuery(custom, 1, 20)
  assert.equal(b.minWidth, 2560)
  assert.equal(b.minHeight, 1440)
}

function testMapSort() {
  assert.equal(mapSortToApi("views").sortBy, "viewCount")
  assert.equal(mapSortToApi("favorites").sortBy, "favoriteCount")
  assert.equal(mapSortToApi("random").sortBy, "random")
}

function testRandomSeed() {
  // 随机排序：翻页带同一 seed，后端 RAND(seed) 顺序稳定
  const f = defaultBrowseFilters()
  f.sortBy = "random"
  const withSeed = buildApiListQuery(f, 2, 20, 123456)
  assert.equal(withSeed.seed, 123456)

  // 非随机排序不携带 seed
  const latest = buildApiListQuery(defaultBrowseFilters(), 1, 20, 123456)
  assert.equal(latest.seed, undefined)
}

function testSceneHero() {
  const hot = sceneHeroFromFilters({
    sortBy: "popular",
    topRange: "1M",
  })
  assert.equal(hot.kind, "hot")
  assert.equal(hot.title, "热门壁纸")

  const latest = sceneHeroFromFilters({
    sortBy: "latest",
    topRange: "1M",
  })
  assert.equal(latest.kind, "latest")
}

testDefaults()
testHotAlias()
testRouteRoundTrip()
testApiListQuery()
testMapSort()
testRandomSeed()
testSceneHero()
console.log("wallpaperBrowse.test.ts: all passed")
